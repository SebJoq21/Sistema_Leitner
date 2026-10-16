import { Link, redirect, useLoaderData } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <h1 className="text-2xl font-extrabold tracking-tight text-secondary-navy dark:text-white">Cajas Leitner</h1>
        <p className="text-sm text-slate-500">
          {total} tarjetas en total · {dueTotal} pendientes de repaso
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {boxes.map((box) => (
          <Card key={box.caja} className={box.pendientes > 0 ? 'border-secondary-blue' : undefined}>
            <CardHeader>
              <CardTitle>Caja {box.caja}</CardTitle>
              <p className="text-xs text-slate-500">cada {box.intervaloDias} {box.intervaloDias === 1 ? 'día' : 'días'}</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <p className="text-3xl font-extrabold">{box.total}</p>
                <p className="text-xs text-slate-500">
                  {box.pendientes} pendiente{box.pendientes === 1 ? '' : 's'}
                </p>
                <Link to={`/study?caja=${box.caja}`}>
                  <Button size="sm" className="w-full" disabled={box.pendientes === 0}>
                    Estudiar caja
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
