import type { NextFunction, Request, Response } from 'express';
import { isValidTimeZone } from '../lib/dates.js';

declare global {
  namespace Express {
    interface Request {
      /** Zona válida enviada por el navegador; nunca contiene valores inválidos. */
      timezone?: string;
    }
  }
}

/**
 * Lee `X-Timezone`. Un valor inválido se ignora para no romper la petición;
 * la capa de settings decide entre la zona guardada, el header y UTC.
 */
export function timezoneMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.get('x-timezone')?.trim();
  if (isValidTimeZone(header)) req.timezone = header;
  next();
}
