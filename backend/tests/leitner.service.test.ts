import { afterEach, describe, expect, it, vi } from 'vitest';
import { toDateOnly } from '../src/lib/dates.js';
import {
  calcularProximaRevision,
  tarjetaInicial,
} from '../src/modules/cards/leitner.service.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('calcularProximaRevision', () => {
  it('suma el intervalo de la caja nueva sin hora', () => {
    const result = calcularProximaRevision({
      cajaActual: 1,
      acierto: true,
      fechaBase: '2026-10-19',
    });

    expect(result.nuevaCaja).toBe(2);
    expect(toDateOnly(result.proximaRevision)).toBe('2026-10-22');
  });

  it('vuelve a la caja 1 al fallar', () => {
    const result = calcularProximaRevision({
      cajaActual: 4,
      acierto: false,
      fechaBase: '2026-03-28',
    });

    expect(result.nuevaCaja).toBe(1);
    expect(toDateOnly(result.proximaRevision)).toBe('2026-03-29');
  });

  it('usa intervalos personalizados', () => {
    const result = calcularProximaRevision({
      cajaActual: 2,
      acierto: true,
      fechaBase: '2026-10-19',
      intervalos: [2, 4, 8, 16, 32],
    });

    expect(result.nuevaCaja).toBe(3);
    expect(toDateOnly(result.proximaRevision)).toBe('2026-10-27');
  });

  it('usa el día actual en la zona del usuario cuando se omite la fecha base', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T02:30:00.000Z'));

    const result = calcularProximaRevision({
      cajaActual: 1,
      acierto: true,
      timeZone: 'America/Lima',
    });

    expect(toDateOnly(result.proximaRevision)).toBe('2026-10-22');
  });
});

describe('tarjetaInicial', () => {
  it('vence el mismo día y no incluye hora', () => {
    const result = tarjetaInicial('2026-10-19');

    expect(result.cajaActual).toBe(1);
    expect(toDateOnly(result.proximaRevision)).toBe('2026-10-19');
  });
});
