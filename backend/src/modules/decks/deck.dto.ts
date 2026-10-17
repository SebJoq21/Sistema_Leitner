import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color hex inválido (ej. #1D4ED8)');

const tagsSchema = z.array(z.string().min(1).max(30)).max(10).optional();

export const createDeckSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
  color: hexColor.optional(),
  icon: z.string().max(50).nullish(),
  tags: tagsSchema,
  metaDiaria: z.coerce.number().int().min(1).max(1000).nullish(),
});

export const updateDeckSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).nullable().optional(),
  color: hexColor.nullable().optional(),
  icon: z.string().max(50).nullish(),
  tags: tagsSchema,
  metaDiaria: z.coerce.number().int().min(1).max(1000).nullish(),
});

export type CreateDeckDto = z.infer<typeof createDeckSchema>;
export type UpdateDeckDto = z.infer<typeof updateDeckSchema>;
