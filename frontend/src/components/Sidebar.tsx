import { NavLink } from 'react-router-dom';
import {
  Archive,
  Flame,
  GraduationCap,
  Info,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  SquareStack,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Biblioteca',
    items: [
      { to: '/', label: 'Mazos', end: true, icon: Layers },
      { to: '/cards', label: 'Tarjetas', end: false, icon: SquareStack },
    ],
  },
  {
    label: 'Estudio',
    items: [
      { to: '/boxes', label: 'Cajas', end: false, icon: Archive },
      { to: '/study', label: 'Estudiar', end: false, icon: GraduationCap },
    ],
  },
];

function NavItemLink({
  item,
  dueCount,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  dueCount: number;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isStudy = item.to === '/study';

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150 motion-reduce:transition-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2',
          collapsed && 'justify-center px-0',
          isActive &&
            cn(
              'bg-sb-active-bg font-semibold text-sb-text-strong',
              'before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-sb-accent',
            ),
          !isActive && 'text-sb-text/85 hover:bg-sb-accent/10 hover:text-sb-text-strong',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'size-4 shrink-0 transition-transform duration-150 motion-reduce:transition-none group-hover:translate-x-0.5',
              (isStudy || isActive) && 'text-sb-accent',
            )}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {isStudy &&
            dueCount > 0 &&
            (collapsed ? (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-naranja" aria-hidden />
            ) : (
              <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-naranja px-1.5 text-[11px] font-bold leading-none text-white">
                {dueCount}
              </span>
            ))}
        </>
      )}
    </NavLink>
  );

  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {link}
    </Tooltip>
  ) : (
    link
  );
}

function ProgressRing({ value }: { value: number }) {
  const size = 40;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--color-sb-accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        className="transition-[stroke-dashoffset] duration-300 motion-reduce:transition-none"
      />
    </svg>
  );
}

function DailyGoalCard({ repasadosHoy, dueTotal }: { repasadosHoy: number; dueTotal: number }) {
  const total = repasadosHoy + dueTotal;

  if (total === 0) {
    return (
      <div className="-mx-4 border-t border-sb-border px-4 pb-2 pt-4 text-center">
        <p className="text-sm font-semibold text-sb-text-strong">¡Todo al día!</p>
        <p className="mt-0.5 text-xs text-sb-text/70">Sin tarjetas pendientes</p>
      </div>
    );
  }

  return (
    <div className="-mx-4 border-t border-sb-border px-4 pb-2 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-sb-text/70">Meta de hoy</p>
      <div className="mt-2 flex items-center gap-3">
        <ProgressRing value={repasadosHoy / total} />
        <p className="min-w-0 text-sm text-sb-text-strong">
          <span className="font-bold">{repasadosHoy}</span> de {total} tarjetas hoy
        </p>
      </div>
      <NavLink to="/study" className="mt-2.5 block">
        <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-sb-border text-xs font-semibold text-sb-text-strong transition-colors hover:border-sb-accent hover:bg-white/8">
          <Play className="size-3.5" />
          Continuar
        </span>
      </NavLink>
    </div>
  );
}

function StreakMini({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Flame className="size-4 shrink-0 text-naranja" aria-hidden />
      <span className="text-sm font-semibold text-sb-text-strong">
        {days} {days === 1 ? 'día' : 'días'}
      </span>
      <span className="text-xs text-sb-text/70">en racha</span>
    </div>
  );
}

export function SidebarBody({
  collapsed = false,
  onToggleCollapse,
  dueCount = 0,
  repasadosHoy = 0,
  rachaDias = 0,
  onNavigate,
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  dueCount?: number;
  repasadosHoy?: number;
  rachaDias?: number;
  onNavigate?: () => void;
}) {
  return (
    <div className={cn('flex h-full flex-col gap-4 p-4', collapsed && 'px-2')}>
      <div className={cn('flex items-center gap-2 px-1', collapsed && 'flex-col gap-2 px-0')}>
        <NavLink to="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sb-accent text-sb-accent-ink">
            <Zap className="size-5" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-lg font-extrabold leading-tight tracking-tight text-sb-text-strong">
                Leitner
              </span>
              <span className="block truncate text-xs text-sb-text/65">Repaso espaciado</span>
            </span>
          )}
        </NavLink>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className={cn(
              'rounded-lg p-1.5 text-sb-text/70 transition-colors hover:bg-sb-accent/10 hover:text-sb-text-strong',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2',
              !collapsed && 'ml-auto',
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>

      <div className="h-px bg-sb-border" aria-hidden />

      <nav className="grid gap-2">
        {GROUPS.map((group, gi) => (
          <div key={group.label} className="grid gap-1">
            {collapsed ? (
              gi > 0 && <div className="mx-2 my-1.5 h-px bg-sb-border" aria-hidden />
            ) : (
              <p className="nav-group-label">{group.label}</p>
            )}
            {group.items.map((item) => (
              <NavItemLink
                key={item.to}
                item={item}
                dueCount={dueCount}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto grid gap-2">
        {!collapsed && <DailyGoalCard repasadosHoy={repasadosHoy} dueTotal={dueCount} />}

        {collapsed ? (
          <Tooltip content={`${rachaDias} en racha`} side="right">
            <div className="flex items-center justify-center py-2 text-naranja">
              <Flame className="size-4" aria-hidden />
            </div>
          </Tooltip>
        ) : (
          <StreakMini days={rachaDias} />
        )}

        {collapsed ? (
          <Tooltip content="Nuevo mazo" side="right">
            <NavLink
              to="/?nuevo=mazo"
              onClick={onNavigate}
              aria-label="Nuevo mazo"
              title="Nuevo mazo"
              className="flex items-center justify-center rounded-xl border border-sb-border py-2 text-sb-text transition-colors hover:border-sb-accent hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2"
            >
              <Plus className="size-4" />
            </NavLink>
          </Tooltip>
        ) : (
          <NavLink
            to="/?nuevo=mazo"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 rounded-xl border border-sb-border px-3 py-2 text-sm font-medium text-sb-text transition-colors hover:border-sb-accent hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2"
          >
            <Plus className="size-4" />
            Nuevo mazo
          </NavLink>
        )}

        {!collapsed && (
          <NavLink
            to="/boxes?info=1"
            onClick={onNavigate}
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1 text-xs text-sb-text/65 transition-colors hover:text-sb-text-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2"
          >
            <Info className="size-3.5" aria-hidden />
            Cómo funciona
          </NavLink>
        )}
      </div>
    </div>
  );
}
