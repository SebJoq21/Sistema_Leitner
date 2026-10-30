import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../errors/http-error.js';

export { HttpError };

// Express 4 no captura errores de handlers async: sin esto, un throw
// (ej. FK de Prisma) es unhandled rejection y tumba el proceso.
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Filtros inválidos', details: parsed.error.flatten() });
    }
    req.query = parsed.data as unknown as Request['query'];
    next();
  };
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    const payload: Record<string, unknown> = {
      error: err.message,
    };
    if (err.code) {
      payload.code = err.code;
    }
    if (err.details && typeof err.details === 'object') {
      Object.assign(payload, err.details);
    } else if (err.details !== undefined) {
      payload.details = err.details;
    }
    return res.status(err.status).json(payload);
  }

  console.error(err);
  res.status(500).json({ error: 'Error interno' });
}

export function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) throw new Error('req.user.id no inyectado — ¿falta authMiddleware?');
  return id;
}
