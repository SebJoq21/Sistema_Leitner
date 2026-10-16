import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.js';
import { deckController } from './deck.controller.js';
import { createDeckSchema, updateDeckSchema } from './deck.dto.js';

export const deckRoutes = Router();

deckRoutes.use(authMiddleware);
deckRoutes.get('/', deckController.list);
deckRoutes.post('/', validateBody(createDeckSchema), deckController.create);
deckRoutes.patch('/:id', validateBody(updateDeckSchema), deckController.update);
deckRoutes.delete('/:id', deckController.remove);
