import { z } from 'zod';

export const updateSettingsSchema = z.object({
  intervalos: z.array(z.number().int().min(1).max(365)).length(5),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
