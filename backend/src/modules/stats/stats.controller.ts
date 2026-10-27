import type { Request, Response } from 'express';
import { statsService } from './stats.service.js';
import { requireUserId } from '../../middlewares/validate.js';
import { settingsService } from '../settings/settings.service.js';

export const statsController = {
  async summary(req: Request, res: Response) {
    const userId = requireUserId(req);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const stats = await statsService.summary(userId, timezone);
    res.json(stats);
  },
};
