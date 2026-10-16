import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler, validateBody } from '../../middlewares/validate.js';
import { cardController } from './card.controller.js';
import { createCardSchema, reviewCardSchema } from './card.dto.js';

export const cardRoutes = Router();

cardRoutes.use(authMiddleware);
cardRoutes.get('/due', asyncHandler(cardController.due));
cardRoutes.post('/', validateBody(createCardSchema), asyncHandler(cardController.create));
cardRoutes.post('/:id/review', validateBody(reviewCardSchema), asyncHandler(cardController.review));
