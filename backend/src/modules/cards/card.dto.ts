import { z } from 'zod';

export const createCardSchema = z.object({
  deckId: z.string().uuid(),
  frontText: z.string().min(1).max(2000),
  backText: z.string().min(1).max(2000),
});

export const reviewCardSchema = z.object({
  acierto: z.boolean(),
});

export const updateCardSchema = z
  .object({
    frontText: z.string().min(1).max(2000).optional(),
    backText: z.string().min(1).max(2000).optional(),
  })
  .refine((d) => d.frontText !== undefined || d.backText !== undefined, {
    message: 'Nada que actualizar',
  });

export const listCardsQuerySchema = z.object({
  deckId: z.string().uuid().optional(),
  caja: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(200).optional(),
});

export type CreateCardDto = z.infer<typeof createCardSchema>;
export type ReviewCardDto = z.infer<typeof reviewCardSchema>;
export type UpdateCardDto = z.infer<typeof updateCardSchema>;
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
