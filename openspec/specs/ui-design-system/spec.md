# ui-design-system

## Propósito

Define los tokens visuales, el modo oscuro, la semántica de color de cajas y mazos, y los patrones de interacción de la interfaz de Leitner.

## Requirements

### Requirement: Paleta azul y tokens de color

La interfaz SHALL usar la paleta azul definida en `frontend/src/index.css`, con `#114e78` como azul profundo, `#3481bc` como azul de acento, `#bce0fa` como azul claro y `#1c262b` como tinta.

#### Scenario: Fondo y texto en modo claro

- GIVEN el modo claro activo
- WHEN se renderiza una página
- THEN el fondo general usa `#f4f9fd`
- AND las superficies usan `#ffffff`
- AND el texto principal usa `#1c262b`
- AND el texto secundario usa `#5f7280`

#### Scenario: Acción principal

- GIVEN un botón con la variante principal
- WHEN se muestra en modo claro
- THEN usa fondo `#114e78` y texto blanco
- AND al pasar el cursor cambia a `#1c262b`

#### Scenario: Acción de estudio

- GIVEN un botón “Estudiar”
- WHEN se muestra
- THEN usa el acento naranja `#ea580c`
- AND el naranja no se usa como color general de botones secundarios

#### Scenario: Estados semánticos

- GIVEN un mensaje de éxito, error o aviso
- WHEN se renderiza
- THEN éxito usa `#2e8b57` sobre `#ddf2e6`
- AND error usa `#d64545` sobre `#fce4e4`
- AND aviso usa `#b7791f` sobre `#fbf0d5`

### Requirement: Modo oscuro con la clase `.dark`

El sistema SHALL activar el modo oscuro mediante la clase `.dark` en el elemento `<html>`, no mediante `prefers-color-scheme` directamente en los componentes. Los tokens de color SHALL redefinirse bajo `.dark`.

#### Scenario: Activar modo oscuro

- GIVEN la aplicación en modo claro
- WHEN el usuario pulsa el botón de tema
- THEN se agrega la clase `dark` a `<html>`
- AND se aplican los tokens oscuros
- AND la preferencia se guarda en `localStorage`

#### Scenario: Persistencia del tema

- GIVEN un usuario que eligió modo oscuro
- WHEN vuelve a abrir la aplicación
- THEN se lee `leitner-theme` de `localStorage`
- AND se aplica el modo oscuro antes de renderizar el contenido

#### Scenario: Preferencia del sistema

- GIVEN un usuario sin preferencia guardada
- WHEN abre la aplicación
- THEN se usa `prefers-color-scheme` del sistema como tema inicial
- AND el usuario puede cambiarlo manualmente

#### Scenario: Superficies en oscuro

- GIVEN el modo oscuro activo
- WHEN se renderiza una tarjeta o un panel
- THEN el fondo principal usa `#11181c`
- AND las superficies usan `#1b262c`
- AND los bordes usan `#33444d`
- AND el texto principal usa `#e8f1f8`

### Requirement: Color e ícono por caja

El sistema SHALL asignar a cada caja un color, un color de texto legible, un ícono y clases estáticas de badge, punto, barra y fondo suave.

#### Scenario: Identidad de Caja 1

- GIVEN una tarjeta en Caja 1
- WHEN se muestra su badge
- THEN usa el color `#ef4444` con texto blanco
- AND muestra el ícono `Flame`

#### Scenario: Identidad de Caja 3

- GIVEN una tarjeta en Caja 3
- WHEN se muestra su badge
- THEN usa el color `#b9c25a` con texto oscuro `#1c262b`
- AND muestra el ícono `Leaf`

#### Scenario: Identidad de Caja 5

- GIVEN una tarjeta en Caja 5
- WHEN se muestra su badge
- THEN usa el color `#0d9488` con texto blanco
- AND muestra el ícono `Trophy`

#### Scenario: Coherencia entre listado, cajas y estudio

- GIVEN una tarjeta en Caja 2
- WHEN se muestra en Tarjetas, en la vista de Cajas y en la sesión de estudio
- THEN las tres vistas usan el mismo color e ícono de la Caja 2

### Requirement: Paleta curada para mazos

El sistema SHALL ofrecer para los mazos la paleta curada `DECK_COLORS` y SHALL usar `#3481BC` como color de respaldo cuando el mazo no tenga color.

#### Scenario: Colores disponibles

- GIVEN el formulario de creación o edición de mazo
- WHEN el usuario abre el selector de color
- THEN ve los ocho colores curados: azul, celeste, teal, índigo, violeta, rosa, verde y gris pizarra
- AND no ve rojo, ámbar ni naranja en esa paleta

#### Scenario: Mazo sin color

- GIVEN un mazo con `color = null`
- WHEN se muestra en el listado
- THEN usa `#3481BC` como color de respaldo

#### Scenario: Ícono del mazo

- GIVEN un mazo con un ícono guardado
- WHEN se muestra en el listado o en el formulario
- THEN usa el ícono correspondiente de Lucide
- AND si el nombre no se reconoce, usa el ícono `Library`

### Requirement: Acciones de tarjeta con hover semántico

La interfaz SHALL mostrar el lápiz de edición en ámbar, el tacho de borrado en rojo y el botón de estudio en verde al pasar el cursor o al recibir foco por teclado.

#### Scenario: Hover de editar

- GIVEN una fila de tarjeta
- WHEN el cursor entra en el botón de lápiz
- THEN el ícono y el fondo cambian a la familia ámbar de edición

#### Scenario: Hover de borrar

- GIVEN una fila de tarjeta
- WHEN el cursor entra en el botón de tacho
- THEN el ícono y el fondo cambian a la familia roja de error

#### Scenario: Hover de estudiar

- GIVEN una fila de tarjeta
- WHEN el cursor entra en el botón de play
- THEN el ícono y el fondo cambian a la familia verde de éxito

#### Scenario: Accesibilidad de los botones de ícono

- GIVEN un botón que solo muestra un ícono
- WHEN se inspecciona
- THEN tiene `aria-label` y `title` descriptivos
- AND el efecto de hover también se aplica con `focus-visible`

### Requirement: Header de contenido

El sistema SHALL mostrar un header pequeño con el selector de tema y el menú de usuario. El menú SHALL mostrar el correo y la acción “Salir”.

#### Scenario: Header en escritorio

- GIVEN una sesión activa en escritorio
- WHEN se renderiza el layout
- THEN el header superior muestra el botón de tema y el menú de usuario
- AND el menú muestra el correo de la sesión y la opción “Salir”

#### Scenario: Header en móvil

- GIVEN una sesión activa en móvil
- WHEN se renderiza el layout
- THEN aparece una barra superior con el botón de menú, el logo de marca (`BrandMark`) y el nombre “Leitner”
- AND el sidebar se abre como drawer

#### Scenario: Cerrar sesión desde el menú

- GIVEN el menú de usuario abierto
- WHEN el usuario elige “Salir”
- THEN se cierra la sesión y se navega a `/login`

### Requirement: Navegación lateral

El sistema SHALL mostrar un sidebar con el logo de marca (`BrandMark`), grupos “Biblioteca” y “Estudio”, íconos por sección con acento de color propio sobre el fondo del sidebar, una tarjeta destacada de racha diaria sin truncar el mensaje motivacional y un botón “Cómo funciona” que abre un tutorial interactivo de 4 pasos sobre el Sistema Leitner (`LeitnerTutorialDialog`). En escritorio SHALL poder colapsarse centrando los íconos y mostrando un único tooltip por ítem; en móvil SHALL funcionar como drawer.

#### Scenario: Secciones del sidebar

- GIVEN una sesión activa
- WHEN se muestra el sidebar
- THEN “Biblioteca” contiene “Mazos” y “Tarjetas”
- AND “Estudio” contiene “Cajas” y “Estudiar”

#### Scenario: Sidebar colapsado

- GIVEN el sidebar expandido en escritorio
- WHEN el usuario lo colapsa
- THEN se muestran solo los íconos
- AND la preferencia se guarda en `localStorage`
- AND los ítems muestran un tooltip con su nombre

#### Scenario: Drawer móvil

- GIVEN una pantalla móvil
- WHEN el usuario pulsa el botón de menú
- THEN se abre el sidebar como drawer
- AND se cierra al navegar o al pulsar el fondo

### Requirement: Animación de volteo de la tarjeta

La tarjeta de estudio SHALL usar una animación 3D de volteo de 500 ms para revelar el reverso, con caras ocultas por `backface-visibility`.

#### Scenario: Voltear con animación

- GIVEN una tarjeta de estudio sin voltear
- WHEN el usuario la voltea
- THEN el contenedor aplica `rotate-y-180`
- AND la transición dura 500 ms
- AND solo se ve una cara a la vez

#### Scenario: Volver al frente

- GIVEN una tarjeta volteada
- WHEN se avanza a la siguiente tarjeta
- THEN el estado de volteo se reinicia
- AND la nueva tarjeta se muestra por el frente

## Preguntas abiertas

- La guía original afirma que `CAJA_THEME` usa rojo y naranja mientras `diseño.md` evita esos colores porque significan borrar y editar. La lectura correcta es que esa restricción aplica a `DECK_COLORS`; `diseño.md` asigna explícitamente rojo y naranja a las cajas. No hay contradicción, pero conviene revisar el contraste en modo oscuro.
- `formatRelative` tiene el signo invertido: una fecha pasada muestra “2 d” en lugar de “Hace 2 días” y una fecha futura de un día muestra “Ayer”. Afecta al texto “Estudiado …” del listado de mazos.
- `isDue` compara el instante exacto y `daysUntil` compara días de calendario; una tarjeta puede considerarse vencida en una función y no en la otra según la hora.
- Los colores de caja están duplicados en `index.css` (tokens) y en `CAJA_THEME` (hex y clases). Cualquier cambio debe hacerse en ambos lugares.
- La paleta de mazos no incluye el color por defecto de Prisma `#1D4ED8`; un mazo creado sin color puede quedar fuera de la paleta curada.
- `--color-tinta` no se redefine en `.dark`, aunque se usa como fondo de overlays; revisar si el overlay necesita un valor distinto en oscuro.
- El tema se aplica en `initTheme` antes del render, pero el estado inicial de `ThemeToggle` lee la clase del documento; no hay SSR, así que no se probó hidratación.
- La Caja 3 usa texto oscuro sobre lima; el contraste debe verificarse en modo claro y oscuro.
- El sidebar y el header móvil usan colores propios (`--color-sb-*`) que no siguen exactamente los tokens de superficie del resto de la interfaz.

## Referencias de código

- `frontend/src/index.css`
- `frontend/src/lib/leitner.ts`
- `frontend/src/lib/theme.ts`
- `frontend/src/components/ThemeToggle.tsx`
- `frontend/src/components/UserMenu.tsx`
- `frontend/src/components/BrandMark.tsx`
- `frontend/src/components/LeitnerTutorialDialog.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/layout.tsx`
- `frontend/src/components/ui/badge.tsx`
- `frontend/src/components/ui/button.tsx`
- `frontend/src/features/decks/DeckForm.tsx`
- `frontend/src/features/decks/DeckList.tsx`
- `frontend/src/features/study/Flashcard.tsx`
- `frontend/src/pages/Cards.tsx`
- `specs/diseño.md` (recuperado del historial de git)
- `specs/mejorasLeitner.md` (recuperado del historial de git)
