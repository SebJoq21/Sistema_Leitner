import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler, validateBody } from '../../middlewares/validate.js';
import { settingsController } from './settings.controller.js';
import { updateSettingsSchema } from './settings.dto.js';

export const settingsRoutes = Router();

settingsRoutes.use(authMiddleware);
settingsRoutes.get('/', asyncHandler(settingsController.get));
settingsRoutes.patch('/', validateBody(updateSettingsSchema), asyncHandler(settingsController.update));
