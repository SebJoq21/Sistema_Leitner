import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { setTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState<boolean>(() =>
    typeof document === 'undefined' ? false : document.documentElement.classList.contains('dark'),
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    setTheme(next ? 'dark' : 'light');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'flex items-center justify-center gap-2 rounded-xl border border-white/20 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5',
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      <span>{dark ? 'Claro' : 'Oscuro'}</span>
    </button>
  );
}
