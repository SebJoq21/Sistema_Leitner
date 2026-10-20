## ADDED Requirements

### Requirement: Límite diario de la sesión

El sistema SHALL aplicar un límite diario opcional por mazo (`Deck.metaDiaria`) y un límite diario opcional total (`UserSettings.limiteDiarioTotal`). El límite SHALL contar tarjetas distintas repasadas hoy en la zona del usuario y SHALL reiniciarse a las 00:00 locales. Los reintentos locales no SHALL consumir cupo.

#### Scenario: Límite por mazo

- GIVEN un mazo con `metaDiaria = 10` y tres tarjetas repasadas hoy
- WHEN el usuario abre la sesión
- THEN la cola incluye como máximo siete tarjetas de ese mazo
- AND las tarjetas de otros mazos no consumen ese cupo

#### Scenario: Límite total

- GIVEN un usuario con `limiteDiarioTotal = 20` y doce tarjetas repasadas hoy en varios mazos
- WHEN abre la sesión
- THEN la cola incluye como máximo ocho tarjetas en total
- AND el límite se comparte entre todos los mazos

#### Scenario: Ambos límites

- GIVEN un mazo con `metaDiaria = 5` y un total de 20, con 4 tarjetas del mazo ya repasadas y 18 en total
- WHEN el usuario abre la sesión
- THEN la cola incluye como máximo una tarjeta de ese mazo
- AND no incluye más de una tarjeta adicional de otros mazos por el cupo total

#### Scenario: Sin límites

- GIVEN un mazo con `metaDiaria = null` y un usuario con `limiteDiarioTotal = null`
- WHEN abre la sesión
- THEN la cola incluye todas las tarjetas vencidas
- AND no se aplica ningún recorte

#### Scenario: Límite con filtro

- GIVEN un usuario con límite total y una sesión filtrada por un mazo
- WHEN abre la sesión
- THEN el cupo total sigue contando los repasos de todos los mazos
- AND no se reinicia por el filtro

#### Scenario: Reinicio a medianoche

- GIVEN un usuario en `America/Lima` que agotó su cupo el 19 de octubre
- WHEN abre la sesión a las 23:59
- THEN no hay tarjetas disponibles por límite
- AND a las 00:01 del 20 de octubre el cupo vuelve a estar completo

#### Scenario: Reintento local

- GIVEN una tarjeta fallada y reencolada como reintento local
- WHEN el usuario la responde en el reintento
- THEN no se crea un `Review`
- AND no consume cupo del mazo ni del total

#### Scenario: Repaso que excede el cupo

- GIVEN una tarjeta vencida y un cupo ya agotado
- WHEN el usuario intenta repasarla
- THEN el backend responde `409 DAILY_LIMIT_REACHED`
- AND no se crea un `Review`
- AND la caja y `proximaRevision` no cambian

## MODIFIED Requirements

### Requirement: Cola de la sesión

El sistema SHALL cargar al iniciar la sesión las tarjetas vencidas del usuario autenticado, ordenadas por `proximaRevision` ascendente, y SHALL permitir filtrarlas por mazo propio y por caja. La cola SHALL recortarse según el cupo diario restante de cada mazo y el cupo total. Durante la sesión, los reintentos locales de tarjetas falladas SHALL agregarse al final sin alterar el orden de las tarjetas originales.

#### Scenario: Cola con tarjetas vencidas

- GIVEN un usuario con tres tarjetas vencidas en distintos mazos y sin límites
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
- AND la interfaz muestra el estado correspondiente

#### Scenario: Recorte por cupo

- GIVEN un usuario con más tarjetas vencidas que cupo disponible
- WHEN abre la sesión
- THEN la cola incluye solo las tarjetas que caben en el cupo
- AND se respeta el orden por `proximaRevision`

#### Scenario: Reintento agregado al final

- GIVEN una cola con las tarjetas A, B y C
- WHEN A falla y su repaso se guarda
- THEN la cola local queda A, B, C, A(reintento)
- AND el reintento no se envía al backend

### Requirement: Estado todo al día

El sistema SHALL mostrar un estado “Todo al día” cuando la cola inicial está vacía y no hay un límite diario agotado, junto con la fecha del próximo repaso si existe una tarjeta futura en el filtro actual. Si la cola está vacía porque se alcanzó el límite, SHALL mostrar “Límite diario alcanzado” y la hora del próximo reinicio local.

#### Scenario: Sin tarjetas vencidas

- GIVEN un usuario sin tarjetas vencidas y sin límite agotado
- WHEN abre la sesión
- THEN se muestra “¡Todo al día!”
- AND se indica que no hay tarjetas pendientes

#### Scenario: Próximo repaso disponible

- GIVEN un usuario sin tarjetas vencidas y con al menos una tarjeta futura
- WHEN la sesión calcula el próximo repaso
- THEN muestra la fecha de la tarjeta futura más cercana según `proximaRevision`
- AND si no hay tarjetas futuras, no muestra una fecha

#### Scenario: Límite total agotado

- GIVEN un usuario que ya repasó tantas tarjetas como su límite total
- WHEN abre la sesión y no quedan tarjetas por cupo
- THEN se muestra “Límite diario alcanzado”
- AND se indica la hora del próximo reinicio local
- AND no se muestra “Todo al día”

#### Scenario: Límite de mazo agotado con filtro

- GIVEN una sesión filtrada por un mazo cuyo cupo está agotado
- WHEN la cola queda vacía
- THEN se muestra “Límite de este mazo alcanzado”
- AND se ofrece quitar el filtro o volver a mazos

### Requirement: Persistencia del repaso y avance

El sistema SHALL enviar cada repaso original al backend antes de avanzar a la siguiente tarjeta; los reintentos locales no SHALL enviarse. Si el backend indica que la tarjeta ya no está pendiente (`409 CARD_NOT_DUE`) o que ya no existe (`404`), SHALL mostrar un aviso, quitarla de la cola local y avanzar. Si el backend indica que se alcanzó el límite diario (`409 DAILY_LIMIT_REACHED`), SHALL mostrar un aviso y recortar la cola según el alcance del límite. Si el envío falla por red o por un error del servidor, SHALL mostrar un error y SHALL mantener al usuario en la tarjeta actual.

#### Scenario: Repaso original guardado

- GIVEN una tarjeta original visible y el backend disponible
- WHEN el usuario marca un resultado
- THEN se envía `POST /api/v1/cards/:id/review` con `{ acierto }`
- AND se muestra un aviso con el resultado
- AND se avanza a la siguiente tarjeta

#### Scenario: Tarjeta que ya no está pendiente

- GIVEN una tarjeta visible que fue reprogramada desde otra pestaña
- WHEN el backend responde `409` con `code = CARD_NOT_DUE`
- THEN se muestra el aviso “Esta tarjeta ya no está pendiente”
- AND la tarjeta se quita de la cola local
- AND se avanza a la siguiente tarjeta

#### Scenario: Tarjeta que ya no existe

- GIVEN una tarjeta visible que fue borrada desde otra pestaña
- WHEN el backend responde `404`
- THEN se muestra el aviso “La tarjeta ya no existe”
- AND la tarjeta se quita de la cola local
- AND se avanza a la siguiente tarjeta

#### Scenario: Límite del mazo alcanzado durante la sesión

- GIVEN una tarjeta de un mazo cuyo cupo se agotó en otra pestaña
- WHEN el backend responde `409 DAILY_LIMIT_REACHED` con `scope = "deck"`
- THEN se muestra el aviso de límite
- AND se quitan de la cola local las tarjetas de ese mazo
- AND se continúa con las tarjetas de otros mazos

#### Scenario: Límite total alcanzado durante la sesión

- GIVEN una tarjeta visible y el cupo total agotado
- WHEN el backend responde `409 DAILY_LIMIT_REACHED` con `scope = "total"`
- THEN se muestra el aviso de límite
- AND la sesión termina y se muestra el resumen
- AND el intento no cuenta como acierto ni como fallo

#### Scenario: Error de red o del servidor

- GIVEN una tarjeta visible y el backend no disponible o respondiendo `500`
- WHEN el usuario marca un resultado
- THEN se muestra un aviso de error
- AND la tarjeta actual no cambia
- AND no se avanza a la siguiente tarjeta

#### Scenario: Envío en curso

- GIVEN un repaso en proceso de envío
- WHEN el usuario intenta marcar otro resultado
- THEN el segundo intento se ignora mientras el primero sigue en curso
