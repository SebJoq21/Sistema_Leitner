import type { Request, Response } from 'express';
import { statsService } from './stats.service.js';
import { requireUserId } from '../../middlewares/validate.js';

export const statsController = {
  async summary(req: Request, res: Response) {
    const stats = await statsService.summary(requireUserId(req));
    res.json(stats);
  },
};
