import * as React from 'react';
import { cn } from '@/lib/utils';
import { cajaTheme } from '@/lib/leitner';

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        className,
      )}
      {...props}
    />
  );
}

export function CajaBadge({ caja, className }: { caja: number; className?: string }) {
  const theme = cajaTheme(caja);
  const Icon = theme.icon;
  return (
    <Badge className={cn(theme.badge, className)}>
      <Icon className="size-3" />
      Caja {caja}
    </Badge>
  );
}
