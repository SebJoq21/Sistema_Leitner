# Leitner Backend — ESM + Prisma 7

Stack según `03 - Resources/Node.js`: ESM (`type:module`, `NodeNext`),
3 archivos Prisma (`schema.prisma` + `prisma.config.ts` + singleton `src/config/prisma.ts`),
env seguro con `dotenv + env-var`, REST versionado `/api/v1/...`.

## Requisitos previos
1. Crear proyecto en Supabase.
2. Copiar `.env.example` a `.env` y completar:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `DATABASE_URL` = pooler (6543 + `?pgbouncer=true`) — runtime vía `PrismaPg`
   - `DIRECT_URL` = directa (5432) — migraciones en `prisma.config.ts`

## Comandos
```powershell
npm install
npx prisma migrate dev --name init  # regla de oro: migrate y luego generate
npx prisma generate
npm run dev        # tsx watch src/server.ts
npm run typecheck  # tsc --noEmit
npm run build      # rimraf + tsc
npm run start:prod # node dist/server.js
```

En prod (Render): `prisma migrate deploy` en el build, nunca `migrate dev`.

## Endpoints (requieren `Authorization: Bearer <supabase-jwt>`)
- `GET /health`
- `GET /api/v1/decks` / `POST /api/v1/decks` / `PATCH /api/v1/decks/:id` / `DELETE /api/v1/decks/:id`
- `GET /api/v1/cards/due?deckId=` — tarjetas con `proximaRevision <= hoy`
- `POST /api/v1/cards` `{ deckId, frontText, backText }` → caja 1, revisión hoy
- `POST /api/v1/cards/:id/review` `{ acierto: true|false }` → Leitner (1,3,7,15,30d) + crea Review
- Rutas legacy `/api/...` siguen montadas por compatibilidad.
