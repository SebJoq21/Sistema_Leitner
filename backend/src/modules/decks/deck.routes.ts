import { Router } from 'express';
import { authMiddleware } from '../auth/auth.middleware.js';
import { asyncHandler, validateBody } from '../../middlewares/validate.js';
import { deckController } from './deck.controller.js';
import { createDeckSchema, updateDeckSchema } from './deck.dto.js';

export const deckRoutes = Router();

deckRoutes.use(authMiddleware);
deckRoutes.get('/', asyncHandler(deckController.list));
deckRoutes.post('/', validateBody(createDeckSchema), asyncHandler(deckController.create));
deckRoutes.patch('/:id', validateBody(updateDeckSchema), asyncHandler(deckController.update));
deckRoutes.delete('/:id', asyncHandler(deckController.remove));
