import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-blue focus-visible:ring-offset-1 disabled:pointer-events-none disabled:border-transparent disabled:bg-azul-100 disabled:text-ink-soft disabled:hover:bg-azul-100 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-azul-700 text-white hover:bg-tinta',
        secondary: 'bg-azul-100 text-secondary-navy hover:bg-azul-100/70',
        success: 'bg-ok text-white hover:brightness-95',
        danger: 'bg-error text-white hover:brightness-95',
        destructive: 'bg-error text-white hover:brightness-95',
        study: 'bg-naranja text-white hover:bg-naranja-hover',
        outline: 'border border-border-soft bg-surface text-ink hover:bg-primary-muted',
        ghost: 'text-ink-soft hover:bg-azul-100 hover:text-secondary-navy',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'size-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
