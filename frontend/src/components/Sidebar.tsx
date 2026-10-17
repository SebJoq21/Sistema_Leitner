import { NavLink } from 'react-router-dom';
import { Archive, GraduationCap, Layers, LogOut, SquareStack, Zap, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';

const items: { to: string; label: string; end: boolean; icon: LucideIcon }[] = [
  { to: '/', label: 'Mazos', end: true, icon: Layers },
  { to: '/cards', label: 'Tarjetas', end: false, icon: SquareStack },
  { to: '/boxes', label: 'Cajas', end: false, icon: Archive },
  { to: '/study', label: 'Estudiar', end: false, icon: GraduationCap },
];

function NavItems({ onNavigate, dueCount = 0 }: { onNavigate?: () => void; dueCount?: number }) {
  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isStudy = item.to === '/study';
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent-orange'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {isStudy && dueCount > 0 && (
              <span className="ml-auto rounded-full bg-accent-orange px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {dueCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}

export function SidebarBody({
  email,
  dueCount = 0,
  onSignOut,
}: {
  email?: string;
  dueCount?: number;
  onSignOut: () => void;
}) {
  const initial = (email?.[0] ?? '?').toUpperCase();
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <NavLink to="/" className="flex items-center gap-2 px-1">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-orange text-white">
          <Zap className="size-5" />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-white">Leitner</span>
      </NavLink>

      <NavItems dueCount={dueCount} />

      <div className="mt-auto grid gap-3 border-t border-white/10 pt-4">
        {email && (
          <div className="flex items-center gap-2 px-1">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
              {initial}
            </span>
            <p className="min-w-0 flex-1 truncate text-xs text-slate-300">{email}</p>
          </div>
        )}
        <ThemeToggle className="w-full" />
        {email ? (
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
          >
            <LogOut className="size-4" />
            Salir
          </button>
        ) : (
          <NavLink
            to="/login"
            className="rounded-xl bg-accent-orange px-3 py-2 text-center text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Entrar
          </NavLink>
        )}
      </div>
    </div>
  );
}

export function SidebarNav({ onNavigate, dueCount = 0 }: { onNavigate?: () => void; dueCount?: number }) {
  return <NavItems onNavigate={onNavigate} dueCount={dueCount} />;
}
