import { prisma } from '../../config/prisma.js';
import { isValidTimeZone } from '../../lib/dates.js';
import { DEFAULT_INTERVALS, normalizarIntervalos } from '../cards/leitner.service.js';

export interface SettingsResult {
  userId: string;
  intervalos: number[];
  timezone: string | null;
}

function storedTimezone(value: string | null | undefined): string | null {
  return isValidTimeZone(value) ? value : null;
}

export const settingsRepository = {
  async getOrCreate(userId: string, headerTimezone?: string): Promise<SettingsResult> {
    const header = isValidTimeZone(headerTimezone) ? headerTimezone : null;
    const existing = await prisma.userSettings.findUnique({ where: { userId } });

    if (existing) {
      let timezone = storedTimezone(existing.timezone);
      if (!timezone && header) {
        await prisma.userSettings.updateMany({
          where: { userId, timezone: null },
          data: { timezone: header },
        });
        timezone = header;
      }
      return {
        userId,
        intervalos: normalizarIntervalos(existing.intervalos),
        timezone,
      };
    }

    const created = await prisma.userSettings.create({
      data: { userId, intervalos: DEFAULT_INTERVALS, timezone: header },
    });
    return {
      userId,
      intervalos: normalizarIntervalos(created.intervalos),
      timezone: storedTimezone(created.timezone),
    };
  },

  /** Solo lee; no crea fila (usado en el hot path de repasos/cajas). */
  async intervalsFor(userId: string): Promise<number[]> {
    const existing = await prisma.userSettings.findUnique({ where: { userId } });
    return normalizarIntervalos(existing?.intervalos ?? null);
  },

  /**
   * Resuelve la zona efectiva: preferencia guardada > header válido > UTC.
   * Si el usuario ya tiene fila pero sin zona, persiste el header de forma idempotente.
   */
  async resolveTimezone(userId: string, headerTimezone?: string): Promise<string> {
    const header = isValidTimeZone(headerTimezone) ? headerTimezone : null;
    const existing = await prisma.userSettings.findUnique({
      where: { userId },
      select: { timezone: true },
    });

    const saved = storedTimezone(existing?.timezone);
    if (saved) return saved;

    if (existing && header) {
      await prisma.userSettings.updateMany({
        where: { userId, timezone: null },
        data: { timezone: header },
      });
    }

    return header ?? 'UTC';
  },

  async update(
    userId: string,
    data: { intervalos?: number[]; timezone?: string | null },
  ): Promise<SettingsResult> {
    const update: { intervalos?: number[]; timezone?: string | null } = {};
    if (data.intervalos !== undefined) update.intervalos = data.intervalos;
    if (data.timezone !== undefined) update.timezone = data.timezone;

    const updated = await prisma.userSettings.upsert({
      where: { userId },
      update,
      create: {
        userId,
        intervalos: data.intervalos ?? DEFAULT_INTERVALS,
        timezone: data.timezone ?? null,
      },
    });

    return {
      userId,
      intervalos: normalizarIntervalos(updated.intervalos),
      timezone: storedTimezone(updated.timezone),
    };
  },
};
