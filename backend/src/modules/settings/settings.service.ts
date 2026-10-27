import { settingsRepository } from './settings.repository.js';
import type { UpdateSettingsDto } from './settings.dto.js';

export const settingsService = {
  get(userId: string, headerTimezone?: string) {
    return settingsRepository.getOrCreate(userId, headerTimezone);
  },
  update(userId: string, dto: UpdateSettingsDto) {
    return settingsRepository.update(userId, {
      intervalos: dto.intervalos,
      timezone: dto.timezone,
    });
  },
  resolveTimezone(userId: string, headerTimezone?: string) {
    return settingsRepository.resolveTimezone(userId, headerTimezone);
  },
};
