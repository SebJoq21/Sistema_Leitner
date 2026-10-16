import { z } from 'zod';

// Espejo de los DTOs del backend (deck.dto / card.dto) para validar antes de enviar.
export const deckSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100),
  descripcion: z.string().max(500).optional(),
});

export const cardSchema = z.object({
  deckId: z.string().uuid('Deck inválido'),
  frontText: z.string().min(1, 'La pregunta es obligatoria').max(2000),
  backText: z.string().min(1, 'La respuesta es obligatoria').max(2000),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type DeckFormValues = z.infer<typeof deckSchema>;
export type CardFormValues = z.infer<typeof cardSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
