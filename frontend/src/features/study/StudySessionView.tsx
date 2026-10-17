import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, RotateCw, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api, type DueCard } from '@/lib/api';
import { Flashcard } from './Flashcard';
import { LeitnerControls } from './LeitnerControls';

export function StudySessionView({ initialCards, token }: { initialCards: DueCard[]; token: string }) {
  const [cards, setCards] = useState<DueCard[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState({ ok: 0, fail: 0 });

  const current = cards[index];

  async function handleResult(acierto: boolean) {
    if (!current || sending) return;
    setSending(true);
    try {
      const updated = await api.reviewCard(token, current.id, acierto);
      setDone((d) => ({ ok: d.ok + (acierto ? 1 : 0), fail: d.fail + (acierto ? 0 : 1) }));
      toast.success(
        acierto ? `Acertaste → caja ${updated.cajaActual}` : 'Fallaste → vuelve a caja 1',
      );
      setFlipped(false);
      setIndex((i) => i + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar el repaso');
    } finally {
      setSending(false);
    }
  }

  function handleRestart(remaining: DueCard[]) {
    setCards(remaining);
    setIndex(0);
    setFlipped(false);
    setDone({ ok: 0, fail: 0 });
  }

  if (!current) {
    const total = done.ok + done.fail;
    const allDoneEmpty = initialCards.length === 0;
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent>
          <div className="grid gap-4 py-6 text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ok-soft text-ok">
              <Trophy className="size-8" />
            </span>
            <div className="grid gap-1">
              <p className="text-lg font-bold">
                {allDoneEmpty ? '¡Todo al día!' : '¡Sesión completa!'}
              </p>
              <p className="text-sm text-ink-soft">
                {allDoneEmpty
                  ? 'No tienes tarjetas pendientes por ahora.'
                  : `Repasaste ${total} tarjeta${total === 1 ? '' : 's'}.`}
              </p>
            </div>
            {!allDoneEmpty && (
              <div className="mx-auto flex gap-6 text-sm">
                <span className="font-semibold text-ok">Aciertos: {done.ok}</span>
                <span className="font-semibold text-error">Fallos: {done.fail}</span>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              <Link to="/">
                <Button variant="secondary">
                  <ArrowLeft className="size-4" />
                  Ir a Mazos
                </Button>
              </Link>
              <Link to="/cards">
                <Button>
                  <Plus className="size-4" />
                  Agregar tarjetas
                </Button>
              </Link>
              {cards.length > 0 && (
                <Button variant="outline" onClick={() => handleRestart(cards)}>
                  <RotateCw className="size-4" />
                  Repasar de nuevo
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <p className="text-center text-sm text-ink-soft">
        Tarjeta {index + 1} de {cards.length}
      </p>
      <Flashcard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
      {flipped ? (
        <LeitnerControls onResult={handleResult} disabled={sending} />
      ) : (
        <div className="mx-auto w-full max-w-xl">
          <Button className="w-full" size="lg" variant="secondary" onClick={() => setFlipped(true)}>
            Ver respuesta
          </Button>
        </div>
      )}
    </div>
  );
}
