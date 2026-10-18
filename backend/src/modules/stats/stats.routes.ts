import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler } from '../../middlewares/validate.js';
import { statsController } from './stats.controller.js';

export const statsRoutes = Router();

statsRoutes.use(authMiddleware);
statsRoutes.get('/', asyncHandler(statsController.summary));
