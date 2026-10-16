import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { validateBody } from '../../middlewares/validate';
import { cardController } from './card.controller';
import { createCardSchema, reviewCardSchema } from './card.dto';

export const cardRoutes = Router();

cardRoutes.use(authMiddleware);
cardRoutes.get('/due', cardController.due);
cardRoutes.post('/', validateBody(createCardSchema), cardController.create);
cardRoutes.post('/:id/review', validateBody(reviewCardSchema), cardController.review);
