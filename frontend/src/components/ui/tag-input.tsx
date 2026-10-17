import { useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_TAGS = 10;

export function TagInput({
  label = 'Etiquetas',
  value,
  onChange,
  placeholder = 'Escribe y pulsa Enter…',
  error,
}: {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const tag = draft.trim();
    if (tag && !value.includes(tag) && value.length < MAX_TAGS) {
      onChange([...value, tag]);
    }
    setDraft('');
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-primary-bg p-1.5 focus-within:border-secondary-blue focus-within:ring-2 focus-within:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900',
          error && 'border-rose-500',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-secondary-blue/10 px-2 py-0.5 text-xs font-medium text-secondary-blue dark:text-slate-200"
          >
            {tag}
            <button
              type="button"
              aria-label={`Quitar ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-full hover:text-error"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={value.length === 0 ? placeholder : ''}
          className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
          disabled={value.length >= MAX_TAGS}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-500">{error}</p>
      ) : (
        <p className="text-xs text-ink-soft">Enter para agregar · máx. {MAX_TAGS}</p>
      )}
    </div>
  );
}
