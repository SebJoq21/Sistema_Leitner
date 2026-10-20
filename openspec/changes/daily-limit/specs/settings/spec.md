## ADDED Requirements

### Requirement: Límite diario total

El sistema SHALL almacenar un límite diario total opcional en `UserSettings.limiteDiarioTotal`, con valores enteros entre 1 y 1000 o `null`. El límite SHALL aplicarse a todas las tarjetas del usuario, sin importar el mazo ni el filtro de la sesión, y SHALL contar tarjetas distintas repasadas hoy en la zona del usuario. `null` SHALL significar sin límite.

#### Scenario: Valor por defecto

- GIVEN un usuario sin fila en `user_settings`
- WHEN consulta sus ajustes
- THEN `limiteDiarioTotal` es `null`
- AND no se aplica un límite total

#### Scenario: Configurar el límite

- GIVEN un usuario con `limiteDiarioTotal = null`
- WHEN envía `PATCH /api/v1/settings` con `{"limiteDiarioTotal": 50}`
- THEN el valor se guarda
- AND la respuesta devuelve `50`
- AND los intervalos y la zona horaria no cambian

#### Scenario: Quitar el límite

- GIVEN un usuario con `limiteDiarioTotal = 50`
- WHEN envía `PATCH /api/v1/settings` con `{"limiteDiarioTotal": null}`
- THEN el límite se elimina
- AND la respuesta devuelve `null`

#### Scenario: Límite inválido

- GIVEN una solicitud con `0`, `1001`, un negativo o un decimal
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND el valor anterior permanece intacto

#### Scenario: Configuración junto con intervalos y zona

- GIVEN un usuario que actualiza intervalos, zona y límite total en la misma solicitud
- WHEN se valida y guarda
- THEN los tres campos se actualizan
- AND la respuesta devuelve los tres valores

#### Scenario: Aislamiento por usuario

- GIVEN dos usuarios con límites totales distintos
- WHEN cada uno consulta o actualiza sus ajustes
- THEN solo se modifica el límite del usuario autenticado

#### Scenario: Reinicio diario

- GIVEN un usuario en `America/Lima` que alcanzó su límite total el 19 de octubre
- WHEN consulta sus ajustes a las 23:59
- THEN el límite sigue siendo el mismo
- AND a las 00:01 del 20 de octubre el cupo usado se reinicia
