import { useState } from 'react';
import { Link, useLoaderData, useRevalidator, redirect } from 'react-router-dom';
import { Clock, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DeckList } from '@/features/decks/DeckList';
import { DeckForm } from '@/features/decks/DeckForm';
import { CardForm } from '@/features/decks/CardForm';
import { api, type Deck } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';
import type { CardFormValues, DeckFormValues } from '@/schemas';

export interface DashboardData {
  decks: Deck[];
  dueTotal: number;
}

export async function dashboardLoader(): Promise<DashboardData> {
  const token = getStoredToken();
  if (!token) {
    throw redirect('/login');
  }
  const [decks, due] = await Promise.all([api.listDecks(token), api.dueCards(token)]);
  return { decks, dueTotal: due.length };
}

export function DashboardPage() {
  const { decks: initialDecks, dueTotal } = useLoaderData() as DashboardData;
  const revalidator = useRevalidator();
  const [decks, setDecks] = useState<Deck[]>(initialDecks);
  const [deckOpen, setDeckOpen] = useState(false);
  const [cardDeck, setCardDeck] = useState<Deck | null>(null);
  const [busy, setBusy] = useState(false);

  function tokenOrThrow(): string {
    const token = getStoredToken();
    if (!token) throw new Error('Sin sesión. Entra de nuevo.');
    return token;
  }

  async function handleCreateDeck(values: DeckFormValues) {
    setBusy(true);
    try {
      const created = await api.createDeck(tokenOrThrow(), values);
      setDecks((d) => [created, ...d]);
      setDeckOpen(false);
      toast.success('Mazo creado');
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear el mazo');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteDeck(id: string) {
    try {
      await api.deleteDeck(tokenOrThrow(), id);
      setDecks((d) => d.filter((deck) => deck.id !== id));
      toast.success('Mazo borrado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo borrar');
    }
  }

  async function handleCreateCard(values: CardFormValues) {
    setBusy(true);
    try {
      await api.createCard(tokenOrThrow(), values);
      setCardDeck(null);
      toast.success('Tarjeta creada en caja 1');
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo crear la tarjeta');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Tus mazos</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-soft">
            <Clock className="size-4" />
            {dueTotal > 0
              ? `${dueTotal} tarjeta${dueTotal === 1 ? '' : 's'} pendiente${dueTotal === 1 ? '' : 's'} de repaso hoy`
              : 'Nada pendiente por hoy'}
          </p>
        </div>
        <div className="flex gap-2">
          {dueTotal > 0 ? (
            <Link to="/study">
              <Button>
                <Play className="size-4" />
                Estudiar ({dueTotal})
              </Button>
            </Link>
          ) : (
            <Button disabled>
              <Clock className="size-4" />
              Nada pendiente
            </Button>
          )}
          <Button variant="secondary" onClick={() => setDeckOpen(true)}>
            <Plus className="size-4" />
            Nuevo mazo
          </Button>
        </div>
      </div>

      <DeckList
        decks={decks}
        onDelete={handleDeleteDeck}
        onAddCard={setCardDeck}
        onCreateDeck={() => setDeckOpen(true)}
      />

      <Dialog open={deckOpen} onOpenChange={setDeckOpen}>
        <DialogContent>
          <DialogTitle>Nuevo mazo</DialogTitle>
          <DeckForm onSubmit={handleCreateDeck} submitting={busy} />
        </DialogContent>
      </Dialog>

      <Dialog open={cardDeck !== null} onOpenChange={(open) => !open && setCardDeck(null)}>
        <DialogContent>
          <DialogTitle>Nueva tarjeta</DialogTitle>
          {cardDeck && (
            <CardForm deckId={cardDeck.id} deckName={cardDeck.nombre} onSubmit={handleCreateCard} submitting={busy} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
