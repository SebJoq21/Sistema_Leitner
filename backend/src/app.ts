import express from 'express';
import cors from 'cors';
import { deckRoutes } from './modules/decks/deck.routes.js';
import { cardRoutes } from './modules/cards/card.routes.js';
import { errorHandler } from './middlewares/validate.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'leitner-backend' }));

  // Versionado REST (tu doc Webserver-restserver-endpoints): /api/v1/...
  app.use('/api/v1/decks', deckRoutes);
  app.use('/api/v1/cards', cardRoutes);

  // Compat con rutas sin versionar (slice mínimo anterior)
  app.use('/api/decks', deckRoutes);
  app.use('/api/cards', cardRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));
  app.use(errorHandler);

  return app;
}
