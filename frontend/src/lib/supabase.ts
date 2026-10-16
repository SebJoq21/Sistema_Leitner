import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (ver .env.example). El login fallará hasta configurarlas.',
  );
}

export const supabase = createClient(url ?? 'http://localhost:54321', anonKey ?? 'changeme');

/** Token JWT persistido para que los loaders del router (fuera de React) puedan autenticarse. */
export const TOKEN_KEY = 'leitner-jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
