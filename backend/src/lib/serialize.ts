import { toDateOnly } from './dates.js';

/** Convierte una columna DATE de Prisma al contrato `YYYY-MM-DD`. */
export function serializeDateOnly<T extends { proximaRevision: Date | null }>(
  value: T,
): Omit<T, 'proximaRevision'> & { proximaRevision: string | null } {
  return {
    ...value,
    proximaRevision: value.proximaRevision ? toDateOnly(value.proximaRevision) : null,
  };
}
