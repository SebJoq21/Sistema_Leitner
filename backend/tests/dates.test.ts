import { describe, expect, it } from 'vitest';
import {
  addCalendarDays,
  addDays,
  dateOnlyToUtc,
  dayKeyInTimeZone,
  isValidTimeZone,
  toDateOnly,
  todayInTimeZone,
} from '../src/lib/dates.js';

describe('todayInTimeZone', () => {
  const midnight = new Date('2026-10-20T02:30:00.000Z');

  it('usa el día anterior en Lima cuando en UTC ya es el día siguiente', () => {
    expect(todayInTimeZone(midnight, 'America/Lima')).toBe('2026-10-19');
  });

  it('usa el día 20 en UTC y Madrid', () => {
    expect(todayInTimeZone(midnight, 'UTC')).toBe('2026-10-20');
    expect(todayInTimeZone(midnight, 'Europe/Madrid')).toBe('2026-10-20');
  });

  it('cae a UTC con una zona inválida', () => {
    expect(todayInTimeZone(midnight, 'Lima')).toBe('2026-10-20');
  });
});

describe('dayKeyInTimeZone', () => {
  it('agrupa un instante por el día local', () => {
    expect(dayKeyInTimeZone(new Date('2026-10-20T02:30:00.000Z'), 'America/Lima')).toBe('2026-10-19');
    expect(dayKeyInTimeZone(new Date('2026-10-20T02:30:00.000Z'), 'UTC')).toBe('2026-10-20');
  });
});

describe('addCalendarDays', () => {
  it('suma días en cambio de mes y año', () => {
    expect(addCalendarDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addCalendarDays('2026-10-19', 3)).toBe('2026-10-22');
  });

  it('respeta el año bisiesto', () => {
    expect(addCalendarDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('no salta por el cambio de horario de verano', () => {
    expect(addCalendarDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addCalendarDays('2026-10-24', 1)).toBe('2026-10-25');
  });

  it('acepta días negativos', () => {
    expect(addCalendarDays('2026-10-19', -1)).toBe('2026-10-18');
  });
});

describe('dateOnlyToUtc y toDateOnly', () => {
  it('convierte a medianoche UTC y de vuelta', () => {
    const date = dateOnlyToUtc('2026-10-19');
    expect(date.toISOString()).toBe('2026-10-19T00:00:00.000Z');
    expect(toDateOnly(date)).toBe('2026-10-19');
  });

  it('rechaza fechas inexistentes', () => {
    expect(() => dateOnlyToUtc('2026-02-30')).toThrow('Fecha inválida');
    expect(() => dateOnlyToUtc('19/10/2026')).toThrow('Fecha inválida');
  });

  it('addDays usa aritmética de calendario', () => {
    expect(toDateOnly(addDays(new Date('2026-10-19T21:30:00.000Z'), 1))).toBe('2026-10-20');
  });
});

describe('isValidTimeZone', () => {
  it('valida zonas IANA y rechaza alias inválidos', () => {
    expect(isValidTimeZone('America/Lima')).toBe(true);
    expect(isValidTimeZone('Europe/Madrid')).toBe(true);
    expect(isValidTimeZone('GMT-5')).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
  });
});
