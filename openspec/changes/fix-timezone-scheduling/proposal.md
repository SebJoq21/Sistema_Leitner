# Programar el repaso por día de calendario en la zona del usuario

## Por qué

El motor suma días con `Date.setDate` sobre la hora local del servidor (`backend/src/modules/cards/leitner.service.ts:41`) y la cola compara `proximaRevision` contra el instante actual del servidor (`backend/src/modules/cards/card.repository.ts:26`). En producción el servidor suele ejecutarse en UTC, mientras que el usuario puede estar en otra zona.

Ejemplo: un usuario en Lima (UTC-5) repasa el lunes a las 21:00 una tarjeta de Caja 1. La próxima revisión queda en martes 21:00, hora del servidor, que en Lima es martes 16:00. La tarjeta no aparece el martes a las 08:00, cuando el usuario espera verla. El mismo desfase afecta:

- La cola de estudio (`findDueByUser`).
- La vista de cajas (`boxesByUser`).
- El filtro de pendientes del listado de tarjetas (`findAllByUser`).
- Los contadores de pendientes de los mazos (`deck.repository.ts`).
- “Repasados hoy” y la racha (`stats.service.ts:14`).
- El estado “todo al día” y las fechas relativas del frontend.

No existe una zona horaria persistida en `UserSettings`, y `Review.fechaRevision` se agrupa por el día local del servidor.

## Qué cambia

- El vencimiento pasa a ser un **día de calendario** en la zona horaria del usuario. Una tarjeta está pendiente desde las 00:00 de ese día.
- `Card.proximaRevision` pasa a ser una fecha (`DATE`) sin hora.
- `UserSettings` incorpora `timezone` (zona IANA válida). El navegador envía su zona; si no hay valor, se usa UTC.
- El motor suma días de calendario, sin conservar horas ni depender del huso del servidor.
- La cola, la vista de cajas, los filtros de pendientes y las estadísticas usan el “hoy” del usuario.
- `repasadosHoy` y la racha agrupan `Review.fechaRevision` por el día calendario del usuario.
- El frontend interpreta las fechas de vencimiento como fechas locales, no como instantes UTC.
- Se corrige `formatRelative`, que hoy invierte el signo, y se alinea `isDue` con `daysUntil`.

## Impacto

- **Specs afectados:** `leitner-scheduling`, `settings`, `stats`, `cards`, `decks`. También cambia la definición de “vencida” que consume `study-session`, aunque su texto no requiera un delta.
- **Código afectado:**
  - `backend/prisma/schema.prisma` y nueva migración.
  - `backend/src/modules/cards/leitner.service.ts`.
  - `backend/src/modules/cards/card.repository.ts`.
  - `backend/src/modules/decks/deck.repository.ts`.
  - `backend/src/modules/stats/stats.service.ts`.
  - `backend/src/modules/settings/*`.
  - `backend/src/app.ts` o middleware de zona horaria.
  - `frontend/src/lib/api.ts`, `frontend/src/lib/leitner.ts`.
  - `frontend/src/pages/StudySession.tsx`, `frontend/src/features/study/StudySessionView.tsx`, `frontend/src/pages/Cards.tsx`, `frontend/src/features/decks/DeckList.tsx`, `frontend/src/pages/Boxes.tsx`.
  - `backend/scripts/seed.ts` si crea fechas.
- **Migraciones de datos:** sí. Hay que convertir `cards.proximaRevision` de `TIMESTAMP(3)` a `DATE` y agregar `user_settings.timezone`. Las tarjetas existentes se migran con una regla explícita (propuesta: fecha UTC) y los usuarios existentes quedan sin zona hasta que el navegador la sincronice.

## Fuera de alcance

- Recalcular o reescribir el historial de `Review`.
- Agregar repaso libre o práctica sin mover cajas.
- Reencolar tarjetas falladas en la sesión.
- Aplicar `metaDiaria` a la cola.
- Cambiar el algoritmo de cajas o los intervalos por defecto.
- Programar recordatorios o notificaciones por zona horaria.
