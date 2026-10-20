## MODIFIED Requirements

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
