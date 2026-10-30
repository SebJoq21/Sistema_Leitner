const base = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://localhost:3001').replace(/\/$/, '');

export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface Deck {
  id: string;
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icon?: string | null;
  tags?: string[];
  metaDiaria?: number | null;
  _count?: { cards: number };
  total?: number;
  pendientes?: number;
  dominadas?: number;
  ultimoEstudio?: string | null;
  proximaRevision?: string | null;
}

export interface DueCard {
  id: string;
  deckId: string;
  frontText: string;
  backText: string;
  hint?: string | null;
  notas?: string | null;
  tags?: string[];
  cajaActual: number;
  proximaRevision: string;
  createdAt?: string;
  updatedAt?: string;
  deck?: { id: string; nombre: string; color?: string | null; icon?: string | null };
}

export interface BoxStats {
  caja: number;
  intervaloDias: number;
  total: number;
  pendientes: number;
  proximaRevision: string | null;
}

export interface Settings {
  userId: string;
  intervalos: number[];
  timezone: string | null;
}

export interface StatsSummary {
  totalTarjetas: number;
  dominadas: number;
  pendientes: number;
  progresoGeneral: number;
  rachaDias: number;
  repasadosHoy: number;
}

export interface CardFilters {
  deckId?: string;
  caja?: number;
  search?: string;
  tag?: string;
  pendientes?: boolean;
  order?: 'createdAt' | 'proximaRevision' | 'updatedAt';
}

export interface DeckPayload {
  nombre: string;
  descripcion?: string | null;
  color?: string | null;
  icon?: string | null;
  tags?: string[];
  metaDiaria?: number | null;
}

export interface CardPayload {
  deckId: string;
  frontText: string;
  backText: string;
  hint?: string | null;
  notas?: string | null;
  tags?: string[];
  cajaInicial?: number;
}

function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const timeZone = browserTimeZone();
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
        ...(timeZone ? { 'X-Timezone': timeZone } : {}),
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
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      details?: unknown;
      proximaRevision?: string;
    };
    const errorMessage = body.error ?? `Error ${res.status}`;
    throw new ApiError(res.status, errorMessage, body.code, body);
  }
  return (await res.json()) as T;
}

export const api = {
  listDecks: (token: string) => request<Deck[]>('/api/v1/decks', token),
  createDeck: (token: string, data: DeckPayload) =>
    request<Deck>('/api/v1/decks', token, { method: 'POST', body: JSON.stringify(data) }),
  updateDeck: (token: string, id: string, data: Partial<DeckPayload>) =>
    request<Deck>(`/api/v1/decks/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
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
    if (filters.tag) q.set('tag', filters.tag);
    if (filters.pendientes !== undefined) q.set('pendientes', String(filters.pendientes));
    if (filters.order) q.set('order', filters.order);
    const suffix = q.size > 0 ? `?${q.toString()}` : '';
    return request<DueCard[]>(`/api/v1/cards${suffix}`, token);
  },
  boxesStats: (token: string) => request<BoxStats[]>('/api/v1/cards/boxes', token),
  stats: (token: string) => request<StatsSummary>('/api/v1/stats', token),
  updateCard: (
    token: string,
    id: string,
    data: {
      deckId?: string;
      frontText?: string;
      backText?: string;
      hint?: string | null;
      notas?: string | null;
      tags?: string[];
    },
  ) => request<DueCard>(`/api/v1/cards/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteCard: (token: string, id: string) =>
    request<void>(`/api/v1/cards/${id}`, token, { method: 'DELETE' }),
  createCard: (token: string, data: CardPayload) =>
    request<DueCard>('/api/v1/cards', token, { method: 'POST', body: JSON.stringify(data) }),
  reviewCard: (token: string, id: string, acierto: boolean) =>
    request<DueCard>(`/api/v1/cards/${id}/review`, token, {
      method: 'POST',
      body: JSON.stringify({ acierto }),
    }),

  getSettings: (token: string) => request<Settings>('/api/v1/settings', token),
  updateSettings: (
    token: string,
    data: { intervalos?: number[]; timezone?: string | null },
  ) =>
    request<Settings>('/api/v1/settings', token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
