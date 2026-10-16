import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/input';
import { cardSchema, type CardFormValues } from '@/schemas';

export function CardForm({
  deckId,
  deckName,
  onSubmit,
  submitting,
}: {
  deckId: string;
  deckName: string;
  onSubmit: (values: CardFormValues) => Promise<void> | void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema),
    defaultValues: { deckId, frontText: '', backText: '' },
  });

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({ ...values, deckId });
        reset({ deckId, frontText: '', backText: '' });
      })}
    >
      <p className="text-xs text-slate-500">
        Nueva tarjeta en <span className="font-semibold">{deckName}</span> — entra en caja 1.
      </p>
      <TextArea label="Anverso (pregunta)" placeholder="¿Cómo se dice…?" error={errors.frontText?.message} {...register('frontText')} />
      <TextArea label="Reverso (respuesta)" placeholder="Respuesta…" error={errors.backText?.message} {...register('backText')} />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Añadir tarjeta'}
      </Button>
    </form>
  );
}
