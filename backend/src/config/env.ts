import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Falta variable de entorno ${name} (ver .env.example)`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  supabaseUrl: required('SUPABASE_URL', 'http://localhost:54321'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY', 'changeme'),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  databaseUrl: required('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public'),
};
