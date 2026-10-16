import { cardRepository } from './card.repository.js';
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from './card.dto.js';

function parseCaja(value: unknown): number | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

export const cardService = {
  due(userId: string, deckId?: string, cajaRaw?: unknown) {
    return cardRepository.findDueByUser(userId, deckId, parseCaja(cajaRaw));
  },
  list(userId: string, query: ListCardsQuery) {
    return cardRepository.findAllByUser(userId, query);
  },
  boxes(userId: string, deckId?: string) {
    return cardRepository.boxesByUser(userId, deckId);
  },
  create(userId: string, dto: CreateCardDto) {
    return cardRepository.createForUser(userId, dto);
  },
  update(userId: string, cardId: string, dto: UpdateCardDto) {
    return cardRepository.updateForUser(cardId, userId, dto);
  },
  remove(userId: string, cardId: string) {
    return cardRepository.removeForUser(cardId, userId);
  },
  review(userId: string, cardId: string, acierto: boolean) {
    return cardRepository.reviewForUser(cardId, userId, acierto);
  },
};
