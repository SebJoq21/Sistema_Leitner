import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api';

describe('ApiError', () => {
  it('instancia correctamente con status, message, code y details', () => {
    const error = new ApiError(409, 'La tarjeta todavía no está pendiente', 'CARD_NOT_DUE', {
      proximaRevision: '2026-10-22',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(409);
    expect(error.message).toBe('La tarjeta todavía no está pendiente');
    expect(error.code).toBe('CARD_NOT_DUE');
    expect(error.details).toEqual({ proximaRevision: '2026-10-22' });
  });

  it('permite distinguir errores 409 y 404', () => {
    const err409 = new ApiError(409, 'La tarjeta todavía no está pendiente', 'CARD_NOT_DUE');
    const err404 = new ApiError(404, 'Tarjeta no encontrada');
    const err500 = new Error('Network error');

    expect(err409.status === 409 || err409.code === 'CARD_NOT_DUE').toBe(true);
    expect(err404.status).toBe(404);
    expect(err500 instanceof ApiError).toBe(false);
  });
});
