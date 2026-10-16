import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { validateBody } from '../../middlewares/validate';
import { deckController } from './deck.controller';
import { createDeckSchema, updateDeckSchema } from './deck.dto';

export const deckRoutes = Router();

deckRoutes.use(authMiddleware);
deckRoutes.get('/', deckController.list);
deckRoutes.post('/', validateBody(createDeckSchema), deckController.create);
deckRoutes.patch('/:id', validateBody(updateDeckSchema), deckController.update);
deckRoutes.delete('/:id', deckController.remove);
