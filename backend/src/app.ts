import express from 'express';
import cors from 'cors';
import { deckRoutes } from './modules/decks/deck.routes';
import { cardRoutes } from './modules/cards/card.routes';
import { errorHandler } from './middlewares/validate';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'leitner-backend' }));

  app.use('/api/decks', deckRoutes);
  app.use('/api/cards', cardRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));
  app.use(errorHandler);

  return app;
}
