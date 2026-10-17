import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-surface px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
        <Icon className="size-7" />
      </span>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && <p className="max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
