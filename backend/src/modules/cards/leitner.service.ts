// Motor Leitner — lógica pura, sin HTTP ni Prisma.
// Specs (task.md §2.1): Caja 1=1d, 2=3d, 3=7d, 4=15d, 5=30d.
export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 15,
  5: 30,
};

export const MAX_CAJA = 5;

export interface LeitnerInput {
  cajaActual: number;
  acierto: boolean;
  fechaBase?: Date;
}

export interface LeitnerOutput {
  nuevaCaja: number;
  proximaRevision: Date;
}

export function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

export function calcularProximaRevision({ cajaActual, acierto, fechaBase = new Date() }: LeitnerInput): LeitnerOutput {
  if (acierto) {
    const nuevaCaja = Math.min(cajaActual + 1, MAX_CAJA);
    const intervalo = LEITNER_INTERVALS[nuevaCaja] ?? 1;
    return { nuevaCaja, proximaRevision: addDays(fechaBase, intervalo) };
  }
  // Fallo: vuelve a caja 1, repaso mañana
  return { nuevaCaja: 1, proximaRevision: addDays(fechaBase, LEITNER_INTERVALS[1]!) };
}

export function tarjetaInicial(fechaBase = new Date()): { cajaActual: number; proximaRevision: Date } {
  return { cajaActual: 1, proximaRevision: fechaBase };
}
