import { describe, expect, it } from 'vitest';
import { computeStreak, countReviewsToday } from '../src/modules/stats/stats.service.js';

const d = (iso: string) => new Date(iso);

describe('computeStreak', () => {
  it('cuenta días consecutivos incluyendo hoy', () => {
    const dates = [
      d('2026-10-18T15:00:00.000Z'),
      d('2026-10-19T15:00:00.000Z'),
      d('2026-10-20T15:00:00.000Z'),
    ];

    expect(computeStreak(dates, d('2026-10-20T18:00:00.000Z'), 'America/Lima')).toBe(3);
  });

  it('se corta con un día sin repaso', () => {
    const dates = [d('2026-10-17T15:00:00.000Z'), d('2026-10-20T15:00:00.000Z')];

    expect(computeStreak(dates, d('2026-10-20T18:00:00.000Z'), 'America/Lima')).toBe(1);
  });

  it('sigue viva desde ayer si todavía no hay repaso hoy', () => {
    const dates = [d('2026-10-18T15:00:00.000Z'), d('2026-10-19T15:00:00.000Z')];

    expect(computeStreak(dates, d('2026-10-20T18:00:00.000Z'), 'America/Lima')).toBe(2);
  });

  it('agrupa por el día local alrededor de la medianoche', () => {
    const dates = [d('2026-10-20T02:30:00.000Z')];

    expect(computeStreak(dates, d('2026-10-20T05:00:00.000Z'), 'America/Lima')).toBe(1);
  });
});

describe('countReviewsToday', () => {
  it('cuenta según el día del usuario, no el día UTC', () => {
    const dates = [d('2026-10-20T02:30:00.000Z')];
    const now = d('2026-10-20T05:00:00.000Z');

    expect(countReviewsToday(dates, now, 'America/Lima')).toBe(0);
    expect(countReviewsToday(dates, now, 'UTC')).toBe(1);
  });

  it('cuenta los repasos del día local actual', () => {
    const dates = [
      d('2026-10-20T02:30:00.000Z'),
      d('2026-10-20T05:00:00.000Z'),
      d('2026-10-20T15:00:00.000Z'),
      d('2026-10-19T15:00:00.000Z'),
    ];

    expect(countReviewsToday(dates, d('2026-10-20T18:00:00.000Z'), 'America/Lima')).toBe(2);
  });
});
