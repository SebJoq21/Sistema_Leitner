import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { TagInput } from '@/components/ui/tag-input';
import { CajaBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { cardSchema, type CardFormValues } from '@/schemas';

export interface CardSubmitValues {
  deckId: string;
  frontText: string;
  backText: string;
  hint?: string;
  notas?: string;
  tags?: string[];
  cajaInicial?: number;
}

export function CardForm({
  deckId,
  deckName,
  token,
  onSubmit,
  submitting,
}: {
  deckId: string;
  deckName: string;
  token: string;
  onSubmit: (values: CardSubmitValues, opts: { keepOpen: boolean }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const defaults: CardFormValues = {
    deckId,
    frontText: '',
    backText: '',
    hint: '',
    notas: '',
    tags: [],
    cajaInicial: '1',
  };
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<CardFormValues>({ resolver: zodResolver(cardSchema), defaultValues: defaults });

  const frontText = watch('frontText') ?? '';
  const backText = watch('backText') ?? '';
  const hint = watch('hint') ?? '';
  const cajaInicial = Number(watch('cajaInicial')) || 1;
  const [existing, setExisting] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    api
      .listCards(token, { deckId })
      .then((cards) => {
        if (active) setExisting(cards.map((c) => c.frontText.trim().toLowerCase()));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, deckId]);

  const isDuplicate = frontText.trim() !== '' && existing.includes(frontText.trim().toLowerCase());

  function build(values: CardFormValues): CardSubmitValues {
    return {
      deckId,
      frontText: values.frontText.trim(),
      backText: values.backText.trim(),
      hint: values.hint?.trim() ? values.hint.trim() : undefined,
      notas: values.notas?.trim() ? values.notas.trim() : undefined,
      tags: values.tags,
      cajaInicial: Number(values.cajaInicial) || 1,
    };
  }

  async function doSubmit(values: CardFormValues, keepOpen: boolean) {
    if (existing.includes(values.frontText.trim().toLowerCase())) {
      setError('frontText', { message: 'Ya existe una tarjeta con esta pregunta en el mazo' });
      return;
    }
    clearErrors('frontText');
    await onSubmit(build(values), { keepOpen });
    reset(defaults);
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
      {/* Vista previa */}
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-primary-muted p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <CajaBadge caja={cajaInicial} />
          <span className="text-xs text-ink-soft">{deckName}</span>
        </div>
        <p className="text-sm font-semibold text-ink">{frontText.trim() || 'Pregunta…'}</p>
        <p className="text-sm text-ink-soft">{backText.trim() || 'Respuesta…'}</p>
        {hint.trim() && <p className="text-xs italic text-ink-soft">Pista: {hint.trim()}</p>}
      </div>

      <div className="grid gap-1.5">
        <TextArea
          label="Pregunta (anverso)"
          placeholder="Escribe la pregunta o el concepto. Una idea por tarjeta."
          error={errors.frontText?.message}
          maxLength={2000}
          {...register('frontText')}
        />
        {isDuplicate && !errors.frontText && (
          <p className="flex items-center gap-1.5 text-xs text-warn">
            <AlertTriangle className="size-3.5" />
            Ya hay una tarjeta con esta pregunta en el mazo.
          </p>
        )}
      </div>

      <TextArea
        label="Respuesta (reverso)"
        placeholder="Respuesta corta y precisa funciona mejor."
        error={errors.backText?.message}
        maxLength={2000}
        {...register('backText')}
      />

      <Input
        label="Pista (opcional)"
        placeholder="Se muestra a petición durante el estudio"
        maxLength={500}
        {...register('hint')}
      />

      <TextArea
        label="Ejemplo / notas (opcional)"
        placeholder="Contexto adicional que aparece tras ver la respuesta."
        maxLength={2000}
        {...register('notas')}
      />

      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagInput value={field.value ?? []} onChange={field.onChange} error={errors.tags?.message} />
        )}
      />

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Caja inicial</label>
        <select
          className="h-10 rounded-xl border border-slate-200 bg-primary-bg px-3 text-sm outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900"
          {...register('cajaInicial')}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Caja {n}
            </option>
          ))}
        </select>
        <p className="text-xs text-ink-soft">Por defecto entra en la Caja 1.</p>
      </div>

      <div className={cn('flex flex-wrap gap-2')}>
        <Button type="button" variant="outline" onClick={handleSubmit((v) => doSubmit(v, true))} disabled={submitting}>
          {submitting ? 'Guardando…' : 'Guardar y crear otra'}
        </Button>
        <Button type="button" onClick={handleSubmit((v) => doSubmit(v, false))} disabled={submitting}>
          Guardar
        </Button>
      </div>
    </form>
  );
}
