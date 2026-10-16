import type { Request, Response } from 'express';
import { cardService } from './card.service.js';
import { requireUserId } from '../../middlewares/validate.js';
import { ensureUser } from '../auth/user-sync.js';
import type { ListCardsQuery } from './card.dto.js';

export const cardController = {
  async due(req: Request, res: Response) {
    const userId = requireUserId(req);
    const deckId = typeof req.query.deckId === 'string' ? req.query.deckId : undefined;
    const cards = await cardService.due(userId, deckId, req.query.caja);
    res.json(cards);
  },

  async list(req: Request, res: Response) {
    const cards = await cardService.list(requireUserId(req), req.query as unknown as ListCardsQuery);
    res.json(cards);
  },

  async boxes(req: Request, res: Response) {
    const deckId = typeof req.query.deckId === 'string' ? req.query.deckId : undefined;
    const stats = await cardService.boxes(requireUserId(req), deckId);
    res.json(stats);
  },

  async create(req: Request, res: Response) {
    await ensureUser(requireUserId(req), req.user?.email);
    const card = await cardService.create(requireUserId(req), req.body);
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
    const card = await cardService.review(
      requireUserId(req),
      req.params.id as string,
      (req.body as { acierto: boolean }).acierto,
    );
    res.json(card);
  },
};
