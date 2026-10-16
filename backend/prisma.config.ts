import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Migraciones: URL directa (5432). El runtime usa la pooler (6543)
  // vía PrismaPg adapter con DATABASE_URL en src/config/prisma.ts.
  datasource: {
    url: env('DIRECT_URL'),
  },
});
