import { cardRepository } from './card.repository.js';
import type { CreateCardDto } from './card.dto.js';

export const cardService = {
  due(userId: string, deckId?: string) {
    return cardRepository.findDueByUser(userId, deckId);
  },
  create(userId: string, dto: CreateCardDto) {
    return cardRepository.createForUser(userId, dto);
  },
  review(userId: string, cardId: string, acierto: boolean) {
    return cardRepository.reviewForUser(cardId, userId, acierto);
  },
};
