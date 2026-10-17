import type { Request, Response } from 'express';
import { settingsService } from './settings.service.js';
import { requireUserId } from '../../middlewares/validate.js';
import { ensureUser } from '../auth/user-sync.js';

export const settingsController = {
  async get(req: Request, res: Response) {
    await ensureUser(requireUserId(req), req.user?.email);
    const settings = await settingsService.get(requireUserId(req));
    res.json(settings);
  },

  async update(req: Request, res: Response) {
    await ensureUser(requireUserId(req), req.user?.email);
    const settings = await settingsService.update(requireUserId(req), req.body);
    res.json(settings);
  },
};
