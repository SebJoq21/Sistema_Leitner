import { Fragment, useEffect, useState } from 'react';
import { Link, redirect, useLoaderData, useRevalidator } from 'react-router-dom';
import { Archive, Check, ChevronRight, Clock, Play, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { cajaTheme, formatNextReview, intervaloLabel } from '@/lib/leitner';
import { api, type BoxStats } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

export interface BoxesData {
  boxes: BoxStats[];
  intervalos: number[];
  token: string;
}

export async function boxesLoader(): Promise<BoxesData> {
  const token = getStoredToken();
  if (!token) throw redirect('/login');
  const [boxes, settings] = await Promise.all([api.boxesStats(token), api.getSettings(token)]);
  return { boxes, intervalos: settings.intervalos, token };
}

function IntervalSettings({
  open,
  onOpenChange,
  initial,
  saving,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: number[];
  saving: boolean;
  onSave: (intervalos: number[]) => void;
}) {
  const [vals, setVals] = useState<string[]>(initial.map(String));

  useEffect(() => {
    if (open) setVals(initial.map(String));
  }, [open, initial]);

  const parsed = vals.map((v) => Number(v));
  const invalid = parsed.some((n) => !Number.isInteger(n) || n < 1 || n > 365);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Intervalos de repaso</DialogTitle>
        <p className="mt-1 text-sm text-ink-soft">
          Días que espera cada caja antes de volver a mostrar la tarjeta.
        </p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {vals.map((v, i) => (
            <div key={i} className="grid gap-1">
              <label className="text-center text-xs font-medium text-ink-soft">Caja {i + 1}</label>
              <input
                type="number"
                min={1}
                max={365}
                value={v}
                onChange={(e) => setVals((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                className="h-10 w-full rounded-xl border border-border-soft bg-primary-bg px-2 text-center text-sm text-ink outline-none focus:border-secondary-blue focus:ring-2 focus:ring-secondary-blue/15"
              />
            </div>
          ))}
        </div>
        {invalid && <p className="mt-2 text-xs text-error">Cada intervalo debe estar entre 1 y 365 días.</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(parsed)} disabled={saving || invalid}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BoxesPage() {
  const { boxes, intervalos: initialIntervalos, token } = useLoaderData() as BoxesData;
  const revalidator = useRevalidator();
  const [intervalos, setIntervalos] = useState<number[]>(initialIntervalos);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = boxes.reduce((acc, b) => acc + b.total, 0);
  const dueTotal = boxes.reduce((acc, b) => acc + b.pendientes, 0);

  async function saveIntervalos(next: number[]) {
    setSaving(true);
    try {
      await api.updateSettings(token, { intervalos: next });
      setIntervalos(next);
      setSettingsOpen(false);
      toast.success('Intervalos actualizados');
      revalidator.revalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">
            <Archive className="size-6 text-secondary-blue" />
            Cajas Leitner
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total} tarjeta{total === 1 ? '' : 's'} en total · {dueTotal} pendiente{dueTotal === 1 ? '' : 's'} de repaso
          </p>
        </div>
        <Button variant="outline" onClick={() => setSettingsOpen(true)}>
          <Settings2 className="size-4" />
          Intervalos
        </Button>
      </div>

      {/* Barra de distribución */}
      {total > 0 && (
        <div className="grid gap-2">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-azul-100">
            {boxes.map((box) =>
              box.total > 0 ? (
                <div
                  key={box.caja}
                  className="h-full"
                  style={{ width: `${(box.total / total) * 100}%`, backgroundColor: cajaTheme(box.caja).color }}
                  title={`Caja ${box.caja}: ${box.total}`}
                />
              ) : null,
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {boxes.map((box) => (
              <span key={box.caja} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: cajaTheme(box.caja).color }} />
                Caja {box.caja}: {box.total}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {boxes.map((box, i) => {
          const theme = cajaTheme(box.caja);
          const Icon = theme.icon;
          const hasDue = box.pendientes > 0;
          return (
            <Fragment key={box.caja}>
              <Card className="flex flex-1 flex-col overflow-hidden transition-shadow hover:shadow-md">
                <div className="h-1.5 w-full" style={{ backgroundColor: theme.color }} aria-hidden />
                <CardHeader className="flex flex-row items-center gap-2.5 pb-1">
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: theme.color, color: theme.onColor }}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <CardTitle className="text-base">Caja {box.caja}</CardTitle>
                    <p className="text-xs text-ink-soft">{intervaloLabel(box.intervaloDias)}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-ink">{box.total}</span>
                    <span className="text-xs text-ink-soft">tarjeta{box.total === 1 ? '' : 's'}</span>
                  </div>
                  <p className={cn('text-xs font-medium', hasDue ? 'text-ink' : 'text-ink-soft')}>
                    {hasDue ? `${box.pendientes} pendiente${box.pendientes === 1 ? '' : 's'} hoy` : 'Al día'}
                  </p>
                  {!hasDue && box.proximaRevision && (
                    <p className="flex items-center gap-1 text-xs text-ink-soft">
                      <Clock className="size-3.5" />
                      Próximo: {formatNextReview(box.proximaRevision)}
                    </p>
                  )}
                  <div className="mt-auto grid gap-2 pt-1">
                    {hasDue ? (
                      <Link to={`/study?caja=${box.caja}`} className="block">
                        <Button size="sm" variant="study" className="w-full">
                          <Play className="size-4" />
                          Estudiar caja
                        </Button>
                      </Link>
                    ) : (
                      <Tooltip content="No hay tarjetas pendientes en esta caja">
                        <span className="block">
                          <Button size="sm" className="w-full" disabled>
                            <Check className="size-4" />
                            Al día
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </CardContent>
              </Card>
              {i < boxes.length - 1 && (
                <div className="hidden items-center justify-center lg:flex" aria-hidden>
                  <ChevronRight className="size-5 text-ink-soft" />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <IntervalSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initial={intervalos}
        saving={saving}
        onSave={saveIntervalos}
      />
    </div>
  );
}
