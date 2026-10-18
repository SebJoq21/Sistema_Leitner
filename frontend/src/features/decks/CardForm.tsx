import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { TagInput } from '@/components/ui/tag-input';
import { CajaBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, type Deck } from '@/lib/api';
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

const selectClass =
  'h-10 rounded-xl border border-slate-200 bg-primary-bg px-3 text-sm outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900';

export function CardForm({
  deckId,
  deckName,
  decks,
  onRequestCreateDeck,
  token,
  onSubmit,
  submitting,
}: {
  deckId?: string;
  deckName?: string;
  decks?: Deck[];
  onRequestCreateDeck?: () => void;
  token: string;
  onSubmit: (values: CardSubmitValues, opts: { keepOpen: boolean }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const defaults: CardFormValues = {
    deckId: deckId ?? decks?.[0]?.id ?? '',
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
  const notas = watch('notas') ?? '';
  const effectiveDeckId = watch('deckId') ?? '';
  const cajaInicial = Number(watch('cajaInicial')) || 1;
  const effectiveDeckName = decks?.find((d) => d.id === effectiveDeckId)?.nombre ?? deckName ?? '';
  const [existing, setExisting] = useState<string[]>([]);

  useEffect(() => {
    if (!effectiveDeckId) {
      setExisting([]);
      return;
    }
    let active = true;
    api
      .listCards(token, { deckId: effectiveDeckId })
      .then((cards) => {
        if (active) setExisting(cards.map((c) => c.frontText.trim().toLowerCase()));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, effectiveDeckId]);

  const isDuplicate = frontText.trim() !== '' && existing.includes(frontText.trim().toLowerCase());

  function build(values: CardFormValues): CardSubmitValues {
    return {
      deckId: values.deckId,
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
    reset({ ...defaults, deckId: values.deckId });
  }

  return (
    <form className="grid gap-4" onSubmit={(e) => e.preventDefault()}>
      {/* Vista previa */}
      <div className="grid gap-2 rounded-xl border border-slate-200 bg-primary-muted p-3 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <CajaBadge caja={cajaInicial} />
          <span className="text-xs text-ink-soft">{effectiveDeckName}</span>
        </div>
        <p className="text-sm font-semibold text-ink">{frontText.trim() || 'Pregunta…'}</p>
        <p className="text-sm text-ink-soft">{backText.trim() || 'Respuesta…'}</p>
        {hint.trim() && <p className="text-xs italic text-ink-soft">Pista: {hint.trim()}</p>}
      </div>

      {decks && decks.length > 0 && (
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mazo</label>
          <Controller
            control={control}
            name="deckId"
            render={({ field }) => (
              <select
                className={selectClass}
                value={field.value}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    onRequestCreateDeck?.();
                    return;
                  }
                  field.onChange(e.target.value);
                }}
              >
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
                {onRequestCreateDeck && <option value="__new__">+ Crear mazo nuevo</option>}
              </select>
            )}
          />
          {errors.deckId?.message && <p className="text-xs text-error">{errors.deckId.message}</p>}
        </div>
      )}

      <div className="grid gap-1.5">
        <TextArea
          label="Pregunta (anverso)"
          placeholder="Escribe la pregunta o el concepto. Una idea por tarjeta."
          error={errors.frontText?.message}
          maxLength={2000}
          {...register('frontText')}
        />
        <div className="flex items-center justify-between">
          {isDuplicate && !errors.frontText ? (
            <p className="flex items-center gap-1.5 text-xs text-warn">
              <AlertTriangle className="size-3.5" />
              Ya hay una tarjeta con esta pregunta en el mazo.
            </p>
          ) : (
            <span />
          )}
          <p className="text-[11px] text-ink-soft">{frontText.length}/2000</p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <TextArea
          label="Respuesta (reverso)"
          placeholder="Respuesta corta y precisa funciona mejor."
          error={errors.backText?.message}
          maxLength={2000}
          {...register('backText')}
        />
        <p className="text-right text-[11px] text-ink-soft">{backText.length}/2000</p>
      </div>

      <div className="grid gap-1.5">
        <Input
          label="Pista (opcional)"
          placeholder="Se muestra a petición durante el estudio"
          maxLength={500}
          {...register('hint')}
        />
        <p className="text-right text-[11px] text-ink-soft">{hint.length}/500</p>
      </div>

      <div className="grid gap-1.5">
        <TextArea
          label="Ejemplo / notas (opcional)"
          placeholder="Contexto adicional que aparece tras ver la respuesta."
          maxLength={2000}
          {...register('notas')}
        />
        <p className="text-right text-[11px] text-ink-soft">{notas.length}/2000</p>
      </div>

      <Controller
        control={control}
        name="tags"
        render={({ field }) => (
          <TagInput value={field.value ?? []} onChange={field.onChange} error={errors.tags?.message} />
        )}
      />

      <div className="grid gap-1.5">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Caja inicial</label>
        <select className={selectClass} {...register('cajaInicial')}>
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
          {submitting ? 'Guardando…' : 'Guardar'}
        </Button>
        {onRequestCreateDeck && (
          <Button type="button" variant="ghost" onClick={onRequestCreateDeck}>
            <Plus className="size-4" />
            Mazo nuevo
          </Button>
        )}
      </div>
    </form>
  );
}
