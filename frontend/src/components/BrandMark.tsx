import { cn } from '@/lib/utils';

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src="/leitner-logo.png"
      alt=""
      aria-hidden="true"
      width={40}
      height={40}
      draggable={false}
      className={cn('shrink-0 select-none object-contain', className)}
    />
  );
}
