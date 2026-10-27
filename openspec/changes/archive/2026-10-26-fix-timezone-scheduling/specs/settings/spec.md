## ADDED Requirements

### Requirement: Zona horaria del usuario

El sistema SHALL almacenar una zona horaria IANA por usuario en `UserSettings.timezone`, SHALL devolverla en la respuesta de ajustes y SHALL usarla como fuente principal para calcular el día actual. El campo SHALL ser nullable para representar que el usuario todavía no eligió una zona.

#### Scenario: Usuario nuevo en Lima

- GIVEN un usuario autenticado sin fila en `user_settings`
- WHEN el navegador envía `X-Timezone: America/Lima` y consulta sus ajustes
- THEN la fila se crea con los intervalos por defecto
- AND `timezone` queda en `America/Lima`
- AND la respuesta incluye `timezone: "America/Lima"`

#### Scenario: Usuario con zona guardada

- GIVEN un usuario con `timezone = "Europe/Madrid"`
- WHEN el navegador envía `X-Timezone: America/Lima`
- THEN el sistema usa `Europe/Madrid`
- AND no reemplaza la zona guardada automáticamente

#### Scenario: Usuario sin zona ni header

- GIVEN un usuario sin `timezone`
- WHEN consulta sus ajustes sin `X-Timezone`
- THEN la respuesta devuelve `timezone: null`
- AND los cálculos usan `UTC`

#### Scenario: Header inválido

- GIVEN un usuario sin `timezone`
- WHEN el navegador envía `X-Timezone: Lima`
- THEN el sistema ignora el header
- AND no persiste una zona inválida

### Requirement: Actualización de la zona horaria

El sistema SHALL permitir actualizar `timezone` mediante `PATCH /api/v1/settings` junto con los intervalos o de forma independiente. El DTO SHALL exigir al menos uno de los dos campos y SHALL responder `400` si la zona no es un identificador IANA válido.

#### Scenario: Actualización solo de zona

- GIVEN un usuario con `timezone = null`
- WHEN envía `PATCH /api/v1/settings` con `{"timezone": "America/Bogota"}`
- THEN la zona se guarda
- AND los intervalos no cambian

#### Scenario: Actualización de intervalos y zona

- GIVEN un usuario con zona `UTC`
- WHEN envía `PATCH /api/v1/settings` con intervalos nuevos y `{"timezone": "America/Lima"}`
- THEN se actualizan ambos campos
- AND la respuesta devuelve ambos valores

#### Scenario: Zona inválida en el PATCH

- GIVEN una solicitud con `{"timezone": "GMT-5"}`
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND la fila anterior permanece intacta

#### Scenario: PATCH vacío

- GIVEN una solicitud sin `intervalos` ni `timezone`
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se modifica la fila

#### Scenario: Aislamiento por usuario

- GIVEN dos usuarios con zonas distintas
- WHEN uno actualiza su zona
- THEN solo cambia la fila de ese usuario
- AND el otro conserva la suya
