import { prisma } from '../../config/prisma.js';
import { toDateOnly } from '../../lib/dates.js';
import type { CreateDeckDto, UpdateDeckDto } from './deck.dto.js';

export interface DeckWithStats {
  id: string;
  userId: string;
  nombre: string;
  descripcion: string | null;
  color: string | null;
  icon: string | null;
  tags: string[];
  metaDiaria: number | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { cards: number };
  total: number;
  pendientes: number;
  dominadas: number;
  ultimoEstudio: Date | null;
  proximaRevision: Date | null;
}

export const deckRepository = {
  async findAllByUser(userId: string, today: string): Promise<DeckWithStats[]> {
    const [decks, cards, reviews] = await Promise.all([
      prisma.deck.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { cards: true } } },
      }),
      prisma.card.findMany({
        where: { deck: { userId } },
        select: { deckId: true, cajaActual: true, proximaRevision: true },
      }),
      prisma.review.findMany({
        where: { card: { deck: { userId } } },
        select: { fechaRevision: true, card: { select: { deckId: true } } },
        orderBy: { fechaRevision: 'desc' },
      }),
    ]);

    const stats = new Map<string, { pendientes: number; dominadas: number; proxima: Date | null }>();
    for (const card of cards) {
      const entry = stats.get(card.deckId) ?? { pendientes: 0, dominadas: 0, proxima: null };
      if (toDateOnly(card.proximaRevision) <= today) entry.pendientes += 1;
      if (card.cajaActual >= 4) entry.dominadas += 1;
      if (!entry.proxima || card.proximaRevision < entry.proxima) entry.proxima = card.proximaRevision;
      stats.set(card.deckId, entry);
    }

    const lastStudy = new Map<string, Date>();
    for (const review of reviews) {
      const deckId = review.card.deckId;
      if (!lastStudy.has(deckId)) lastStudy.set(deckId, review.fechaRevision);
    }

    return decks.map((deck) => {
      const s = stats.get(deck.id) ?? { pendientes: 0, dominadas: 0, proxima: null };
      return {
        ...deck,
        total: deck._count.cards,
        pendientes: s.pendientes,
        dominadas: s.dominadas,
        ultimoEstudio: lastStudy.get(deck.id) ?? null,
        proximaRevision: s.proxima,
      };
    });
  },

  findByIdForUser(id: string, userId: string) {
    return prisma.deck.findFirst({ where: { id, userId } });
  },

  create(userId: string, data: CreateDeckDto) {
    return prisma.deck.create({ data: { ...data, userId } });
  },

  update(id: string, userId: string, data: UpdateDeckDto) {
    return prisma.deck.updateMany({ where: { id, userId }, data });
  },

  remove(id: string, userId: string) {
    return prisma.deck.deleteMany({ where: { id, userId } });
  },

  assertOwnership(id: string, userId: string) {
    return prisma.deck.findFirstOrThrow({ where: { id, userId } });
  },
};
