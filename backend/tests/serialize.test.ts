import { describe, expect, it } from 'vitest';
import { serializeDateOnly } from '../src/lib/serialize.js';

describe('serializeDateOnly', () => {
  it('convierte una fecha DATE al contrato YYYY-MM-DD', () => {
    const value = serializeDateOnly({
      id: 'card-1',
      proximaRevision: new Date('2026-10-20T00:00:00.000Z'),
    });

    expect(value).toEqual({ id: 'card-1', proximaRevision: '2026-10-20' });
  });

  it('mantiene null cuando no hay próxima revisión', () => {
    const value = serializeDateOnly({ id: 'box-1', proximaRevision: null });

    expect(value.proximaRevision).toBeNull();
  });
});
