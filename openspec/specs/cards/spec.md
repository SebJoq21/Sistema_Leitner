# cards

## Propósito

Define el ciclo de vida de las tarjetas: creación, edición, borrado, movimiento entre mazos y listado con filtros, siempre aislado por el usuario autenticado.

## Requirements

### Requirement: CRUD aislado por usuario

El sistema SHALL permitir crear, listar, actualizar y borrar tarjetas solo cuando pertenezcan a un mazo del usuario autenticado.

#### Scenario: Crear una tarjeta en un mazo propio

- GIVEN un usuario autenticado y un mazo propio
- WHEN envía `POST /api/v1/cards` con `deckId` del mazo
- THEN la tarjeta se crea asociada a ese mazo
- AND la respuesta tiene estado `201`

#### Scenario: Crear una tarjeta en un mazo ajeno

- GIVEN un usuario autenticado y el `deckId` de un mazo de otro usuario
- WHEN intenta crear una tarjeta en ese mazo
- THEN la operación falla sin crear la tarjeta
- AND no se expone información del mazo ajeno

#### Scenario: Listar tarjetas propias

- GIVEN un usuario con tarjetas en dos mazos propios y otro usuario con tarjetas propias
- WHEN consulta `GET /api/v1/cards`
- THEN solo recibe sus propias tarjetas
- AND no recibe tarjetas del otro usuario

#### Scenario: Borrar una tarjeta propia

- GIVEN una tarjeta de un mazo propio
- WHEN el usuario la borra
- THEN la tarjeta deja de existir
- AND la respuesta tiene estado `204`

### Requirement: Validación de contenido

El sistema SHALL validar los campos de una tarjeta con estos límites: `frontText` y `backText` entre 1 y 2000 caracteres; `hint` hasta 500; `notas` hasta 2000; hasta 10 etiquetas, cada una entre 1 y 30 caracteres.

#### Scenario: Tarjeta válida

- GIVEN un `frontText` y un `backText` no vacíos dentro de los límites
- WHEN se valida el DTO de creación
- THEN la validación pasa
- AND los campos opcionales ausentes se guardan como `null` o arreglo vacío según corresponda

#### Scenario: Frente vacío o demasiado largo

- GIVEN un `frontText` vacío o de 2001 caracteres
- WHEN se valida el DTO
- THEN el backend responde `400` con `Datos inválidos`
- AND no se crea ni actualiza la tarjeta

#### Scenario: Demasiadas etiquetas

- GIVEN un arreglo de 11 etiquetas o una etiqueta de 31 caracteres
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se guarda la tarjeta

#### Scenario: Pista y notas opcionales

- GIVEN una tarjeta sin `hint` ni `notas`
- WHEN se crea
- THEN ambos campos quedan en `null`
- AND la tarjeta es válida

### Requirement: Creación y estado inicial

El sistema SHALL crear la tarjeta en Caja 1 con vencimiento inmediato por defecto, y SHALL aceptar `cajaInicial` entre 1 y 5 para sobrescribir únicamente la caja.

#### Scenario: Creación por defecto

- GIVEN un `deckId` propio y un cuerpo sin `cajaInicial`
- WHEN se crea la tarjeta
- THEN `cajaActual` es 1
- AND `proximaRevision` es el instante de creación

#### Scenario: Creación con caja inicial

- GIVEN un cuerpo con `cajaInicial = 3`
- WHEN se crea la tarjeta
- THEN `cajaActual` es 3
- AND `proximaRevision` sigue siendo el instante de creación

#### Scenario: Caja inicial fuera de rango

- GIVEN un cuerpo con `cajaInicial = 0` o `6`
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se crea la tarjeta

### Requirement: Mover tarjeta de mazo

El sistema SHALL permitir mover una tarjeta a otro mazo propio mediante la actualización de `deckId`.

#### Scenario: Mover a otro mazo propio

- GIVEN una tarjeta propia y un segundo mazo propio
- WHEN se actualiza la tarjeta con el `deckId` del segundo mazo
- THEN la tarjeta queda asociada al segundo mazo
- AND conserva su caja, su próxima revisión y sus repasos

#### Scenario: Mover a un mazo ajeno

- GIVEN una tarjeta propia y el `deckId` de un mazo ajeno
- WHEN se intenta mover la tarjeta
- THEN la operación falla sin cambiar el mazo
- AND no se expone información del mazo ajeno

### Requirement: Listado y filtros del API

El sistema SHALL permitir filtrar el listado por mazo, caja, texto en frente o reverso sin distinguir mayúsculas, etiqueta y estado de pendiente, y SHALL permitir ordenar por creación, actualización o próxima revisión.

#### Scenario: Búsqueda sin distinguir mayúsculas

- GIVEN una tarjeta con frente “Capital de Francia”
- WHEN se lista con `search = capital`
- THEN la tarjeta aparece en el resultado
- AND también aparecería con `search = CAPITAL`

#### Scenario: Filtro por etiqueta

- GIVEN tarjetas con la etiqueta `historia` y otras sin ella
- WHEN se lista con `tag = historia`
- THEN solo aparecen las tarjetas que contienen esa etiqueta

#### Scenario: Filtro por pendientes

- GIVEN tarjetas con `proximaRevision` pasada y futura
- WHEN se lista con `pendientes = true`
- THEN solo aparecen las tarjetas con vencimiento cumplido
- AND con `pendientes = false` aparecen las no vencidas

#### Scenario: Filtro por caja

- GIVEN tarjetas en Caja 1 y Caja 5
- WHEN se lista con `caja = 5`
- THEN solo aparecen las tarjetas de Caja 5

#### Scenario: Orden por próxima revisión

- GIVEN varias tarjetas con distintas `proximaRevision`
- WHEN se lista con `order = proximaRevision`
- THEN el resultado se ordena de la fecha más antigua a la más reciente

### Requirement: Filtros de la interfaz de Tarjetas

La página de Tarjetas SHALL mostrar búsqueda por texto, filtro por mazo, filtro por caja y orden por creación reciente o próxima revisión. La búsqueda y los filtros de la interfaz SHALL aplicarse sobre las tarjetas cargadas.

#### Scenario: Buscar en la interfaz

- GIVEN una lista de tarjetas cargada
- WHEN el usuario escribe en el buscador
- THEN se muestran las tarjetas cuyo frente o reverso contiene el texto, sin distinguir mayúsculas

#### Scenario: Combinar filtros

- GIVEN tarjetas de varios mazos y cajas
- WHEN el usuario selecciona un mazo y una caja
- THEN solo se muestran las tarjetas que cumplen ambos filtros

#### Scenario: Limpiar filtros

- GIVEN una lista filtrada
- WHEN el usuario pulsa “Limpiar filtros”
- THEN se restablecen búsqueda, mazo y caja
- AND se vuelve a mostrar la lista completa cargada

### Requirement: Aislamiento en tarjetas ajenas

El sistema SHALL tratar cualquier tarjeta o mazo ajeno como no accesible: no SHALL devolver, modificar, borrar ni repasar datos de otro usuario.

#### Scenario: Actualizar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta actualizarla
- THEN la operación falla
- AND la tarjeta ajena no se modifica
- AND no se devuelven sus datos

#### Scenario: Borrar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta borrarla
- THEN la operación falla
- AND la tarjeta ajena sigue existiendo

#### Scenario: Repasar una tarjeta ajena

- GIVEN una tarjeta que pertenece a otro usuario
- WHEN el usuario autenticado intenta repasarla
- THEN la operación falla
- AND no se crea un `Review` para esa tarjeta

### Requirement: Edición de campos

El sistema SHALL permitir actualizar `deckId`, `frontText`, `backText`, `hint`, `notas` y `tags`. La actualización SHALL rechazarse si no incluye ningún campo.

#### Scenario: Actualización parcial

- GIVEN una tarjeta propia
- WHEN se envía un `PATCH` con solo `backText`
- THEN se actualiza el reverso
- AND los demás campos conservan su valor

#### Scenario: Actualización vacía

- GIVEN una solicitud `PATCH` sin campos reconocidos
- WHEN se valida el DTO
- THEN el backend responde `400`
- AND no se modifica la tarjeta

#### Scenario: Campos no editables por esta vía

- GIVEN una solicitud que intenta cambiar `cajaActual` o `proximaRevision`
- WHEN se valida el DTO
- THEN esos campos no se aceptan
- AND solo se modifican los campos permitidos

### Requirement: Operaciones masivas

La interfaz SHALL permitir seleccionar varias tarjetas para borrarlas o moverlas a otro mazo. Las operaciones masivas SHALL ejecutarse como peticiones independientes, no como una transacción única.

#### Scenario: Borrado masivo

- GIVEN varias tarjetas seleccionadas
- WHEN el usuario confirma el borrado
- THEN se envía una petición de borrado por tarjeta
- AND la interfaz quita del listado las tarjetas borradas

#### Scenario: Error parcial en borrado masivo

- GIVEN varias tarjetas seleccionadas y una petición que falla
- WHEN finaliza la operación
- THEN se muestra un aviso de error
- AND las tarjetas borradas antes del error no se restauran automáticamente

#### Scenario: Deshacer un borrado

- GIVEN una tarjeta borrada desde la interfaz
- WHEN el usuario pulsa “Deshacer” en el aviso
- THEN se crea una tarjeta nueva con el mismo contenido y la misma caja
- AND no se recuperan los `Review` anteriores ni la `proximaRevision` original

### Requirement: Aviso de duplicados en la interfaz

El formulario de creación SHALL avisar y bloquear el envío cuando ya existe una tarjeta con el mismo `frontText` en el mazo seleccionado. Esa comprobación SHALL ser solo de interfaz.

#### Scenario: Frente duplicado en el mismo mazo

- GIVEN un mazo con una tarjeta cuyo frente es “¿Qué es una célula?”
- WHEN el usuario intenta crear otra con el mismo frente en ese mazo
- THEN el formulario muestra un aviso de duplicado
- AND no envía la creación

#### Scenario: Mismo frente en otro mazo

- GIVEN un mazo con una tarjeta cuyo frente es “¿Qué es una célula?”
- WHEN el usuario crea una tarjeta con ese frente en otro mazo propio
- THEN el aviso no se muestra
- AND la creación se permite

## Preguntas abiertas

- El acceso a una tarjeta ajena no responde `404`. `findFirstOrThrow` lanza una excepción de Prisma y `errorHandler` responde `500` con `{ error: 'Error interno' }`. Lo mismo ocurre al mover a un mazo ajeno, actualizar un mazo ajeno o borrar un mazo ajeno.
- No existe `GET /api/v1/cards/:id`; la lectura individual solo ocurre a través del listado, la cola de vencidas o la vista de cajas.
- El backend acepta los filtros `tag` y `pendientes`, pero la página de Tarjetas no los expone. La guía de diseño pidió eliminar esos filtros de la interfaz.
- La interfaz carga todas las tarjetas y filtra en el navegador; no hay paginación ni carga progresiva.
- `order = createdAt` y `order = updatedAt` se traducen ambos a orden descendente; no existe orden ascendente por creación o actualización.
- La unicidad del frente no está garantizada en la base de datos. La comprobación del formulario es local, se hace por mazo y puede fallar si hay dos pestañas o dos clientes creando a la vez.
- `frontText` y `backText` aceptan una cadena compuesta solo por espacios en el backend, aunque el formulario hace `trim` antes de enviar.
- Las operaciones masivas de borrado y movimiento no son atómicas. El “Deshacer” recrea tarjetas nuevas y pierde el historial de repasos y la fecha original de próxima revisión.
- El filtro `pendientes` usa el instante actual del servidor. Su definición cambiará si se implementa `fix-timezone-scheduling`.
- No se permite editar `cajaActual` ni `proximaRevision` desde el `PATCH` de tarjeta; solo el repaso o la creación las modifican.

## Referencias de código

- `backend/src/modules/cards/card.dto.ts`
- `backend/src/modules/cards/card.repository.ts`
- `backend/src/modules/cards/card.service.ts`
- `backend/src/modules/cards/card.controller.ts`
- `backend/src/modules/cards/card.routes.ts`
- `backend/src/middlewares/validate.ts`
- `frontend/src/pages/Cards.tsx`
- `frontend/src/features/decks/CardForm.tsx`
- `frontend/src/schemas/index.ts`
- `frontend/src/lib/api.ts`
