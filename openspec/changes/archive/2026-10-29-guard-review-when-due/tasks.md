# Tareas: Rechazar repasos de tarjetas que todavía no están pendientes

- [x] 1. Escribir tests de integración que fallen para repaso de una tarjeta de ayer (`200`), de hoy (`200`) y de mañana (`409`), verificando que el `409` no cambia la caja ni crea `Review`.
- [x] 2. Escribir tests que fallen para tarjeta inexistente (`404`), tarjeta de otro usuario (`404`) y dos repasos concurrentes sobre la misma tarjeta (un `200`, un `409`, un solo `Review`).
- [x] 3. Agregar `HttpError` y hacer que `errorHandler` responda con su estado, código y detalles; mantener `500` para errores no controlados.
- [x] 4. Resolver el día actual con la zona del usuario antes de la transacción y reutilizar el mismo criterio de vencimiento que `findDueByUser`.
- [x] 5. Refactorizar `reviewForUser` para leer la tarjeta, validar pertenencia y vencimiento, calcular la transición y actualizar con `updateMany` condicional dentro de `prisma.$transaction`.
- [x] 6. Verificar que el `Review` se crea solo cuando la actualización condicional afectó una fila y que un `count = 0` se traduce en `409`.
- [x] 7. Actualizar el controller o el servicio para propagar `HttpError` sin convertirlo en `500` y documentar las respuestas `404` y `409`.
- [x] 8. Exponer estado y código de error en `frontend/src/lib/api.ts`.
- [x] 9. Actualizar `StudySessionView` para distinguir `409 CARD_NOT_DUE` y `404`, quitar la tarjeta de la cola y avanzar; mantener el comportamiento actual para errores de red y `500`.
- [x] 10. Resolver “Repasar de nuevo” para que no reenvíe tarjetas ya programadas: recargar la cola de vencidas o coordinarlo con `requeue-failed-in-session`.
- [x] 11. Agregar un test de UI o de integración que verifique que un `409` no deja al usuario atascado en la tarjeta.
- [x] 12. Actualizar los deltas de `leitner-scheduling`, `cards` y `study-session`; archivar el change y comprobar que no queden llamadas a `/review` sin guard.
