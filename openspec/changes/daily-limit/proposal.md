# Aplicar un límite diario por mazo y total

## Por qué

`Deck.metaDiaria` existe en el esquema, en el formulario y en el DTO, pero `findDueByUser` no la consulta. El campo se guarda y nunca limita nada. Además, el texto del formulario dice “Máximo de tarjetas nuevas por día”, aunque el sistema no distingue tarjetas nuevas de repasos vencidos.

Tampoco existe un límite global. Un usuario con veinte mazos puede abrir una sesión con cientos de tarjetas aunque cada mazo tenga una meta. La guía de diseño pide un límite diario por mazo y un límite diario total, para que el estudio sea sostenible y no una cola interminable.

El límite debe aplicarse en el backend, no solo al construir la cola. Si solo se recorta la lista, dos pestañas o un cliente directo pueden repasar más tarjetas de las permitidas. También debe contar por día calendario del usuario, no por hora del servidor.

## Qué cambia

- `Deck.metaDiaria` pasa a ser el **límite diario de ese mazo** (`null` = sin límite).
- `UserSettings` incorpora `limiteDiarioTotal` (`null` = sin límite), configurable junto con los intervalos.
- El límite cuenta **tarjetas distintas repasadas hoy** en la zona del usuario. Un reintento local de `requeue-failed-in-session` no cuenta porque no crea `Review`.
- La cola inicial se recorta respetando el cupo restante de cada mazo y el cupo total. Las tarjetas se ordenan por `proximaRevision` ascendente y se toman hasta agotar alguno de los límites.
- El backend rechaza con `409` y código `DAILY_LIMIT_REACHED` cualquier repaso que exceda el cupo, aunque la tarjeta esté vencida. No se crea `Review` ni se mueve la caja.
- El chequeo se hace dentro de la transacción del repaso, con un lock por usuario, para que dos peticiones concurrentes no puedan pasarse del límite.
- La API de la sesión devuelve, junto con las tarjetas, el estado de los límites: límite, usadas y restantes por mazo y en total.
- La interfaz muestra cuántas tarjetas quedan hoy, distingue “Todo al día” de “Límite diario alcanzado” y actualiza el texto del formulario de mazo.
- Los límites se reinician a las 00:00 de la zona del usuario.

## Impacto

- **Specs afectados:** `study-session` (cola, estado, persistencia y límite), `decks` (meta diaria) y `settings` (límite total).
- **Código afectado:**
  - `backend/prisma/schema.prisma` y migración para `limiteDiarioTotal`.
  - `backend/src/modules/settings/*`.
  - `backend/src/modules/decks/deck.dto.ts` y formulario.
  - `backend/src/modules/cards/card.repository.ts`, `card.service.ts`, `card.controller.ts`.
  - `backend/src/modules/cards/card.routes.ts` para la nueva ruta de cola.
  - `backend/src/middlewares/validate.ts` si el error de límite usa `HttpError`.
  - `frontend/src/lib/api.ts`, `frontend/src/pages/StudySession.tsx`, `frontend/src/features/study/StudySessionView.tsx`, `frontend/src/pages/Boxes.tsx`, `frontend/src/features/decks/DeckForm.tsx`.
- **Dependencias:** `fix-timezone-scheduling` para el día local y `guard-review-when-due` para la transacción y el manejo de `409`.
- **Migración de datos:** solo agregar la columna nullable; no se reescriben mazos ni repasos.

## Fuera de alcance

- Distinguir tarjetas nuevas de repasos para el límite.
- Límites semanales o mensuales.
- Límite por etiqueta o por caja.
- Pausar un mazo con `metaDiaria = 0`.
- Notificaciones o recordatorios cuando se alcanza el límite.
- Cambiar el algoritmo de cajas o los intervalos.
- Persistir la cola o los reintentos locales.
- Recalcular estadísticas históricas.
