import { z } from 'zod';

export const createCardSchema = z.object({
  deckId: z.string().uuid(),
  frontText: z.string().min(1).max(2000),
  backText: z.string().min(1).max(2000),
});

export const reviewCardSchema = z.object({
  acierto: z.boolean(),
});

export type CreateCardDto = z.infer<typeof createCardSchema>;
export type ReviewCardDto = z.infer<typeof reviewCardSchema>;
