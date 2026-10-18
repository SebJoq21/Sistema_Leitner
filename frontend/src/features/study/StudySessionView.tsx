import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Clock, Lightbulb, Plus, RotateCw, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CajaBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, type DueCard } from '@/lib/api';
import { cajaTheme, formatNextReview } from '@/lib/leitner';
import { Flashcard } from './Flashcard';

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function StudySessionView({
  initialCards,
  token,
  nextReview,
}: {
  initialCards: DueCard[];
  token: string;
  nextReview?: string | null;
}) {
  const [cards, setCards] = useState<DueCard[]>(initialCards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState({ ok: 0, fail: 0 });
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const current = cards[index];

  const nextCaja = useMemo(() => {
    if (!current) return 1;
    return Math.min(current.cajaActual + 1, 5);
  }, [current]);

  const handleResult = useCallback(
    async (acierto: boolean) => {
      if (!current || sending) return;
      setSending(true);
      try {
        const updated = await api.reviewCard(token, current.id, acierto);
        setDone((d) => ({ ok: d.ok + (acierto ? 1 : 0), fail: d.fail + (acierto ? 0 : 1) }));
        toast.success(
          acierto ? `Acertaste → caja ${updated.cajaActual}` : 'Fallaste → vuelve a caja 1',
        );
        setFlipped(false);
        setShowHint(false);
        const next = index + 1;
        setIndex(next);
        if (next >= cards.length) setElapsedMs(Date.now() - startedAt.current);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al guardar el repaso');
      } finally {
        setSending(false);
      }
    },
    [current, sending, token, cards.length, index],
  );

  // Atajos de teclado: Espacio = voltear, ←/1 = fallo, →/2 = acierto.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!current) return;
      if (!flipped) {
        if (e.code === 'Space') {
          e.preventDefault();
          setFlipped(true);
        }
        return;
      }
      if (e.key === '1' || e.key === 'ArrowLeft') {
        e.preventDefault();
        void handleResult(false);
      } else if (e.key === '2' || e.key === 'ArrowRight') {
        e.preventDefault();
        void handleResult(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, handleResult]);

  function handleRestart(remaining: DueCard[]) {
    setCards(remaining);
    setIndex(0);
    setFlipped(false);
    setShowHint(false);
    setDone({ ok: 0, fail: 0 });
    setElapsedMs(null);
    startedAt.current = Date.now();
  }

  if (!current) {
    const total = done.ok + done.fail;
    const allDoneEmpty = initialCards.length === 0;
    const pct = total > 0 ? Math.round((done.ok / total) * 100) : 0;
    const elapsed = elapsedMs ?? 0;
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
              {allDoneEmpty && nextReview && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
                  <Clock className="size-3.5" />
                  Próximo repaso: {formatNextReview(nextReview)}
                </p>
              )}
            </div>

            {!allDoneEmpty && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-ok-soft p-3">
                    <p className="text-2xl font-extrabold text-ok">{done.ok}</p>
                    <p className="text-xs font-medium text-ok">Aciertos</p>
                  </div>
                  <div className="rounded-xl bg-error-soft p-3">
                    <p className="text-2xl font-extrabold text-error">{done.fail}</p>
                    <p className="text-xs font-medium text-error">Fallos</p>
                  </div>
                  <div className="rounded-xl bg-azul-100 p-3">
                    <p className="text-2xl font-extrabold text-ink">{pct}%</p>
                    <p className="text-xs font-medium text-ink-soft">Acierto</p>
                  </div>
                </div>
                <p className="flex items-center justify-center gap-1.5 text-xs text-ink-soft">
                  <Clock className="size-3.5" />
                  Tiempo total: {formatDuration(elapsed)}
                </p>
              </>
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
    <div className="grid gap-5">
      <div className="mx-auto grid w-full max-w-xl gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-ink-soft">
            Tarjeta {index + 1} de {cards.length}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-soft">
            {current.cajaActual < 5 ? (
              <>
                <CajaBadge caja={current.cajaActual} />
                <ArrowRight className="size-3.5" />
                <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', cajaTheme(nextCaja).badge)}>
                  Caja {nextCaja} si aciertas
                </span>
              </>
            ) : (
              <CajaBadge caja={5} />
            )}
          </span>
        </div>
        <Progress value={(index / cards.length) * 100} label="Progreso de la sesión" />
      </div>

      <Flashcard card={current} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

      {current.hint && (
        <div className="mx-auto w-full max-w-xl">
          {showHint ? (
            <p className="flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2 text-sm text-warn">
              <Lightbulb className="mt-0.5 size-4 shrink-0" />
              {current.hint}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink"
            >
              <Lightbulb className="size-3.5" />
              Ver pista
            </button>
          )}
        </div>
      )}

      {flipped ? (
        <div className="mx-auto flex w-full max-w-xl gap-3">
          <Button
            className="flex-1"
            size="lg"
            variant="danger"
            disabled={sending}
            onClick={() => handleResult(false)}
          >
            <X className="size-5" />
            No la sabía
          </Button>
          <Button
            className="flex-1"
            size="lg"
            variant="success"
            disabled={sending}
            onClick={() => handleResult(true)}
          >
            <Check className="size-5" />
            La sabía
          </Button>
        </div>
      ) : (
        <div className="mx-auto grid w-full max-w-xl gap-2">
          <Button className="w-full" size="lg" variant="secondary" onClick={() => setFlipped(true)}>
            Ver respuesta
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-ink-soft">
        Atajos: <kbd className="rounded border px-1">Espacio</kbd> voltear ·{' '}
        <kbd className="rounded border px-1">1</kbd>/<kbd className="rounded border px-1">←</kbd> fallo ·{' '}
        <kbd className="rounded border px-1">2</kbd>/<kbd className="rounded border px-1">→</kbd> acierto
      </p>
    </div>
  );
}
