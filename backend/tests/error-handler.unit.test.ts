import { describe, expect, it, vi } from 'vitest';
import { errorHandler, HttpError } from '../src/middlewares/validate.js';
import type { Request, Response } from 'express';

describe('errorHandler middleware', () => {
  it('responde con status, message y code de un HttpError', () => {
    const err = new HttpError(409, 'La tarjeta todavía no está pendiente', 'CARD_NOT_DUE', {
      proximaRevision: '2026-10-22',
    });

    const statusFn = vi.fn().mockReturnThis();
    const jsonFn = vi.fn();
    const res = { status: statusFn, json: jsonFn } as unknown as Response;
    const req = {} as Request;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(409);
    expect(jsonFn).toHaveBeenCalledWith({
      error: 'La tarjeta todavía no está pendiente',
      code: 'CARD_NOT_DUE',
      proximaRevision: '2026-10-22',
    });
  });

  it('responde 500 para errores no controlados', () => {
    const err = new Error('Database down');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const statusFn = vi.fn().mockReturnThis();
    const jsonFn = vi.fn();
    const res = { status: statusFn, json: jsonFn } as unknown as Response;
    const req = {} as Request;
    const next = vi.fn();

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith({ error: 'Error interno' });
    consoleError.mockRestore();
  });
});
