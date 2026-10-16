import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? React.useId();
  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'h-10 rounded-xl border border-slate-200 bg-primary-bg px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900',
          error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-100',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ className, label, error, id, ...props }: TextAreaProps) {
  const inputId = id ?? React.useId();
  return (
    <div className="grid gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'min-h-20 rounded-xl border border-slate-200 bg-primary-bg px-3 py-2 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900',
          error && 'border-rose-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
