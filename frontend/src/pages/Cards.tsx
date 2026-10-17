import { useMemo, useState } from 'react';
import { Link, redirect, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router-dom';
import { Clock, Filter, Pencil, Play, Plus, SquareStack, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CajaBadge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, TextArea } from '@/components/ui/input';
import { api, type Deck, type DueCard } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';
import { formatNextReview } from '@/lib/leitner';

export interface CardsData {
  cards: DueCard[];
  decks: Deck[];
  token: string;
}

export async function cardsLoader({ request }: LoaderFunctionArgs): Promise<CardsData> {
  const token = getStoredToken();
  if (!token) {
    throw redirect('/login');
  }
  const url = new URL(request.url);
  const filters = {
    deckId: url.searchParams.get('deckId') ?? undefined,
    caja: url.searchParams.get('caja') ? Number(url.searchParams.get('caja')) : undefined,
    search: url.searchParams.get('search') ?? undefined,
  };
  const [cards, decks] = await Promise.all([api.listCards(token, filters), api.listDecks(token)]);
  return { cards, decks, token };
}

function EditCardForm({
  card,
  onSubmit,
  submitting,
}: {
  card: DueCard;
  onSubmit: (values: { frontText: string; backText: string }) => Promise<void> | void;
  submitting?: boolean;
}) {
  const [frontText, setFrontText] = useState(card.frontText);
  const [backText, setBackText] = useState(card.backText);
  return (
    <form
      className="grid gap-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await onSubmit({ frontText, backText });
      }}
    >
      <TextArea label="Pregunta (anverso)" value={frontText} onChange={(e) => setFrontText(e.target.value)} />
      <TextArea label="Respuesta (reverso)" value={backText} onChange={(e) => setBackText(e.target.value)} />
      <Button type="submit" disabled={submitting || frontText.trim() === '' || backText.trim() === ''}>
        {submitting ? 'Guardando…' : 'Guardar cambios'}
      </Button>
    </form>
  );
}

export function CardsPage() {
  const { cards: initial, decks, token } = useLoaderData() as CardsData;
  const revalidator = useRevalidator();
  const [cards, setCards] = useState<DueCard[]>(initial);
  const [search, setSearch] = useState('');
  const [deckId, setDeckId] = useState('');
  const [caja, setCaja] = useState('');
  const [editing, setEditing] = useState<DueCard | null>(null);
  const [confirmCard, setConfirmCard] = useState<DueCard | null>(null);
  const [busy, setBusy] = useState(false);

  const hasFilters = search.trim() !== '' || deckId !== '' || caja !== '';

  function clearFilters() {
    setSearch('');
    setDeckId('');
    setCaja('');
  }

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (deckId && c.deckId !== deckId) return false;
      if (caja && c.cajaActual !== Number(caja)) return false;
      if (s && !c.frontText.toLowerCase().includes(s) && !c.backText.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [cards, search, deckId, caja]);

  async function handleUpdate(values: { frontText: string; backText: string }) {
    if (!editing) return;
    setBusy(true);
    try {
      const updated = await api.updateCard(token, editing.id, values);
      setCards((list) => list.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      setEditing(null);
      toast.success('Tarjeta actualizada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirmCard) return;
    const card = confirmCard;
    try {
      await api.deleteCard(token, card.id);
      setCards((list) => list.filter((c) => c.id !== card.id));
      setConfirmCard(null);
      toast.success('Tarjeta borrada', {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              const recreated = await api.createCard(token, {
                deckId: card.deckId,
                frontText: card.frontText,
                backText: card.backText,
                hint: card.hint,
                notas: card.notas,
                tags: card.tags,
                cajaInicial: card.cajaActual,
              });
              setCards((list) => [recreated, ...list]);
              toast.success('Tarjeta restaurada');
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'No se pudo restaurar');
            }
          },
        },
      });
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo borrar');
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Tarjetas</h1>
        <p className="text-sm text-ink-soft">
          {filtered.length} de {cards.length} tarjeta{cards.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <Input
          label="Buscar"
          placeholder="Texto de la pregunta o respuesta…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mazo</label>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-primary-bg px-3 text-sm outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
          >
            <option value="">Todos</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Caja</label>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-primary-bg px-3 text-sm outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15 dark:border-slate-700 dark:bg-slate-900"
            value={caja}
            onChange={(e) => setCaja(e.target.value)}
          >
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Caja {n}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" onClick={clearFilters} disabled={!hasFilters}>
          <X className="size-4" />
          Limpiar
        </Button>
      </div>

      {cards.length === 0 ? (
        <EmptyState
          icon={SquareStack}
          title="Todavía no hay tarjetas"
          description="Crea un mazo y añade tu primera tarjeta para empezar."
          action={
            <Link to="/">
              <Button>
                <Plus className="size-4" />
                Ir a mis mazos
              </Button>
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Filter}
          title="No encontramos tarjetas con ese filtro"
          description="Prueba con otro texto o quita los filtros aplicados."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              <X className="size-4" />
              Limpiar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((card) => (
            <Card key={card.id} className="transition-shadow hover:shadow-md">
              <CardContent className="grid gap-3 pt-6">
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Pregunta</p>
                    <p className="text-sm font-semibold text-ink">{card.frontText}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Respuesta</p>
                    <p className="text-sm text-ink-soft">{card.backText}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <CajaBadge caja={card.cajaActual} />
                  {card.deck && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: card.deck.color ?? '#1D4ED8' }}
                        aria-hidden
                      />
                      {card.deck.nombre}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                    <Clock className="size-3.5" />
                    {formatNextReview(card.proximaRevision)}
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label="Editar tarjeta" onClick={() => setEditing(card)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Link to={`/study?deckId=${card.deckId}`} aria-label="Estudiar este mazo">
                      <Button size="icon" variant="ghost">
                        <Play className="size-4" />
                      </Button>
                    </Link>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-ink-soft hover:bg-error-soft hover:text-error"
                      aria-label="Borrar tarjeta"
                      onClick={() => setConfirmCard(card)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogTitle>Editar tarjeta</DialogTitle>
          {editing && <EditCardForm card={editing} onSubmit={handleUpdate} submitting={busy} />}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmCard !== null}
        onOpenChange={(open) => !open && setConfirmCard(null)}
        title="¿Borrar esta tarjeta?"
        description={confirmCard ? `"${confirmCard.frontText.slice(0, 80)}"` : undefined}
        confirmLabel="Borrar tarjeta"
        onConfirm={handleDelete}
      />
    </div>
  );
}
