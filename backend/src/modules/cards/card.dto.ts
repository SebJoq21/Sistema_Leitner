import { z } from 'zod';

const tagsSchema = z.array(z.string().min(1).max(30)).max(10).optional();

export const createCardSchema = z.object({
  deckId: z.string().uuid(),
  frontText: z.string().min(1).max(2000),
  backText: z.string().min(1).max(2000),
  hint: z.string().max(500).nullish(),
  notas: z.string().max(2000).nullish(),
  tags: tagsSchema,
  cajaInicial: z.coerce.number().int().min(1).max(5).optional(),
});

export const reviewCardSchema = z.object({
  acierto: z.boolean(),
});

export const updateCardSchema = z
  .object({
    deckId: z.string().uuid().optional(),
    frontText: z.string().min(1).max(2000).optional(),
    backText: z.string().min(1).max(2000).optional(),
    hint: z.string().max(500).nullish(),
    notas: z.string().max(2000).nullish(),
    tags: tagsSchema,
  })
  .refine(
    (d) =>
      d.deckId !== undefined ||
      d.frontText !== undefined ||
      d.backText !== undefined ||
      d.hint !== undefined ||
      d.notas !== undefined ||
      d.tags !== undefined,
    { message: 'Nada que actualizar' },
  );

export const listCardsQuerySchema = z.object({
  deckId: z.string().uuid().optional(),
  caja: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().max(200).optional(),
  tag: z.string().max(30).optional(),
  pendientes: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  order: z.enum(['createdAt', 'proximaRevision', 'updatedAt']).optional(),
});

export type CreateCardDto = z.infer<typeof createCardSchema>;
export type ReviewCardDto = z.infer<typeof reviewCardSchema>;
export type UpdateCardDto = z.infer<typeof updateCardSchema>;
export type ListCardsQuery = z.infer<typeof listCardsQuerySchema>;
