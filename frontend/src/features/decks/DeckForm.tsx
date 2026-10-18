import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { TagInput } from '@/components/ui/tag-input';
import { cn } from '@/lib/utils';
import { deckIcon, DECK_COLORS, DECK_ICON_OPTIONS } from '@/lib/leitner';
import { deckSchema, type DeckFormValues } from '@/schemas';
import type { Deck } from '@/lib/api';

export interface DeckSubmitValues {
  nombre: string;
  descripcion?: string;
  color?: string;
  icon?: string;
  tags?: string[];
  metaDiaria?: number;
}

function toDefaults(initial?: Deck): DeckFormValues {
  return {
    nombre: initial?.nombre ?? '',
    descripcion: initial?.descripcion ?? '',
    color: initial?.color ?? DECK_COLORS[0],
    icon: initial?.icon ?? 'library',
    tags: initial?.tags ?? [],
    metaDiaria: initial?.metaDiaria != null ? String(initial.metaDiaria) : undefined,
  };
}

export function DeckForm({
  onSubmit,
  submitting,
  initial,
  submitLabel,
}: {
  onSubmit: (values: DeckSubmitValues) => Promise<void> | void;
  submitting?: boolean;
  initial?: Deck;
  submitLabel?: string;
}) {
  const defaults = toDefaults(initial);
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm<DeckFormValues>({ resolver: zodResolver(deckSchema), defaultValues: defaults });

  const nombre = watch('nombre') ?? '';
  const descripcion = watch('descripcion') ?? '';
  const color = watch('color') ?? DECK_COLORS[0]!;
  const icon = watch('icon') ?? 'library';
  const PreviewIcon = deckIcon(icon);

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({
          nombre: values.nombre.trim(),
          descripcion: values.descripcion?.trim() ? values.descripcion.trim() : undefined,
          color: values.color,
          icon: values.icon,
          tags: values.tags,
          metaDiaria: values.metaDiaria ? Number(values.metaDiaria) : undefined,
        });
        if (!initial) reset(toDefaults());
      })}
    >
      {/* Vista previa */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-primary-muted p-3 dark:border-slate-700 dark:bg-slate-900">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          <PreviewIcon className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{nombre.trim() || 'Nombre del mazo'}</p>
          <p className="truncate text-xs text-ink-soft">
            {descripcion.trim() || 'Sin descripción'}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Input
          label="Nombre"
          placeholder="Capitales de Europa"
          error={errors.nombre?.message}
          maxLength={60}
          {...register('nombre')}
        />
        <p className="text-right text-[11px] text-ink-soft">{nombre.length}/60</p>
      </div>

      <div className="grid gap-1.5">
        <TextArea
          label="Descripción"
          placeholder="¿De qué trata este mazo? ¿Para qué examen o curso es?"
          error={errors.descripcion?.message}
          maxLength={200}
          {...register('descripcion')}
        />
        <p className="text-right text-[11px] text-ink-soft">{descripcion.length}/200</p>
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Color</label>
        <Controller
          control={control}
          name="color"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => field.onChange(c)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-105',
                    field.value === c && 'ring-2 ring-slate-900 dark:ring-white',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {field.value === c && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Ícono</label>
        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <div className="grid grid-cols-7 gap-1.5">
              {DECK_ICON_OPTIONS.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  type="button"
                  aria-label={`Ícono ${name}`}
                  onClick={() => field.onChange(name)}
                  className={cn(
                    'flex h-9 items-center justify-center rounded-lg border transition-colors',
                    field.value === name
                      ? 'border-secondary-blue bg-secondary-blue/10 text-secondary-blue'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800',
                  )}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          )}
        />
      </div>

      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagInput value={field.value ?? []} onChange={field.onChange} error={errors.tags?.message} />
        )}
      />

      <Input
        label="Meta diaria (opcional)"
        type="number"
        min={1}
        max={1000}
        placeholder="Máximo de tarjetas nuevas por día"
        error={errors.metaDiaria?.message}
        {...register('metaDiaria')}
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Guardando…' : submitLabel ?? 'Crear mazo'}
      </Button>
    </form>
  );
}
