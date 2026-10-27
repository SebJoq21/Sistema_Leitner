import { describe, expect, it } from 'vitest';
import { updateSettingsSchema } from '../src/modules/settings/settings.dto.js';

describe('updateSettingsSchema', () => {
  it('acepta solo timezone', () => {
    expect(updateSettingsSchema.safeParse({ timezone: 'America/Bogota' }).success).toBe(true);
  });

  it('acepta intervalos y timezone', () => {
    expect(
      updateSettingsSchema.safeParse({
        intervalos: [1, 3, 7, 15, 30],
        timezone: 'America/Lima',
      }).success,
    ).toBe(true);
  });

  it('rechaza una zona inválida', () => {
    expect(updateSettingsSchema.safeParse({ timezone: 'GMT-5' }).success).toBe(false);
  });

  it('rechaza un PATCH vacío', () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });

  it('acepta null para limpiar la zona', () => {
    expect(updateSettingsSchema.safeParse({ timezone: null }).success).toBe(true);
  });
});
