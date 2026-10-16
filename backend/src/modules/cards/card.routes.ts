import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler, validateBody, validateQuery } from '../../middlewares/validate.js';
import { cardController } from './card.controller.js';
import { createCardSchema, listCardsQuerySchema, reviewCardSchema, updateCardSchema } from './card.dto.js';

export const cardRoutes = Router();

cardRoutes.use(authMiddleware);
cardRoutes.get('/', validateQuery(listCardsQuerySchema), asyncHandler(cardController.list));
cardRoutes.get('/boxes', asyncHandler(cardController.boxes));
cardRoutes.get('/due', asyncHandler(cardController.due));
cardRoutes.post('/', validateBody(createCardSchema), asyncHandler(cardController.create));
cardRoutes.patch('/:id', validateBody(updateCardSchema), asyncHandler(cardController.update));
cardRoutes.delete('/:id', asyncHandler(cardController.remove));
cardRoutes.post('/:id/review', validateBody(reviewCardSchema), asyncHandler(cardController.review));
