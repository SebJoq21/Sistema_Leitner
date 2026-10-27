import { z } from 'zod';
import { isValidTimeZone } from '../../lib/dates.js';

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(isValidTimeZone, { message: 'Zona horaria IANA inválida' });

export const updateSettingsSchema = z
  .object({
    intervalos: z.array(z.number().int().min(1).max(365)).length(5).optional(),
    timezone: timezoneSchema.nullable().optional(),
  })
  .refine((d) => d.intervalos !== undefined || d.timezone !== undefined, {
    message: 'Nada que actualizar',
  });

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
