# study-session

## Propósito

Describe la experiencia de repaso: qué tarjetas entran en la sesión, cómo se revelan, cómo se envían los resultados y qué resumen ve el usuario al terminar.

## Requirements

### Requirement: Cola de la sesión

El sistema SHALL cargar al iniciar la sesión las tarjetas vencidas del usuario autenticado, ordenadas primero por `cajaActual` ascendente (Caja 1 → Caja 2 → Caja 3 → Caja 4 → Caja 5) y luego por `proximaRevision` ascendente, mostrando en la interfaz la secuencia explícita de progreso por cajas, y SHALL permitir filtrarlas por mazo propio y por caja.

#### Scenario: Cola con tarjetas vencidas

- GIVEN un usuario con tres tarjetas vencidas en distintas cajas y mazos
- WHEN abre la sesión sin filtros
- THEN recibe las tres tarjetas ordenadas de menor a mayor caja (`cajaActual` ascendente) y, dentro de cada caja, de la `proximaRevision` más antigua a la más reciente
- AND la interfaz muestra la ruta de repaso por cajas indicando cuántas tarjetas corresponden a cada caja y cuál se está estudiando actualmente

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

### Requirement: Volteo de la tarjeta y pista

El sistema SHALL mostrar primero el frente de la tarjeta y SHALL permitir voltearla para ver el reverso. Si la tarjeta tiene pista, SHALL mostrarla solo bajo demanda.

#### Scenario: Voltear la tarjeta

- GIVEN una tarjeta con frente y reverso
- WHEN el usuario hace clic en la tarjeta o pulsa Espacio
- THEN la tarjeta gira 180 grados con una transición de 500 ms
- AND se muestra el reverso

#### Scenario: Ver la pista

- GIVEN una tarjeta con `hint`
- WHEN el usuario pulsa “Ver pista”
- THEN se muestra el texto de la pista
- AND la pista no se muestra automáticamente al cargar la tarjeta

#### Scenario: Tarjeta sin pista

- GIVEN una tarjeta con `hint = null`
- WHEN se muestra la tarjeta
- THEN no aparece el control “Ver pista”

### Requirement: Acciones de evaluación

El sistema SHALL permitir marcar “La sabía” o “No la sabía” solo después de voltear la tarjeta, indicando en cada botón la caja de destino correspondiente.

#### Scenario: Botones antes de voltear

- GIVEN una tarjeta con el frente visible
- WHEN el usuario aún no ha volteado la tarjeta
- THEN solo se muestra el botón “Ver respuesta”
- AND no se muestran los botones de acierto y fallo

#### Scenario: Botones después de voltear

- GIVEN una tarjeta con el reverso visible
- WHEN el usuario observa los controles
- THEN se muestran “No la sabía” (indicando que vuelve o sigue en Caja 1) y “La sabía” (indicando la caja a la que sube o que mantiene Caja 5)

### Requirement: Atajos de teclado

El sistema SHALL aceptar Espacio para voltear, `1` o flecha izquierda para fallo, y `2` o flecha derecha para acierto. Los atajos SHALL ignorarse cuando el foco está en un input o en un textarea.

#### Scenario: Atajo para voltear

- GIVEN una tarjeta sin voltear y el foco fuera de un campo de texto
- WHEN el usuario pulsa Espacio
- THEN la tarjeta se voltea
- AND el navegador no ejecuta el desplazamiento por defecto de la barra espaciadora

#### Scenario: Atajo de fallo

- GIVEN una tarjeta volteada y el foco fuera de un campo de texto
- WHEN el usuario pulsa `1` o flecha izquierda
- THEN se envía un repaso con `acierto = false`

#### Scenario: Atajo de acierto

- GIVEN una tarjeta volteada y el foco fuera de un campo de texto
- WHEN el usuario pulsa `2` o flecha derecha
- THEN se envía un repaso con `acierto = true`

#### Scenario: Atajo dentro de un campo de texto

- GIVEN el foco dentro de un input o textarea
- WHEN el usuario pulsa `1`, `2`, Espacio o una flecha
- THEN la sesión no procesa el atajo
- AND el campo conserva su comportamiento normal

### Requirement: Persistencia del repaso y avance

El sistema SHALL enviar cada respuesta al backend antes de avanzar a la siguiente tarjeta. Si el envío falla, SHALL mostrar un error y SHALL mantener al usuario en la tarjeta actual.

#### Scenario: Repaso guardado

- GIVEN una tarjeta visible y el backend disponible
- WHEN el usuario marca un resultado
- THEN se envía `POST /api/v1/cards/:id/review` con `{ acierto }`
- AND se actualizan en la cabecera de la sesión los contadores en vivo y el indicador contextual de la transición de caja (sin mostrar un popup/toast flotante)
- AND se avanza a la siguiente tarjeta

#### Scenario: Error al guardar

- GIVEN una tarjeta visible y el backend no disponible o respondiendo error
- WHEN el usuario marca un resultado
- THEN se muestra un aviso de error
- AND la tarjeta actual no cambia
- AND no se avanza a la siguiente tarjeta

#### Scenario: Envío en curso

- GIVEN un repaso en proceso de envío
- WHEN el usuario intenta marcar otro resultado
- THEN el segundo intento se ignora mientras el primero sigue en curso

### Requirement: Resumen de la sesión

El sistema SHALL mostrar al terminar la cola un resumen con aciertos, fallos, porcentaje de acierto y tiempo total, contando cada respuesta emitida en la sesión.

#### Scenario: Sesión terminada con respuestas

- GIVEN una sesión que comenzó con tres tarjetas
- WHEN el usuario responde las tres
- THEN el resumen muestra los aciertos, los fallos y el porcentaje calculado sobre el total de respuestas
- AND muestra el tiempo transcurrido desde el inicio de la sesión
- AND muestra las acciones para volver a mazos o agregar tarjetas

#### Scenario: Sesión sin respuestas

- GIVEN una sesión con tarjetas pero sin respuestas emitidas
- WHEN se alcanza el final de la cola
- THEN el porcentaje se muestra como 0%
- AND no se realizan divisiones por cero

### Requirement: Estado todo al día

El sistema SHALL mostrar un estado “Todo al día” cuando la cola inicial está vacía, junto con la fecha del próximo repaso si existe una tarjeta futura en el filtro actual.

#### Scenario: Sin tarjetas vencidas

- GIVEN un usuario sin tarjetas vencidas
- WHEN abre la sesión
- THEN se muestra “¡Todo al día!”
- AND se indica que no hay tarjetas pendientes

#### Scenario: Próximo repaso disponible

- GIVEN un usuario sin tarjetas vencidas y con al menos una tarjeta futura
- WHEN la sesión calcula el próximo repaso
- THEN muestra la fecha de la tarjeta futura más cercana según `proximaRevision`
- AND si no hay tarjetas futuras, no muestra una fecha

### Requirement: Filtros de la sesión

El sistema SHALL ofrecer en la interfaz selectores para estudiar todos los mazos o uno concreto y para filtrar por caja. Al cambiar un filtro SHALL navegar a la sesión con el nuevo parámetro y SHALL ofrecer una acción para quitar el filtro.

#### Scenario: Cambiar de mazo

- GIVEN una sesión abierta sin filtros
- WHEN el usuario selecciona un mazo
- THEN la URL pasa a incluir `deckId`
- AND la cola se recarga con las tarjetas vencidas de ese mazo

#### Scenario: Quitar filtros

- GIVEN una sesión filtrada por mazo o caja
- WHEN el usuario pulsa “Quitar filtro”
- THEN navega a `/study` sin parámetros
- AND la cola vuelve a incluir todas las tarjetas vencidas

### Requirement: Repetición manual de la sesión

El sistema SHALL ofrecer la acción “Repasar de nuevo” al finalizar una sesión que tenía tarjetas iniciales, reiniciando la cola completa y el contador de resultados.

#### Scenario: Repasar la misma cola

- GIVEN una sesión terminada que comenzó con tarjetas
- WHEN el usuario pulsa “Repasar de nuevo”
- THEN la cola vuelve al inicio con las mismas tarjetas
- AND se reinician aciertos, fallos, tiempo y estado de volteo

## Preguntas abiertas

- La cola es fija: una tarjeta fallada no vuelve a aparecer en la misma sesión. Esto se aborda en `requeue-failed-in-session`.
- “Repasar de nuevo” reinicia la cola completa y vuelve a llamar al endpoint de repaso. Cuando exista `guard-review-when-due`, esas tarjetas ya no estarán vencidas y los repasos serán rechazados. Hay que decidir si el botón se elimina, se limita a los reintentos o se convierte en un modo de práctica sin efecto sobre cajas.
- La interfaz usa “La sabía” y “No la sabía”, no “Acerté” y “Fallé” como en la guía original.
- Los atajos solo ignoran `input` y `textarea`; un `<select>` o un elemento `contenteditable` con foco podría procesar el atajo.
- El tiempo total se mide desde el montaje del componente y no se pausa al cambiar de pestaña ni al abrir diálogos.
- El próximo repaso se calcula solo sobre las tarjetas que devuelve el filtro actual. Si el filtro es una caja sin tarjetas futuras, no se muestra el próximo repaso global.
- El componente inicializa la cola con `initialCards` una sola vez. Si se cambian los filtros y React Router reutiliza el componente, la cola podría quedar con los datos anteriores; hay que verificar el comportamiento real de navegación.
- La cola no aplica `metaDiaria`; la meta solo se guarda en el mazo. Esto se aborda en `daily-limit`.
- El resumen cuenta intentos, no tarjetas distintas. Si se agrega reencolado, la definición debe mantenerse explícita.
- No hay manejo específico de una respuesta `401` durante la sesión: el error se muestra como un aviso y el usuario permanece en la tarjeta.

## Referencias de código

- `frontend/src/features/study/StudySessionView.tsx`
- `frontend/src/features/study/Flashcard.tsx`
- `frontend/src/pages/StudySession.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/leitner.ts`
- `backend/src/modules/cards/card.repository.ts`
- `backend/src/modules/cards/card.routes.ts`
