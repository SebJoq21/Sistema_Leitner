# Leitner Frontend — Vite + Tailwind + Shadcn-style + Router Data APIs

Vertical completo: Login → Dashboard (mazos) → Study (flip 3D + Acerté/Fallé).

## Configurar
```powershell
Copy-Item .env.example .env  # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev     # http://localhost:5173
```

## Estructura (Feature-Sliced, spec §2.2)
- `components/ui/` Button (cva), Card, Input/TextArea, Dialog (Radix)
- `features/auth/` AuthContext (Supabase + `localStorage leitner-jwt`), LoginForm (Zod+HookForm), RequireAuth
- `features/decks/` DeckList, DeckForm, CardForm
- `features/study/` Flashcard (flip `rotate-y-180 duration-500`), LeitnerControls (emerald/rose), StudySessionView
- `pages/` Login, Dashboard (loader decks+due), StudySession (loader due?deckId), RouteError
- `lib/` api (`/api/v1` + Bearer), supabase, utils (cn)

## Flujo
Login (Supabase Auth) → token en `localStorage` → loaders leen token → Dashboard crea mazos/tarjetas (caja 1) → Study repasa `proximaRevision<=hoy` → `POST review {acierto}` mueve caja (1,3,7,15,30d).
