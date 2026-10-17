import { prisma } from '../../config/prisma.js';
import { DEFAULT_INTERVALS, normalizarIntervalos } from '../cards/leitner.service.js';

export interface SettingsResult {
  userId: string;
  intervalos: number[];
}

export const settingsRepository = {
  async getOrCreate(userId: string): Promise<SettingsResult> {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    if (existing) return { userId, intervalos: normalizarIntervalos(existing.intervalos) };
    const created = await prisma.userSettings.create({
      data: { userId, intervalos: DEFAULT_INTERVALS },
    });
    return { userId, intervalos: normalizarIntervalos(created.intervalos) };
  },

  /** Solo lee; no crea fila (usado en el hot path de repasos/cajas). */
  async intervalsFor(userId: string): Promise<number[]> {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    return normalizarIntervalos(existing?.intervalos ?? null);
  },

  async update(userId: string, intervalos: number[]): Promise<SettingsResult> {
    const updated = await prisma.userSettings.upsert({
      where: { userId },
      update: { intervalos },
      create: { userId, intervalos },
    });
    return { userId, intervalos: normalizarIntervalos(updated.intervalos) };
  },
};
