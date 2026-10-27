## ADDED Requirements

### Requirement: Zona horaria del usuario

El sistema SHALL calcular el día actual de cada usuario con su zona horaria IANA, resuelta desde `UserSettings.timezone`, el header `X-Timezone` o `UTC` como último respaldo. La zona SHALL usarse para decidir si una tarjeta está vencida y para agrupar repasos por día.

#### Scenario: Usuario en Lima repasa de noche

- GIVEN un usuario con zona `America/Lima`
- WHEN repasa una tarjeta de Caja 1 el lunes a las 21:00 hora local
- THEN la próxima revisión es el martes
- AND la tarjeta está pendiente desde las 00:00 del martes en Lima
- AND no espera hasta las 21:00 del martes

#### Scenario: Usuario sin zona guardada

- GIVEN un usuario sin `timezone` persistida
- WHEN el navegador envía `X-Timezone: America/Lima`
- THEN el backend usa `America/Lima` para la petición
- AND persiste la zona si el usuario tiene fila de ajustes

#### Scenario: Sin zona ni header

- GIVEN un usuario sin `timezone` y una petición sin `X-Timezone`
- WHEN el backend calcula el día
- THEN usa `UTC`

#### Scenario: Zona inválida

- GIVEN un header `X-Timezone` con un valor que no es una zona IANA válida
- WHEN el backend resuelve la zona
- THEN ignora el header y usa la zona guardada o `UTC`
- AND no falla la petición por ese motivo

## MODIFIED Requirements

### Requirement: Creación de tarjetas

El sistema SHALL crear toda tarjeta nueva en la Caja 1 con vencimiento para el día actual en la zona horaria del usuario, salvo que el DTO incluya `cajaInicial`, en cuyo caso SHALL guardar esa caja y mantener el vencimiento para el día actual.

#### Scenario: Tarjeta nueva sin caja inicial

- GIVEN un mazo propio del usuario autenticado y un usuario en `America/Lima`
- WHEN se crea una tarjeta sin `cajaInicial`
- THEN la tarjeta queda en `cajaActual = 1`
- AND `proximaRevision` es la fecha local actual, sin hora
- AND la tarjeta aparece de inmediato en la cola de vencidas

#### Scenario: Tarjeta nueva con caja inicial distinta de 1

- GIVEN un mazo propio del usuario autenticado
- WHEN se crea una tarjeta con `cajaInicial = 4`
- THEN la tarjeta queda en `cajaActual = 4`
- AND `proximaRevision` sigue siendo el día actual
- AND la tarjeta aparece de inmediato en la cola de vencidas

#### Scenario: Creación alrededor de la medianoche

- GIVEN un usuario en `America/Lima` y un instante `2026-10-20T02:30:00Z`
- WHEN crea una tarjeta
- THEN la fecha de vencimiento es `2026-10-19`
- AND otro usuario en `UTC` que crea una tarjeta en el mismo instante obtiene `2026-10-20`

### Requirement: Cálculo de la próxima revisión

El sistema SHALL calcular la próxima revisión como un día de calendario en la zona horaria del usuario, sumando el número de días del intervalo a la fecha base. La fecha resultante SHALL guardarse sin hora y SHALL interpretarse como el inicio de ese día en la zona del usuario.

#### Scenario: Acierto en Lima

- GIVEN una fecha base `2026-10-19` en `America/Lima`
- WHEN una tarjeta sube a Caja 2 con intervalo de 3 días
- THEN la próxima revisión es `2026-10-22`
- AND la tarjeta está pendiente desde las 00:00 del 22 de octubre en Lima

#### Scenario: Fallo en Madrid

- GIVEN una fecha base `2026-03-28` en `Europe/Madrid`
- WHEN una tarjeta falla y vuelve a Caja 1 con intervalo de 1 día
- THEN la próxima revisión es `2026-03-29`
- AND el cambio de horario de verano no altera la fecha

#### Scenario: Fecha base omitida

- GIVEN una llamada al motor sin fecha base
- WHEN se calcula la transición
- THEN el motor usa el día actual en la zona del usuario
- AND la fecha resultante no incluye hora

#### Scenario: Intervalo personalizado

- GIVEN un usuario con intervalos `[2, 4, 8, 16, 32]` y una fecha base `2026-10-19`
- WHEN una tarjeta sube a Caja 3
- THEN la próxima revisión es `2026-10-27`
- AND se usa el intervalo de 8 días de la Caja 3

### Requirement: Vista agregada de cajas

El sistema SHALL devolver siempre las cinco cajas con su intervalo vigente, total de tarjetas, cantidad de pendientes desde el inicio del día actual en la zona del usuario y la próxima revisión más cercana de cada caja. La vista SHALL poder filtrarse por mazo propio.

#### Scenario: Resumen de las cinco cajas

- GIVEN un usuario con tarjetas en varias cajas
- WHEN consulta la vista de cajas
- THEN recibe cinco entradas, una por caja
- AND cada entrada incluye `intervaloDias`, `total`, `pendientes` y `proximaRevision`
- AND las cajas sin tarjetas devuelven `total = 0`, `pendientes = 0` y `proximaRevision = null`

#### Scenario: Pendientes desde el inicio del día local

- GIVEN un usuario en `America/Lima` con una tarjeta agendada para hoy
- WHEN consulta la vista de cajas a las 00:01 hora local
- THEN la tarjeta cuenta como pendiente
- AND no espera a la hora exacta en que fue agendada

#### Scenario: Filtro por mazo

- GIVEN un usuario con dos mazos
- WHEN consulta la vista de cajas con `deckId` de uno de ellos
- THEN solo cuenta las tarjetas de ese mazo
- AND no incluye tarjetas de mazos ajenos
