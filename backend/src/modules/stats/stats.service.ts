import { addCalendarDays, dayKeyInTimeZone, todayInTimeZone } from '../../lib/dates.js';
import { deckRepository } from '../decks/deck.repository.js';
import { statsRepository } from './stats.repository.js';

export interface StatsSummary {
  totalTarjetas: number;
  dominadas: number;
  pendientes: number;
  progresoGeneral: number;
  rachaDias: number;
  repasadosHoy: number;
}

/** Cantidad de repasos cuyo día local coincide con el día actual. */
export function countReviewsToday(dates: Date[], now: Date = new Date(), timeZone = 'UTC'): number {
  const today = todayInTimeZone(now, timeZone);
  return dates.filter((date) => dayKeyInTimeZone(date, timeZone) === today).length;
}

/**
 * Días consecutivos con al menos una revisión.
 * Un día completo sin repasar corta la racha. Si todavía no hay revisiones
 * hoy, la racha sigue viva desde ayer (el día aún no ha terminado).
 */
export function computeStreak(dates: Date[], now: Date = new Date(), timeZone = 'UTC'): number {
  const days = new Set(dates.map((date) => dayKeyInTimeZone(date, timeZone)));
  let cursor = todayInTimeZone(now, timeZone);

  if (!days.has(cursor)) cursor = addCalendarDays(cursor, -1);

  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addCalendarDays(cursor, -1);
  }
  return streak;
}

export const statsService = {
  async summary(userId: string, timezone = 'UTC', now: Date = new Date()): Promise<StatsSummary> {
    const today = todayInTimeZone(now, timezone);
    const [decks, reviewDays] = await Promise.all([
      deckRepository.findAllByUser(userId, today),
      statsRepository.reviewDaysForUser(userId),
    ]);
    const totalTarjetas = decks.reduce((n, d) => n + d.total, 0);
    const dominadas = decks.reduce((n, d) => n + d.dominadas, 0);
    const pendientes = decks.reduce((n, d) => n + d.pendientes, 0);
    const progresoGeneral = totalTarjetas > 0 ? Math.round((dominadas / totalTarjetas) * 100) : 0;

    return {
      totalTarjetas,
      dominadas,
      pendientes,
      progresoGeneral,
      rachaDias: computeStreak(reviewDays, now, timezone),
      repasadosHoy: countReviewsToday(reviewDays, now, timezone),
    };
  },
};
