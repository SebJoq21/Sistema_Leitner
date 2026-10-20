# Tareas: Aplicar un límite diario por mazo y total

- [ ] 1. Escribir tests que fallen para el conteo de tarjetas distintas repasadas hoy, por mazo y total, incluyendo dos repasos de la misma tarjeta y repasos en mazos distintos.
- [ ] 2. Escribir tests que fallen para el recorte de cola con límite por mazo, límite total, ambos, filtros por mazo/caja y límites `null`.
- [ ] 3. Escribir tests de medianoche local (Lima y UTC) y de reinicio del cupo al cambiar de día.
- [ ] 4. Agregar `limiteDiarioTotal Int?` a `UserSettings` y la migración; agregar el índice de `Review.fechaRevision` si se confirma que la consulta lo necesita.
- [ ] 5. Extender el DTO y el repositorio de settings para leer y actualizar `limiteDiarioTotal` (`null` o `1..1000`), manteniendo la compatibilidad con `intervalos` y `timezone`.
- [ ] 6. Extender el DTO de mazo y el formulario para etiquetar `metaDiaria` como “Límite diario del mazo” y aclarar que vacío significa sin límite.
- [ ] 7. Implementar el helper de conteo diario (`usadasTotal`, `usadasPorMazo`) con la zona del usuario, tarjetas distintas y la ventana de 48 horas.
- [ ] 8. Implementar el recorte de la cola por cupo de mazo y total, manteniendo el orden por `proximaRevision` ascendente.
- [ ] 9. Agregar `GET /api/v1/cards/study-queue` con `{ cards, limits }` y asegurar que la ruta se registre antes de `/:id`; mantener `/cards/due` recortado por compatibilidad.
- [ ] 10. Integrar el límite en `reviewForUser` dentro de la transacción, con lock por usuario, validación de cupo de mazo y total, y error `409 DAILY_LIMIT_REACHED` sin crear `Review`.
- [ ] 11. Reutilizar el `HttpError` o el formato de error de `guard-review-when-due` para distinguir `CARD_NOT_DUE` de `DAILY_LIMIT_REACHED`.
- [ ] 12. Actualizar `api.ts` con el nuevo endpoint, los tipos `StudyQueue` y `StudyLimits`, y `updateSettings` con `limiteDiarioTotal`.
- [ ] 13. Actualizar `StudySession` y `StudySessionView` para usar la cola con metadata, mostrar restantes, distinguir “Límite diario alcanzado” de “Todo al día” y manejar el `409` por alcance.
- [ ] 14. Actualizar el modal de intervalos de `Boxes.tsx` para configurar el límite total.
- [ ] 15. Verificar dos pestañas con un solo cupo restante: exactamente una repasa y la otra recibe el aviso de límite.
- [ ] 16. Actualizar los deltas de `study-session`, `decks` y `settings`; archivar el change y comprobar que `metaDiaria` ya no se describe como “tarjetas nuevas”.
