# leitner-scheduling

## Propósito

Define cómo el Sistema Leitner asigna cajas, calcula la próxima revisión y registra los repasos. Es la fuente de verdad para la cola de estudio y para la vista agregada de cajas.

## Requirements

### Requirement: Cinco cajas con intervalos por defecto

El sistema SHALL manejar exactamente cinco cajas y usar por defecto los intervalos de 1, 3, 7, 15 y 30 días para las cajas 1 a 5, respectivamente.

#### Scenario: Intervalos por defecto de un usuario sin ajustes

- GIVEN un usuario sin fila en `user_settings`
- WHEN el sistema necesita el intervalo de cada caja
- THEN usa los valores `[1, 3, 7, 15, 30]`
- AND la Caja 1 programa a 1 día, la Caja 2 a 3 días, la Caja 3 a 7 días, la Caja 4 a 15 días y la Caja 5 a 30 días

#### Scenario: Consulta de un intervalo fuera del rango de cajas

- GIVEN una solicitud de intervalo para una caja menor que 1 o mayor que 5
- WHEN el motor resuelve el intervalo
- THEN usa el intervalo por defecto correspondiente si existe
- AND si no existe, usa 1 día como último respaldo

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

### Requirement: Transición por acierto

El sistema SHALL subir una caja cuando el repaso es un acierto, con tope en la Caja 5, y SHALL programar la próxima revisión con el intervalo de la caja nueva.

#### Scenario: Acierto desde una caja intermedia

- GIVEN una tarjeta en Caja 1 con `proximaRevision` ya cumplida
- WHEN el usuario la marca como acertada
- THEN la tarjeta pasa a Caja 2
- AND la próxima revisión se calcula como la fecha base más 3 días

#### Scenario: Acierto desde la Caja 5

- GIVEN una tarjeta en Caja 5 con `proximaRevision` ya cumplida
- WHEN el usuario la marca como acertada
- THEN la tarjeta permanece en Caja 5
- AND la próxima revisión se calcula como la fecha base más 30 días

### Requirement: Transición por fallo

El sistema SHALL devolver siempre la tarjeta a la Caja 1 cuando el repaso es un fallo, y SHALL programar la próxima revisión con el intervalo de la Caja 1.

#### Scenario: Fallo desde una caja alta

- GIVEN una tarjeta en Caja 4 con `proximaRevision` ya cumplida
- WHEN el usuario la marca como fallada
- THEN la tarjeta pasa a Caja 1
- AND la próxima revisión se calcula como la fecha base más 1 día

#### Scenario: Fallo en la Caja 1

- GIVEN una tarjeta en Caja 1 con `proximaRevision` ya cumplida
- WHEN el usuario la marca como fallada
- THEN la tarjeta permanece en Caja 1
- AND la próxima revisión se calcula como la fecha base más 1 día

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

### Requirement: Intervalos configurables por usuario

El sistema SHALL aceptar intervalos configurables por usuario solo cuando sean exactamente cinco enteros entre 1 y 365. Si los valores almacenados o recibidos no cumplen esa regla, SHALL usar los intervalos por defecto.

#### Scenario: Intervalos válidos

- GIVEN un usuario con intervalos `[2, 4, 8, 16, 32]`
- WHEN se calcula la próxima revisión de una tarjeta que sube a Caja 2
- THEN se usan 4 días para esa tarjeta

#### Scenario: Intervalos inválidos en la base de datos

- GIVEN una fila `user_settings` con `[1, 3, 7]`
- WHEN el repositorio lee los intervalos
- THEN devuelve `[1, 3, 7, 15, 30]`
- AND no propaga el arreglo inválido al motor

#### Scenario: Actualización con valores fuera de rango

- GIVEN una solicitud de actualización con un intervalo de 0, 366 o un valor no entero
- WHEN se valida el DTO
- THEN el backend responde `400` con `Datos inválidos`
- AND no modifica los ajustes existentes

### Requirement: Registro transaccional del repaso

El sistema SHALL actualizar la caja y la próxima revisión de la tarjeta y crear un registro `Review` en una sola transacción cuando se procesa un repaso.

#### Scenario: Repaso exitoso

- GIVEN una tarjeta propia y un repaso con `acierto = true`
- WHEN el repositorio procesa el repaso
- THEN actualiza `cajaActual` y `proximaRevision` de la tarjeta
- AND crea un `Review` con `resultado = true` y la fecha de revisión
- AND ambas escrituras pertenecen a la misma transacción

#### Scenario: Falla una de las escrituras

- GIVEN un error al crear el `Review` o al actualizar la tarjeta
- WHEN se ejecuta la transacción
- THEN ninguna de las dos escrituras queda confirmada

### Requirement: Pureza del motor

El motor de cálculo SHALL ser lógica pura: no SHALL depender de Express, Prisma, la base de datos ni de efectos de red.

#### Scenario: Uso del motor en aislamiento

- GIVEN una tarjeta con caja y una fecha base conocidas
- WHEN se invoca `calcularProximaRevision`
- THEN el resultado depende solo de los argumentos recibidos
- AND no se realiza ninguna consulta a la base de datos ni petición HTTP

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

## Preguntas abiertas

- `cajaInicial` cambia la caja, pero no la fecha de vencimiento: una tarjeta creada en Caja 5 vence el día actual.
- La migración histórica interpreta los timestamps existentes como UTC; una tarjeta creada cerca de la medianoche local puede quedar con un día de diferencia.
- `reviewForUser` no comprueba que la tarjeta esté vencida. Un cliente puede repasar la misma tarjeta varias veces y subirla de caja sin esperar los intervalos. Esto se aborda en `guard-review-when-due`.
- La lectura de la tarjeta y de los intervalos ocurre fuera de la transacción. Dos repasos simultáneos pueden leer la misma caja y crear dos `Review`; la transacción actual solo agrupa la actualización y la creación. Esto se aborda en `guard-review-when-due`.
- `normalizarIntervalos` no exige que los intervalos sean crecientes ni distintos. Un usuario puede guardar `[30, 1, 7, 15, 3]` si cumple los límites.
- La `proximaRevision` de la vista de cajas usa el mínimo de la caja, que puede ser una fecha ya pasada. La interfaz solo la muestra cuando no hay pendientes.
- La constante `LEITNER_INTERVALS` se conserva por compatibilidad, pero el cálculo usa `DEFAULT_INTERVALS` y los intervalos del usuario.
- No existe una validación explícita de que `cajaActual` esté entre 1 y 5 al leer una tarjeta ya existente.

## Referencias de código

- `backend/src/lib/dates.ts`
- `backend/src/modules/cards/leitner.service.ts`
- `backend/src/modules/cards/card.repository.ts`
- `backend/src/modules/cards/card.dto.ts`
- `backend/src/modules/settings/settings.repository.ts`
- `backend/src/middlewares/timezone.ts`
- `backend/prisma/schema.prisma`
