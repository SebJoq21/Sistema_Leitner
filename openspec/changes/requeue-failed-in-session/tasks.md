# Tareas: Reencolar tarjetas falladas dentro de la sesión

- [ ] 1. Definir el tipo de elemento de sesión (`kind: "original" | "retry"`, `attempt`, `submitted`) y separar la cola inicial de los reintentos locales.
- [ ] 2. Refactorizar `StudySessionView` para que, tras un `200` con `acierto = false`, agregue un reintento al final y, tras un acierto, no agregue nada.
- [ ] 3. Asegurar que un `409`, un `404` o un error de red no agreguen reintento y mantengan el comportamiento definido en `guard-review-when-due`.
- [ ] 4. Implementar la respuesta de un reintento sin llamar a `/review`, sin modificar la caja, sin crear `Review` y sin volver a encolarlo.
- [ ] 5. Mostrar la marca “Reintento de práctica · no cambia la caja” en la tarjeta y ajustar el progreso para calcularlo sobre la cola actual.
- [ ] 6. Actualizar el resumen para incluir `reintentos` y calcular aciertos, fallos y porcentaje sobre todas las respuestas emitidas.
- [ ] 7. Reemplazar “Repasar de nuevo” por “Repasar falladas”, que reinicia solo las tarjetas falladas en modo local y reinicia los contadores de la ronda.
- [ ] 8. Verificar que cambiar de filtro, recargar o salir de la sesión descarta los reintentos sin afectar el repaso ya guardado.
- [ ] 9. Escribir tests de UI que fallen para: fallo agrega al final, acierto no agrega, reintento no llama a la API, máximo un reintento, resumen con reintentos y “Repasar falladas”.
- [ ] 10. Agregar un test que espía `fetch` y confirma que los reintentos no generan peticiones a `/review`.
- [ ] 11. Actualizar los deltas de `study-session` (reintento, cola, resumen y repetición manual) y archivar el change.
- [ ] 12. Revisar la interacción con `guard-review-when-due`: ningún camino de la UI debe reenviar una tarjeta ya programada.
