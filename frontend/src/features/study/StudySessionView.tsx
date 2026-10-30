import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useRevalidator } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Clock, Lightbulb, Plus, RotateCw, Trophy, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CajaBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, ApiError, type DueCard } from '@/lib/api';
import { cajaTheme, formatNextReview } from '@/lib/leitner';
import { Flashcard } from './Flashcard';

interface LastTransition {
  acierto: boolean;
  fromCaja: number;
  toCaja: number;
}

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function sortByBoxOrder(list: DueCard[]): DueCard[] {
  return [...list].sort(
    (a, b) => a.cajaActual - b.cajaActual || a.proximaRevision.localeCompare(b.proximaRevision),
  );
}

export function StudySessionView({
  initialCards,
  token,
  nextReview,
  deckId,
  caja,
}: {
  initialCards: DueCard[];
  token: string;
  nextReview?: string | null;
  deckId?: string;
  caja?: number;
}) {
  const revalidator = useRevalidator();
  const [cards, setCards] = useState<DueCard[]>(() => sortByBoxOrder(initialCards));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sending, setSending] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState({ ok: 0, fail: 0 });
  const [lastTransition, setLastTransition] = useState<LastTransition | null>(null);
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

  // Agrupación ordenada por caja (Caja 1 → Caja 2 → ... → Caja 5) para mostrar la secuencia explícita.
  const boxStages = useMemo(() => {
    return [1, 2, 3, 4, 5]
      .map((cajaNum) => {
        let total = 0;
        let completed = 0;
        cards.forEach((c, idx) => {
          if (c.cajaActual === cajaNum) {
            total += 1;
            if (idx < index) completed += 1;
          }
        });
        return {
          caja: cajaNum,
          total,
          completed,
          remaining: total - completed,
          isCurrent: current?.cajaActual === cajaNum,
          isDone: total > 0 && completed === total,
        };
      })
      .filter((stage) => stage.total > 0);
  }, [cards, index, current]);

  const currentBoxProgress = useMemo(() => {
    if (!current) return null;
    const stage = boxStages.find((s) => s.caja === current.cajaActual);
    if (!stage) return null;
    return {
      caja: stage.caja,
      positionInBox: stage.completed + 1,
      totalInBox: stage.total,
    };
  }, [current, boxStages]);

  const handleResult = useCallback(
    async (acierto: boolean) => {
      if (!current || sending) return;
      setSending(true);
      const fromCaja = current.cajaActual;
      try {
        const updated = await api.reviewCard(token, current.id, acierto);
        setDone((d) => ({ ok: d.ok + (acierto ? 1 : 0), fail: d.fail + (acierto ? 0 : 1) }));
        setLastTransition({ acierto, fromCaja, toCaja: updated.cajaActual });
        setFlipped(false);
        setShowHint(false);
        const next = index + 1;
        setIndex(next);
        if (next >= cards.length) {
          setElapsedMs(Date.now() - startedAt.current);
          revalidator.revalidate();
        }
      } catch (err) {
        if (err instanceof ApiError && (err.status === 409 || err.code === 'CARD_NOT_DUE')) {
          toast.info('Esta tarjeta ya no está pendiente');
          setCards((prev) => prev.filter((_, i) => i !== index));
          setFlipped(false);
          setShowHint(false);
          if (index >= cards.length - 1) {
            setElapsedMs(Date.now() - startedAt.current);
            revalidator.revalidate();
          }
        } else if (err instanceof ApiError && err.status === 404) {
          toast.info('La tarjeta ya no existe');
          setCards((prev) => prev.filter((_, i) => i !== index));
          setFlipped(false);
          setShowHint(false);
          if (index >= cards.length - 1) {
            setElapsedMs(Date.now() - startedAt.current);
            revalidator.revalidate();
          }
        } else {
          toast.error(err instanceof Error ? err.message : 'Error al guardar el repaso');
        }
      } finally {
        setSending(false);
      }
    },
    [current, sending, token, cards.length, index, revalidator],
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

  async function handleReloadDue() {
    try {
      setReloading(true);
      const fresh = await api.dueCards(token, deckId, caja);
      setCards(sortByBoxOrder(fresh));
      setIndex(0);
      setFlipped(false);
      setShowHint(false);
      setDone({ ok: 0, fail: 0 });
      setLastTransition(null);
      setElapsedMs(null);
      startedAt.current = Date.now();
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar pendientes');
    } finally {
      setReloading(false);
    }
  }

  if (!current) {
    const total = done.ok + done.fail;
    const allDoneEmpty = cards.length === 0 && total === 0;
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
              <Button variant="outline" disabled={reloading} onClick={handleReloadDue}>
                <RotateCw className={cn('size-4', reloading && 'animate-spin')} />
                Repasar de nuevo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="mx-auto grid w-full max-w-xl gap-3">
        {/* Ruta secuencial por cajas: Caja 1 → Caja 2 → ... → Caja 5 */}
        <div className="rounded-xl border border-border-soft bg-surface p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft">
            <span className="font-semibold text-ink">
              Orden de repaso por cajas (de menor a mayor)
            </span>
            {currentBoxProgress && (
              <span>
                Estudiando <strong className="text-ink">Caja {currentBoxProgress.caja}</strong> (
                {currentBoxProgress.positionInBox} de {currentBoxProgress.totalInBox})
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {boxStages.map((stage, i) => {
              const theme = cajaTheme(stage.caja);
              const Icon = theme.icon;
              return (
                <Fragment key={stage.caja}>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all',
                      stage.isCurrent && 'border-transparent shadow-sm',
                      stage.isDone && 'border-border-soft bg-primary-muted text-ink-soft opacity-65',
                      !stage.isCurrent && !stage.isDone && 'border-border-soft bg-primary-bg text-ink-soft',
                    )}
                    style={
                      stage.isCurrent
                        ? { backgroundColor: theme.color, color: theme.onColor }
                        : undefined
                    }
                  >
                    {stage.isDone ? <Check className="size-3.5 text-ok" /> : <Icon className="size-3.5" />}
                    <span>Caja {stage.caja}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[11px]',
                        stage.isCurrent ? 'bg-black/15' : 'bg-border-soft/60 text-ink',
                      )}
                    >
                      {stage.completed}/{stage.total}
                    </span>
                  </span>
                  {i < boxStages.length - 1 && (
                    <ChevronRight className="size-3.5 shrink-0 text-ink-soft" aria-hidden />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink-soft">
              Tarjeta {index + 1} de {cards.length}
            </span>
            {(done.ok > 0 || done.fail > 0) && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-ok"
                  aria-label={`${done.ok} aciertos`}
                >
                  <Check className="size-3" />
                  {done.ok}
                </span>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-error-soft px-2 py-0.5 text-error"
                  aria-label={`${done.fail} fallos`}
                >
                  <X className="size-3" />
                  {done.fail}
                </span>
              </span>
            )}
            {lastTransition && (
              <span
                role="status"
                aria-live="polite"
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
                  lastTransition.acierto ? 'bg-ok-soft text-ok' : 'bg-error-soft text-error',
                )}
              >
                {lastTransition.acierto ? (
                  <>
                    <Check className="size-3" />
                    {lastTransition.fromCaja === lastTransition.toCaja
                      ? `Mantiene Caja ${lastTransition.toCaja}`
                      : `Subió a Caja ${lastTransition.toCaja}`}
                  </>
                ) : (
                  <>
                    <RotateCw className="size-3" />
                    {lastTransition.fromCaja === 1 ? 'Sigue en Caja 1' : 'Volvió a Caja 1'}
                  </>
                )}
              </span>
            )}
          </div>
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
            className="h-auto flex-1 flex-col gap-0.5 py-2.5"
            size="lg"
            variant="danger"
            disabled={sending}
            onClick={() => handleResult(false)}
          >
            <span className="inline-flex items-center gap-1.5 text-base font-bold">
              <X className="size-4" />
              No la sabía
            </span>
            <span className="text-xs font-medium text-white/85">
              {current.cajaActual === 1 ? 'Sigue en Caja 1' : 'Vuelve a Caja 1'}
            </span>
          </Button>
          <Button
            className="h-auto flex-1 flex-col gap-0.5 py-2.5"
            size="lg"
            variant="success"
            disabled={sending}
            onClick={() => handleResult(true)}
          >
            <span className="inline-flex items-center gap-1.5 text-base font-bold">
              <Check className="size-4" />
              La sabía
            </span>
            <span className="text-xs font-medium text-white/85">
              {current.cajaActual < 5 ? `Sube a Caja ${nextCaja}` : 'Mantiene Caja 5'}
            </span>
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
