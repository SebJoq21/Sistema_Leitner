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
  /** Color de texto/ícono legible sobre `color` (hex). */
  onColor: string;
  /** Clases estáticas Tailwind (deben existir en el bundle). */
  badge: string;
  dot: string;
  bar: string;
  softBg: string;
  icon: LucideIcon;
}

// Colores estáticos para que Tailwind los incluya en el build.
export const CAJA_THEME: Record<number, CajaTheme> = {
  1: { label: 'Caja 1', short: 'Reciente', color: '#EF4444', onColor: '#FFFFFF', badge: 'bg-caja-1-soft text-caja-1', dot: 'bg-caja-1', bar: 'bg-caja-1', softBg: 'bg-caja-1-soft', icon: Flame },
  2: { label: 'Caja 2', short: 'Aprendiendo', color: '#F97316', onColor: '#1C262B', badge: 'bg-caja-2-soft text-caja-2', dot: 'bg-caja-2', bar: 'bg-caja-2', softBg: 'bg-caja-2-soft', icon: Sprout },
  3: { label: 'Caja 3', short: 'Consolidando', color: '#B9C25A', onColor: '#1C262B', badge: 'bg-caja-3-soft text-caja-3', dot: 'bg-caja-3', bar: 'bg-caja-3', softBg: 'bg-caja-3-soft', icon: Leaf },
  4: { label: 'Caja 4', short: 'Casi dominada', color: '#22C55E', onColor: '#1C262B', badge: 'bg-caja-4-soft text-caja-4', dot: 'bg-caja-4', bar: 'bg-caja-4', softBg: 'bg-caja-4-soft', icon: Trees },
  5: { label: 'Caja 5', short: 'Dominada', color: '#0D9488', onColor: '#FFFFFF', badge: 'bg-caja-5-soft text-caja-5', dot: 'bg-caja-5', bar: 'bg-caja-5', softBg: 'bg-caja-5-soft', icon: Trophy },
};

export function cajaTheme(caja: number): CajaTheme {
  return CAJA_THEME[caja] ?? CAJA_THEME[1]!;
}

export function intervaloLabel(dias: number): string {
  return `cada ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

// —— Colores e íconos de mazo ——
// Set curado: azul/teal/índigo/violeta/rosa/verde/pizarra (media saturación).
// Se evitan rojo, ámbar y naranja porque ya significan borrar, editar y "Estudiar".
export const DECK_COLORS = [
  '#3481BC', // azul
  '#0284C7', // celeste
  '#0D9488', // teal
  '#6366F1', // índigo
  '#8B5CF6', // violeta
  '#D9468F', // rosa
  '#2E8B57', // verde
  '#64748B', // gris pizarra
];

export const DECK_COLOR_FALLBACK = '#3481BC';

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
