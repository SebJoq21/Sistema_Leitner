import {
  Atom,
  Book,
  Braces,
  Calculator,
  Code,
  Dumbbell,
  Flame,
  FlaskConical,
  Globe,
  Heart,
  Languages,
  Layers,
  Leaf,
  Library,
  Music,
  Palette,
  Sprout,
  Trees,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

export const CAJA_MAX = 5;
export const DEFAULT_INTERVALS = [1, 3, 7, 15, 30];

export interface CajaTheme {
  label: string;
  short: string;
  /** Color base (hex) — para estilos inline dinámicos. */
  color: string;
  /** Clases estáticas Tailwind (deben existir en el bundle). */
  badge: string;
  dot: string;
  bar: string;
  softBg: string;
  icon: LucideIcon;
}

// Colores estáticos para que Tailwind los incluya en el build.
export const CAJA_THEME: Record<number, CajaTheme> = {
  1: { label: 'Caja 1', short: 'Reciente', color: '#EF4444', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', bar: 'bg-red-500', softBg: 'bg-red-50', icon: Flame },
  2: { label: 'Caja 2', short: 'Aprendiendo', color: '#F97316', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', bar: 'bg-orange-500', softBg: 'bg-orange-50', icon: Sprout },
  3: { label: 'Caja 3', short: 'Consolidando', color: '#EAB308', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', bar: 'bg-yellow-500', softBg: 'bg-yellow-50', icon: Leaf },
  4: { label: 'Caja 4', short: 'Casi dominada', color: '#22C55E', badge: 'bg-green-100 text-green-700', dot: 'bg-green-500', bar: 'bg-green-500', softBg: 'bg-green-50', icon: Trees },
  5: { label: 'Caja 5', short: 'Dominada', color: '#0D9488', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', bar: 'bg-teal-500', softBg: 'bg-teal-50', icon: Trophy },
};

export function cajaTheme(caja: number): CajaTheme {
  return CAJA_THEME[caja] ?? CAJA_THEME[1]!;
}

export function intervaloLabel(dias: number): string {
  return `cada ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// —— Colores e íconos de mazo ——
export const DECK_COLORS = [
  '#1D4ED8',
  '#0D9488',
  '#F97316',
  '#7C3AED',
  '#DC2626',
  '#16A34A',
  '#DB2777',
  '#0891B2',
];

export const DECK_ICON_OPTIONS: { name: string; icon: LucideIcon }[] = [
  { name: 'library', icon: Library },
  { name: 'layers', icon: Layers },
  { name: 'globe', icon: Globe },
  { name: 'languages', icon: Languages },
  { name: 'book', icon: Book },
  { name: 'atom', icon: Atom },
  { name: 'flask', icon: FlaskConical },
  { name: 'calculator', icon: Calculator },
  { name: 'code', icon: Code },
  { name: 'braces', icon: Braces },
  { name: 'palette', icon: Palette },
  { name: 'music', icon: Music },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'heart', icon: Heart },
];

const DECK_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  DECK_ICON_OPTIONS.map((o) => [o.name, o.icon]),
);

export function deckIcon(name?: string | null): LucideIcon {
  return (name && DECK_ICON_MAP[name]) || Library;
}

export function pickDeckColor(index: number): string {
  return DECK_COLORS[index % DECK_COLORS.length]!;
}

// —— Fechas ——
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Días de calendario hasta `date` (negativo si ya venció). */
export function daysUntil(date: string | Date): number {
  return Math.round((startOfDay(new Date(date)) - startOfDay(new Date())) / DAY_MS);
}

export function isDue(date: string | Date): boolean {
  return new Date(date).getTime() <= Date.now();
}

/** "Hoy" / "Mañana" / "En 3 días" / "Vencida hace 2 días". */
export function formatNextReview(date: string | Date | null | undefined): string {
  if (!date) return 'Sin repasos';
  const d = daysUntil(date);
  if (d < 0) return d === -1 ? 'Vencida desde ayer' : `Vencida hace ${Math.abs(d)} días`;
  if (d === 0) return 'Pendiente hoy';
  if (d === 1) return 'Mañana';
  return `En ${d} días`;
}

/** "Hoy" / "Ayer" / "Hace 5 días" / "Nunca". */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return 'Nunca';
  const d = daysUntil(date);
  if (d <= 0) return d === 0 ? 'Hoy' : `${Math.abs(d)} d`;
  if (d === 1) return 'Ayer';
  if (d < 30) return `Hace ${d} días`;
  const months = Math.round(d / 30);
  return months === 1 ? 'Hace 1 mes' : `Hace ${months} meses`;
}
