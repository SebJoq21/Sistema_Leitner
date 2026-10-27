import { prisma } from '../../config/prisma.js';
import { dateOnlyToUtc } from '../../lib/dates.js';
import { settingsRepository } from '../settings/settings.repository.js';
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from './card.dto.js';
import {
  calcularProximaRevision,
  intervaloDeCaja,
  MAX_CAJA,
  tarjetaInicial,
} from './leitner.service.js';

export interface BoxesStats {
  caja: number;
  intervaloDias: number;
  total: number;
  pendientes: number;
  proximaRevision: Date | null;
}

const ORDER_MAP: Record<NonNullable<ListCardsQuery['order']>, 'asc' | 'desc'> = {
  createdAt: 'desc',
  updatedAt: 'desc',
  proximaRevision: 'asc',
};

export const cardRepository = {
  findDueByUser(userId: string, today: string, deckId?: string, caja?: number) {
    return prisma.card.findMany({
      where: {
        proximaRevision: { lte: dateOnlyToUtc(today) },
        ...(caja !== undefined ? { cajaActual: caja } : {}),
        deck: { userId, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { proximaRevision: 'asc' },
      include: { deck: { select: { id: true, nombre: true, color: true, icon: true } } },
    });
  },

  findAllByUser(userId: string, today: string, query: ListCardsQuery) {
    const { deckId, caja, search, tag, pendientes, order } = query;
    const orderField = order ?? 'updatedAt';
    const todayDate = dateOnlyToUtc(today);
    return prisma.card.findMany({
      where: {
        ...(caja !== undefined ? { cajaActual: caja } : {}),
        ...(tag ? { tags: { has: tag } } : {}),
        ...(pendientes !== undefined
          ? { proximaRevision: pendientes ? { lte: todayDate } : { gt: todayDate } }
          : {}),
        ...((search
          ? { OR: [{ frontText: { contains: search, mode: 'insensitive' } }, { backText: { contains: search, mode: 'insensitive' } }] }
          : {}) as object),
        deck: { userId, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { [orderField]: ORDER_MAP[orderField] },
      include: { deck: { select: { id: true, nombre: true, color: true, icon: true } } },
    });
  },

  async boxesByUser(userId: string, today: string, deckId?: string): Promise<BoxesStats[]> {
    const deckFilter = { userId, ...(deckId ? { id: deckId } : {}) };
    const todayDate = dateOnlyToUtc(today);
    const [totals, dues, nexts, intervalos] = await Promise.all([
      prisma.card.groupBy({
        by: ['cajaActual'],
        where: { deck: deckFilter },
        _count: { _all: true },
      }),
      prisma.card.groupBy({
        by: ['cajaActual'],
        where: { deck: deckFilter, proximaRevision: { lte: todayDate } },
        _count: { _all: true },
      }),
      prisma.card.groupBy({
        by: ['cajaActual'],
        where: { deck: deckFilter },
        _min: { proximaRevision: true },
      }),
      settingsRepository.intervalsFor(userId),
    ]);
    const totalBy = new Map(totals.map((t) => [t.cajaActual, t._count._all]));
    const dueBy = new Map(dues.map((d) => [d.cajaActual, d._count._all]));
    const nextBy = new Map(nexts.map((n) => [n.cajaActual, n._min.proximaRevision]));
    return Array.from({ length: MAX_CAJA }, (_, i) => {
      const caja = i + 1;
      return {
        caja,
        intervaloDias: intervaloDeCaja(caja, intervalos),
        total: totalBy.get(caja) ?? 0,
        pendientes: dueBy.get(caja) ?? 0,
        proximaRevision: nextBy.get(caja) ?? null,
      };
    });
  },

  findByIdForUser(cardId: string, userId: string) {
    return prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
      include: { deck: { select: { id: true, nombre: true, color: true, icon: true } } },
    });
  },

  async createForUser(userId: string, dto: CreateCardDto, today: string) {
    const deck = await prisma.deck.findFirstOrThrow({ where: { id: dto.deckId, userId } });
    const init = tarjetaInicial(today);
    const cajaActual = dto.cajaInicial ?? init.cajaActual;
    return prisma.card.create({
      data: {
        deckId: deck.id,
        frontText: dto.frontText,
        backText: dto.backText,
        hint: dto.hint ?? null,
        notas: dto.notas ?? null,
        tags: dto.tags ?? [],
        cajaActual,
        proximaRevision: init.proximaRevision,
      },
    });
  },

  async updateForUser(cardId: string, userId: string, dto: UpdateCardDto) {
    await prisma.card.findFirstOrThrow({ where: { id: cardId, deck: { userId } } });
    if (dto.deckId) {
      await prisma.deck.findFirstOrThrow({ where: { id: dto.deckId, userId } });
    }
    return prisma.card.update({ where: { id: cardId }, data: dto });
  },

  async removeForUser(cardId: string, userId: string) {
    await prisma.card.findFirstOrThrow({ where: { id: cardId, deck: { userId } } });
    await prisma.card.delete({ where: { id: cardId } });
  },

  async reviewForUser(userId: string, cardId: string, acierto: boolean, today: string) {
    const card = await prisma.card.findFirstOrThrow({
      where: { id: cardId, deck: { userId } },
    });
    const intervalos = await settingsRepository.intervalsFor(userId);

    const { nuevaCaja, proximaRevision } = calcularProximaRevision({
      cajaActual: card.cajaActual,
      acierto,
      fechaBase: today,
      intervalos,
    });

    const [updated] = await prisma.$transaction([
      prisma.card.update({
        where: { id: card.id },
        data: { cajaActual: nuevaCaja, proximaRevision },
      }),
      prisma.review.create({
        data: { cardId: card.id, resultado: acierto },
      }),
    ]);

    return updated;
  },
};
