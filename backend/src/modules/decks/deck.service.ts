import { todayInTimeZone } from '../../lib/dates.js';
import { serializeDateOnly } from '../../lib/serialize.js';
import { deckRepository } from './deck.repository.js';
import type { CreateDeckDto, UpdateDeckDto } from './deck.dto.js';

export const deckService = {
  async list(userId: string, timezone: string) {
    const today = todayInTimeZone(new Date(), timezone);
    const decks = await deckRepository.findAllByUser(userId, today);
    return decks.map(serializeDateOnly);
  },
  create(userId: string, dto: CreateDeckDto) {
    return deckRepository.create(userId, dto);
  },
  async update(userId: string, id: string, dto: UpdateDeckDto) {
    await deckRepository.assertOwnership(id, userId);
    await deckRepository.update(id, userId, dto);
    return deckRepository.findByIdForUser(id, userId);
  },
  async remove(userId: string, id: string) {
    await deckRepository.assertOwnership(id, userId);
    await deckRepository.remove(id, userId);
  },
};
