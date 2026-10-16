import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router-dom';
import { StudySessionView } from '@/features/study/StudySessionView';
import { api, type DueCard } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

export interface StudyData {
  cards: DueCard[];
  token: string;
  deckId?: string;
}

export async function studyLoader({ request }: LoaderFunctionArgs): Promise<StudyData> {
  const token = getStoredToken();
  if (!token) {
    throw redirect('/login');
  }
  const url = new URL(request.url);
  const deckId = url.searchParams.get('deckId') ?? undefined;
  const cards = await api.dueCards(token, deckId);
  return { cards, token, deckId };
}

export function StudySessionPage() {
  const { cards, token } = useLoaderData() as StudyData;
  return (
    <div className="grid gap-6 py-4">
      <h1 className="text-center text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Sesión de estudio</h1>
      <StudySessionView initialCards={cards} token={token} />
    </div>
  );
}
