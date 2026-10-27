import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  daysUntil,
  formatNextReview,
  formatRelative,
  isDue,
} from './leitner';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('daysUntil', () => {
  it('interpreta YYYY-MM-DD como fecha local', () => {
    expect(daysUntil('2026-10-20')).toBe(0);
    expect(daysUntil('2026-10-19')).toBe(-1);
    expect(daysUntil('2026-10-22')).toBe(2);
  });

  it('acepta un Date con hora', () => {
    expect(daysUntil(new Date(2026, 9, 18, 23, 59))).toBe(-2);
  });
});

describe('isDue', () => {
  it('vence desde el inicio del día local', () => {
    expect(isDue('2026-10-19')).toBe(true);
    expect(isDue('2026-10-20')).toBe(true);
    expect(isDue('2026-10-21')).toBe(false);
  });
});

describe('formatNextReview', () => {
  it('distingue vencida, hoy, mañana y futuro', () => {
    expect(formatNextReview('2026-10-19')).toBe('Vencida desde ayer');
    expect(formatNextReview('2026-10-20')).toBe('Pendiente hoy');
    expect(formatNextReview('2026-10-21')).toBe('Mañana');
    expect(formatNextReview('2026-10-23')).toBe('En 3 días');
  });
});

describe('formatRelative', () => {
  it('corrige el signo para fechas pasadas y futuras', () => {
    expect(formatRelative('2026-10-20')).toBe('Hoy');
    expect(formatRelative('2026-10-19')).toBe('Ayer');
    expect(formatRelative('2026-10-15')).toBe('Hace 5 días');
    expect(formatRelative('2026-10-21')).toBe('Mañana');
    expect(formatRelative('2026-10-22')).toBe('En 2 días');
  });

  it('maneja valores vacíos', () => {
    expect(formatRelative(null)).toBe('Nunca');
    expect(formatRelative(undefined)).toBe('Nunca');
  });
});
