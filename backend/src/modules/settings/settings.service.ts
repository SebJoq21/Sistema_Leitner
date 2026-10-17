import { settingsRepository } from './settings.repository.js';
import type { UpdateSettingsDto } from './settings.dto.js';

export const settingsService = {
  get(userId: string) {
    return settingsRepository.getOrCreate(userId);
  },
  update(userId: string, dto: UpdateSettingsDto) {
    return settingsRepository.update(userId, dto.intervalos);
  },
};
