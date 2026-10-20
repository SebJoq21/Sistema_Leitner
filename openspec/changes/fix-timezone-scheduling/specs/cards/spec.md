## MODIFIED Requirements

### Requirement: Listado y filtros del API

El sistema SHALL devolver las tarjetas del usuario autenticado con su mazo, y SHALL permitir filtrar por `deckId`, `tag` y `pendientes`. `pendientes=true` SHALL devolver solo las tarjetas cuya `proximaRevision` sea menor o igual al día actual en la zona horaria del usuario. El listado SHALL incluir `id`, `deckId`, `anverso`, `reverso`, `tag`, `cajaActual`, `proximaRevision`, `createdAt`, `updatedAt` y `deck`.

#### Scenario: Listado completo

- GIVEN un usuario con tarjetas en varios mazos
- WHEN consulta `GET /api/v1/cards`
- THEN recibe solo sus tarjetas
- AND cada tarjeta incluye su mazo en `deck`
- AND `proximaRevision` se serializa como `YYYY-MM-DD`

#### Scenario: Filtro por mazo

- GIVEN un usuario con dos mazos
- WHEN consulta el listado con `deckId`
- THEN recibe solo las tarjetas de ese mazo
- AND si el mazo es de otro usuario, el sistema no expone sus tarjetas

#### Scenario: Filtro por etiqueta

- GIVEN tarjetas con etiquetas `verbo` y `sustantivo`
- WHEN consulta el listado con `tag = "verbo"`
- THEN recibe solo las tarjetas con esa etiqueta exacta

#### Scenario: Filtro de pendientes desde el inicio del día local

- GIVEN un usuario en `America/Lima` con una tarjeta agendada para hoy
- WHEN consulta el listado con `pendientes = true` a las 00:01 hora local
- THEN la tarjeta aparece en el resultado
- AND una tarjeta agendada para mañana no aparece

#### Scenario: Pendientes con otra zona horaria

- GIVEN un usuario en `America/Lima` y un usuario en `UTC` con la misma tarjeta agendada para `2026-10-20`
- WHEN cada uno consulta sus pendientes en un instante en que en Lima todavía es 19 de octubre
- THEN el usuario de Lima no la ve como pendiente
- AND el usuario de UTC sí la ve como pendiente

### Requirement: Creación y estado inicial

El sistema SHALL crear la tarjeta en Caja 1 con vencimiento para el día actual en la zona horaria del usuario, y SHALL aceptar `cajaInicial` entre 1 y 5 para sobrescribir únicamente la caja. La fecha de vencimiento SHALL guardarse sin hora.

#### Scenario: Creación por defecto

- GIVEN un `deckId` propio y un cuerpo sin `cajaInicial`
- WHEN se crea la tarjeta
- THEN `cajaActual` es 1
- AND `proximaRevision` es la fecha local actual, sin hora
- AND la tarjeta aparece de inmediato en la cola de vencidas

#### Scenario: Creación con caja inicial

- GIVEN un cuerpo con `cajaInicial = 3`
- WHEN se crea la tarjeta
- THEN `cajaActual` es 3
- AND `proximaRevision` sigue siendo la fecha local actual, no la fecha base más el intervalo de la Caja 3
- AND la tarjeta aparece de inmediato en la cola de vencidas

#### Scenario: Creación en Lima cerca de la medianoche

- GIVEN un usuario en `America/Lima` y un instante `2026-10-20T02:30:00Z`
- WHEN crea una tarjeta
- THEN `proximaRevision` es `2026-10-19`
- AND un usuario en `UTC` que crea una tarjeta en el mismo instante obtiene `2026-10-20`

#### Scenario: Caja inicial fuera de rango

- GIVEN un cuerpo con `cajaInicial = 0` o `6`
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se crea la tarjeta
