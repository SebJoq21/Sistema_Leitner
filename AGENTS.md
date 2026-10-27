# AGENTS.md

## Contexto del proyecto

Sistema Leitner es una aplicación web de repetición espaciada basada en cinco cajas.

- Frontend: React 19 + TypeScript + Vite 8 + Tailwind CSS 4.
- Backend: Node.js + TypeScript + Express 4 + Prisma 7.
- Base de datos: PostgreSQL.
- Autenticación: Supabase Auth.
- Frontend y backend se comunican por `/api/v1/...`.

Este archivo define **cómo se trabaja en el repositorio**. Las reglas funcionales viven en `openspec/`; no deben duplicarse aquí.

## Fuente de verdad

- `openspec/specs/` describe el comportamiento actual del sistema.
- `openspec/changes/` contiene las funcionalidades y correcciones planificadas.
- Cada change tiene `proposal.md`, `design.md`, `tasks.md` y deltas de las capacidades afectadas.
- Si el código contradice una spec, no se ignora: se actualiza la spec o se crea un change.
- No implementar comportamiento que no esté respaldado por una spec o un change.
- Las decisiones que el código no permita resolver se registran en `## Preguntas abiertas`; no se inventan.

## Regla de oro de Git

- `main` es la rama principal y **no se toca** durante el desarrollo normal.
- `development` es la rama de integración.
- Cada funcionalidad sale de `development`.
- Una funcionalidad = una rama = un PR a `development`.
- No se commitea directamente en `development`.
- No se hace push directo a `main` ni a `development`.
- No se hace merge de un PR sin instrucción explícita.

## Flujo obligatorio por funcionalidad

### 1. Sincronizar `development`

```powershell
git fetch origin
git checkout development
git pull --ff-only origin development
```

### 2. Crear la rama de la funcionalidad

```powershell
git checkout -b feat/<nombre-del-change>
```

La rama debe salir siempre de la versión más reciente de `development`.

### 3. Implementar

- Seguir las tareas de `openspec/changes/<change>/tasks.md`.
- Marcar las tareas completadas en ese archivo.
- Hacer commits pequeños y coherentes.
- No mezclar cambios no relacionados en la misma rama.
- No agregar dependencias sin justificarlo en el PR.
- No commitear secretos, archivos `.env` ni artefactos generados.

### 4. Verificar antes del PR

```powershell
git fetch origin
git rebase origin/development
```

Ejecutar las comprobaciones que existan:

```powershell
# Backend
cd backend
npm run typecheck
npm run build
npm test

# Frontend
cd frontend
npm run lint
npm run build
npm test
```

Notas:

- Actualmente no hay framework de tests. El primer change debe agregar Vitest al backend.
- Si un comando de test todavía no existe, indicarlo en el PR y no inventar resultados.
- Si hay migraciones Prisma, probarlas localmente antes de abrir el PR.

### 5. Publicar y abrir el PR

```powershell
git push -u origin feat/<nombre-del-change>

gh pr create `
  --base development `
  --head feat/<nombre-del-change> `
  --title "feat: <descripción>" `
  --body "<resumen, pruebas y riesgos>"
```

El PR se abre **listo para revisión** cuando el código y las pruebas estén terminados. Un draft solo se usa si se pide explícitamente mostrar trabajo en progreso.

### 6. Después del merge

- Sincronizar `development`.
- Eliminar la rama de la funcionalidad si ya no se necesita.
- Crear la siguiente rama desde `development` actualizado.

## Convención de ramas

| Tipo | Rama |
| --- | --- |
| Funcionalidad | `feat/fix-timezone-scheduling` |
| Funcionalidad | `feat/guard-review-when-due` |
| Funcionalidad | `feat/requeue-failed-in-session` |
| Funcionalidad | `feat/daily-limit` |
| Documentación | `docs/agents-md` |

## Reglas de commits

- Usar Conventional Commits con mensajes en español.
- Ejemplos:
  - `docs: agregar guía de ramas, PR y verificación`
  - `feat(backend): programar repaso por día calendario`
  - `fix(frontend): corregir cálculo de fechas relativas`
- Revisar `git status` y `git diff` antes de agregar archivos.
- Preferir rutas explícitas en `git add`; evitar `git add -A` sin revisar.
- No reescribir historia de ramas compartidas.

## Reglas de PR

Cada PR debe incluir:

- Funcionalidad y change de OpenSpec asociado.
- Resumen de cambios de backend y frontend.
- Migraciones y riesgos de datos.
- Plan de pruebas ejecutado.
- Pasos manuales de verificación.
- Notas de rollback si hay migración.
- Base siempre `development`; nunca `main`.

No hacer merge automáticamente. El merge se realiza solo cuando se indique explícitamente.

## Verificación mínima

| Área | Comandos |
| --- | --- |
| Backend | `npm run typecheck`, `npm run build`, `npm test` |
| Frontend | `npm run lint`, `npm run build`, `npm test` |
| Prisma | `npm run prisma:generate`, migración probada en local |

Si se agrega CI, el PR debe esperar a que las checks estén en verde.

## Orden de desarrollo

El orden respeta dependencias funcionales y técnicas:

1. `fix-timezone-scheduling`
2. `guard-review-when-due`
3. `requeue-failed-in-session`
4. `daily-limit`

Motivos:

- `guard-review-when-due` necesita la definición de “vencida” por día calendario.
- `requeue-failed-in-session` necesita el guard para no reenviar tarjetas ya programadas.
- `daily-limit` necesita la zona horaria y el manejo transaccional del `409`.

No empezar un change que dependa de otro sin integrar antes el anterior en `development`.

## Reglas de OpenSpec

- Cada requirement debe tener al menos un `#### Scenario`.
- Los scenarios deben usar `GIVEN`, `WHEN`, `THEN` y `AND` cuando corresponda.
- Los deltas `MODIFIED` deben repetir el requirement completo con su nombre exacto.
- Los `ADDED` no deben duplicar requirements existentes.
- Al implementar un change:
  1. Actualizar `tasks.md`.
  2. Integrar los deltas en `openspec/specs/`.
  3. Archivar el change.
  4. Verificar que las specs describan el estado real.
- Mantener la documentación en español; conservar en inglés las palabras clave de OpenSpec.

## Decisiones pendientes

Estas decisiones deben confirmarse antes de implementar el change correspondiente:

1. **Migración histórica de `proximaRevision`**
   - Recomendación: interpretar los timestamps existentes como UTC.
   - Alternativa: usar la zona local del servidor de producción.
   - Riesgo: un posible corrimiento de un día en tarjetas creadas cerca de medianoche.

2. **Zona horaria del usuario**
   - Recomendación: usar la zona del navegador (`X-Timezone`) y persistirla automáticamente.
   - Alternativa: agregar un selector manual en ajustes desde el inicio.
   - Decisión pendiente: si la zona guardada se actualiza automáticamente cuando cambia el navegador.

3. **Tests de frontend**
   - Recomendación: backend con Vitest desde el primer change; frontend con Vitest + Testing Library cuando se cubra la UI.
   - Alternativa: limitar el primer change a tests de backend.
   - Decisión pendiente: alcance inicial de los tests de frontend.

4. **Método de merge**
   - Pendiente: squash, merge commit o rebase.
   - Regla común: no hacer merge sin instrucción explícita.

5. **Protección de ramas**
   - Pendiente: configurar reglas en GitHub para impedir pushes directos a `main` y `development`.
   - Mientras no existan reglas, la restricción se respeta por convención.
