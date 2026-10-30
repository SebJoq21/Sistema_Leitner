# Rechazar repasos de tarjetas que todavía no están pendientes

## Por qué

`reviewForUser` busca la tarjeta con `findFirstOrThrow` y calcula la transición sin comprobar `proximaRevision` (`backend/src/modules/cards/card.repository.ts:131`). Cualquier cliente autenticado puede llamar a `POST /api/v1/cards/:id/review` sobre una tarjeta propia aunque su próximo repaso sea dentro de 30 días.

Consecuencias:

- Un usuario puede subir una tarjeta de Caja 1 a Caja 5 en segundos, sin respetar los intervalos.
- Una pestaña abierta con una cola vieja puede repasar tarjetas que ya fueron reprogramadas.
- “Repasar de nuevo” reutiliza las mismas tarjetas y vuelve a llamar al endpoint, aunque ya no estén vencidas.
- El historial `Review` registra repasos que no correspondían.
- Dos repasos simultáneos pueden leer la misma caja antes de que el otro escriba. La transacción actual solo agrupa el `update` y el `create`; la lectura y el cálculo quedan fuera, por lo que ambos pueden pasar y crear dos `Review`.

La comprobación debe vivir en el backend, no solo en la interfaz, porque el endpoint es público para cualquier cliente con token.

## Qué cambia

- El repaso SHALL rechazarse con `409 Conflict` cuando `proximaRevision` sea posterior al día actual del usuario.
- La comprobación SHALL ejecutarse dentro de la misma transacción que actualiza la tarjeta y crea el `Review`.
- La actualización SHALL ser condicional: solo se aplica si la tarjeta sigue perteneciendo al usuario y sigue vencida. Si otra petición la reprogramó primero, la segunda recibe `409`.
- Una tarjeta inexistente o de otro usuario SHALL responder `404`, sin revelar si existe.
- La tarjeta no vencida no SHALL cambiar de caja ni crear un `Review`.
- El frontend SHALL distinguir el `409` de un error de red: muestra un aviso de “ya no está pendiente”, quita la tarjeta de la cola local y continúa, en lugar de dejar al usuario atascado.
- Se agrega un error HTTP tipado para que el `errorHandler` deje de convertir estos casos en `500`.

## Impacto

- **Specs afectados:** `leitner-scheduling` (nuevo requirement y registro transaccional), `study-session` (manejo del 409 en la sesión) y `cards` (acceso a tarjeta ajena).
- **Código afectado:**
  - `backend/src/modules/cards/card.repository.ts`.
  - `backend/src/modules/cards/card.service.ts` o controller para propagar el error.
  - `backend/src/middlewares/validate.ts` para `HttpError` y el handler.
  - `frontend/src/features/study/StudySessionView.tsx`.
  - `frontend/src/lib/api.ts` si necesita exponer el estado y el código del error.
- **Dependencia:** la definición de “vencida” debe coincidir con `fix-timezone-scheduling`. Si ese change no se implementa primero, el guard usa la comparación por día con la zona disponible o el instante actual como fallback.
- **Dependencia:** `requeue-failed-in-session` decide qué pasa con “Repasar de nuevo”. Este change no debe permitir que ese botón reenvíe tarjetas ya programadas.

## Fuera de alcance

- Limitar la cantidad de repasos por día o por tarjeta.
- Agregar idempotency keys.
- Implementar un modo de práctica que no mueva cajas.
- Corregir la zona horaria; eso pertenece a `fix-timezone-scheduling`.
- Reencolar tarjetas falladas; eso pertenece a `requeue-failed-in-session`.
- Rate limiting o bloqueo por abuso.
