import type { Request, Response } from 'express';
import { cardService } from './card.service';
import { requireUserId } from '../../middlewares/validate';

export const cardController = {
  async due(req: Request, res: Response) {
    const userId = requireUserId(req);
    const deckId = typeof req.query.deckId === 'string' ? req.query.deckId : undefined;
    const cards = await cardService.due(userId, deckId);
    res.json(cards);
  },

  async create(req: Request, res: Response) {
    const card = await cardService.create(requireUserId(req), req.body);
    res.status(201).json(card);
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
