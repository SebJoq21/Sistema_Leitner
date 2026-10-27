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

El sistema SHALL contar como dominada toda tarjeta con `cajaActual >= 4` y como pendiente toda tarjeta cuya `proximaRevision` sea menor o igual al día actual en la zona horaria del usuario.

#### Scenario: Conteo de dominadas

- GIVEN tarjetas en Caja 3, 4 y 5
- WHEN se calcula el resumen
- THEN `dominadas` cuenta las tarjetas de Caja 4 y Caja 5
- AND no cuenta la tarjeta de Caja 3

#### Scenario: Pendientes desde el inicio del día local

- GIVEN un usuario en `America/Lima` con una tarjeta agendada para hoy
- WHEN consulta el resumen a las 00:01 hora local
- THEN `pendientes` incluye esa tarjeta
- AND no espera a la hora exacta en que fue agendada

#### Scenario: Tarjeta futura

- GIVEN una tarjeta con `proximaRevision` de mañana en la zona del usuario
- WHEN se calcula el resumen
- THEN `pendientes` no la incluye

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

El sistema SHALL calcular las tarjetas repasadas hoy y la racha diaria a partir de `Review.fechaRevision`, agrupando cada repaso por el día de calendario en la zona horaria del usuario. La racha SHALL contar días consecutivos con al menos un repaso, incluyendo hoy si ya hubo repaso, y SHALL reiniciarse cuando falte un día.

#### Scenario: Repasos de hoy en la zona del usuario

- GIVEN un usuario en `America/Lima`
- WHEN consulta las estadísticas
- THEN `repasadosHoy` cuenta los repasos cuyo día local es hoy
- AND no cuenta repasos de ayer ni de mañana

#### Scenario: Repaso cerca de la medianoche

- GIVEN un repaso registrado en `2026-10-20T02:30:00Z`
- WHEN el usuario está en `America/Lima`
- THEN el repaso cuenta para el día `2026-10-19`
- AND si el usuario estuviera en `UTC`, contaría para `2026-10-20`

#### Scenario: Racha con repasos en días consecutivos

- GIVEN repasos en los días locales 18, 19 y 20 de octubre
- WHEN el usuario consulta sus estadísticas el día 20
- THEN la racha es 3
- AND el día 20 cuenta porque ya hubo al menos un repaso

#### Scenario: Racha cortada por un día sin repaso

- GIVEN repasos en los días 17 y 20, sin repasos el 18 ni el 19
- WHEN el usuario consulta sus estadísticas el día 20
- THEN la racha es 1
- AND no se cuentan los días anteriores al hueco

#### Scenario: Racha antes del primer repaso del día

- GIVEN repasos ayer y ningún repaso hoy
- WHEN el usuario consulta sus estadísticas hoy
- THEN la racha sigue contando hasta ayer
- AND no se reinicia por la ausencia de repaso de hoy

#### Scenario: Cambio de zona horaria

- GIVEN un usuario que cambia su zona de `UTC` a `America/Lima`
- WHEN consulta sus estadísticas
- THEN los repasos se agrupan con la zona nueva
- AND el historial no se reescribe

## Preguntas abiertas

- `repasadosHoy` cuenta intentos (`Review`), no tarjetas distintas. Si una tarjeta se repasa dos veces en el día, suma dos.
- La racha incluye cualquier `Review` del usuario, incluso los de tarjetas que luego fueron borradas, porque el cálculo se hace sobre las revisiones existentes en el momento de la consulta.
- El repositorio de estadísticas carga todas las fechas de revisión del usuario, sin límite ni agregación en la base de datos.
- `pendientes` y `dominadas` se obtienen del resumen de mazos, que también usa el día local y `cajaActual >= 4`. No hay una definición separada para el dashboard.
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
