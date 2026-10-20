# Sistema Leitner

## Descripción

Aplicación web de repetición espaciada basada en el Sistema Leitner de cinco cajas. El usuario crea mazos y tarjetas, estudia las tarjetas vencidas y el sistema mueve cada tarjeta de caja según acierte o falle, programando la siguiente revisión con el intervalo de la nueva caja.

El producto está pensado para estudio individual: cada usuario ve exclusivamente sus mazos, tarjetas, repasos y ajustes.

## Stack

| Capa | Tecnología | Despliegue |
| --- | --- | --- |
| Frontend | React 19 + TypeScript + Vite 8 + Tailwind CSS 4, React Router 7, React Hook Form + Zod | Vercel, según `specs/task.md`. No hay configuración de despliegue en el repositorio. |
| Backend | Node.js + TypeScript (ESM) + Express 4, Zod | Render, según `specs/task.md`. No hay configuración de despliegue en el repositorio. |
| Base de datos | PostgreSQL en Supabase, Prisma 7 | Supabase |
| Autenticación | Supabase Auth con JWT | Supabase |
| Pruebas | No hay framework ni pruebas automatizadas configuradas actualmente | — |

En desarrollo local el frontend usa `VITE_API_URL` (por defecto `http://localhost:3001`) y el backend escucha en `PORT` (por defecto `3001`). El backend expone las rutas versionadas `/api/v1/...` y mantiene alias sin versión (`/api/...`) por compatibilidad.

## Arquitectura

### Backend

Organización por dominio en `backend/src/modules/*`:

- `auth/`: validación del JWT de Supabase y sincronización del usuario en `users`.
- `decks/`: CRUD y estadísticas agregadas de mazos.
- `cards/`: CRUD de tarjetas, cola de vencidas, vista de cajas y motor Leitner.
- `settings/`: intervalos configurables y preferencias del usuario.
- `stats/`: resumen global, progreso, racha y repasos del día.
- `reviews/`: carpeta reservada; hoy no contiene implementación.

Cada dominio sigue el flujo **controlador → servicio → repositorio**:

- El controlador recibe HTTP, obtiene el `userId` autenticado y delega.
- El servicio contiene la lógica de aplicación y validaciones de propiedad.
- El repositorio concentra las consultas Prisma y el filtrado por `userId`.

El motor Leitner es lógica pura en `backend/src/modules/cards/leitner.service.ts`: no importa Express ni Prisma.

### Frontend

Organización por capas y funcionalidades:

- `components/ui/`: componentes reutilizables sin lógica de dominio.
- `components/`: layout, sidebar, tema y menú de usuario.
- `features/*/`: lógica y componentes de cada dominio (`auth`, `decks`, `study`, `stats`).
- `pages/*/`: vistas conectadas a React Router y a los loaders.
- `lib/`: cliente API, Supabase, utilidades de Leitner, CSV, tema y funciones auxiliares.
- `schemas/`: espejo de los DTO del backend para validar formularios con Zod.

Los loaders del router leen el token de `localStorage`, llaman al backend y redirigen a `/login` cuando no hay sesión. `RequireAuth` protege además las rutas a nivel de componente.

## Convenciones

- **Idioma del dominio:** nombres de campos y funciones en español (`cajaActual`, `proximaRevision`, `metaDiaria`, `intervalos`, `rachaDias`). Los nombres técnicos de Prisma y de las rutas permanecen en inglés cuando ya existen (`Card`, `Deck`, `Review`, `frontText`, `backText`).
- **Validación:** los DTO se declaran con Zod en archivos `*.dto.ts`; `validateBody` y `validateQuery` responden `400` con `{ error, details }` cuando la validación falla.
- **Aislamiento:** toda consulta de datos de usuario filtra por el `userId` autenticado, directa o indirectamente mediante `deck.userId`. Los mazos y tarjetas ajenos no se exponen.
- **Errores:** `401` para token ausente o inválido; `400` para datos inválidos; `204` en borrados exitosos; `500` para errores no controlados. No existe un mapeo global de errores de “no encontrado” de Prisma a `404`.
- **Fechas:** el backend recibe y devuelve fechas ISO-8601. `proximaRevision` y `fechaRevision` son `DateTime` en el estado actual; el frontend las interpreta con la zona horaria del navegador.
- **Formularios:** React Hook Form + Zod en el frontend; los límites de longitud y los valores permitidos se validan también en el backend.
- **UI:** Tailwind CSS 4 con tokens definidos en `frontend/src/index.css`; modo oscuro mediante la clase `.dark` en `<html>`.

## Glosario

- **Mazo (Deck):** conjunto de tarjetas de un tema, con nombre, descripción, color, ícono, etiquetas y meta diaria opcional.
- **Tarjeta (Card):** unidad de estudio con frente (pregunta), reverso (respuesta), pista, notas, etiquetas y estado Leitner.
- **Caja:** nivel de 1 a 5 que define cada cuánto se repasa una tarjeta. Los intervalos por defecto son 1, 3, 7, 15 y 30 días.
- **Repaso (Review):** registro de una respuesta, con `resultado` booleano (acierto/fallo) y `fechaRevision`.
- **Vencimiento / pendiente:** tarjeta cuya `proximaRevision` ya llegó. En el estado actual se compara contra el instante presente del servidor.
- **Dominada:** para las estadísticas de mazos y del dashboard, una tarjeta está dominada cuando `cajaActual >= 4`. La interfaz etiqueta la Caja 5 como “Dominada”, pero el conteo incluye también la Caja 4. Esta diferencia está documentada en las preguntas abiertas de `decks` y `stats`.
- **Intervalo:** número de días que espera una caja antes de volver a mostrar la tarjeta. Es configurable por usuario.
- **Meta diaria (`metaDiaria`):** campo opcional del mazo. En el estado actual solo se almacena y se muestra; no limita la cola de estudio.
- **Sesión de estudio:** conjunto de tarjetas vencidas que el usuario repasa en una pantalla, con filtros opcionales por mazo y caja.
- **Zona horaria:** zona IANA del usuario. En el estado actual no existe como preferencia persistida; los cálculos usan la zona del servidor.

## Cómo trabajamos

Este proyecto usa un flujo de desarrollo guiado por especificaciones con OpenSpec:

1. Los archivos de `openspec/specs/` son la fuente de verdad del comportamiento actual.
2. Cada mejora o corrección entra como una carpeta en `openspec/changes/` con `proposal.md`, `design.md`, `tasks.md` y deltas de las capacidades afectadas.
3. Los deltas usan `ADDED`, `MODIFIED` y `REMOVED`; un `MODIFIED` repite el requirement completo con su nombre exacto.
4. Al terminar e implementar un change, sus deltas se integran en `openspec/specs/`, el change se archiva y los specs vuelven a describir el estado real.
5. Si el código no aclara una decisión, no se inventa: se registra en `## Preguntas abiertas`.

## Referencias de código

- `backend/src/app.ts`
- `backend/src/modules/cards/leitner.service.ts`
- `backend/src/modules/cards/card.repository.ts`
- `backend/src/modules/decks/deck.repository.ts`
- `backend/src/modules/stats/stats.service.ts`
- `backend/src/modules/auth/auth.middleware.ts`
- `backend/src/modules/auth/user-sync.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/router.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/lib/leitner.ts`
- `frontend/src/index.css`
- `specs/task.md` (recuperado del historial de git)
- `specs/diseño.md` (recuperado del historial de git)
- `specs/mejorasLeitner.md` (recuperado del historial de git)
