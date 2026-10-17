import { Link, redirect, useLoaderData } from 'react-router-dom';
import { Archive, Check, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { cajaTheme, intervaloLabel } from '@/lib/leitner';
import { api, type BoxStats } from '@/lib/api';
import { getStoredToken } from '@/lib/supabase';

export async function boxesLoader(): Promise<BoxStats[]> {
  const token = getStoredToken();
  if (!token) throw redirect('/login');
  return api.boxesStats(token);
}

export function BoxesPage() {
  const boxes = useLoaderData() as BoxStats[];
  const total = boxes.reduce((acc, b) => acc + b.total, 0);
  const dueTotal = boxes.reduce((acc, b) => acc + b.pendientes, 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">
          <Archive className="size-6 text-secondary-blue" />
          Cajas Leitner
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          {total} tarjeta{total === 1 ? '' : 's'} en total · {dueTotal} pendiente{dueTotal === 1 ? '' : 's'} de repaso
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {boxes.map((box) => {
          const theme = cajaTheme(box.caja);
          const Icon = theme.icon;
          const hasDue = box.pendientes > 0;
          return (
            <Card
              key={box.caja}
              className={cn(
                'flex flex-col overflow-hidden transition-shadow hover:shadow-md',
                hasDue && 'ring-1 ring-inset ring-black/5 dark:ring-white/10',
              )}
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: theme.color }} aria-hidden />
              <CardHeader className="flex flex-row items-center gap-2.5 pb-1">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: theme.color }}
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
                <div className="mt-auto pt-1">
                  {hasDue ? (
                    <Link to={`/study?caja=${box.caja}`} className="block">
                      <Button size="sm" className="w-full">
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
          );
        })}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
        <Clock className="size-3.5" />
        Acierta y la tarjeta sube de caja; falla y vuelve a la Caja 1.
      </p>
    </div>
  );
}
