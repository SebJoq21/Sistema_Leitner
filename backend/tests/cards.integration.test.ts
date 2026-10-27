import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { dateOnlyToUtc, toDateOnly, todayInTimeZone } from '../src/lib/dates.js';
import { cardRepository } from '../src/modules/cards/card.repository.js';
import { deckRepository } from '../src/modules/decks/deck.repository.js';
import { settingsRepository } from '../src/modules/settings/settings.repository.js';
import { statsService } from '../src/modules/stats/stats.service.js';

const USER_A = '00000000-0000-4000-8000-000000000001';
const USER_B = '00000000-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-20T02:30:00.000Z');

async function resetDatabase() {
  await prisma.review.deleteMany();
  await prisma.card.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
}

async function createUser(id: string, email: string) {
  return prisma.user.create({ data: { id, email } });
}

async function createDeck(userId: string, nombre = 'Mazo') {
  return prisma.deck.create({ data: { userId, nombre } });
}

async function createCard(
  deckId: string,
  frontText: string,
  dueDate: string,
  cajaActual = 1,
) {
  return prisma.card.create({
    data: {
      deckId,
      frontText,
      backText: 'respuesta',
      cajaActual,
      proximaRevision: dateOnlyToUtc(dueDate),
    },
  });
}

beforeAll(async () => {
  await prisma.$connect();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('vencimiento por día local', () => {
  it('la cola usa el hoy de Lima, no el de UTC', async () => {
    await createUser(USER_A, 'a@test.com');
    const deck = await createDeck(USER_A);
    const ayer = await createCard(deck.id, 'ayer', '2026-10-18');
    const hoy = await createCard(deck.id, 'hoy', '2026-10-19');
    const manana = await createCard(deck.id, 'mañana', '2026-10-20');

    const todayLima = todayInTimeZone(NOW, 'America/Lima');
    const todayUtc = todayInTimeZone(NOW, 'UTC');

    const dueLima = await cardRepository.findDueByUser(USER_A, todayLima);
    const dueUtc = await cardRepository.findDueByUser(USER_A, todayUtc);

    expect(todayLima).toBe('2026-10-19');
    expect(dueLima.map((card) => card.id)).toEqual([ayer.id, hoy.id]);
    expect(dueUtc.map((card) => card.id)).toEqual([ayer.id, hoy.id, manana.id]);
  });

  it('cajas, pendientes y mazos comparten el mismo día local', async () => {
    await createUser(USER_A, 'a@test.com');
    const deck = await createDeck(USER_A);
    const ayer = await createCard(deck.id, 'ayer', '2026-10-18');
    const hoy = await createCard(deck.id, 'hoy', '2026-10-19');
    const manana = await createCard(deck.id, 'mañana', '2026-10-20');

    const todayLima = todayInTimeZone(NOW, 'America/Lima');
    const boxes = await cardRepository.boxesByUser(USER_A, todayLima);
    const pendientes = await cardRepository.findAllByUser(USER_A, todayLima, {
      pendientes: true,
      order: 'proximaRevision',
    });
    const futuras = await cardRepository.findAllByUser(USER_A, todayLima, {
      pendientes: false,
      order: 'proximaRevision',
    });
    const decks = await deckRepository.findAllByUser(USER_A, todayLima);

    expect(boxes[0]).toMatchObject({
      caja: 1,
      total: 3,
      pendientes: 2,
      proximaRevision: dateOnlyToUtc('2026-10-18'),
    });
    expect(pendientes.map((card) => card.id)).toEqual([ayer.id, hoy.id]);
    expect(futuras.map((card) => card.id)).toEqual([manana.id]);
    expect(decks[0]).toMatchObject({
      total: 3,
      pendientes: 2,
      dominadas: 0,
      proximaRevision: dateOnlyToUtc('2026-10-18'),
    });
  });

  it('crea y repasa con aritmética de calendario', async () => {
    await createUser(USER_A, 'a@test.com');
    const deck = await createDeck(USER_A);

    const created = await cardRepository.createForUser(
      USER_A,
      { deckId: deck.id, frontText: 'nueva', backText: 'respuesta' },
      '2026-10-19',
    );
    expect(toDateOnly(created.proximaRevision)).toBe('2026-10-19');

    const reviewed = await cardRepository.reviewForUser(USER_A, created.id, true, '2026-10-19');
    expect(reviewed.cajaActual).toBe(2);
    expect(toDateOnly(reviewed.proximaRevision)).toBe('2026-10-22');
    expect(await prisma.review.count({ where: { cardId: created.id } })).toBe(1);
  });

  it('no mezcla tarjetas de otros usuarios', async () => {
    await createUser(USER_A, 'a@test.com');
    await createUser(USER_B, 'b@test.com');
    const deckA = await createDeck(USER_A, 'A');
    const deckB = await createDeck(USER_B, 'B');
    await createCard(deckA.id, 'propia', '2026-10-19');
    await createCard(deckB.id, 'ajena', '2026-10-19');

    const boxes = await cardRepository.boxesByUser(USER_A, '2026-10-19');
    const decks = await deckRepository.findAllByUser(USER_A, '2026-10-19');

    expect(boxes[0]?.total).toBe(1);
    expect(decks).toHaveLength(1);
    expect(decks[0]?.nombre).toBe('A');
  });
});

describe('estadísticas por zona', () => {
  it('cuenta repasadosHoy y racha en la zona del usuario', async () => {
    await createUser(USER_A, 'a@test.com');
    const deck = await createDeck(USER_A);
    const card = await createCard(deck.id, 'tarjeta', '2026-10-19', 4);
    await prisma.review.createMany({
      data: [
        { cardId: card.id, resultado: true, fechaRevision: new Date('2026-10-18T15:00:00.000Z') },
        { cardId: card.id, resultado: true, fechaRevision: new Date('2026-10-19T15:00:00.000Z') },
        { cardId: card.id, resultado: true, fechaRevision: new Date('2026-10-20T02:30:00.000Z') },
      ],
    });

    const lima = await statsService.summary(USER_A, 'America/Lima', NOW);
    const utc = await statsService.summary(USER_A, 'UTC', NOW);

    expect(lima).toMatchObject({ repasadosHoy: 2, rachaDias: 2, dominadas: 1 });
    expect(utc).toMatchObject({ repasadosHoy: 1, rachaDias: 3, dominadas: 1 });
  });
});

describe('ajustes de zona horaria', () => {
  it('crea la zona desde el header y no la reemplaza', async () => {
    await createUser(USER_A, 'a@test.com');

    const created = await settingsRepository.getOrCreate(USER_A, 'America/Lima');
    expect(created.timezone).toBe('America/Lima');

    const resolved = await settingsRepository.resolveTimezone(USER_A, 'Europe/Madrid');
    expect(resolved).toBe('America/Lima');
  });

  it('persiste el header si la fila existe sin zona', async () => {
    await createUser(USER_A, 'a@test.com');
    await prisma.userSettings.create({ data: { userId: USER_A } });

    expect(await settingsRepository.resolveTimezone(USER_A, 'Europe/Madrid')).toBe('Europe/Madrid');
    const saved = await prisma.userSettings.findUnique({ where: { userId: USER_A } });
    expect(saved?.timezone).toBe('Europe/Madrid');
  });

  it('actualiza solo los campos enviados sin tocar el otro', async () => {
    await createUser(USER_A, 'a@test.com');
    await settingsRepository.getOrCreate(USER_A, 'America/Lima');

    const onlyTimezone = await settingsRepository.update(USER_A, { timezone: 'America/Bogota' });
    expect(onlyTimezone.timezone).toBe('America/Bogota');
    expect(onlyTimezone.intervalos).toEqual([1, 3, 7, 15, 30]);

    const onlyIntervals = await settingsRepository.update(USER_A, { intervalos: [2, 4, 8, 16, 32] });
    expect(onlyIntervals.intervalos).toEqual([2, 4, 8, 16, 32]);
    expect(onlyIntervals.timezone).toBe('America/Bogota');
  });

  it('aísla la zona entre usuarios', async () => {
    await createUser(USER_A, 'a@test.com');
    await createUser(USER_B, 'b@test.com');
    await settingsRepository.getOrCreate(USER_A, 'America/Lima');
    await settingsRepository.getOrCreate(USER_B, 'Europe/Madrid');

    await settingsRepository.update(USER_A, { timezone: 'America/Bogota' });
    const userB = await settingsRepository.getOrCreate(USER_B);

    expect(userB.timezone).toBe('Europe/Madrid');
  });
});
