import type { Request, Response } from 'express';
import { deckService } from './deck.service';
import { requireUserId } from '../../middlewares/validate';

export const deckController = {
  async list(req: Request, res: Response) {
    const decks = await deckService.list(requireUserId(req));
    res.json(decks);
  },

  async create(req: Request, res: Response) {
    const deck = await deckService.create(requireUserId(req), req.body);
    res.status(201).json(deck);
  },

  async update(req: Request, res: Response) {
    const deck = await deckService.update(requireUserId(req), req.params.id as string, req.body);
    if (!deck) return res.status(404).json({ error: 'Deck no encontrado' });
    res.json(deck);
  },

  async remove(req: Request, res: Response) {
    await deckService.remove(requireUserId(req), req.params.id as string);
    res.status(204).send();
  },
};
