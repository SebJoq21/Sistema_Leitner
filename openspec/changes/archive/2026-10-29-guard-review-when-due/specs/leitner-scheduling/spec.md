## ADDED Requirements

### Requirement: Repaso solo de tarjetas vencidas

El sistema SHALL permitir un repaso solo cuando `proximaRevision` sea menor o igual al día actual en la zona horaria del usuario. Si la tarjeta todavía no está pendiente, SHALL responder `409 Conflict`, SHALL dejar la tarjeta y sus repasos sin cambios y SHALL no revelar datos de otra tarjeta.

#### Scenario: Tarjeta con vencimiento futuro

- GIVEN una tarjeta propia con `proximaRevision` de mañana
- WHEN el usuario envía `POST /api/v1/cards/:id/review`
- THEN el backend responde `409`
- AND la tarjeta conserva su caja y su `proximaRevision`
- AND no se crea un `Review`

#### Scenario: Tarjeta vencida hoy

- GIVEN una tarjeta propia con `proximaRevision` del día actual en la zona del usuario
- WHEN el usuario la repasa
- THEN el backend responde `200`
- AND se aplica la transición de caja

#### Scenario: Tarjeta vencida ayer

- GIVEN una tarjeta propia con `proximaRevision` de ayer
- WHEN el usuario la repasa
- THEN el backend responde `200`
- AND se aplica la transición de caja

#### Scenario: Límite de medianoche en Lima

- GIVEN una tarjeta agendada para el 20 de octubre y un usuario en `America/Lima`
- WHEN intenta repasarla a las 23:00 del 19 de octubre
- THEN el backend responde `409`
- AND a las 00:01 del 20 de octubre el repaso se acepta

#### Scenario: Dos repasos simultáneos

- GIVEN una tarjeta vencida y dos peticiones de repaso simultáneas
- WHEN ambas llegan al backend
- THEN una responde `200` y la otra `409`
- AND se crea exactamente un `Review`
- AND la tarjeta avanza una sola caja

#### Scenario: Tarjeta inexistente o ajena

- GIVEN un identificador que no existe o que pertenece a otro usuario
- WHEN se intenta repasar
- THEN el backend responde `404`
- AND no se crea un `Review`

## MODIFIED Requirements

### Requirement: Registro transaccional del repaso

El sistema SHALL leer la tarjeta y sus intervalos, validar que esté vencida y que pertenezca al usuario, actualizar la caja y la próxima revisión y crear un registro `Review` dentro de una sola transacción. La actualización SHALL aplicarse solo si la tarjeta sigue vencida al momento de escribir.

#### Scenario: Repaso exitoso

- GIVEN una tarjeta propia y vencida, y un repaso con `acierto = true`
- WHEN el repositorio procesa el repaso
- THEN valida la pertenencia y el vencimiento dentro de la transacción
- AND actualiza `cajaActual` y `proximaRevision` de la tarjeta
- AND crea un `Review` con `resultado = true` y la fecha de revisión
- AND ambas escrituras pertenecen a la misma transacción

#### Scenario: Tarjeta no vencida

- GIVEN una tarjeta propia con `proximaRevision` futura
- WHEN el repositorio intenta procesar el repaso
- THEN lanza un conflicto `409`
- AND no actualiza la tarjeta
- AND no crea el `Review`
- AND la transacción no deja escrituras parciales

#### Scenario: Tarjeta reprogramada por otra petición

- GIVEN dos repasos concurrentes sobre la misma tarjeta vencida
- WHEN la segunda actualización condicional ya no encuentra la tarjeta vencida
- THEN la segunda petición responde `409`
- AND no se crea un segundo `Review`

#### Scenario: Falla una de las escrituras

- GIVEN un error al crear el `Review` o al actualizar la tarjeta
- WHEN se ejecuta la transacción
- THEN ninguna de las dos escrituras queda confirmada
- AND la tarjeta conserva su estado anterior

#### Scenario: Tarjeta ajena o inexistente

- GIVEN una tarjeta de otro usuario o un identificador inexistente
- WHEN el repositorio la busca dentro de la transacción
- THEN responde `404`
- AND no se crea un `Review`
- AND no se modifica ninguna tarjeta
