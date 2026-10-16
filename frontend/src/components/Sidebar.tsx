import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', label: 'Mazos', end: true },
  { to: '/cards', label: 'Tarjetas', end: false },
  { to: '/boxes', label: 'Cajas', end: false },
  { to: '/study', label: 'Estudiar', end: false },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="grid gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'relative rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white before:absolute before:left-0 before:top-1/2 before:h-5 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-accent-orange'
                : 'text-slate-300 hover:bg-white/5 hover:text-white',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function SidebarBody({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <NavLink to="/" className="px-1 text-lg font-extrabold tracking-tight text-white">
        Leitner
      </NavLink>
      <NavItems />
      <div className="mt-auto grid gap-2 border-t border-white/10 pt-4">
        {email && <p className="truncate px-1 text-xs text-slate-400">{email}</p>}
        {email ? (
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white hover:bg-white/5"
          >
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

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return <NavItems onNavigate={onNavigate} />;
}
