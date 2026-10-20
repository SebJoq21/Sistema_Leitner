## MODIFIED Requirements

### Requirement: Resumen por mazo

El sistema SHALL devolver por cada mazo el total de tarjetas, la cantidad de dominadas, la cantidad de pendientes desde el inicio del día actual en la zona horaria del usuario, la fecha del último estudio y la próxima revisión más cercana. Las fechas de revisión SHALL devolverse como `YYYY-MM-DD`.

#### Scenario: Mazo con tarjetas en varias cajas

- GIVEN un mazo con tarjetas en Caja 1, Caja 4 y Caja 5
- WHEN se lista el mazo
- THEN `total` cuenta las tres tarjetas
- AND `dominadas` cuenta las tarjetas de Caja 4 y Caja 5
- AND `pendientes` cuenta las tarjetas con `proximaRevision` menor o igual a hoy

#### Scenario: Pendientes desde el inicio del día local

- GIVEN un usuario en `America/Lima` con una tarjeta agendada para hoy
- WHEN lista sus mazos a las 00:01 hora local
- THEN la tarjeta cuenta como pendiente
- AND no espera a la hora exacta en que fue agendada

#### Scenario: Mazo sin tarjetas

- GIVEN un mazo recién creado
- WHEN se lista
- THEN `total = 0`, `dominadas = 0` y `pendientes = 0`
- AND `ultimoEstudio` y `proximaRevision` son `null`

#### Scenario: Último estudio

- GIVEN un mazo con varios repasos
- WHEN se lista
- THEN `ultimoEstudio` es la fecha del repaso más reciente del mazo
- AND se muestra en la zona horaria del usuario

#### Scenario: Próxima revisión comparada por día

- GIVEN un mazo con una tarjeta agendada para mañana y otra para dentro de tres días
- WHEN se lista el mazo
- THEN `proximaRevision` es la fecha de mañana
- AND se devuelve como `YYYY-MM-DD`, sin hora
