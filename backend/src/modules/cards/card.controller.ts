import type { Request, Response } from 'express';
import { cardService } from './card.service.js';
import { requireUserId } from '../../middlewares/validate.js';
import { ensureUser } from '../auth/user-sync.js';
import { settingsService } from '../settings/settings.service.js';
import type { ListCardsQuery } from './card.dto.js';

export const cardController = {
  async due(req: Request, res: Response) {
    const userId = requireUserId(req);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const deckId = typeof req.query.deckId === 'string' ? req.query.deckId : undefined;
    const cards = await cardService.due(userId, timezone, deckId, req.query.caja);
    res.json(cards);
  },

  async list(req: Request, res: Response) {
    const userId = requireUserId(req);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const cards = await cardService.list(userId, timezone, req.query as unknown as ListCardsQuery);
    res.json(cards);
  },

  async boxes(req: Request, res: Response) {
    const userId = requireUserId(req);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const deckId = typeof req.query.deckId === 'string' ? req.query.deckId : undefined;
    const stats = await cardService.boxes(userId, timezone, deckId);
    res.json(stats);
  },

  async create(req: Request, res: Response) {
    const userId = requireUserId(req);
    await ensureUser(userId, req.user?.email);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const card = await cardService.create(userId, timezone, req.body);
    res.status(201).json(card);
  },

  async update(req: Request, res: Response) {
    const card = await cardService.update(
      requireUserId(req),
      req.params.id as string,
      req.body,
    );
    res.json(card);
  },

  async remove(req: Request, res: Response) {
    await cardService.remove(requireUserId(req), req.params.id as string);
    res.status(204).send();
  },

  async review(req: Request, res: Response) {
    const userId = requireUserId(req);
    const timezone = await settingsService.resolveTimezone(userId, req.timezone);
    const card = await cardService.review(
      userId,
      timezone,
      req.params.id as string,
      (req.body as { acierto: boolean }).acierto,
    );
    res.json(card);
  },
};
