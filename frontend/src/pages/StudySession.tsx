import { Link, redirect, useLoaderData, useNavigate, type LoaderFunctionArgs } from 'react-router-dom';
import { GraduationCap, X } from 'lucide-react';
import { StudySessionView } from '@/features/study/StudySessionView';
import { api, type Deck, type DueCard } from '@/lib/api';
import { daysUntil } from '@/lib/leitner';
import { getStoredToken } from '@/lib/supabase';

export interface StudyData {
  cards: DueCard[];
  token: string;
  deckId?: string;
  caja?: number;
  decks: Deck[];
  nextReview: string | null;
}

export async function studyLoader({ request }: LoaderFunctionArgs): Promise<StudyData> {
  const token = getStoredToken();
  if (!token) {
    throw redirect('/login');
  }
  const url = new URL(request.url);
  const deckId = url.searchParams.get('deckId') ?? undefined;
  const cajaRaw = url.searchParams.get('caja');
  const caja = cajaRaw ? Number(cajaRaw) : undefined;
  const [cards, decks, upcoming] = await Promise.all([
    api.dueCards(token, deckId, caja),
    api.listDecks(token),
    api.listCards(token, { deckId, caja, order: 'proximaRevision' }),
  ]);
  const nextReview = upcoming.find((c) => daysUntil(c.proximaRevision) > 0)?.proximaRevision ?? null;
  return { cards, token, deckId, caja, decks, nextReview };
}

const selectClass =
  'h-9 rounded-xl border border-border-soft bg-primary-bg px-2.5 text-sm text-ink outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15';

export function StudySessionPage() {
  const { cards, token, deckId, caja, decks, nextReview } = useLoaderData() as StudyData;
  const navigate = useNavigate();
  const hasFilter = Boolean(deckId || caja);

  return (
    <div className="grid gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">
            <GraduationCap className="size-6 text-secondary-blue" />
            Sesión de estudio
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {cards.length} tarjeta{cards.length === 1 ? '' : 's'} pendiente{cards.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Qué estudiar"
            className={selectClass}
            value={deckId ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) navigate(`/study?deckId=${value}`);
              else navigate(caja ? `/study?caja=${caja}` : '/study');
            }}
          >
            <option value="">Todos los mazos</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por caja"
            className={selectClass}
            value={caja ? String(caja) : ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value) navigate(`/study?caja=${value}`);
              else navigate(deckId ? `/study?deckId=${deckId}` : '/study');
            }}
          >
            <option value="">Todas las cajas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Caja {n}
              </option>
            ))}
          </select>
          {hasFilter && (
            <Link
              to="/study"
              className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <X className="size-3.5" />
              Quitar filtro
            </Link>
          )}
        </div>
      </div>

      <StudySessionView initialCards={cards} token={token} nextReview={nextReview} />
    </div>
  );
}
