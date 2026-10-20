# decks

## Propósito

Define la creación y gestión de mazos, sus campos opcionales y las estadísticas agregadas que alimentan el dashboard y la pantalla de mazos.

## Requirements

### Requirement: CRUD aislado por usuario

El sistema SHALL permitir crear, listar, actualizar y borrar mazos solo del usuario autenticado.

#### Scenario: Crear un mazo

- GIVEN un usuario autenticado
- WHEN envía `POST /api/v1/decks` con un nombre válido
- THEN el mazo se crea asociado a su `userId`
- AND la respuesta tiene estado `201`

#### Scenario: Listar mazos propios

- GIVEN un usuario con mazos propios y otro usuario con mazos distintos
- WHEN consulta `GET /api/v1/decks`
- THEN solo recibe sus mazos
- AND cada mazo incluye sus estadísticas agregadas

#### Scenario: Actualizar un mazo propio

- GIVEN un mazo propio
- WHEN se envía un `PATCH` con campos válidos
- THEN se actualizan solo esos campos
- AND la respuesta devuelve el mazo actualizado

#### Scenario: Acceder a un mazo ajeno

- GIVEN un mazo que pertenece a otro usuario
- WHEN el usuario autenticado intenta actualizarlo o borrarlo
- THEN la operación falla
- AND el mazo ajeno no se modifica

### Requirement: Campos y validación

El sistema SHALL aceptar los campos `nombre`, `descripcion`, `color`, `icon`, `tags` y `metaDiaria` con estas reglas: nombre entre 1 y 100 caracteres; descripción hasta 500; color hexadecimal `#RRGGBB`; ícono hasta 50 caracteres; hasta 10 etiquetas de máximo 30 caracteres; meta diaria entera entre 1 y 1000 o `null`.

#### Scenario: Mazo completo válido

- GIVEN un cuerpo con nombre, descripción, color, ícono, etiquetas y meta diaria válidos
- WHEN se crea el mazo
- THEN todos los campos se guardan
- AND la respuesta los devuelve

#### Scenario: Nombre vacío o demasiado largo

- GIVEN un nombre vacío o de 101 caracteres
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se crea el mazo

#### Scenario: Color inválido

- GIVEN un color `azul` o `#12345`
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se crea ni actualiza el mazo

#### Scenario: Meta diaria fuera de rango

- GIVEN una `metaDiaria` de 0 o de 1001
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se guarda el mazo

### Requirement: Borrado en cascada

El sistema SHALL borrar las tarjetas de un mazo cuando el mazo se elimina, y SHALL borrar en cascada los repasos de esas tarjetas.

#### Scenario: Borrar un mazo con tarjetas

- GIVEN un mazo propio con tarjetas y repasos
- WHEN el usuario borra el mazo
- THEN el mazo deja de existir
- AND sus tarjetas dejan de existir
- AND los repasos de esas tarjetas dejan de existir

#### Scenario: Borrar un mazo vacío

- GIVEN un mazo propio sin tarjetas
- WHEN el usuario lo borra
- THEN el mazo deja de existir
- AND la respuesta tiene estado `204`

### Requirement: Resumen por mazo

El sistema SHALL devolver por cada mazo el total de tarjetas, la cantidad de dominadas, la cantidad de pendientes, la fecha del último estudio y la próxima revisión más cercana.

#### Scenario: Mazo con tarjetas en varias cajas

- GIVEN un mazo con tarjetas en Caja 1, Caja 4 y Caja 5
- WHEN se lista el mazo
- THEN `total` cuenta las tres tarjetas
- AND `dominadas` cuenta las tarjetas de Caja 4 y Caja 5
- AND `pendientes` cuenta las tarjetas con `proximaRevision` ya cumplida

#### Scenario: Mazo sin tarjetas

- GIVEN un mazo recién creado
- WHEN se lista
- THEN `total = 0`, `dominadas = 0` y `pendientes = 0`
- AND `ultimoEstudio` y `proximaRevision` son `null`

#### Scenario: Último estudio

- GIVEN un mazo con varios repasos
- WHEN se lista
- THEN `ultimoEstudio` es la fecha del repaso más reciente del mazo

### Requirement: Meta diaria

El sistema SHALL almacenar `metaDiaria` como un valor opcional del mazo. En el estado actual la meta diaria no SHALL limitar la cola de estudio ni la cantidad de tarjetas repasadas.

#### Scenario: Mazo con meta diaria

- GIVEN un mazo con `metaDiaria = 10` y veinte tarjetas vencidas
- WHEN el usuario abre la sesión de estudio
- THEN la cola incluye las veinte tarjetas vencidas
- AND la meta diaria no reduce la cola

#### Scenario: Mazo sin meta diaria

- GIVEN un mazo con `metaDiaria = null`
- WHEN se guarda el mazo
- THEN el campo queda vacío
- AND no se aplica ningún límite

### Requirement: Búsqueda y orden en la interfaz

La pantalla de mazos SHALL permitir buscar por nombre, descripción o etiquetas y ordenar por nombre, progreso, pendientes o último estudio.

#### Scenario: Buscar un mazo

- GIVEN varios mazos con nombres, descripciones y etiquetas distintas
- WHEN el usuario escribe un texto en el buscador
- THEN solo se muestran los mazos que contienen ese texto en nombre, descripción o etiquetas

#### Scenario: Ordenar por pendientes

- GIVEN mazos con distintas cantidades de pendientes
- WHEN el usuario elige “Más pendientes”
- THEN los mazos se ordenan de mayor a menor cantidad de pendientes

#### Scenario: Sin resultados

- GIVEN un texto que no coincide con ningún mazo
- WHEN el usuario busca
- THEN se muestra el estado “Ningún mazo coincide”
- AND se ofrece limpiar la búsqueda

## Preguntas abiertas

- `dominadas` cuenta `cajaActual >= 4`, no solo Caja 5. La interfaz llama “Dominada” a la Caja 5 y usa el mismo contador para el progreso, por lo que una tarjeta en Caja 4 ya suma como dominada.
- `metaDiaria` existe en el esquema y en el formulario, pero `findDueByUser` no la consulta. El texto del formulario dice “Máximo de tarjetas nuevas por día”, aunque el campo no distingue nuevas de vencidas. Esto se aborda en `daily-limit`.
- El color por defecto de Prisma es `#1D4ED8` (índigo), pero el formulario propone `#3481BC` y `DECK_COLORS` no incluye `#1D4ED8`. Un mazo creado sin color puede recibir un color fuera de la paleta curada.
- Los límites de la interfaz son más estrictos que los del backend: el formulario limita nombre a 60 y descripción a 200, mientras el DTO acepta 100 y 500.
- El “Deshacer” del borrado de mazo recrea el mazo y sus tarjetas, pero no recupera los repasos ni las fechas originales de próxima revisión.
- Un `PATCH` o `DELETE` sobre un mazo ajeno termina en `500` por una excepción de Prisma, no en `404`.
- La fecha de último estudio se muestra con `formatRelative`, que hoy interpreta mal el signo de las fechas pasadas: puede mostrar “2 d” en lugar de “Hace 2 días” y “Ayer” para una fecha futura de un día.
- El listado de mazos carga todas las tarjetas y todos los repasos del usuario para calcular las estadísticas; no pagina ni agrega en la base de datos.
- No se valida que `icon` corresponda a un ícono conocido; cualquier cadena de hasta 50 caracteres se guarda y la interfaz usa un ícono por defecto si no lo reconoce.

## Referencias de código

- `backend/src/modules/decks/deck.dto.ts`
- `backend/src/modules/decks/deck.repository.ts`
- `backend/src/modules/decks/deck.service.ts`
- `backend/src/modules/decks/deck.controller.ts`
- `backend/src/modules/decks/deck.routes.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/features/decks/DeckList.tsx`
- `frontend/src/features/decks/DeckForm.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/lib/leitner.ts`
