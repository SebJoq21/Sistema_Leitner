import { describe, expect, it, vi } from 'vitest';
import { cardRepository } from '../src/modules/cards/card.repository.js';
import { prisma } from '../src/config/prisma.js';
import { settingsRepository } from '../src/modules/settings/settings.repository.js';
import { HttpError } from '../src/errors/http-error.js';
import { dateOnlyToUtc } from '../src/lib/dates.js';

describe('cardRepository.reviewForUser (unit)', () => {
  const userId = 'user-1';
  const cardId = 'card-1';
  const today = '2026-10-20';

  it('rechaza con 404 si la tarjeta no existe o es de otro usuario', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        card: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };
      return callback(tx);
    });

    await expect(cardRepository.reviewForUser(userId, cardId, true, today)).rejects.toMatchObject({
      name: 'HttpError',
      status: 404,
      message: 'Tarjeta no encontrada',
    });
  });

  it('rechaza con 409 CARD_NOT_DUE si la tarjeta tiene fecha futura', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        card: {
          findFirst: vi.fn().mockResolvedValue({
            id: cardId,
            cajaActual: 1,
            proximaRevision: dateOnlyToUtc('2026-10-21'),
          }),
        },
      };
      return callback(tx);
    });

    try {
      await cardRepository.reviewForUser(userId, cardId, true, today);
      expect.fail('Debería lanzar HttpError');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      const httpError = err as HttpError;
      expect(httpError.status).toBe(409);
      expect(httpError.code).toBe('CARD_NOT_DUE');
      expect(httpError.details).toEqual({ proximaRevision: '2026-10-21' });
    }
  });

  it('permite repasar una tarjeta de hoy (200) y crea Review', async () => {
    vi.spyOn(settingsRepository, 'intervalsFor').mockResolvedValue([1, 3, 7, 15, 30]);

    const txCardFindFirst = vi.fn().mockResolvedValue({
      id: cardId,
      cajaActual: 1,
      proximaRevision: dateOnlyToUtc('2026-10-20'),
    });
    const txCardUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const txReviewCreate = vi.fn().mockResolvedValue({ id: 'rev-1', cardId, resultado: true });
    const txCardFindUniqueOrThrow = vi.fn().mockResolvedValue({
      id: cardId,
      cajaActual: 2,
      proximaRevision: dateOnlyToUtc('2026-10-23'),
    });

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        card: {
          findFirst: txCardFindFirst,
          updateMany: txCardUpdateMany,
          findUniqueOrThrow: txCardFindUniqueOrThrow,
        },
        review: {
          create: txReviewCreate,
        },
      };
      return callback(tx);
    });

    const res = await cardRepository.reviewForUser(userId, cardId, true, today);
    expect(res.cajaActual).toBe(2);
    expect(txCardUpdateMany).toHaveBeenCalledWith({
      where: {
        id: cardId,
        deck: { userId },
        proximaRevision: { lte: dateOnlyToUtc(today) },
      },
      data: {
        cajaActual: 2,
        proximaRevision: dateOnlyToUtc('2026-10-23'),
      },
    });
    expect(txReviewCreate).toHaveBeenCalledWith({
      data: { cardId, resultado: true },
    });
  });

  it('rechaza con 409 si updateMany actualizó 0 filas por concurrencia', async () => {
    vi.spyOn(settingsRepository, 'intervalsFor').mockResolvedValue([1, 3, 7, 15, 30]);

    const txCardFindFirst = vi
      .fn()
      .mockResolvedValueOnce({
        id: cardId,
        cajaActual: 1,
        proximaRevision: dateOnlyToUtc('2026-10-20'),
      })
      .mockResolvedValueOnce({
        id: cardId,
        cajaActual: 2,
        proximaRevision: dateOnlyToUtc('2026-10-23'),
      });
    const txCardUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
    const txReviewCreate = vi.fn();

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        card: {
          findFirst: txCardFindFirst,
          updateMany: txCardUpdateMany,
        },
        review: {
          create: txReviewCreate,
        },
      };
      return callback(tx);
    });

    try {
      await cardRepository.reviewForUser(userId, cardId, true, today);
      expect.fail('Debería lanzar HttpError');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      const httpError = err as HttpError;
      expect(httpError.status).toBe(409);
      expect(httpError.code).toBe('CARD_NOT_DUE');
      expect(httpError.details).toEqual({ proximaRevision: '2026-10-23' });
      expect(txReviewCreate).not.toHaveBeenCalled();
    }
  });
});
