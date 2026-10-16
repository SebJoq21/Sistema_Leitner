import { deckRepository } from './deck.repository';
import type { CreateDeckDto, UpdateDeckDto } from './deck.dto';

export const deckService = {
  list(userId: string) {
    return deckRepository.findAllByUser(userId);
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
