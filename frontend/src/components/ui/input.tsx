import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-10 rounded-xl border border-border-soft bg-primary-bg px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15',
          error && 'border-error focus:border-error focus:ring-error/20',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ className, label, error, id, ...props }: TextAreaProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'min-h-20 rounded-xl border border-border-soft bg-primary-bg px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15',
          error && 'border-error',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
