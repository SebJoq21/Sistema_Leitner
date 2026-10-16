import { prisma } from '../../config/prisma.js';
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from './card.dto.js';
import { calcularProximaRevision, tarjetaInicial, LEITNER_INTERVALS, MAX_CAJA } from './leitner.service.js';

export interface BoxesStats {
  caja: number;
  intervaloDias: number;
  total: number;
  pendientes: number;
}

export const cardRepository = {
  findDueByUser(userId: string, deckId?: string, caja?: number) {
    return prisma.card.findMany({
      where: {
        proximaRevision: { lte: new Date() },
        ...(caja !== undefined ? { cajaActual: caja } : {}),
        deck: { userId, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { proximaRevision: 'asc' },
      include: { deck: { select: { id: true, nombre: true } } },
    });
  },

  findAllByUser(userId: string, query: ListCardsQuery) {
    const { deckId, caja, search } = query;
    return prisma.card.findMany({
      where: {
        ...(caja !== undefined ? { cajaActual: caja } : {}),
        ...((search
          ? { OR: [{ frontText: { contains: search, mode: 'insensitive' } }, { backText: { contains: search, mode: 'insensitive' } }] }
          : {}) as object),
        deck: { userId, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { updatedAt: 'desc' },
      include: { deck: { select: { id: true, nombre: true } } },
    });
  },

  async boxesByUser(userId: string, deckId?: string): Promise<BoxesStats[]> {
    const deckFilter = { userId, ...(deckId ? { id: deckId } : {}) };
    const [totals, dues] = await Promise.all([
      prisma.card.groupBy({
        by: ['cajaActual'],
        where: { deck: deckFilter },
        _count: { _all: true },
      }),
      prisma.card.groupBy({
        by: ['cajaActual'],
        where: { deck: deckFilter, proximaRevision: { lte: new Date() } },
        _count: { _all: true },
      }),
    ]);
    const totalBy = new Map(totals.map((t) => [t.cajaActual, t._count._all]));
    const dueBy = new Map(dues.map((d) => [d.cajaActual, d._count._all]));
    return Array.from({ length: MAX_CAJA }, (_, i) => {
      const caja = i + 1;
      return {
        caja,
        intervaloDias: LEITNER_INTERVALS[caja] ?? 1,
        total: totalBy.get(caja) ?? 0,
        pendientes: dueBy.get(caja) ?? 0,
      };
    });
  },

  findByIdForUser(cardId: string, userId: string) {
    return prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
      include: { deck: { select: { id: true, nombre: true } } },
    });
  },

  async createForUser(userId: string, dto: CreateCardDto) {
    const deck = await prisma.deck.findFirstOrThrow({ where: { id: dto.deckId, userId } });
    const init = tarjetaInicial(new Date());
    return prisma.card.create({
      data: {
        deckId: deck.id,
        frontText: dto.frontText,
        backText: dto.backText,
        cajaActual: init.cajaActual,
        proximaRevision: init.proximaRevision,
      },
    });
  },

  async updateForUser(cardId: string, userId: string, dto: UpdateCardDto) {
    await prisma.card.findFirstOrThrow({ where: { id: cardId, deck: { userId } } });
    return prisma.card.update({ where: { id: cardId }, data: dto });
  },

  async removeForUser(cardId: string, userId: string) {
    await prisma.card.findFirstOrThrow({ where: { id: cardId, deck: { userId } } });
    await prisma.card.delete({ where: { id: cardId } });
  },

  async reviewForUser(cardId: string, userId: string, acierto: boolean) {
    const card = await prisma.card.findFirstOrThrow({
      where: { id: cardId, deck: { userId } },
    });

    const { nuevaCaja, proximaRevision } = calcularProximaRevision({
      cajaActual: card.cajaActual,
      acierto,
      fechaBase: new Date(),
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
