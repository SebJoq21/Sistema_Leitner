import { prisma } from '../../config/prisma.js';

/**
 * La tabla public.users está sincronizada con Supabase Auth (spec §2.4),
 * pero Auth no la rellena sola: el primer request con un JWT nuevo
 * crearía decks huérfanos (FK). Este helper hace upsert idempotente.
 */
export async function ensureUser(userId: string, email?: string) {
  if (!email) return;
  await prisma.user.upsert({
    where: { id: userId },
    update: { email },
    create: { id: userId, email },
  });
}
