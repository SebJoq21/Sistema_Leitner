import { z } from 'zod';

export const createDeckSchema = z.object({
  nombre: z.string().min(1).max(100),
  descripcion: z.string().max(500).optional(),
});

export const updateDeckSchema = z.object({
  nombre: z.string().min(1).max(100).optional(),
  descripcion: z.string().max(500).nullable().optional(),
});

export type CreateDeckDto = z.infer<typeof createDeckSchema>;
export type UpdateDeckDto = z.infer<typeof updateDeckSchema>;
