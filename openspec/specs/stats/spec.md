# stats

## Propósito

Proporciona el resumen de progreso del usuario que alimenta el dashboard, la barra lateral y la pantalla de estadísticas: totales, dominadas, pendientes, progreso, racha y repasos del día.

## Requirements

### Requirement: Resumen de estadísticas

El sistema SHALL devolver para el usuario autenticado un resumen con `totalTarjetas`, `dominadas`, `pendientes`, `progresoGeneral`, `rachaDias` y `repasadosHoy`.

#### Scenario: Usuario con tarjetas y repasos

- GIVEN un usuario con mazos, tarjetas y repasos
- WHEN consulta `GET /api/v1/stats`
- THEN recibe los seis campos del resumen
- AND todos los valores se calculan solo con datos de sus mazos

#### Scenario: Usuario sin tarjetas

- GIVEN un usuario sin mazos ni tarjetas
- WHEN consulta el resumen
- THEN todos los contadores son 0
- AND `progresoGeneral` es 0
- AND `rachaDias` es 0

### Requirement: Dominadas y pendientes

El sistema SHALL contar como dominada toda tarjeta con `cajaActual >= 4` y como pendiente toda tarjeta con `proximaRevision` menor o igual al instante actual.

#### Scenario: Conteo de dominadas

- GIVEN tarjetas en Caja 3, 4 y 5
- WHEN se calcula el resumen
- THEN `dominadas` cuenta las tarjetas de Caja 4 y Caja 5
- AND no cuenta la tarjeta de Caja 3

#### Scenario: Conteo de pendientes

- GIVEN tarjetas con `proximaRevision` pasada y futura
- WHEN se calcula el resumen
- THEN `pendientes` cuenta solo las que ya cumplieron su fecha

#### Scenario: Múltiples mazos

- GIVEN tarjetas repartidas en varios mazos propios
- WHEN se calcula el resumen
- THEN los totales suman las tarjetas de todos los mazos
- AND no incluyen tarjetas de otros usuarios

### Requirement: Progreso general

El sistema SHALL calcular `progresoGeneral` como el porcentaje entero de tarjetas dominadas sobre el total de tarjetas, redondeado al entero más cercano. Si no hay tarjetas, SHALL devolver 0.

#### Scenario: Progreso con tarjetas

- GIVEN 3 tarjetas dominadas de un total de 8
- WHEN se calcula el progreso
- THEN `progresoGeneral` es 38

#### Scenario: Progreso sin tarjetas

- GIVEN un usuario sin tarjetas
- WHEN se calcula el progreso
- THEN `progresoGeneral` es 0
- AND no se produce una división por cero

### Requirement: Hoy y racha

El sistema SHALL calcular el día de calendario con la hora local del servidor. `repasadosHoy` SHALL contar los registros `Review` cuya `fechaRevision` cae en el día actual. La racha SHALL contar días consecutivos con al menos un `Review`; un día completo sin repasos corta la racha, pero si todavía no hay repasos hoy la racha SHALL seguir viva desde ayer.

#### Scenario: Racha de tres días

- GIVEN repasos en lunes, martes y miércoles
- WHEN se calcula la racha el miércoles
- THEN `rachaDias` es 3

#### Scenario: Día intermedio sin repasos

- GIVEN repasos el lunes y el miércoles, sin repasos el martes
- WHEN se calcula la racha el miércoles
- THEN `rachaDias` es 1
- AND la racha se corta en el martes faltante

#### Scenario: Aún no hay repasos hoy

- GIVEN repasos el lunes y el martes, y ningún repaso el miércoles
- WHEN se calcula la racha el miércoles
- THEN la racha sigue viva desde el martes
- AND `rachaDias` es 2

#### Scenario: Repasos de hoy

- GIVEN dos repasos con `fechaRevision` de hoy y uno de ayer
- WHEN se calcula el resumen
- THEN `repasadosHoy` es 2
- AND cuenta registros de repaso, no tarjetas distintas

## Preguntas abiertas

- El día se calcula con `getFullYear`, `getMonth` y `getDate` del servidor. En producción, con el servidor en UTC, un usuario en Lima puede ver “repasados hoy” y la racha desfasados alrededor de la medianoche. Esto se aborda en `fix-timezone-scheduling`.
- `repasadosHoy` cuenta intentos (`Review`), no tarjetas distintas. Si una tarjeta se repasa dos veces en el día, suma dos.
- La racha incluye cualquier `Review` del usuario, incluso los de tarjetas que luego fueron borradas, porque el cálculo se hace sobre las revisiones existentes en el momento de la consulta.
- El repositorio de estadísticas carga todas las fechas de revisión del usuario, sin límite ni agregación en la base de datos.
- `pendientes` y `dominadas` se obtienen del resumen de mazos, que también usa el instante actual y `cajaActual >= 4`. No hay una definición separada para el dashboard.
- `progresoGeneral` se redondea con `Math.round`; un 37.5% se muestra como 38%.
- El resumen no expone una fecha de “próximo repaso” global; esa fecha se calcula en la pantalla de estudio y en la vista de cajas.

## Referencias de código

- `backend/src/modules/stats/stats.service.ts`
- `backend/src/modules/stats/stats.repository.ts`
- `backend/src/modules/stats/stats.controller.ts`
- `backend/src/modules/stats/stats.routes.ts`
- `backend/src/modules/decks/deck.repository.ts`
- `frontend/src/features/stats/DashboardStats.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/Sidebar.tsx`
