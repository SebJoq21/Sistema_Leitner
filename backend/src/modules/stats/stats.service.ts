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

/** Clave de día en hora local para agrupar revisiones por día calendario. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Días consecutivos con al menos una revisión.
 * Un día completo sin repasar corta la racha. Si todavía no hay revisiones
 * hoy, la racha sigue viva desde ayer (el día aún no ha terminado).
 */
export function computeStreak(dates: Date[], now: Date = new Date()): number {
  const days = new Set(dates.map(dayKey));
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const statsService = {
  async summary(userId: string): Promise<StatsSummary> {
    const [decks, reviewDays] = await Promise.all([
      deckRepository.findAllByUser(userId),
      statsRepository.reviewDaysForUser(userId),
    ]);
    const totalTarjetas = decks.reduce((n, d) => n + d.total, 0);
    const dominadas = decks.reduce((n, d) => n + d.dominadas, 0);
    const pendientes = decks.reduce((n, d) => n + d.pendientes, 0);
        const progresoGeneral = totalTarjetas > 0 ? Math.round((dominadas / totalTarjetas) * 100) : 0;
        const now = new Date();
        const repasadosHoy = reviewDays.filter((d) => dayKey(d) === dayKey(now)).length;
        return {
          totalTarjetas,
          dominadas,
          pendientes,
          progresoGeneral,
          rachaDias: computeStreak(reviewDays, now),
          repasadosHoy,
        };
  },
};
