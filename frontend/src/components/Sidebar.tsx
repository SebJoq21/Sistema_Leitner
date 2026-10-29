import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Archive,
  Flame,
  GraduationCap,
  HelpCircle,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  SquareStack,
  type LucideIcon,
} from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { LeitnerTutorialDialog } from '@/components/LeitnerTutorialDialog';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  end: boolean;
  icon: LucideIcon;
  color: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: 'Biblioteca',
    items: [
      { to: '/', label: 'Mazos', end: true, icon: Layers, color: '#38BDF8' },
      { to: '/cards', label: 'Tarjetas', end: false, icon: SquareStack, color: '#A78BFA' },
    ],
  },
  {
    label: 'Estudio',
    items: [
      { to: '/boxes', label: 'Cajas', end: false, icon: Archive, color: '#FBBF24' },
      { to: '/study', label: 'Estudiar', end: false, icon: GraduationCap, color: '#34D399' },
    ],
  },
];

function NavItemLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  const link = (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      aria-label={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex min-h-10 w-full items-center rounded-xl text-sm font-medium transition-all duration-150 motion-reduce:transition-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2',
          collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2',
          isActive &&
            cn(
              'bg-sb-active-bg font-semibold text-sb-text-strong shadow-sm',
              'before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-sb-accent',
            ),
          !isActive && 'text-sb-text/85 hover:bg-sb-accent/10 hover:text-sb-text-strong',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 motion-reduce:transition-none group-hover:scale-105',
            )}
            style={{
              backgroundColor: isActive ? `${item.color}2E` : `${item.color}1A`,
              color: item.color,
            }}
          >
            <Icon className="size-4 shrink-0" />
          </span>
          {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
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

function StreakCard({ days, collapsed }: { days: number; collapsed: boolean }) {
  const active = days > 0;
  if (collapsed) {
    return (
      <Tooltip content={`${days} ${days === 1 ? 'día' : 'días'} en racha`} side="right">
        <div
          className="mx-auto flex size-10 items-center justify-center rounded-xl border transition-transform hover:scale-105"
          style={{
            background: active
              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.28), rgba(251, 191, 36, 0.14))'
              : 'rgba(255, 255, 255, 0.06)',
            borderColor: active ? 'rgba(251, 146, 60, 0.45)' : 'var(--color-sb-border)',
          }}
        >
          <Flame className={cn('size-5', active ? 'text-[#FB923C]' : 'text-sb-text/60')} aria-hidden />
        </div>
      </Tooltip>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-3 shadow-sm"
      style={{
        background: active
          ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.26) 0%, rgba(245, 158, 11, 0.12) 100%)'
          : 'rgba(255, 255, 255, 0.05)',
        borderColor: active ? 'rgba(251, 146, 60, 0.4)' : 'var(--color-sb-border)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm"
          style={{
            background: active
              ? 'linear-gradient(135deg, #EA580C 0%, #F59E0B 100%)'
              : 'rgba(255, 255, 255, 0.1)',
            color: '#FFFFFF',
          }}
          aria-hidden
        >
          <Flame className="size-4.5 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-extrabold leading-none tracking-tight text-sb-text-strong">
              {days} {days === 1 ? 'día' : 'días'}
            </span>
            <span className="text-xs font-semibold text-[#FDBA74]">en racha</span>
          </div>
          <p className="mt-1 text-[11px] leading-snug text-sb-text/80">
            {active ? '¡Sigue así todos los días!' : 'Estudia hoy para encenderla'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function SidebarBody({
  collapsed = false,
  onToggleCollapse,
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
  const [tutorialOpen, setTutorialOpen] = useState(false);

  return (
    <div className={cn('flex h-full flex-col gap-4', collapsed ? 'px-2 py-4' : 'p-4')}>
      <div className={cn('flex w-full items-center gap-2', collapsed ? 'flex-col px-0' : 'px-1')}>
        <NavLink
          to="/"
          onClick={onNavigate}
          aria-label="Leitner"
          className={cn('flex min-w-0 items-center gap-2', collapsed && 'justify-center')}
        >
          <BrandMark className="size-10" />
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
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto grid gap-2.5 pt-3">
        <StreakCard days={rachaDias} collapsed={collapsed} />

        {collapsed ? (
          <Tooltip content="Cómo funciona el Sistema Leitner" side="right">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              aria-label="Cómo funciona el Sistema Leitner"
              className="mx-auto flex size-10 items-center justify-center rounded-xl border border-sb-border bg-white/5 text-[#38BDF8] transition-colors hover:border-sb-accent/50 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2"
            >
              <HelpCircle className="size-4.5" aria-hidden />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setTutorialOpen(true)}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-sb-border bg-white/6 px-3 py-2 text-xs font-semibold text-sb-text transition-all hover:border-sb-accent/50 hover:bg-white/12 hover:text-sb-text-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-sb-accent focus-visible:outline-offset-2"
          >
            <HelpCircle className="size-4 text-[#38BDF8] transition-transform group-hover:scale-110" aria-hidden />
            Cómo funciona
          </button>
        )}
      </div>

      <LeitnerTutorialDialog open={tutorialOpen} onOpenChange={setTutorialOpen} />
    </div>
  );
}
