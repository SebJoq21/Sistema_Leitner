import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('animate-pulse rounded-2xl bg-azul-100', className)}
      {...props}
    />
  );
}

export function SkeletonLine({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn('h-3 animate-pulse rounded-full bg-azul-100', className)}
      {...props}
    />
  );
}
