import express from 'express';
import cors from 'cors';
import { deckRoutes } from './modules/decks/deck.routes.js';
import { cardRoutes } from './modules/cards/card.routes.js';
import { settingsRoutes } from './modules/settings/settings.routes.js';
import { statsRoutes } from './modules/stats/stats.routes.js';
import { errorHandler } from './middlewares/validate.js';
import { timezoneMiddleware } from './middlewares/timezone.js';

export function createApp() {
  const app = express();
  app.use(cors({ allowedHeaders: ['Content-Type', 'Authorization', 'X-Timezone'] }));
  app.use(express.json());
  app.use(timezoneMiddleware);

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'leitner-backend' }));

  // Versionado REST (tu doc Webserver-restserver-endpoints): /api/v1/...
  app.use('/api/v1/decks', deckRoutes);
  app.use('/api/v1/cards', cardRoutes);
  app.use('/api/v1/settings', settingsRoutes);
  app.use('/api/v1/stats', statsRoutes);

  // Compat con rutas sin versionar (slice mínimo anterior)
  app.use('/api/decks', deckRoutes);
  app.use('/api/cards', cardRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/stats', statsRoutes);

  app.use((_req, res) => res.status(404).json({ error: 'No encontrado' }));
  app.use(errorHandler);

  return app;
}
