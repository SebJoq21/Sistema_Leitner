import { Link, useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function RouteError() {
  const error = useRouteError();
  const message = error instanceof Error ? error.message : 'Ruta no encontrada o error de carga.';

  return (
    <div className="grid gap-3 py-16 text-center">
      <h1 className="text-xl font-extrabold">Algo falló</h1>
      <p className="text-sm text-ink-soft">{message}</p>
      <div>
        <Link to="/">
          <Button>Volver a mazos</Button>
        </Link>
      </div>
    </div>
  );
}
