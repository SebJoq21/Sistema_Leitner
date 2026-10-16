const base = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://localhost:3001').replace(/\/$/, '');

export interface Deck {
  id: string;
  nombre: string;
  descripcion?: string | null;
  _count?: { cards: number };
}

export interface DueCard {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  cajaActual: number;
  proximaRevision: string;
  deck?: { id: string; nombre: string };
}

export interface BoxStats {
  caja: number;
  intervaloDias: number;
  total: number;
  pendientes: number;
}

export interface CardFilters {
  deckId?: string;
  caja?: number;
  search?: string;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    // Sin timeout, un backend apagado deja la promesa colgada eternamente
    // y el router re-dispara loaders acumulando requests pendientes.
    res = await fetch(`${base}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(15000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new Error('El servidor no responde. ¿Está el backend encendido en :3001?');
    }
    throw new Error('No se pudo conectar al servidor. ¿Está el backend encendido en :3001?');
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Error ${res.status}`);
  }
  return (await res.json()) as T;
}

export const api = {
  listDecks: (token: string) => request<Deck[]>('/api/v1/decks', token),
  createDeck: (token: string, data: { nombre: string; descripcion?: string }) =>
    request<Deck>('/api/v1/decks', token, { method: 'POST', body: JSON.stringify(data) }),
  deleteDeck: (token: string, id: string) =>
    request<void>(`/api/v1/decks/${id}`, token, { method: 'DELETE' }),

  dueCards: (token: string, deckId?: string, caja?: number) => {
    const q = new URLSearchParams();
    if (deckId) q.set('deckId', deckId);
    if (caja !== undefined) q.set('caja', String(caja));
    const suffix = q.size > 0 ? `?${q.toString()}` : '';
    return request<DueCard[]>(`/api/v1/cards/due${suffix}`, token);
  },
  listCards: (token: string, filters: CardFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.deckId) q.set('deckId', filters.deckId);
    if (filters.caja !== undefined) q.set('caja', String(filters.caja));
    if (filters.search) q.set('search', filters.search);
    const suffix = q.size > 0 ? `?${q.toString()}` : '';
    return request<DueCard[]>(`/api/v1/cards${suffix}`, token);
  },
  boxesStats: (token: string) => request<BoxStats[]>('/api/v1/cards/boxes', token),
  updateCard: (token: string, id: string, data: { frontText?: string; backText?: string }) =>
    request<DueCard>(`/api/v1/cards/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCard: (token: string, id: string) =>
    request<void>(`/api/v1/cards/${id}`, token, { method: 'DELETE' }),
  createCard: (token: string, data: { deckId: string; frontText: string; backText: string }) =>
    request<DueCard>('/api/v1/cards', token, { method: 'POST', body: JSON.stringify(data) }),
  reviewCard: (token: string, id: string, acierto: boolean) =>
    request<DueCard>(`/api/v1/cards/${id}/review`, token, {
      method: 'POST',
      body: JSON.stringify({ acierto }),
    }),
};
