import 'dotenv/config';
import pkg from 'env-var';

const { get } = pkg;

export const env = {
  port: get('PORT').default('3001').asPortNumber(),
  supabaseUrl: get('SUPABASE_URL').default('http://localhost:54321').asString(),
  supabaseAnonKey: get('SUPABASE_ANON_KEY').default('changeme').asString(),
  supabaseServiceKey: get('SUPABASE_SERVICE_ROLE_KEY').default('').asString(),
  // Runtime: pooler Supabase (6543 + ?pgbouncer=true) vía adapter PrismaPg
  databaseUrl: get('DATABASE_URL').required().asString(),
  // Migraciones: directa Supabase (5432), usada en prisma.config.ts
  directUrl: get('DIRECT_URL').required().asString(),
};
