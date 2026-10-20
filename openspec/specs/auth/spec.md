# auth

## Propósito

Define cómo el frontend inicia sesión con Supabase Auth, cómo el backend valida el JWT y cómo se aíslan los datos por usuario.

## Requirements

### Requirement: Inicio de sesión con Supabase Auth

El frontend SHALL iniciar sesión y registrar cuentas mediante Supabase Auth. Al obtener una sesión, SHALL guardar el token de acceso en `localStorage` bajo la clave `leitner-jwt`.

#### Scenario: Inicio de sesión exitoso

- GIVEN un usuario con credenciales válidas
- WHEN envía el formulario de login
- THEN Supabase Auth devuelve una sesión
- AND el frontend guarda el `access_token` en `localStorage`
- AND redirige a la ruta solicitada o al dashboard

#### Scenario: Credenciales inválidas

- GIVEN un correo o una contraseña incorrectos
- WHEN el usuario intenta iniciar sesión
- THEN se muestra un aviso de error
- AND no se guarda una sesión

#### Scenario: Registro de cuenta

- GIVEN un correo no registrado y una contraseña de al menos 6 caracteres
- WHEN el usuario elige “Registrarme”
- THEN el frontend llama a `supabase.auth.signUp`
- AND muestra un aviso indicando que revise el correo si la confirmación está habilitada

### Requirement: Token Bearer en las peticiones

El cliente API SHALL enviar el token de Supabase en el header `Authorization: Bearer <token>` en todas las peticiones al backend.

#### Scenario: Petición autenticada

- GIVEN un usuario con sesión activa
- WHEN el frontend llama a cualquier endpoint de datos
- THEN la petición incluye `Authorization: Bearer <access_token>`
- AND el header `Content-Type` es `application/json`

#### Scenario: Petición sin sesión

- GIVEN un usuario sin token en `localStorage`
- WHEN intenta abrir una ruta protegida
- THEN el loader redirige a `/login`
- AND no se llama al backend sin autorización

#### Scenario: Token expirado o inválido

- GIVEN un token vencido o malformado
- WHEN el backend valida la petición
- THEN responde `401` con `Token inválido o expirado`
- AND no ejecuta la operación solicitada

### Requirement: Validación del token en el backend

El middleware de autenticación SHALL exigir el header `Authorization: Bearer <token>`, SHALL validar el token con Supabase y SHALL inyectar el `userId` y el correo en la petición.

#### Scenario: Token ausente

- GIVEN una petición sin header `Authorization`
- WHEN llega a una ruta protegida
- THEN el backend responde `401` con `Falta token Bearer`

#### Scenario: Esquema de autorización incorrecto

- GIVEN un header `Authorization: Basic ...` o un valor sin `Bearer `
- WHEN llega a una ruta protegida
- THEN el backend responde `401`

#### Scenario: Token válido

- GIVEN un JWT válido emitido por Supabase
- WHEN el middleware lo valida
- THEN asigna `req.user.id` al `sub` del usuario
- AND asigna `req.user.email` cuando está disponible
- AND continúa con el controlador

#### Scenario: Token de un usuario eliminado

- GIVEN un JWT que Supabase ya no reconoce como usuario válido
- WHEN el middleware consulta el usuario
- THEN responde `401`
- AND no se ejecuta la operación

### Requirement: Sincronización del usuario

El backend SHALL sincronizar el usuario de Supabase en la tabla `users` mediante un upsert idempotente. La sincronización SHALL ejecutarse en la creación de mazos, en la creación de tarjetas y en la obtención o actualización de ajustes.

#### Scenario: Primer mazo de un usuario nuevo

- GIVEN un JWT válido de un usuario que aún no existe en `users`
- WHEN el usuario crea su primer mazo
- THEN el backend inserta el usuario con su `id` y `email`
- AND luego crea el mazo sin violar la clave foránea

#### Scenario: Sincronización repetida

- GIVEN un usuario ya existente en `users`
- WHEN vuelve a crear un mazo o consultar sus ajustes
- THEN el upsert actualiza el correo si cambió
- AND no crea un usuario duplicado

#### Scenario: Acceso de solo lectura sin fila previa

- GIVEN un JWT válido de un usuario que aún no existe en `users`
- WHEN consulta el listado de mazos, la cola de vencidas o las estadísticas
- THEN el backend no ejecuta `ensureUser`
- AND responde con listas o contadores vacíos según corresponda

### Requirement: Rutas protegidas en el frontend

El frontend SHALL proteger las rutas de dashboard, tarjetas, cajas y estudio. Sin sesión SHALL redirigir a `/login`; con sesión en `/login` SHALL redirigir a la ruta de origen o al dashboard.

#### Scenario: Acceso sin sesión

- GIVEN un usuario sin sesión
- WHEN navega a `/`, `/cards`, `/boxes` o `/study`
- THEN `RequireAuth` redirige a `/login`
- AND conserva la ruta de origen para volver después del login

#### Scenario: Acceso con sesión a login

- GIVEN un usuario con sesión activa
- WHEN navega a `/login`
- THEN el frontend lo redirige al dashboard o a la ruta de origen

#### Scenario: Cierre de sesión

- GIVEN un usuario con sesión activa
- WHEN pulsa “Salir”
- THEN Supabase cierra la sesión
- AND se elimina `leitner-jwt` de `localStorage`
- AND se navega a `/login`

### Requirement: Aislamiento por userId

Todas las consultas de datos SHALL filtrar por el `userId` autenticado, directa o indirectamente mediante la relación `deck.userId`.

#### Scenario: Consulta de mazos

- GIVEN dos usuarios con mazos propios
- WHEN uno consulta sus mazos
- THEN solo se incluyen mazos cuyo `userId` coincide con su token

#### Scenario: Consulta de tarjetas y repasos

- GIVEN tarjetas y repasos de dos usuarios
- WHEN uno consulta tarjetas, cajas, estadísticas o repasos
- THEN solo se incluyen registros alcanzables desde sus propios mazos

#### Scenario: Identificador enviado por el cliente

- GIVEN una petición que intenta indicar otro `userId` en el cuerpo o la query
- WHEN el controlador resuelve el usuario
- THEN usa el `userId` del token
- AND ignora el identificador del cliente

## Preguntas abiertas

- `ensureUser` no se ejecuta en los `GET` de mazos, tarjetas, cajas o estadísticas. La afirmación “el usuario se sincroniza en su primer acceso” solo es cierta para los endpoints que llaman al helper.
- El frontend guarda el token en `localStorage`, no en una cookie `HttpOnly`. Cualquier script en la página puede leerlo.
- El backend valida el token llamando a `supabase.auth.getUser(token)` en cada petición; no verifica la firma localmente ni cachea el resultado.
- No hay redirección global al login cuando una petición devuelve `401`. Los loaders redirigen si no hay token, pero un token vencido durante una acción muestra el error en la pantalla actual.
- El registro puede requerir confirmación por correo según la configuración de Supabase; en ese caso el usuario no obtiene sesión inmediata.
- No hay roles ni permisos: cualquier usuario autenticado puede operar sobre sus propios datos.
- El middleware no valida un `aud` o `iss` adicional más allá de lo que devuelve Supabase.
- La ruta `/login` no usa el layout con sidebar; el resto de rutas sí.

## Referencias de código

- `backend/src/modules/auth/auth.middleware.ts`
- `backend/src/modules/auth/user-sync.ts`
- `backend/src/app.ts`
- `backend/src/middlewares/validate.ts`
- `backend/src/config/supabase.ts`
- `frontend/src/features/auth/AuthContext.tsx`
- `frontend/src/features/auth/RequireAuth.tsx`
- `frontend/src/features/auth/LoginForm.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/lib/supabase.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/router.tsx`
