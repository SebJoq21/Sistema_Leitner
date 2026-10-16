import { prisma } from '../../config/prisma.js';
import type { CreateCardDto } from './card.dto.js';
import { calcularProximaRevision, tarjetaInicial } from './leitner.service.js';

export const cardRepository = {
  findDueByUser(userId: string, deckId?: string) {
    return prisma.card.findMany({
      where: {
        proximaRevision: { lte: new Date() },
        deck: { userId, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { proximaRevision: 'asc' },
      include: { deck: { select: { id: true, nombre: true } } },
    });
  },

  findByIdForUser(cardId: string, userId: string) {
    return prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
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
