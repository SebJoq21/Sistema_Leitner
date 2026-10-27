# Diseño: Programar el repaso por día de calendario en la zona del usuario

## Decisiones

### 1. `proximaRevision` se guarda como `DATE`

`Card.proximaRevision` pasa de `DateTime` a `@db.Date`. Una fecha sin hora representa exactamente lo que el dominio necesita: el día en que la tarjeta vuelve a estar disponible. No hay que decidir “medianoche de qué zona” en cada lectura y no se rompe con los cambios de horario de verano.

La consecuencia es que la API deja de devolver un instante para ese campo y pasa a devolver una fecha `YYYY-MM-DD`. El frontend debe tratarla como fecha local, no como un instante UTC.

### 2. La zona horaria se guarda en `UserSettings`

Se agrega `timezone String?` a `user_settings`:

- Es una zona IANA (`America/Lima`, `Europe/Madrid`, `UTC`).
- Es nullable para distinguir “el usuario todavía no la eligió” de “eligió UTC”.
- Si no hay valor, se usa la zona enviada por el navegador en el header `X-Timezone`.
- Si tampoco hay header, se usa `UTC`.

El frontend agrega `X-Timezone` a todas las peticiones con `Intl.DateTimeFormat().resolvedOptions().timeZone`. El backend valida el header y, cuando el usuario todavía no tiene zona guardada, la persiste. La zona guardada gana sobre el header para que el usuario pueda fijarla explícitamente.

Se agrega también la posibilidad de actualizar `timezone` desde `PATCH /api/v1/settings`. El DTO acepta `intervalos`, `timezone` o ambos, y exige al menos uno.

### 3. “Hoy” se calcula con la zona del usuario

Se agrega un helper puro, por ejemplo `todayInTimeZone(now: Date, timeZone: string): string`, que devuelve `YYYY-MM-DD` usando `Intl.DateTimeFormat` con `formatToParts`. No se usan las funciones locales del servidor.

Las consultas comparan contra esa fecha:

- `findDueByUser`: `proximaRevision <= hoy`.
- `boxesByUser`: pendientes con `proximaRevision <= hoy`.
- `findAllByUser` con `pendientes = true`: `proximaRevision <= hoy`.
- `deckRepository.findAllByUser`: pendientes con `proximaRevision <= hoy`.
- `stats`: `repasadosHoy` y racha con `dayKeyInTimeZone(fechaRevision, timezone)`.

### 4. La suma de días es aritmética de calendario

`addDays` deja de usar `Date.setDate` sobre la hora local del servidor. Se implementa una suma sobre la fecha:

1. Convertir `YYYY-MM-DD` a un `Date` en UTC a las 00:00.
2. Sumar `days * 86_400_000`.
3. Devolver la fecha resultante como `Date` en UTC a las 00:00, que es lo que Prisma espera para `@db.Date`.

Para mostrar o comparar, se usa el prefijo `YYYY-MM-DD`. Esta aritmética no se ve afectada por DST porque no hay hora local involucrada.

### 5. `Review.fechaRevision` no cambia de tipo

Los repasos siguen guardando un instante (`TIMESTAMP(3)`). Para estadísticas se agrupan por día usando la zona del usuario:

- `dayKeyInTimeZone(fecha, timezone)` devuelve `YYYY-MM-DD`.
- La racha y `repasadosHoy` comparan claves de día.
- No hace falta una consulta de rango; el repositorio ya trae las fechas y el volumen actual lo permite. Si el volumen crece, se puede agregar una consulta por rango con `[inicioDiaUtc, finDiaUtc)`.

### 6. Serialización de fechas en la API

Los endpoints que devuelven tarjetas o mazos deben serializar `proximaRevision` como `YYYY-MM-DD`, no como ISO completo. Esto evita que el navegador en Lima interprete `2026-10-20T00:00:00.000Z` como el 19 de octubre a las 19:00.

El frontend actualiza:

- `daysUntil` para construir la fecha local desde `YYYY-MM-DD`.
- `isDue` para comparar contra el día local actual.
- `formatNextReview` y `formatRelative` para usar la misma base.
- `studyLoader` para elegir el próximo repaso comparando fechas, no `Date.now()`.
- Los tipos `DueCard` y `Deck` para aceptar la fecha sin hora.

Se corrige de paso el signo de `formatRelative`: una fecha pasada debe producir “Hace N días” y una futura “En N días” o “Ayer” nunca debe aparecer para una fecha futura.

### 7. Migración

Migración propuesta:

```sql
ALTER TABLE "cards"
  ALTER COLUMN "proximaRevision" TYPE DATE
  USING ("proximaRevision" AT TIME ZONE 'UTC')::date;

ALTER TABLE "cards"
  ALTER COLUMN "proximaRevision" SET DEFAULT CURRENT_DATE;

ALTER TABLE "user_settings"
  ADD COLUMN "timezone" TEXT;
```

En Prisma:

- `proximaRevision DateTime @db.Date @default(dbgenerated("CURRENT_DATE"))`.
- `timezone String?` en `UserSettings`.

La conversión interpreta los timestamps existentes como UTC. Es determinista, pero un usuario en Lima con una tarjeta agendada a las 02:00 UTC del día 21 puede quedar en el día 21 aunque en su reloj fuera el día 20. No hay forma de reconstruir la zona de cada tarjeta histórica porque no se guardó. La migración debe documentar este corrimiento y ejecutarse en una ventana controlada.

### 8. Resolución de zona en el backend

Flujo propuesto:

1. `authMiddleware` valida el JWT.
2. Un middleware posterior lee `X-Timezone`, lo valida con `Intl.DateTimeFormat` y lo deja en `req.timezone` si es válido.
3. El servicio de settings resuelve la zona: `UserSettings.timezone ?? req.timezone ?? 'UTC'`.
4. Si el usuario no tiene zona guardada y el header es válido, se persiste de forma idempotente.
5. Si el header es inválido, se ignora y se usa `UTC`; un `PATCH` explícito con zona inválida responde `400`.

## Alternativas descartadas

- **Mantener `DateTime` y normalizar a medianoche UTC:** obliga a reconstruir la medianoche local en cada lectura y a lidiar con DST. Además, el frontend sigue teniendo que distinguir entre “fecha” e “instante”.
- **Guardar la hora local como texto:** pierde las validaciones y comparaciones de fecha de PostgreSQL.
- **Usar el huso del servidor:** es el comportamiento actual y es la causa del problema.
- **Guardar el offset del usuario en minutos:** el offset cambia con el horario de verano y no identifica la zona.
- **Enviar la zona en cada query en lugar de persistirla:** funciona para calcular, pero no deja una preferencia estable ni permite jobs futuros.
- **Usar `Temporal`:** sería la opción ideal, pero no está disponible de forma estable en el runtime objetivo.

## Riesgos y migración

- **Corrimiento de fechas históricas:** la migración UTC puede adelantar o atrasar un día tarjetas creadas cerca de la medianoche local. Mitigación: documentar, avisar en la release y permitir que el usuario corrija una tarjeta manualmente si es necesario.
- **Clientes viejos sin `X-Timezone`:** siguen funcionando con UTC. No se rompe la API, pero mantienen el problema hasta actualizar el frontend.
- **Cambio de contrato de `proximaRevision`:** cualquier consumidor que espere un ISO completo debe adaptarse. Mitigación: actualizar tipos, loaders y tests en el mismo change.
- **Fechas del navegador:** `Intl` puede devolver zonas con alias; se valida con el mismo runtime. Si el navegador no soporta una zona, se ignora.
- **CORS y header personalizado:** `cors()` debe permitir `X-Timezone`. Verificar preflight en desarrollo y producción.
- **Estadísticas históricas:** los repasos cerca de la medianoche pueden cambiar de día al aplicar la zona. Es esperado; no se reescribe el historial.
- **Índices:** `cards_proximaRevision_idx` sigue siendo útil para comparar `DATE`.
- **Usuarios que viajan:** la zona guardada no cambia automáticamente. Se puede ofrecer un selector en ajustes; el header solo se usa si no hay zona guardada.

## Estrategia de pruebas

- **Unitarias del motor:** `todayInTimeZone`, `addCalendarDays`, `calcularProximaRevision` y `tarjetaInicial` con fechas fijas y zonas `UTC`, `America/Lima` y `Europe/Madrid`.
- **Medianoche:** un instante `2026-10-20T02:30:00Z` debe ser día 19 en Lima y día 20 en UTC/Madrid; verificar la cola y la fecha programada.
- **DST:** sumar un día a `2026-03-28` en `Europe/Madrid` devuelve `2026-03-29`; sumar un día a `2026-10-24` devuelve `2026-10-25`. La fecha no debe saltar por el cambio de hora.
- **Integración de cola:** crear tarjetas con `proximaRevision` de ayer, hoy y mañana; con zona Lima y `now` fijo, la cola devuelve solo las de ayer y hoy.
- **Estadísticas:** repasos en `2026-10-20T02:30:00Z`; con zona Lima cuentan para el día 19, con UTC para el día 20.
- **Racha:** días consecutivos y hueco intermedio con claves de día en zona del usuario.
- **Migración:** aplicar sobre una base con timestamps conocidos y verificar los valores `DATE`.
- **Frontend:** `daysUntil`, `isDue`, `formatNextReview` y `formatRelative` con cadenas `YYYY-MM-DD`, fechas pasadas y futuras.
- **Regresión:** un usuario en UTC debe obtener exactamente los mismos días que antes, salvo que la tarjeta estuviera agendada con hora distinta de la medianoche.
- No hay framework de tests en el repositorio; al implementar este change hay que agregar Vitest al backend y, si se cubre el frontend, Vitest + Testing Library.

## Preguntas abiertas

- ¿La migración debe usar UTC o la zona local del servidor de producción? UTC es determinista; la zona del servidor reproduce mejor el comportamiento actual, pero es menos predecible.
- ¿Qué zona se asigna a los usuarios existentes antes de que el navegador envíe `X-Timezone`: `null` con fallback a UTC o `UTC` explícito?
- ¿La zona guardada debe actualizarse automáticamente si el header del navegador cambia, o solo mediante una acción explícita del usuario?
- ¿Se quiere un selector de zona horaria en la pantalla de ajustes o basta con la zona del navegador?
- ¿La API debe devolver `YYYY-MM-DD` o un ISO completo y dejar que el frontend corte la fecha? La propuesta es `YYYY-MM-DD`.
- ¿Cómo se comunica al usuario el posible corrimiento de fechas históricas durante la migración?
- ¿Los reportes históricos deben recalcularse con la zona actual del usuario o conservar la zona que tenían al momento del repaso? Hoy no se guarda esa zona.
