import { ChevronDown, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function UserMenu({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  const initial = (email?.[0] ?? '?').toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-border-soft bg-surface py-1 pl-1 pr-1 text-sm text-ink transition-colors hover:border-secondary-blue hover:bg-azul-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-blue/40 data-[state=open]:border-secondary-blue data-[state=open]:bg-azul-100 md:pr-2.5"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-azul-700 text-xs font-semibold text-white dark:bg-azul-500 dark:text-[#0d1a22]">
            {initial}
          </span>
          {email && <span className="hidden max-w-40 truncate sm:inline">{email}</span>}
          <ChevronDown className="hidden size-4 shrink-0 text-ink-soft md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56">
        {email && (
          <>
            <div className="flex items-center gap-2 border-b border-border-soft px-2.5 py-2 text-xs text-ink-soft">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-azul-700 text-xs font-semibold text-white dark:bg-azul-500 dark:text-[#0d1a22]">
                {initial}
              </span>
              <span className="min-w-0 flex-1 truncate">{email}</span>
            </div>
          </>
        )}
        <DropdownMenuItem
          className="my-0.5 hover:bg-error-soft hover:text-error focus:bg-error-soft focus:text-error"
          onSelect={() => onSignOut()}
        >
          <LogOut className="size-4" />
          Salir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
