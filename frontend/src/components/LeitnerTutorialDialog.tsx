import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CAJA_THEME, DEFAULT_INTERVALS } from '@/lib/leitner';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    badge: 'Paso 1 de 4 · El método',
    title: '¿Qué es el Sistema Leitner?',
    subtitle:
      'Un método científico de repetición espaciada que te ayuda a memorizar a largo plazo estudiando menos tiempo.',
  },
  {
    badge: 'Paso 2 de 4 · Las 5 cajas',
    title: 'Cada caja tiene su propio intervalo',
    subtitle:
      'Las tarjetas empiezan en la Caja 1 (repaso diario) y, a medida que las dominas, se espacian hasta 30 días.',
  },
  {
    badge: 'Paso 3 de 4 · Regla de movimiento',
    title: '¿Qué pasa cuando respondes?',
    subtitle:
      'Al estudiar, volteas la tarjeta y evalúas tu respuesta. El sistema mueve la tarjeta automáticamente.',
  },
  {
    badge: 'Paso 4 de 4 · Orden de estudio',
    title: 'Tu rutina diaria paso a paso',
    subtitle:
      'Cada sesión sigue un orden inteligente para que aproveches al máximo unos pocos minutos al día.',
  },
];

export function LeitnerTutorialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState(0);

  function handleOpenChange(next: boolean) {
    if (!next) setStep(0);
    onOpenChange(next);
  }

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-azul-100 px-2.5 py-0.5 text-xs font-semibold text-secondary-navy">
              <Sparkles className="size-3.5 text-secondary-blue" />
              {current.badge}
            </span>
            <DialogTitle className="mt-2 text-xl font-extrabold text-secondary-navy dark:text-white">
              {current.title}
            </DialogTitle>
            <p className="mt-1 text-sm text-ink-soft">{current.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Cerrar tutorial"
            className="rounded-lg p-1.5 text-ink-soft transition-colors hover:bg-primary-muted hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Contenido visual por paso */}
        <div className="my-5">
          {step === 0 && (
            <div className="grid gap-3">
              <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-primary-muted p-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#38BDF8]/20 text-[#0284C7]">
                  <Layers className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">1. Crea tus mazos y tarjetas</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Organiza tus temas en mazos con pregunta (anverso), respuesta (reverso) y pistas opcionales.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-primary-muted p-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#34D399]/20 text-[#059669]">
                  <GraduationCap className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">2. Enfócate en lo que más te cuesta</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    En vez de repasar todo siempre, las tarjetas que fallas vuelven pronto y las que dominas esperan más días.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-border-soft bg-primary-muted p-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#0D9488]/20 text-[#0D9488]">
                  <Trophy className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-ink">3. Domina el conocimiento</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Cuando tus tarjetas llegan a las cajas 4 y 5, pasan a tu memoria de largo plazo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-2">
              {[1, 2, 3, 4, 5].map((caja) => {
                const theme = CAJA_THEME[caja]!;
                const Icon = theme.icon;
                const dias = DEFAULT_INTERVALS[caja - 1]!;
                return (
                  <div
                    key={caja}
                    className="flex items-center gap-3 rounded-xl border border-border-soft bg-primary-muted px-3.5 py-2.5"
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
                      style={{ backgroundColor: theme.color, color: theme.onColor }}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        {theme.label} · <span className="font-medium text-ink-soft">{theme.short}</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
                      Cada {dias} {dias === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                );
              })}
              <p className="mt-1 text-center text-xs text-ink-soft">
                Puedes personalizar estos intervalos en cualquier momento desde la vista <strong>Cajas</strong>.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <div className="rounded-xl border border-ok/30 bg-ok-soft p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ok text-white">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ok">Si aciertas («La sabía»)</p>
                    <p className="text-xs text-ink">
                      La tarjeta <strong>sube 1 caja</strong> (ej. Caja 1 → Caja 2 → Caja 3, hasta la Caja 5).
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink">
                  <span className="rounded-md bg-surface px-2 py-0.5">Caja 2</span>
                  <ArrowRight className="size-3.5 text-ok" />
                  <span className="rounded-md bg-ok px-2 py-0.5 text-white">Sube a Caja 3 (en 7 días)</span>
                </div>
              </div>

              <div className="rounded-xl border border-error/30 bg-error-soft p-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-error text-white">
                    <RotateCcw className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-error">Si fallas («No la sabía»)</p>
                    <p className="text-xs text-ink">
                      Sin importar en qué caja estaba, la tarjeta <strong>vuelve a la Caja 1</strong> para reforzarla mañana.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-ink">
                  <span className="rounded-md bg-surface px-2 py-0.5">Caja 4</span>
                  <ArrowRight className="size-3.5 text-error" />
                  <span className="rounded-md bg-error px-2 py-0.5 text-white">Vuelve a Caja 1 (mañana)</span>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3">
              <div className="rounded-xl border border-border-soft bg-primary-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary-blue">
                  Orden en la sesión de estudio
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  Empezamos por la Caja 1 y avanzamos en orden hasta la Caja 5
                </p>
                <p className="mt-1 text-xs text-ink-soft">
                  Así aseguras primero las tarjetas recientes o difíciles y terminas consolidando las más avanzadas.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((c, i) => (
                    <div key={c} className="flex items-center gap-1">
                      <span
                        className="rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{ backgroundColor: CAJA_THEME[c]!.color, color: CAJA_THEME[c]!.onColor }}
                      >
                        Caja {c}
                      </span>
                      {i < 4 && <ArrowRight className="size-3 text-ink-soft" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border-soft bg-primary-muted p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary-blue">
                  Atajos rápidos de teclado
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-surface p-2">
                    <kbd className="rounded border border-border-soft px-1.5 py-0.5 font-mono font-bold text-ink">
                      Espacio
                    </kbd>
                    <p className="mt-1 text-ink-soft">Voltear tarjeta</p>
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <kbd className="rounded border border-border-soft px-1.5 py-0.5 font-mono font-bold text-ink">
                      1
                    </kbd>{' '}
                    o{' '}
                    <kbd className="rounded border border-border-soft px-1.5 py-0.5 font-mono font-bold text-ink">
                      ←
                    </kbd>
                    <p className="mt-1 text-ink-soft">No la sabía</p>
                  </div>
                  <div className="rounded-lg bg-surface p-2">
                    <kbd className="rounded border border-border-soft px-1.5 py-0.5 font-mono font-bold text-ink">
                      2
                    </kbd>{' '}
                    o{' '}
                    <kbd className="rounded border border-border-soft px-1.5 py-0.5 font-mono font-bold text-ink">
                      →
                    </kbd>
                    <p className="mt-1 text-ink-soft">La sabía</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indicadores de paso y navegación */}
        <div className="flex items-center justify-between border-t border-border-soft pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Ir al paso ${idx + 1}`}
                onClick={() => setStep(idx)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  idx === step ? 'w-6 bg-secondary-blue' : 'w-2 bg-border-soft hover:bg-ink-soft/50',
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="size-4" />
                Anterior
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={() => handleOpenChange(false)}>
                <Check className="size-4" />
                ¡Entendido!
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Siguiente
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
