## ADDED Requirements

### Requirement: Reintento local de tarjetas falladas

El sistema SHALL agregar al final de la cola un reintento local cuando un repaso original sea confirmado con `acierto = false`. El reintento SHALL ser una práctica en memoria: no SHALL llamar a `/review`, no SHALL crear un `Review`, no SHALL cambiar la caja ni `proximaRevision`, y SHALL permitirse como máximo una vez por tarjeta en la sesión.

#### Scenario: Fallo confirmado

- GIVEN una tarjeta original visible
- WHEN el usuario marca “No la sabía” y el backend responde `200`
- THEN la tarjeta se agrega al final de la cola como reintento
- AND se muestra la marca “Reintento”
- AND la tarjeta original ya quedó programada en Caja 1 para el día siguiente

#### Scenario: Acierto confirmado

- GIVEN una tarjeta original visible
- WHEN el usuario marca “La sabía” y el backend responde `200`
- THEN no se agrega ningún reintento

#### Scenario: Reintento acertado

- GIVEN una tarjeta en modo reintento
- WHEN el usuario marca “La sabía”
- THEN no se llama a `/review`
- AND no se crea un `Review`
- AND la caja y `proximaRevision` no cambian
- AND se avanza a la siguiente tarjeta

#### Scenario: Reintento fallado

- GIVEN una tarjeta en modo reintento
- WHEN el usuario marca “No la sabía”
- THEN no se llama a `/review`
- AND no se crea un `Review`
- AND la tarjeta no se vuelve a encolar
- AND se avanza a la siguiente tarjeta

#### Scenario: Máximo un reintento

- GIVEN una tarjeta que falló en su repaso original y volvió a fallar en el reintento
- WHEN el usuario continúa la sesión
- THEN la tarjeta no aparece una tercera vez

#### Scenario: Tarjeta rechazada por el backend

- GIVEN una tarjeta original que recibe `409` o `404`
- WHEN el backend rechaza el repaso
- THEN no se agrega un reintento
- AND la tarjeta se quita de la cola según el manejo de errores

#### Scenario: Recarga de la página

- GIVEN una sesión con reintentos locales pendientes
- WHEN el usuario recarga la página
- THEN los reintentos se pierden
- AND el repaso original sigue guardado
- AND la tarjeta reaparece cuando vuelva a estar vencida

## MODIFIED Requirements

### Requirement: Cola de la sesión

El sistema SHALL cargar al iniciar la sesión las tarjetas vencidas del usuario autenticado, ordenadas por `proximaRevision` ascendente, y SHALL permitir filtrarlas por mazo propio y por caja. Durante la sesión, los reintentos locales de tarjetas falladas SHALL agregarse al final sin alterar el orden de las tarjetas originales.

#### Scenario: Cola con tarjetas vencidas

- GIVEN un usuario con tres tarjetas vencidas en distintos mazos
- WHEN abre la sesión sin filtros
- THEN recibe las tres tarjetas
- AND la primera es la que tiene la `proximaRevision` más antigua

#### Scenario: Filtro por mazo

- GIVEN un usuario con tarjetas vencidas en dos mazos propios
- WHEN abre la sesión con `deckId` de uno de ellos
- THEN la cola solo contiene tarjetas de ese mazo
- AND no contiene tarjetas de otros usuarios ni de otros mazos

#### Scenario: Filtro por caja

- GIVEN un usuario con tarjetas vencidas en Caja 1 y Caja 3
- WHEN abre la sesión con `caja = 3`
- THEN la cola solo contiene tarjetas vencidas de la Caja 3
- AND las tarjetas vencidas de otras cajas no aparecen

#### Scenario: Tarjetas no vencidas

- GIVEN un usuario cuyas tarjetas tienen `proximaRevision` futura
- WHEN abre la sesión
- THEN la cola está vacía
- AND la interfaz muestra el estado “todo al día”

#### Scenario: Reintento agregado al final

- GIVEN una cola con las tarjetas A, B y C
- WHEN A falla y su repaso se guarda
- THEN la cola local queda A, B, C, A(reintento)
- AND el reintento no se envía al backend

### Requirement: Resumen de la sesión

El sistema SHALL mostrar al terminar la cola un resumen con aciertos, fallos, porcentaje de acierto, tiempo total y cantidad de reintentos, contando cada respuesta emitida en la sesión, incluyendo los reintentos locales.

#### Scenario: Sesión terminada con respuestas

- GIVEN una sesión que comenzó con tres tarjetas
- WHEN el usuario responde las tres
- THEN el resumen muestra los aciertos, los fallos y el porcentaje calculado sobre el total de respuestas
- AND muestra el tiempo transcurrido desde el inicio de la sesión
- AND muestra la cantidad de reintentos
- AND muestra las acciones para volver a mazos o agregar tarjetas

#### Scenario: Sesión sin respuestas

- GIVEN una sesión con tarjetas pero sin respuestas emitidas
- WHEN se alcanza el final de la cola
- THEN el porcentaje se muestra como 0%
- AND no se realizan divisiones por cero

#### Scenario: Resumen con reintentos

- GIVEN una tarjeta fallada y luego acertada en su reintento
- WHEN la sesión termina
- THEN el resumen muestra un acierto, un fallo y un reintento
- AND el porcentaje es 50%
- AND no se muestra un segundo `Review` ni un cambio de caja

#### Scenario: Resumen sin reintentos

- GIVEN una sesión sin tarjetas falladas
- WHEN la sesión termina
- THEN el resumen muestra `reintentos = 0`
- AND el porcentaje se calcula solo con las respuestas originales

### Requirement: Repetición manual de la sesión

El sistema SHALL ofrecer la acción “Repasar falladas” al finalizar una sesión que tenga al menos una tarjeta con último resultado fallido. La acción SHALL reiniciar la cola solo con esas tarjetas en modo reintento local, sin llamar a `/review`, y SHALL reiniciar los contadores de la nueva ronda. Si no hay tarjetas falladas, la acción no SHALL mostrarse.

#### Scenario: Repasar las falladas

- GIVEN una sesión terminada con dos tarjetas falladas y una acertada
- WHEN el usuario pulsa “Repasar falladas”
- THEN la cola vuelve al inicio solo con las dos falladas
- AND las tarjetas se muestran en modo reintento
- AND no se llama a `/review`
- AND los contadores de la ronda se reinician

#### Scenario: Sin falladas

- GIVEN una sesión terminada con todas las tarjetas acertadas
- WHEN se muestra el resumen
- THEN no aparece la acción “Repasar falladas”

#### Scenario: Volver a fallar en la ronda manual

- GIVEN una ronda de “Repasar falladas” con dos tarjetas
- WHEN ambas vuelven a fallar
- THEN la ronda termina
- AND se puede volver a pulsar “Repasar falladas”
- AND no se crea ningún `Review` adicional

#### Scenario: Cambiar de filtro después de una ronda

- GIVEN una ronda manual con reintentos locales
- WHEN el usuario cambia el filtro de mazo o caja
- THEN la ronda local se descarta
- AND se carga la cola de vencidas del nuevo filtro

### Requirement: Persistencia del repaso y avance

El sistema SHALL enviar cada repaso original al backend antes de avanzar a la siguiente tarjeta; los reintentos locales no SHALL enviarse. Si el backend indica que la tarjeta ya no está pendiente (`409 CARD_NOT_DUE`) o que ya no existe (`404`), SHALL mostrar un aviso, quitarla de la cola local y avanzar. Si el envío falla por red o por un error del servidor, SHALL mostrar un error y SHALL mantener al usuario en la tarjeta actual.

#### Scenario: Repaso original guardado

- GIVEN una tarjeta original visible y el backend disponible
- WHEN el usuario marca un resultado
- THEN se envía `POST /api/v1/cards/:id/review` con `{ acierto }`
- AND se muestra un aviso con el resultado
- AND se avanza a la siguiente tarjeta

#### Scenario: Reintento local sin envío

- GIVEN una tarjeta en modo reintento
- WHEN el usuario marca un resultado
- THEN no se envía ninguna petición a `/review`
- AND se actualiza el resumen local
- AND se avanza a la siguiente tarjeta

#### Scenario: Tarjeta que ya no está pendiente

- GIVEN una tarjeta visible que fue reprogramada desde otra pestaña
- WHEN el backend responde `409` con `code = CARD_NOT_DUE`
- THEN se muestra el aviso “Esta tarjeta ya no está pendiente”
- AND la tarjeta se quita de la cola local
- AND no se agrega un reintento

#### Scenario: Error de red o del servidor

- GIVEN una tarjeta original visible y el backend no disponible o respondiendo `500`
- WHEN el usuario marca un resultado
- THEN se muestra un aviso de error
- AND la tarjeta actual no cambia
- AND no se agrega un reintento
