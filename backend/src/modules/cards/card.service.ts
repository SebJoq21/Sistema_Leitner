import { todayInTimeZone } from '../../lib/dates.js';
import { serializeDateOnly } from '../../lib/serialize.js';
import { cardRepository } from './card.repository.js';
import type { CreateCardDto, ListCardsQuery, UpdateCardDto } from './card.dto.js';

function parseCaja(value: unknown): number | undefined {
  if (typeof value !== 'string' || value === '') return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

export const cardService = {
  async due(userId: string, timezone: string, deckId?: string, cajaRaw?: unknown) {
    const today = todayInTimeZone(new Date(), timezone);
    const cards = await cardRepository.findDueByUser(userId, today, deckId, parseCaja(cajaRaw));
    return cards.map(serializeDateOnly);
  },
  async list(userId: string, timezone: string, query: ListCardsQuery) {
    const today = todayInTimeZone(new Date(), timezone);
    const cards = await cardRepository.findAllByUser(userId, today, query);
    return cards.map(serializeDateOnly);
  },
  async boxes(userId: string, timezone: string, deckId?: string) {
    const today = todayInTimeZone(new Date(), timezone);
    const boxes = await cardRepository.boxesByUser(userId, today, deckId);
    return boxes.map(serializeDateOnly);
  },
  async create(userId: string, timezone: string, dto: CreateCardDto) {
    const today = todayInTimeZone(new Date(), timezone);
    const card = await cardRepository.createForUser(userId, dto, today);
    return serializeDateOnly(card);
  },
  async update(userId: string, cardId: string, dto: UpdateCardDto) {
    const card = await cardRepository.updateForUser(cardId, userId, dto);
    return serializeDateOnly(card);
  },
  async remove(userId: string, cardId: string) {
    return cardRepository.removeForUser(cardId, userId);
  },
  async review(userId: string, timezone: string, cardId: string, acierto: boolean) {
    const today = todayInTimeZone(new Date(), timezone);
    const card = await cardRepository.reviewForUser(userId, cardId, acierto, today);
    return serializeDateOnly(card);
  },
};
