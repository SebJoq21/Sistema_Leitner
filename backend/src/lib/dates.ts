const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

const timeZoneCache = new Map<string, boolean>();

/** Valida una zona IANA con el mismo runtime que la usará. */
export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  const cached = timeZoneCache.get(timeZone);
  if (cached !== undefined) return cached;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    timeZoneCache.set(timeZone, true);
    return true;
  } catch {
    timeZoneCache.set(timeZone, false);
    return false;
  }
}

/** Devuelve el día calendario `YYYY-MM-DD` en la zona indicada. */
export function todayInTimeZone(now: Date = new Date(), timeZone = 'UTC'): string {
  const zone = isValidTimeZone(timeZone) ? timeZone : 'UTC';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Clave de día calendario para un instante concreto. */
export function dayKeyInTimeZone(date: Date, timeZone = 'UTC'): string {
  return todayInTimeZone(date, timeZone);
}

/** Convierte `YYYY-MM-DD` al Date UTC que Prisma usa para columnas DATE. */
export function dateOnlyToUtc(value: string): Date {
  const match = DATE_ONLY_RE.exec(value);
  if (!match) throw new Error(`Fecha inválida: "${value}" (se espera YYYY-MM-DD)`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Fecha inválida: "${value}"`);
  }

  return date;
}

/** Serializa una columna DATE de Prisma como `YYYY-MM-DD`. */
export function toDateOnly(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new Error('Fecha inválida');
  return date.toISOString().slice(0, 10);
}

/** Suma días de calendario sin depender de la hora local del servidor. */
export function addCalendarDays(date: string, days: number): string {
  if (!Number.isInteger(days)) throw new Error('La cantidad de días debe ser un entero');
  const next = new Date(dateOnlyToUtc(date).getTime() + days * DAY_MS);
  return toDateOnly(next);
}

/** Compatibilidad con consumidores que trabajan con Date. */
export function addDays(base: Date, days: number): Date {
  return dateOnlyToUtc(addCalendarDays(toDateOnly(base), days));
}
