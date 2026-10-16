import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input, TextArea } from '@/components/ui/input';
import { deckSchema, type DeckFormValues } from '@/schemas';

export function DeckForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: DeckFormValues) => Promise<void> | void;
  submitting?: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeckFormValues>({ resolver: zodResolver(deckSchema) });

  return (
    <form
      className="grid gap-4"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
        reset();
      })}
    >
      <Input label="Nombre" placeholder="Vocabulario inglés" error={errors.nombre?.message} {...register('nombre')} />
      <TextArea label="Descripción" placeholder="Palabras de la unidad 3…" error={errors.descripcion?.message} {...register('descripcion')} />
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Crear mazo'}
      </Button>
    </form>
  );
}
