import { useMemo, useState } from 'react';
import { Link, redirect, useLoaderData, useRevalidator, type LoaderFunctionArgs } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input, TextArea } from '@/components/ui/input';
import { api, type Deck, type DueCard } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

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
      <TextArea label="Anverso" value={frontText} onChange={(e) => setFrontText(e.target.value)} />
      <TextArea label="Reverso" value={backText} onChange={(e) => setBackText(e.target.value)} />
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
  const [busy, setBusy] = useState(false);

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

  async function handleDelete(card: DueCard) {
    if (!window.confirm(`¿Borrar la tarjeta "${card.frontText.slice(0, 40)}"?`)) return;
    try {
      await api.deleteCard(token, card.id);
      setCards((list) => list.filter((c) => c.id !== card.id));
      toast.success('Tarjeta borrada');
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo borrar');
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Tarjetas</h1>
        <p className="text-sm text-slate-500">{filtered.length} de {cards.length} tarjetas</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Buscar" placeholder="Texto del anverso o reverso…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Mazo</label>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={deckId}
            onChange={(e) => setDeckId(e.target.value)}
          >
            <option value="">Todos</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Caja</label>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={caja}
            onChange={(e) => setCaja(e.target.value)}
          >
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>Caja {n}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="py-4 text-center text-sm text-slate-500">Sin tarjetas con esos filtros.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle className="text-base">{card.frontText}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{card.backText}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary-blue/10 px-2 py-0.5 text-xs font-semibold text-secondary-blue dark:bg-secondary-blue/20 dark:text-slate-200">
                    Caja {card.cajaActual}
                  </span>
                  <span className="text-xs text-slate-400">{card.deck?.nombre}</span>
                  <span className="ml-auto flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(card)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(card)}>
                      Borrar
                    </Button>
                    <Link to={`/study?deckId=${card.deckId}`}>
                      <Button size="sm">Estudiar</Button>
                    </Link>
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
    </div>
  );
}
