/**
 * Seed de datos de prueba realistas para evaluar el diseño.
 * Uso:  npm run seed            (usa usuario@test.com)
 *       SEED_EMAIL=otro@mail.com npm run seed
 *
 * Borra los mazos del usuario indicado (cascade a tarjetas/reviews) y crea
 * 3 mazos + 18 tarjetas repartidas entre cajas con fechas de repaso variadas.
 */
import { prisma } from '../src/config/prisma.js';
import { addDays, DEFAULT_INTERVALS } from '../src/modules/cards/leitner.service.js';
import { dateOnlyToUtc, todayInTimeZone } from '../src/lib/dates.js';

interface CardSpec {
  front: string;
  back: string;
  hint?: string;
  notas?: string;
  tags?: string[];
  caja: number;
  dueInDays: number;
}

interface DeckSpec {
  nombre: string;
  descripcion: string;
  color: string;
  icon: string;
  tags: string[];
  metaDiaria: number;
  cards: CardSpec[];
}

const DECKS: DeckSpec[] = [
  {
    nombre: 'Capitales de Europa',
    descripcion: 'Capitales del continente para el examen de geografía.',
    color: '#1D4ED8',
    icon: 'globe',
    tags: ['geografía', 'europa'],
    metaDiaria: 10,
    cards: [
      { front: 'Francia', back: 'París', hint: 'Torre Eiffel', caja: 5, dueInDays: 12, tags: ['europa occidental'] },
      { front: 'Alemania', back: 'Berlín', caja: 4, dueInDays: 6, tags: ['europa occidental'] },
      { front: 'Italia', back: 'Roma', caja: 3, dueInDays: 0, hint: 'Coliseo' },
      { front: 'España', back: 'Madrid', caja: 2, dueInDays: -1 },
      { front: 'Portugal', back: 'Lisboa', caja: 2, dueInDays: 2 },
      { front: 'Austria', back: 'Viena', caja: 1, dueInDays: 0, notas: 'Antiguamente capital del Imperio Austrohúngaro.' },
      { front: 'Bélgica', back: 'Bruselas', caja: 1, dueInDays: -2, hint: 'Sede de la UE' },
      { front: 'Noruega', back: 'Oslo', caja: 1, dueInDays: 0 },
    ],
  },
  {
    nombre: 'Vocabulario Inglés — Unidad 3',
    descripcion: 'Palabras clave del libro de inglés, unidad 3.',
    color: '#0D9488',
    icon: 'languages',
    tags: ['inglés', 'idiomas'],
    metaDiaria: 15,
    cards: [
      { front: 'to afford', back: 'permitirse (económicamente)', caja: 4, dueInDays: 10 },
      { front: 'reliable', back: 'confiable, fiable', caja: 3, dueInDays: 3, hint: 'Someone you can trust' },
      { front: 'to borrow', back: 'pedir prestado', caja: 2, dueInDays: -1, notas: 'Borrow = pedir; lend = prestar.' },
      { front: 'thorough', back: 'minucioso, exhaustivo', caja: 2, dueInDays: 1 },
      { front: 'to overcome', back: 'superar, vencer', caja: 1, dueInDays: 0 },
      { front: 'shortage', back: 'escasez, falta', caja: 1, dueInDays: 0 },
    ],
  },
  {
    nombre: 'Fórmulas de Física',
    descripcion: 'Fórmulas base para el parcial de mecánica.',
    color: '#F97316',
    icon: 'atom',
    tags: ['física', 'ciencia'],
    metaDiaria: 8,
    cards: [
      { front: 'Segunda ley de Newton', back: 'F = m · a', caja: 3, dueInDays: 5, notas: 'Fuerza neta = masa por aceleración.' },
      { front: 'Energía cinética', back: 'Ec = ½ · m · v²', caja: 2, dueInDays: -1 },
      { front: 'Energía potencial gravitatoria', back: 'Ep = m · g · h', caja: 1, dueInDays: 0, hint: 'g ≈ 9,8 m/s²' },
      { front: 'Tercera ley de Newton', back: 'A toda acción corresponde una reacción igual y opuesta', caja: 1, dueInDays: 0 },
    ],
  },
];

async function main() {
  const email = process.env.SEED_EMAIL ?? 'usuario@test.com';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error(`No existe el usuario "${email}" en public.users. Inicia sesión una vez en la app para sincronizarlo.`);
  }

  await prisma.$transaction([
    prisma.review.deleteMany({ where: { card: { deck: { userId: user.id } } } }),
    prisma.card.deleteMany({ where: { deck: { userId: user.id } } }),
    prisma.deck.deleteMany({ where: { userId: user.id } }),
  ]);

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { intervalos: DEFAULT_INTERVALS },
    create: { userId: user.id, intervalos: DEFAULT_INTERVALS },
  });

  const now = new Date();
  const today = dateOnlyToUtc(todayInTimeZone(now));
  let totalCards = 0;

  for (const spec of DECKS) {
    const deck = await prisma.deck.create({
      data: {
        userId: user.id,
        nombre: spec.nombre,
        descripcion: spec.descripcion,
        color: spec.color,
        icon: spec.icon,
        tags: spec.tags,
        metaDiaria: spec.metaDiaria,
      },
    });

    const cardIds: string[] = [];
    for (const c of spec.cards) {
      const card = await prisma.card.create({
        data: {
          deckId: deck.id,
          frontText: c.front,
          backText: c.back,
          hint: c.hint ?? null,
          notas: c.notas ?? null,
          tags: c.tags ?? [],
          cajaActual: c.caja,
          proximaRevision: addDays(today, c.dueInDays),
        },
      });
      cardIds.push(card.id);
      totalCards += 1;
    }

    // Un par de reviews para que "último estudio" y el resumen tengan datos.
    await prisma.review.createMany({
      data: [
        { cardId: cardIds[0]!, resultado: true, fechaRevision: new Date(now.getTime() - 2 * 86_400_000) },
        { cardId: cardIds[1] ?? cardIds[0]!, resultado: true, fechaRevision: new Date(now.getTime() - 86_400_000) },
      ],
    });
  }

  console.log(`Seed OK: ${DECKS.length} mazos y ${totalCards} tarjetas para ${email}.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
