# Leitner Backend — slice mínimo

## Requisitos previos
1. Crear proyecto en Supabase (desde cero).
2. Copiar `.env.example` a `.env` y completar `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DATABASE_URL`.

## Comandos
```powershell
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Endpoints (requieren `Authorization: Bearer <supabase-jwt>`)
- `GET /health`
- `GET /api/decks` / `POST /api/decks` / `PATCH /api/decks/:id` / `DELETE /api/decks/:id`
- `GET /api/cards/due?deckId=` — tarjetas con `proximaRevision <= hoy`
- `POST /api/cards` `{ deckId, frontText, backText }` → entra en caja 1, revisión hoy
- `POST /api/cards/:id/review` `{ acierto: true|false }` → aplica Leitner + crea Review
```
