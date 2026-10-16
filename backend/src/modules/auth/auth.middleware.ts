import type { Request, Response, NextFunction } from 'express';
import { supabase } from '../../config/supabase';

export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Espera header: Authorization: Bearer <supabase-jwt>
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Falta token Bearer' });
  }
  const token = header.slice(7);

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  req.user = { id: data.user.id, email: data.user.email ?? undefined };
  next();
}
