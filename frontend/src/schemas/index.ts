import { z } from 'zod';

// Espejo de los DTOs del backend (deck.dto / card.dto) para validar antes de enviar.
// Los campos numéricos viven como string en el formulario y se convierten al enviar.
const metaDiaria = z
  .string()
  .optional()
  .refine(
    (v) => v === undefined || v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 1000),
    'Entre 1 y 1000',
  );

export const deckSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido').optional(),
  icon: z.string().max(50).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  metaDiaria,
});

export const cardSchema = z.object({
  deckId: z.string().uuid('Deck inválido'),
  frontText: z.string().min(1, 'La pregunta es obligatoria').max(2000),
  backText: z.string().min(1, 'La respuesta es obligatoria').max(2000),
  hint: z.string().max(500).optional(),
  notas: z.string().max(2000).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  cajaInicial: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type DeckFormValues = z.infer<typeof deckSchema>;
export type CardFormValues = z.infer<typeof cardSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
