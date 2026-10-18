# Mejoras propuestas para Leitner

Revisión de las cuatro pantallas actuales (Mazos, Tarjetas, Cajas, Estudiar). El objetivo: más color y personalidad, íconos, formularios más completos y mejores estados vacíos, sin perder la claridad que ya tiene el sitio.

---

## 1. Diagnóstico rápido

**Lo que ya funciona**
- Navegación lateral clara y consistente en todas las pantallas.
- Jerarquía simple: título, subtítulo con contador, contenido.
- Tipografía legible (se ve como Inter) y buen uso del espacio en blanco.

**Lo que se siente débil**
- Casi todo es azul oscuro + naranja + blanco. Funciona, pero se ve plano y genérico.
- No hay íconos: el menú y los botones son solo texto.
- Las tarjetas (cards) se parecen todas; no hay forma de distinguir un mazo de otro.
- El botón "Estudiar (0)" está en naranja fuerte aunque no hay nada que estudiar.
- Los botones "Estudiar caja" están en un naranja muy pálido (parece deshabilitado, y el contraste es bajo).
- "Borrar" se ve igual que una acción normal y no pide confirmación.
- Los estados vacíos ("No había tarjetas pendientes") son texto suelto, sin guía ni motivación.
- La pantalla de Cajas muestra números pero no explica el sistema Leitner ni muestra el progreso.

---

## 2. Colores

### Paleta sugerida

Mantener el azul de marca como base, pero suavizarlo y agregar colores de apoyo con significado.

| Uso | Color | Hex sugerido |
|---|---|---|
| Barra lateral (fondo) | Azul profundo | `#1E3A8A` → o un degradado a `#172554` |
| Acento principal (acciones) | Naranja | `#F97316` (hover `#EA580C`) |
| Fondo de la página | Gris azulado muy claro | `#F8FAFC` |
| Texto principal | Casi negro azulado | `#0F172A` |
| Texto secundario | Gris azulado | `#64748B` |
| Acierto / correcto | Verde | `#16A34A` (fondo `#DCFCE7`) |
| Fallo / error | Rojo | `#DC2626` (fondo `#FEE2E2`) |
| Pendiente / aviso | Ámbar | `#D97706` (fondo `#FEF3C7`) |
| Información / etiquetas | Azul claro | `#2563EB` (fondo `#DBEAFE`) |

### Un color por caja (muy recomendable)

Dar a cada caja Leitner su propio color crea una progresión visual: de "reciente" a "dominada".

| Caja | Intervalo | Color sugerido |
|---|---|---|
| Caja 1 | cada 1 día | Rojo/coral `#EF4444` |
| Caja 2 | cada 3 días | Naranja `#F97316` |
| Caja 3 | cada 7 días | Amarillo `#EAB308` |
| Caja 4 | cada 15 días | Verde claro `#22C55E` |
| Caja 5 | cada 30 días | Verde/teal `#0D9488` |

Ese mismo color se usa en la etiqueta "Caja 2" de la lista de tarjetas, en la tarjeta de la caja y en la barra de progreso.

### Color por mazo

Permitir elegir un color (y un ícono) al crear el mazo. Se muestra como una franja o un círculo en la card del mazo. Así, de un vistazo se reconoce cada tema.

### Reglas generales
- Naranja solo para la acción principal de cada pantalla (no para todo).
- Si no hay nada que estudiar, el botón "Estudiar" pasa a gris con el texto "Nada pendiente".
- Botones deshabilitados: gris claro con texto gris, no naranja pálido.
- Verificar contraste mínimo 4.5:1 en textos pequeños (los textos gris claro de las cards están en el límite).
- Opcional: modo oscuro más adelante, usando las mismas variables de color.

---

## 3. Íconos

Se recomienda **Lucide** (`lucide-react` o `lucide-static`): son livianos, consistentes y gratuitos. Alternativas: Phosphor o Heroicons.

### Menú lateral

| Sección | Ícono Lucide |
|---|---|
| Mazos | `library` o `layers` |
| Tarjetas | `square-stack` o `credit-card` |
| Cajas | `archive` o `box` |
| Estudiar | `graduation-cap` o `brain` |
| Salir | `log-out` |

### Botones y acciones

| Acción | Ícono |
|---|---|
| Nuevo mazo | `plus` / `folder-plus` |
| Agregar tarjeta | `plus` |
| Editar | `pencil` |
| Borrar | `trash-2` (en rojo) |
| Estudiar | `play` o `zap` |
| Buscar | `search` |
| Acierto / Fallo | `check` / `x` |
| Pendientes | `clock` o `bell` |
| Voltear tarjeta | `rotate-cw` o `repeat` |

### Dónde más usarlos
- Un círculo con ícono grande al inicio de cada card de mazo.
- En los estados vacíos: ícono grande en gris suave + mensaje + botón.
- En los contadores del encabezado (por ejemplo, un reloj junto a "0 pendientes").

---

## 4. Mejoras por sección

### 4.1 Barra lateral (todas las pantallas)
- Añadir ícono a cada ítem y un pequeño **contador (badge)** en "Estudiar" con las tarjetas pendientes.
- Agregar un avatar con la inicial del usuario junto al correo, en lugar de solo texto.
- Logo con un ícono pequeño (por ejemplo, una caja o un rayo) junto a "Leitner".
- Versión colapsable para móviles (menú hamburguesa o barra inferior).
- Estado "activo" más marcado: fondo más claro + barra naranja (ya existe, solo reforzarla).

### 4.2 Mazos
**Estado actual:** una card con nombre, descripción, número de tarjetas y tres botones.

Mejoras:
- Ícono y color propios por mazo.
- Mostrar en la card: total de tarjetas, **pendientes hoy**, y una **barra de progreso** (porcentaje de tarjetas en caja 4–5, es decir, "dominadas").
- Fecha de la última sesión de estudio ("Estudiado hace 2 días").
- "Borrar" pasa a un menú de tres puntos (`more-horizontal`) con confirmación: *"¿Borrar 'Mazo prueba' y sus 2 tarjetas? Esta acción no se puede deshacer."*
- Mantener "Estudiar" como único botón destacado; "+ Tarjeta" como secundario.
- Botón "Estudiar (0)" deshabilitado cuando no hay pendientes.
- Buscador y orden (por nombre, por pendientes, por último estudio) cuando haya muchos mazos.
- Estado vacío: *"Aún no tienes mazos. Crea el primero para empezar a estudiar"* + botón "Nuevo mazo".
- Vista de cuadrícula o lista (opcional).

### 4.3 Tarjetas
**Estado actual:** buscador, filtros por mazo y caja, lista de cards con anverso y reverso.

Mejoras:
- Filtros con ícono, y un botón **"Limpiar filtros"**.
- Filtros extra: pendientes hoy, etiquetas, ordenar por fecha de creación o próxima revisión.
- En cada fila: etiqueta de caja con el **color de su caja**, nombre del mazo con su color, y la **próxima fecha de repaso** ("Repasar en 2 días").
- Mostrar anverso y reverso claramente separados (por ejemplo, "Pregunta" / "Respuesta" con etiqueta pequeña) en lugar de dos líneas de texto parecidas.
- Acciones "Editar" y "Borrar" como íconos (`pencil`, `trash-2`); "Estudiar" solo al pasar el cursor o como ícono `play`.
- Paginación o carga progresiva si la lista crece.
- Selección múltiple para mover o borrar varias tarjetas a la vez.
- Estado sin resultados: *"No encontramos tarjetas con ese filtro"* + botón "Limpiar filtros".

### 4.4 Cajas (sistema Leitner)
**Estado actual:** cinco cards con nombre, intervalo, número de tarjetas y botón.

Mejoras:
- Un breve **bloque explicativo** arriba (colapsable): *"Las tarjetas que aciertas suben a la siguiente caja y se repasan con menos frecuencia. Si fallas, vuelven a la Caja 1."*
- Visualizar el recorrido como **flujo**: Caja 1 → Caja 2 → … → Caja 5, con flechas entre las cards.
- Color e ícono propio por caja (ver sección 2).
- Mostrar dos números diferenciados: **total** y **pendientes hoy** (hoy el "0 pendientes" es muy pequeño).
- Barra horizontal que indique qué proporción del total está en cada caja.
- Mostrar cuándo vence la próxima tarjeta ("Próximo repaso: mañana") cuando no hay pendientes.
- "Estudiar caja" en gris deshabilitado cuando hay 0 pendientes, con un tooltip: *"No hay tarjetas pendientes en esta caja"*.
- Permitir **configurar los intervalos** (1, 3, 7, 15, 30 días) desde ajustes. Hoy están fijos.
- Al hacer clic en una caja, mostrar la lista de tarjetas que contiene.

### 4.5 Estudiar
**Estado actual:** solo se ve la pantalla de "Sesión completa" cuando no hay nada pendiente.

Mejoras en el estado vacío / final:
- Ícono grande (trofeo, check o celebración) + mensaje amable: *"¡Todo al día! No tienes tarjetas pendientes."*
- Mostrar **cuándo habrá nuevas tarjetas** ("Próximo repaso: mañana a las 9:00").
- Botones de salida: "Ir a Mazos" y "Agregar tarjetas".
- Al terminar una sesión real: resumen con aciertos (verde), fallos (rojo), porcentaje de acierto y tiempo total.

Mejoras en la sesión activa (para cuando haya tarjetas):
- Barra de progreso superior ("Tarjeta 3 de 12").
- Tarjeta grande y centrada con **animación de volteo** al mostrar la respuesta.
- Botón "Mostrar respuesta" y después dos botones claros: **"No la sabía"** (rojo, `x`) y **"La sabía"** (verde, `check`). Opcional: un tercer botón "Más o menos".
- Indicar de qué caja viene la tarjeta y a cuál pasará.
- Atajos de teclado: `Espacio` para voltear, `1` / `2` o `←` / `→` para fallo / acierto.
- Opción de salir y reanudar sin perder el progreso.
- Selector de qué estudiar: todo lo pendiente, un mazo concreto o una caja concreta.

---

## 5. Formularios: información más detallada

Hoy se ve poco de lo que se pide al crear o editar. Esta es la propuesta de campos, con ayudas visibles para el usuario.

### 5.1 Nuevo mazo / editar mazo

| Campo | Tipo | Obligatorio | Ayuda sugerida |
|---|---|---|---|
| Nombre | Texto (máx. 60) | Sí | "Ej.: Capitales de Europa" con contador de caracteres |
| Descripción | Texto largo (máx. 200) | No | "¿De qué trata este mazo? ¿Para qué examen o curso es?" |
| Color | Selector de paleta | No | Predeterminado según el orden |
| Ícono | Selector | No | Lista corta de íconos por tema |
| Etiquetas / tema | Chips | No | Para agrupar mazos (idiomas, medicina, historia…) |
| Meta diaria | Número | No | "Máximo de tarjetas nuevas por día" |

### 5.2 Nueva tarjeta / editar tarjeta

| Campo | Tipo | Obligatorio | Ayuda sugerida |
|---|---|---|---|
| Mazo | Selector | Sí | Con opción "Crear mazo nuevo" |
| Anverso (pregunta) | Texto largo | Sí | "Escribe la pregunta o el concepto. Una idea por tarjeta." |
| Reverso (respuesta) | Texto largo | Sí | "Respuesta corta y precisa funciona mejor." |
| Pista (opcional) | Texto | No | Se muestra bajo petición durante el estudio |
| Ejemplo / notas | Texto largo | No | Contexto adicional que aparece tras ver la respuesta |
| Imagen | Subida de archivo | No | Con vista previa |
| Etiquetas | Chips | No | Para filtrar luego |
| Caja inicial | Selector | No | Por defecto Caja 1 |

Mejoras de experiencia:
- **Vista previa en vivo** de la tarjeta (anverso y reverso) al lado del formulario.
- Botones "Guardar" y **"Guardar y crear otra"** para cargar tarjetas rápido.
- Contadores de caracteres y mensajes de error junto al campo (*"El anverso es obligatorio"*), no solo alertas.
- Aviso de **tarjeta duplicada** si ya existe un anverso igual en el mazo.
- Importar tarjetas desde CSV (anverso, reverso) para cargar muchas a la vez.
- Los formularios abren en un **modal o panel lateral**, para no salir de la pantalla actual.

### 5.3 Confirmaciones y mensajes
- Confirmación para toda acción destructiva (borrar mazo, borrar tarjeta, borrar varias).
- **Notificaciones tipo toast** tras acciones: "Tarjeta guardada", "Mazo eliminado" (con opción **Deshacer** durante unos segundos).
- Estados de carga (skeletons) en lugar de pantallas en blanco mientras se obtienen los datos.

---

## 6. Detalles de estilo

- **Bordes y sombras:** las cards ya tienen buen redondeo; usar una sombra muy suave y subirla ligeramente al pasar el cursor.
- **Espaciado:** definir una escala (4, 8, 12, 16, 24, 32 px) y respetarla.
- **Tipografía:** mantener Inter; títulos en semibold/bold, textos secundarios en `#64748B`. Probar un título con una fuente de más carácter (por ejemplo, *Plus Jakarta Sans* o *Sora*) solo para encabezados.
- **Botones:** tres niveles claros: primario (naranja relleno), secundario (gris claro o contorno) y destructivo (rojo, solo en confirmaciones).
- **Microinteracciones:** transiciones de 150–200 ms en hover y al cambiar de pantalla; animación de volteo en las tarjetas de estudio.
- **Responsive:** en móviles, barra lateral pasa a barra inferior con íconos; las cards de caja pasan a una columna.
- **Accesibilidad:** foco visible en botones y campos, `aria-label` en los botones que solo tienen ícono, no depender solo del color (acompañar con texto o ícono en aciertos/fallos).

### Variables CSS sugeridas

```css
:root {
  --azul-900: #172554;
  --azul-800: #1e3a8a;
  --azul-600: #2563eb;
  --azul-100: #dbeafe;

  --naranja-500: #f97316;
  --naranja-600: #ea580c;

  --fondo: #f8fafc;
  --superficie: #ffffff;
  --borde: #e2e8f0;
  --texto: #0f172a;
  --texto-suave: #64748b;

  --ok: #16a34a;
  --ok-fondo: #dcfce7;
  --error: #dc2626;
  --error-fondo: #fee2e2;
  --aviso: #d97706;
  --aviso-fondo: #fef3c7;

  --caja-1: #ef4444;
  --caja-2: #f97316;
  --caja-3: #eab308;
  --caja-4: #22c55e;
  --caja-5: #0d9488;

  --radio: 14px;
  --sombra: 0 1px 2px rgba(15, 23, 42, .06), 0 4px 12px rgba(15, 23, 42, .06);
}
```

---

## 7. Plan de implementación sugerido

**Fase 1: impacto visual rápido**
1. Definir variables de color y aplicarlas.
2. Instalar Lucide e incorporar íconos en menú y botones.
3. Colores por caja y botones deshabilitados correctos.
4. Estados vacíos con ícono y mensaje.

**Fase 2: usabilidad**
5. Confirmación al borrar y mensajes toast.
6. Formularios completos con validación y vista previa.
7. Mejoras de la pantalla Cajas (flujo, explicación, barra de distribución).
8. Cards de mazo con pendientes y progreso.

**Fase 3: experiencia de estudio**
9. Sesión de estudio con volteo, progreso y atajos de teclado.
10. Resumen de sesión con estadísticas.
11. Colores e íconos personalizables por mazo.

**Fase 4: extras**
12. Importar/exportar CSV, etiquetas, intervalos configurables.
13. Versión móvil pulida y modo oscuro.

---

## 8. Nota sobre los datos de prueba

Las tarjetas actuales ("dsadsad") son de prueba. Para evaluar el diseño con realismo, conviene cargar 15–20 tarjetas reales repartidas en varias cajas y 2–3 mazos distintos; así se verán los estados con contenido, pendientes y progreso.