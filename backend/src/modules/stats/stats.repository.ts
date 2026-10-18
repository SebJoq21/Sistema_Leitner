import { prisma } from '../../config/prisma.js';

export const statsRepository = {
  /** Fechas de todas las revisiones del usuario, más recientes primero. */
  async reviewDaysForUser(userId: string): Promise<Date[]> {
    const rows = await prisma.review.findMany({
      where: { card: { deck: { userId } } },
      select: { fechaRevision: true },
      orderBy: { fechaRevision: 'desc' },
    });
    return rows.map((r) => r.fechaRevision);
  },
};
