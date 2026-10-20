# Diseño: Reencolar tarjetas falladas dentro de la sesión

## Decisiones

### 1. El reintento es local y no vuelve a llamar al backend

El repaso original ya quedó registrado: la tarjeta volvió a Caja 1 y se programó para el día siguiente. Volver a llamar a `/review` en la misma sesión:

- Sería rechazado por `guard-review-when-due` porque la tarjeta ya no está vencida.
- Duplicaría `Review` y podría mover la tarjeta otra vez.
- Haría que el resumen y las estadísticas contaran dos respuestas para una sola decisión de programación.

Por eso el reintento es una **repetición de práctica en memoria**. No crea `Review`, no cambia `cajaActual` ni `proximaRevision`, y no requiere endpoints nuevos. La consecuencia del fallo ya está aplicada; el reintento sirve para reforzar el recuerdo, no para reprogramar.

### 2. La cola local distingue originales y reintentos

Cada elemento de la sesión tiene:

- `card`: la tarjeta.
- `kind`: `"original"` o `"retry"`.
- `attempt`: 1 para el original, 2 para el reintento.
- `submitted`: si ya se envió al backend (solo los originales).

La cola inicial se construye con las tarjetas vencidas que devuelve el loader. Los reintentos se agregan al final en el orden en que fallaron.

### 3. Un fallo confirmado agrega un reintento

Flujo:

1. El usuario marca un resultado en una tarjeta original.
2. Se envía `POST /review`.
3. Si el backend responde `200` y `acierto = false`, se agrega un elemento `retry` al final.
4. Si el backend responde `200` y `acierto = true`, no se agrega nada.
5. Si el backend responde `409` o `404`, se quita la tarjeta y no se agrega reintento.
6. Si hay error de red o `500`, se mantiene la tarjeta actual y no se agrega nada.

Solo se agrega un reintento por tarjeta. Si el reintento también falla, no se vuelve a encolar. Esto evita un bucle automático infinito si el usuario no recuerda la tarjeta.

### 4. Responder un reintento no envía nada

Cuando el elemento actual es `retry`:

- Se muestra la tarjeta con una marca “Reintento”.
- El usuario puede voltearla, ver la pista y usar los mismos atajos.
- Al marcar “La sabía” o “No la sabía”, se actualiza el resumen local.
- No se llama a la API.
- Se avanza al siguiente elemento.
- Si el reintento falla, no se agrega otro.

La marca visual es importante para que el usuario no crea que está moviendo la tarjeta de caja otra vez. El texto puede ser “Reintento de práctica · no cambia la caja”.

### 5. El resumen cuenta intentos y reintentos

El resumen conserva los campos actuales y agrega `reintentos`:

- `aciertos`: todos los aciertos, incluidos los de reintento.
- `fallos`: todos los fallos, incluidos los de reintento.
- `reintentos`: cantidad de respuestas que fueron reintentos.
- `porcentaje`: `aciertos / (aciertos + fallos)` sobre todas las respuestas emitidas; `0` si no hubo respuestas.
- `tiempoTotal`: igual que hoy, desde el montaje de la sesión.

Ejemplo: una tarjeta fallada y luego acertada en el reintento produce `aciertos = 1`, `fallos = 1`, `reintentos = 1`, `porcentaje = 50%`. La programación de la tarjeta sigue siendo Caja 1 para mañana; el resumen refleja la práctica, no la programación.

### 6. “Repasar falladas”

La acción “Repasar de nuevo” se reemplaza por “Repasar falladas”:

- Solo aparece si hay al menos una tarjeta cuyo último resultado fue fallo.
- Reinicia la cola local con esas tarjetas, en modo `retry`, sin llamar al backend.
- Reinicia los contadores del resumen para esa ronda.
- Cada tarjeta puede practicarse una vez por ronda; si vuelve a fallar, la ronda termina y se puede volver a pulsar el botón.
- Si no hay falladas, la acción no se muestra.

Esto reemplaza el comportamiento actual de reiniciar toda la cola y reenviar repasos. La acción es explícitamente de práctica y no altera cajas ni historial.

### 7. Persistencia y recarga

La cola de reintentos vive en el estado de React. Si el usuario:

- Recarga la página.
- Cambia de mazo o de caja.
- Navega fuera de la sesión.

Los reintentos locales se pierden. El repaso original ya está guardado y la tarjeta reaparecerá cuando venza. No se intenta persistir la cola en `localStorage` porque podría quedar desincronizada con el backend.

## Alternativas descartadas

- **Volver a llamar a `/review` en el reintento:** choca con el guard, duplica `Review` y altera la programación.
- **Posponer el envío del fallo hasta el final de la sesión:** permitiría reintentar antes de programar, pero cambia el contrato actual de guardado por respuesta y complica el manejo de errores y el cierre de pestaña.
- **Reiniciar toda la cola como hoy:** vuelve a repasar tarjetas que ya no están vencidas y duplica trabajo.
- **Reencolado ilimitado:** puede crear un bucle infinito con una tarjeta que el usuario no recuerda.
- **Guardar el reintento como un `Review` con una marca:** requiere migración, cambia estadísticas y no aporta a la programación.
- **Persistir la cola en el navegador:** agrega complejidad de sincronización y no resuelve el problema principal.

## Riesgos

- **Expectativa del usuario:** puede pensar que acertar el reintento sube la tarjeta. Mitigación: marca “Reintento” y texto explícito de que no cambia la caja.
- **Resumen confuso:** contar reintentos cambia el porcentaje respecto de versiones anteriores. Mitigación: mostrar el desglose de reintentos.
- **Pérdida al recargar:** es aceptable, pero debe documentarse.
- **Sesión larga:** un usuario puede practicar la misma tarjeta muchas veces con “Repasar falladas”. Es una acción manual y sin efectos de programación; no se limita.
- **Progreso:** la barra de avance puede crecer al agregar reintentos; debe calcularse sobre la cola actual, no sobre la longitud inicial.
- **Atajos:** un reintento no debe disparar un envío; el handler debe comprobar `kind` antes de llamar a la API.
- **Doble respuesta:** el bloqueo de envío en curso solo aplica a originales; un reintento local es inmediato. Hay que evitar que un doble clic agregue dos resultados al resumen.

## Estrategia de pruebas

- **Fallo original:** una tarjeta fallada se agrega al final de la cola y se marca como reintento.
- **Acierto original:** no se agrega reintento.
- **Reintento acertado:** no llama a la API, actualiza el resumen y avanza.
- **Reintento fallado:** no se vuelve a encolar.
- **Máximo un reintento:** dos fallos de la misma tarjeta no generan dos reintentos automáticos.
- **Varias tarjetas:** A falla, B acierta, C falla; el orden final es A, B, C, A(reintento), C(reintento).
- **Error de red:** no se agrega reintento y el usuario permanece en la tarjeta.
- **`409`:** no se agrega reintento y la tarjeta se quita de la cola.
- **Resumen:** verificar aciertos, fallos, reintentos y porcentaje con y sin reintentos.
- **“Repasar falladas”:** reinicia solo las falladas, sin llamadas a `/review`, y reinicia contadores.
- **Regresión:** una sesión sin fallos se comporta igual que antes, salvo que ya no existe “Repasar de nuevo” al final.
- **API:** un test que espía `fetch` y verifica que los reintentos no generan peticiones.

## Preguntas abiertas

- ¿Un reintento debe permitir más de un intento si el usuario vuelve a fallar? La propuesta es no, para evitar bucles.
- ¿El reintento debe contar en el porcentaje del resumen o mostrarse aparte? La propuesta es que cuente y que además se muestre el desglose.
- ¿“Repasar falladas” debe poder repetirse indefinidamente? La propuesta es sí, porque es una acción manual sin efectos de programación.
- ¿Debe existir un modo de práctica separado del estudio programado? Sería el siguiente paso si se quiere persistir o mezclar con tarjetas no vencidas.
- ¿El reintento debe guardarse si el usuario cierra la pestaña a mitad de la sesión? La propuesta es no.
- ¿La marca “Reintento” debe aparecer también en el resumen por tarjeta? La propuesta es solo en la tarjeta y en el contador de reintentos.
- ¿Qué pasa si la tarjeta fue borrada entre el fallo y el reintento? Como el reintento es local, se muestra igual; no hay llamada que falle. Si se quiere evitar, habría que revalidar contra el backend.
