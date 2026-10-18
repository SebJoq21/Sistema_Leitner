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
        'inline-flex size-9 items-center justify-center rounded-xl border border-border-soft text-ink-soft transition-colors hover:bg-azul-100 hover:text-secondary-navy',
        className,
      )}
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
