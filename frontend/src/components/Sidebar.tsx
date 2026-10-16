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
              'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
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
      <NavLink to="/" className="px-1 text-lg font-extrabold tracking-tight text-indigo-600">
        Leitner
      </NavLink>
      <NavItems />
      <div className="mt-auto grid gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
        {email && <p className="truncate px-1 text-xs text-slate-500">{email}</p>}
        {email ? (
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Salir
          </button>
        ) : (
          <NavLink
            to="/login"
            className="rounded-xl bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
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
