# Tareas: Programar el repaso por día de calendario en la zona del usuario

- [ ] 1. Agregar el framework de pruebas del backend (Vitest) y escribir tests que fallen para: `todayInTimeZone` en UTC/Lima/Madrid alrededor de medianoche, `addCalendarDays` en cambio de mes, año y DST, y `calcularProximaRevision` con fechas fijas.
- [ ] 2. Agregar tests de integración que fallen para `findDueByUser`, `boxesByUser`, `findAllByUser` con `pendientes` y `deckRepository.findAllByUser`, usando una tarjeta de ayer, una de hoy y una de mañana con una zona distinta de UTC.
- [ ] 3. Agregar tests que fallen para `computeStreak` y `repasadosHoy` con repasos cercanos a la medianoche en Lima y UTC.
- [ ] 4. Actualizar `prisma/schema.prisma`: `Card.proximaRevision` como `@db.Date` con default `CURRENT_DATE` y `UserSettings.timezone String?`.
- [ ] 5. Crear la migración Prisma que convierte `proximaRevision` a `DATE`, cambia el default y agrega `timezone`; probarla sobre una base con datos conocidos.
- [ ] 6. Implementar helpers puros de fecha (`todayInTimeZone`, `dayKeyInTimeZone`, `dateOnlyToUtc`, `addCalendarDays`) y adaptar `leitner.service.ts` sin dependencias de Prisma ni HTTP.
- [ ] 7. Adaptar `card.repository.ts` para calcular `hoy` con la zona del usuario y comparar `proximaRevision <= hoy` en cola, cajas y filtro de pendientes.
- [ ] 8. Adaptar `deck.repository.ts` para recibir la zona o la fecha de hoy y calcular `pendientes`, `proximaRevision` y `ultimoEstudio` de forma consistente.
- [ ] 9. Adaptar `stats.service.ts` y `stats.repository.ts` para agrupar por día en la zona del usuario y actualizar la racha y `repasadosHoy`.
- [ ] 10. Extender `UserSettings` y el DTO de settings con `timezone` (IANA válida, nullable), resolver la zona con `UserSettings.timezone ?? X-Timezone ?? UTC` y persistir la zona del navegador cuando falte.
- [ ] 11. Agregar el middleware o helper que valide `X-Timezone`, lo deje disponible en la petición y no rompa peticiones sin header.
- [ ] 12. Serializar `proximaRevision` como `YYYY-MM-DD` en las respuestas de tarjetas y mazos; actualizar tipos y tests de contrato.
- [ ] 13. Actualizar `frontend/src/lib/api.ts` para enviar `X-Timezone` y los tipos de fecha; actualizar `leitner.ts` para parsear fechas sin hora, corregir `formatRelative` y alinear `isDue` con `daysUntil`.
- [ ] 14. Actualizar `studyLoader`, la vista de estudio, la lista de tarjetas, el listado de mazos y la vista de cajas para usar las fechas `YYYY-MM-DD` y el próximo repaso por día.
- [ ] 15. Verificar el flujo completo: tarjeta creada hoy, repaso a las 21:00 en Lima, aparición a las 00:00 del día siguiente, y coherencia entre cola, cajas, mazos, dashboard y racha.
- [ ] 16. Actualizar `openspec/specs/` con los deltas, archivar el change y comprobar que no queden referencias a `DateTime` para `proximaRevision` ni a la hora del servidor.
