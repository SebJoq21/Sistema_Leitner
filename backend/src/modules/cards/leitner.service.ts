// Motor Leitner — lógica pura, sin HTTP ni Prisma.
// Specs (task.md §2.1): Caja 1=1d, 2=3d, 3=7d, 4=15d, 5=30d.
// Los intervalos son configurables por usuario (UserSettings.intervalos).
export const DEFAULT_INTERVALS: number[] = [1, 3, 7, 15, 30];

// Compat: se mantiene el mapa original para consumidores que lo importen.
export const LEITNER_INTERVALS: Record<number, number> = {
  1: 1,
  2: 3,
  3: 7,
  4: 15,
  5: 30,
};

export const MAX_CAJA = 5;

/** Valida y normaliza los intervalos del usuario; si son inválidos usa el default. */
export function normalizarIntervalos(raw?: number[] | null): number[] {
  if (!raw || raw.length !== MAX_CAJA || raw.some((n) => !Number.isInteger(n) || n < 1 || n > 365)) {
    return [...DEFAULT_INTERVALS];
  }
  return [...raw];
}

export function intervaloDeCaja(caja: number, intervalos: number[] = DEFAULT_INTERVALS): number {
  return intervalos[caja - 1] ?? DEFAULT_INTERVALS[caja - 1] ?? 1;
}

export interface LeitnerInput {
  cajaActual: number;
  acierto: boolean;
  fechaBase?: Date;
  intervalos?: number[];
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

export function calcularProximaRevision({
  cajaActual,
  acierto,
  fechaBase = new Date(),
  intervalos = DEFAULT_INTERVALS,
}: LeitnerInput): LeitnerOutput {
  if (acierto) {
    const nuevaCaja = Math.min(cajaActual + 1, MAX_CAJA);
    return { nuevaCaja, proximaRevision: addDays(fechaBase, intervaloDeCaja(nuevaCaja, intervalos)) };
  }
  // Fallo: vuelve a caja 1, repaso según el intervalo de la caja 1
  return { nuevaCaja: 1, proximaRevision: addDays(fechaBase, intervaloDeCaja(1, intervalos)) };
}

export function tarjetaInicial(fechaBase = new Date()): { cajaActual: number; proximaRevision: Date } {
  return { cajaActual: 1, proximaRevision: fechaBase };
}
