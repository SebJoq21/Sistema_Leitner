import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.js';
import { cardController } from './card.controller.js';
import { createCardSchema, reviewCardSchema } from './card.dto.js';

export const cardRoutes = Router();

cardRoutes.use(authMiddleware);
cardRoutes.get('/due', cardController.due);
cardRoutes.post('/', validateBody(createCardSchema), cardController.create);
cardRoutes.post('/:id/review', validateBody(reviewCardSchema), cardController.review);
