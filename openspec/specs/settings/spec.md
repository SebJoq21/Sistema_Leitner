# settings

## Propósito

Gestiona las preferencias del usuario que afectan el motor Leitner: los cinco intervalos de repaso por caja y la zona horaria IANA.

## Requirements

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

### Requirement: Obtención y creación de ajustes

El sistema SHALL devolver los ajustes del usuario autenticado. Si el usuario no tiene fila en `user_settings`, SHALL crearla con los intervalos por defecto `[1, 3, 7, 15, 30]`.

#### Scenario: Usuario sin ajustes

- GIVEN un usuario autenticado sin fila en `user_settings`
- WHEN consulta `GET /api/v1/settings`
- THEN el sistema crea la fila con `[1, 3, 7, 15, 30]`
- AND devuelve esos intervalos

#### Scenario: Usuario con ajustes existentes

- GIVEN un usuario con intervalos guardados `[2, 4, 8, 16, 32]`
- WHEN consulta sus ajustes
- THEN recibe exactamente esos cinco valores
- AND no se crea una segunda fila

#### Scenario: Usuario que aún no existe en `users`

- GIVEN un JWT válido de Supabase cuyo usuario todavía no está en la tabla `users`
- WHEN consulta o actualiza sus ajustes
- THEN el backend sincroniza el usuario antes de crear los ajustes
- AND la operación se completa sin violar la clave foránea

### Requirement: Actualización de intervalos

El sistema SHALL actualizar los intervalos del usuario solo cuando reciba exactamente cinco enteros entre 1 y 365. Si la validación falla, SHALL responder `400` y no modificar los ajustes.

#### Scenario: Actualización válida

- GIVEN un usuario con los intervalos por defecto
- WHEN envía `PATCH /api/v1/settings` con `[2, 4, 8, 16, 32]`
- THEN los intervalos se guardan
- AND la respuesta devuelve los nuevos valores

#### Scenario: Arreglo de longitud incorrecta

- GIVEN una solicitud con cuatro o seis intervalos
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND los ajustes anteriores permanecen intactos

#### Scenario: Intervalo fuera de rango

- GIVEN una solicitud con `0`, `366` o un número decimal
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se actualiza la fila

### Requirement: Normalización de intervalos almacenados

El sistema SHALL normalizar los intervalos cada vez que los lee. Si la fila almacenada no contiene exactamente cinco enteros entre 1 y 365, SHALL devolver los valores por defecto sin modificar automáticamente la fila.

#### Scenario: Fila con datos corruptos

- GIVEN una fila `user_settings` con `[1, 3, 7]`
- WHEN el sistema lee los intervalos
- THEN devuelve `[1, 3, 7, 15, 30]`
- AND la fila de la base de datos no se reescribe en esa lectura

#### Scenario: Fila con valores no enteros

- GIVEN una fila con un intervalo `1.5`
- WHEN el sistema lee los intervalos
- THEN usa los valores por defecto
- AND el motor no recibe el valor inválido

### Requirement: Los cambios de intervalos no reprograman tarjetas

El sistema SHALL aplicar los intervalos nuevos solo a los cálculos futuros. Las tarjetas ya agendadas SHALL conservar su `proximaRevision` y su caja hasta el próximo repaso.

#### Scenario: Cambio de intervalo después de agendar

- GIVEN una tarjeta en Caja 2 con `proximaRevision` dentro de 3 días
- WHEN el usuario cambia el intervalo de Caja 2 a 10 días
- THEN la tarjeta conserva su `proximaRevision` actual
- AND el nuevo intervalo se usa recién en el próximo repaso que la mueva a Caja 2

#### Scenario: Cambio de intervalo antes de crear tarjetas

- GIVEN un usuario que cambia los intervalos y luego crea y repasa tarjetas
- WHEN el motor calcula las nuevas fechas
- THEN usa los intervalos actualizados

### Requirement: Lectura de intervalos sin creación

El sistema SHALL poder leer los intervalos en el camino caliente de repasos y vista de cajas sin crear una fila de ajustes. Si no existe fila, SHALL devolver los valores por defecto.

#### Scenario: Repaso de un usuario sin fila de ajustes

- GIVEN un usuario sin fila en `user_settings`
- WHEN se procesa un repaso o se consulta la vista de cajas
- THEN el sistema usa `[1, 3, 7, 15, 30]`
- AND no se crea una fila como efecto secundario

#### Scenario: Usuario con fila existente

- GIVEN un usuario con intervalos guardados
- WHEN se procesa un repaso
- THEN el sistema usa esos intervalos
- AND no los reemplaza por los valores por defecto

### Requirement: Aislamiento por usuario

El sistema SHALL asociar los ajustes a un único `userId` y SHALL impedir que un usuario lea o modifique los ajustes de otro.

#### Scenario: Ajustes propios

- GIVEN dos usuarios con ajustes distintos
- WHEN cada uno consulta sus ajustes
- THEN cada uno recibe solo los suyos

#### Scenario: Identificador ajeno

- GIVEN una solicitud que intenta operar con el identificador de otro usuario
- WHEN el backend resuelve los ajustes
- THEN usa el `userId` del token
- AND no acepta un `userId` enviado por el cliente

## Preguntas abiertas

- El DTO no exige que los intervalos sean crecientes ni distintos; por ejemplo, `[5, 5, 5, 5, 5]` es válido.
- La creación de la fila ocurre en `getOrCreate`, usado por `GET` y `PATCH /settings`, pero no en `intervalsFor`, usado por repasos y vista de cajas. Un usuario puede repasar sin tener fila de ajustes y usar los valores por defecto.
- La actualización no valida que los intervalos sean coherentes con las tarjetas ya agendadas; solo guarda los valores.
- No hay endpoint para restablecer los intervalos por defecto; el usuario debe enviar manualmente `[1, 3, 7, 15, 30]`.
- La tabla `user_settings` no tiene `createdAt`; solo `updatedAt`.

## Referencias de código

- `backend/src/lib/dates.ts`
- `backend/src/middlewares/timezone.ts`
- `backend/src/modules/settings/settings.dto.ts`
- `backend/src/modules/settings/settings.repository.ts`
- `backend/src/modules/settings/settings.service.ts`
- `backend/src/modules/settings/settings.controller.ts`
- `backend/src/modules/settings/settings.routes.ts`
- `backend/src/modules/auth/user-sync.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/pages/Boxes.tsx`
- `frontend/src/lib/api.ts`
