import { useState } from 'react';
import { Link, useLoaderData, useRevalidator, redirect } from 'react-router-dom';
import { Clock, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DeckList } from '@/features/decks/DeckList';
import { DeckForm, type DeckSubmitValues } from '@/features/decks/DeckForm';
import { CardForm, type CardSubmitValues } from '@/features/decks/CardForm';
import { api, type Deck, type DueCard } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

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
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [cardDeck, setCardDeck] = useState<Deck | null>(null);
  const [confirmDeck, setConfirmDeck] = useState<Deck | null>(null);
  const [busy, setBusy] = useState(false);

  const token = getStoredToken();

  function tokenOrThrow(): string {
    if (!token) throw new Error('Sin sesión. Entra de nuevo.');
    return token;
  }

  async function handleCreateDeck(values: DeckSubmitValues) {
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

  async function handleUpdateDeck(values: DeckSubmitValues) {
    if (!editingDeck) return;
    setBusy(true);
    try {
      const updated = await api.updateDeck(tokenOrThrow(), editingDeck.id, values);
      setDecks((list) => list.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
      setEditingDeck(null);
      toast.success('Mazo actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDeleteDeck() {
    if (!confirmDeck) return;
    const deck = confirmDeck;
    setBusy(true);
    try {
      // Snapshot para poder deshacer.
      let cards: DueCard[] = [];
      try {
        cards = await api.listCards(tokenOrThrow(), { deckId: deck.id });
      } catch {
        cards = [];
      }
      await api.deleteDeck(tokenOrThrow(), deck.id);
      setDecks((d) => d.filter((x) => x.id !== deck.id));
      setConfirmDeck(null);
      toast.success(`Mazo "${deck.nombre}" borrado`, {
        action: {
          label: 'Deshacer',
          onClick: async () => {
            try {
              const recreated = await api.createDeck(tokenOrThrow(), {
                nombre: deck.nombre,
                descripcion: deck.descripcion,
                color: deck.color,
                icon: deck.icon,
                tags: deck.tags,
                metaDiaria: deck.metaDiaria,
              });
              for (const c of cards) {
                await api.createCard(tokenOrThrow(), {
                  deckId: recreated.id,
                  frontText: c.frontText,
                  backText: c.backText,
                  hint: c.hint,
                  notas: c.notas,
                  tags: c.tags,
                  cajaInicial: c.cajaActual,
                });
              }
              toast.success('Mazo restaurado');
              revalidator.revalidate();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : 'No se pudo restaurar');
            }
          },
        },
      });
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo borrar');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCard(values: CardSubmitValues, opts: { keepOpen: boolean }) {
    setBusy(true);
    try {
      await api.createCard(tokenOrThrow(), values);
      if (!opts.keepOpen) setCardDeck(null);
      toast.success('Tarjeta guardada');
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
        onDelete={setConfirmDeck}
        onAddCard={setCardDeck}
        onCreateDeck={() => setDeckOpen(true)}
        onEdit={setEditingDeck}
      />

      <Dialog open={cardDeck !== null} onOpenChange={(open) => !open && setCardDeck(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Nueva tarjeta</DialogTitle>
          {cardDeck && token && (
            <CardForm
              deckId={cardDeck.id}
              deckName={cardDeck.nombre}
              decks={decks}
              onRequestCreateDeck={() => setDeckOpen(true)}
              token={token}
              onSubmit={handleCreateCard}
              submitting={busy}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Se registra al final para quedar por encima del diálogo de tarjeta */}
      <Dialog open={deckOpen} onOpenChange={setDeckOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Nuevo mazo</DialogTitle>
          <DeckForm onSubmit={handleCreateDeck} submitting={busy} />
        </DialogContent>
      </Dialog>

      <Dialog open={editingDeck !== null} onOpenChange={(open) => !open && setEditingDeck(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogTitle>Editar mazo</DialogTitle>
          {editingDeck && (
            <DeckForm
              initial={editingDeck}
              onSubmit={handleUpdateDeck}
              submitting={busy}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDeck !== null}
        onOpenChange={(open) => !open && setConfirmDeck(null)}
        title={`¿Borrar "${confirmDeck?.nombre ?? ''}"?`}
        description={
          confirmDeck
            ? `Se borrarán también sus ${confirmDeck.total ?? confirmDeck._count?.cards ?? 0} tarjetas. Esta acción se puede deshacer unos segundos desde el aviso.`
            : undefined
        }
        confirmLabel="Borrar mazo"
        loading={busy}
        onConfirm={confirmDeleteDeck}
      />
    </div>
  );
}
