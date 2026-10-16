import { prisma } from '../../config/prisma.js';
import type { CreateDeckDto, UpdateDeckDto } from './deck.dto.js';

export const deckRepository = {
  findAllByUser(userId: string) {
    return prisma.deck.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { cards: true } } },
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
