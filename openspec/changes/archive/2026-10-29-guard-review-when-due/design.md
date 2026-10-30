# Diseño: Rechazar repasos de tarjetas que todavía no están pendientes

## Decisiones

### 1. La condición de vencimiento es la misma que usa la cola

Una tarjeta está disponible cuando `proximaRevision <= hoy`, donde `hoy` es el día actual en la zona del usuario. Con `fix-timezone-scheduling`, ambos son fechas `DATE`; sin ese change, se usa el mismo criterio de comparación que `findDueByUser` para no crear dos definiciones distintas.

El guard no acepta una fecha enviada por el cliente. La calcula el backend con la zona resuelta para el usuario.

### 2. El guard vive en la transacción del repaso

La secuencia propuesta en `reviewForUser` es:

1. Resolver `hoy` antes de abrir la transacción.
2. Dentro de `prisma.$transaction(async (tx) => { ... })`, buscar la tarjeta por `id` y `deck.userId`.
3. Si no existe, lanzar `HttpError(404, 'Tarjeta no encontrada')`.
4. Si `proximaRevision > hoy`, lanzar `HttpError(409, 'La tarjeta todavía no está pendiente', 'CARD_NOT_DUE')`.
5. Leer los intervalos del usuario.
6. Calcular `nuevaCaja` y `proximaRevision`.
7. Actualizar con `updateMany` y `where` que incluya `id` y `proximaRevision <= hoy`.
8. Si `count === 0`, otra petición ganó la carrera: lanzar `409`.
9. Crear el `Review` y devolver la tarjeta actualizada.

El `where` condicional del paso 7 es la pieza que evita el doble repaso concurrente. No alcanza con leer y comparar: entre la lectura y la escritura otra petición puede reprogramar la tarjeta.

### 3. Actualización condicional en lugar de bloqueo pesimista

`updateMany` con `proximaRevision <= hoy` funciona como compare-and-set:

- Si la tarjeta sigue vencida, actualiza una fila.
- Si otra petición ya la movió a una fecha futura, actualiza cero filas.
- No hace falta `SELECT ... FOR UPDATE` ni una versión explícita.
- La transacción garantiza que el `Review` solo se crea si la actualización condicional tuvo efecto.

Si se prefiere un bloqueo pesimista, se puede usar `$queryRaw` con `FOR UPDATE`, pero agrega SQL específico y no mejora el resultado para este caso.

### 4. Códigos HTTP

- `200`: repaso aplicado; devuelve la tarjeta actualizada.
- `404`: la tarjeta no existe o pertenece a otro usuario. No se revela cuál de las dos cosas.
- `409`: la tarjeta existe, es del usuario, pero su `proximaRevision` es futura. No se modifica nada.
- `400`: body inválido (`acierto` ausente o no booleano), como hoy.
- `500`: error inesperado.

Se elige `409 Conflict` porque la petición es válida en forma pero entra en conflicto con el estado actual del recurso. `422` también sería defendible, pero `409` comunica mejor “la cola cambió”.

Respuesta propuesta:

```json
{
  "error": "La tarjeta todavía no está pendiente",
  "code": "CARD_NOT_DUE",
  "proximaRevision": "2026-10-22"
}
```

No se incluye el contenido de la tarjeta en el error; el usuario ya la conoce, pero no hace falta exponerla en un cuerpo de error.

### 5. `HttpError` y `errorHandler`

Se agrega una clase mínima:

- `status: number`.
- `code?: string`.
- `details?: unknown`.

`errorHandler` comprueba `instanceof HttpError` y responde con ese estado y `{ error, code, ...details }`. Los errores de Prisma que hoy terminan en `500` pueden mapearse después; este change solo garantiza los dos casos del repaso. El resto sigue devolviendo `500` con `Error interno`.

### 6. Manejo en la sesión de estudio

`api.ts` debe exponer el estado HTTP y el `code` del error, no solo un mensaje. En `StudySessionView`:

- `409 CARD_NOT_DUE`: mostrar “Esta tarjeta ya no está pendiente”, quitarla de la cola local y avanzar. No tiene sentido dejar al usuario en una tarjeta que el backend rechazará siempre.
- `404`: mostrar “La tarjeta ya no existe”, quitarla y avanzar.
- Error de red o `500`: mantener la tarjeta actual, mostrar el error y permitir reintentar, como hoy.
- Mientras el envío está en curso, seguir ignorando un segundo clic.

Este comportamiento modifica el contrato de “cualquier error mantiene la tarjeta”, por eso se actualiza el spec de `study-session`.

### 7. “Repasar de nuevo” y reencolado

Con el guard, “Repasar de nuevo” no puede reenviar tarjetas que ya fueron reprogramadas. Opciones:

- **Recomendada:** que el botón recargue la cola de vencidas desde el backend. Si no hay ninguna, muestra “Todo al día”. Así no se reenvía nada programado.
- **Alternativa:** eliminarlo y dejar que `requeue-failed-in-session` lo reemplace por “Repasar falladas”, que solo reencola las tarjetas falladas de la sesión y las mantiene vencidas.
- **No recomendada:** mantener el botón y tragarse los `409`; el usuario vería una sesión que no avanza o que “pierde” tarjetas.

La decisión final corresponde a `requeue-failed-in-session`; este change solo exige que la interfaz no intente repasar tarjetas no vencidas.

## Alternativas descartadas

- **Validar solo en el controller:** deja la carrera abierta y duplica la lógica de vencimiento.
- **Validar solo en el frontend:** no protege la API; cualquier cliente con token puede saltarse la cola.
- **Constraint en la base de datos:** PostgreSQL no puede expresar “solo si `proximaRevision <= hoy`” sin un trigger, y el trigger no conoce la zona del usuario.
- **Bloqueo optimista con columna `version`:** requiere migración y no aporta sobre el `updateMany` condicional.
- **Devolver `200` sin aplicar el cambio:** oculta el problema y rompe la confianza en el historial.
- **Aceptar el repaso y no crear `Review`:** deja la tarjeta y el historial inconsistentes.

## Riesgos

- **Reloj del servidor:** `hoy` se calcula en el backend. Un reloj desfasado puede rechazar o aceptar un repaso en el límite del día. Mitigación: usar la hora del servidor como fuente y monitorear desfase.
- **Zona horaria cambiante:** si el usuario cambia de zona, el límite del día cambia. Es el comportamiento esperado de `fix-timezone-scheduling`.
- **Cliente viejo:** si no maneja `409`, mostrará un error genérico y no avanzará. Mitigación: actualizar el frontend en el mismo release.
- **Doble clic:** el guard del backend lo resuelve, pero la UI debe seguir bloqueando el segundo envío para no mostrar dos avisos.
- **“Repasar de nuevo”:** si no se coordina con `requeue-failed-in-session`, el botón queda roto. Es el principal riesgo de regresión funcional.
- **Transacciones concurrentes:** `updateMany` puede devolver `count = 0` por una razón distinta a la carrera; el código debe volver a leer para decidir entre `404` y `409` si hace falta.
- **Tarjetas ya vencidas pero con hora:** mientras no se implemente `fix-timezone-scheduling`, la comparación exacta puede rechazar una tarjeta que la UI muestra como vencida por fecha. Mitigación: implementar ambos changes juntos o alinear el criterio.

## Estrategia de pruebas

- **Repaso vencido:** tarjeta con `proximaRevision` de ayer; `POST /review` responde `200`, sube de caja y crea un `Review`.
- **Repaso de hoy:** tarjeta con `proximaRevision` de hoy; responde `200`.
- **Repaso futuro:** tarjeta con `proximaRevision` de mañana; responde `409`, no cambia la caja y no crea `Review`.
- **Tarjeta ajena:** responde `404` y no crea `Review`.
- **Tarjeta inexistente:** responde `404`.
- **Concurrencia:** dos `POST /review` simultáneos sobre la misma tarjeta vencida; exactamente uno responde `200`, el otro `409`, y se crea un solo `Review`.
- **Fallo en la transacción:** si falla la creación del `Review`, la tarjeta no cambia.
- **Zona horaria:** con `America/Lima`, una tarjeta agendada para el 20 no se puede repasar a las 23:00 del 19; a las 00:01 del 20 sí.
- **Frontend:** un `409` quita la tarjeta de la cola y avanza; un `500` mantiene la tarjeta y muestra reintento.
- **Regresión:** un repaso normal sigue devolviendo la tarjeta actualizada y el resumen de la sesión no cambia.

## Preguntas abiertas

- ¿`409` o `422` para una tarjeta no vencida? La propuesta es `409`.
- ¿Debe existir una tolerancia de segundos o minutos por relojes desfasados entre cliente y servidor? La propuesta es no: manda el servidor.
- ¿El cuerpo del `409` debe incluir `proximaRevision`? La propuesta es sí, para que la UI pueda explicar cuándo vuelve.
- ¿Qué pasa si el usuario tiene dos pestañas y una ya repasó la tarjeta? La segunda recibe `409` y la UI la quita de la cola local.
- ¿Se debe permitir repasar una tarjeta vencida más de una vez el mismo día? Con el guard, después del primer repaso queda programada a futuro y se rechaza. Es lo esperado.
- ¿Se necesita un idempotency key para reintentos de red? No en este change; un reintento después de un `200` recibirá `409`, lo que puede confundir a la UI. Habría que distinguir “reintento del mismo repaso” si se vuelve un problema.
- ¿“Repasar de nuevo” se recarga desde el servidor o se elimina? Depende de `requeue-failed-in-session`.
- ¿El guard aplica a un futuro modo de práctica o administración? La propuesta es que todo repaso que mueva cajas pase por el guard.
