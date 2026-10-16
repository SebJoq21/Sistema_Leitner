import { useState } from 'react';
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
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent>
          <div className="grid gap-3 py-6 text-center">
            <p className="text-lg font-bold">Sesión completa</p>
            <p className="text-sm text-slate-500">
              Aciertos: {done.ok} · Fallos: {done.fail}
              {initialCards.length === 0 && ' · No había tarjetas pendientes.'}
            </p>
            {cards.length > 0 && (
              <Button variant="secondary" onClick={() => handleRestart(cards)}>
                Repasar de nuevo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <p className="text-center text-sm text-slate-500">
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
