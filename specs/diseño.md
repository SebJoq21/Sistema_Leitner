# Leitner: paleta azul, filtros de Tarjetas y hover de íconos

Cambios pedidos:
1. Cambiar los colores de todo el sitio a la paleta azul de la imagen de referencia.
2. En Tarjetas, eliminar los filtros **Etiqueta** y **Repaso**.
3. Al pasar el cursor: el lápiz (editar) en amarillo y el tacho (borrar) en rojo.

> Los nombres de clase (`.sidebar`, `.card`, `.icon-btn`, etc.) son supuestos. Hay que ajustarlos a los que use el proyecto.

---

## 1. Por qué la paleta azul

- **Contraste alto:** el azul profundo y el casi negro dan texto blanco muy legible en la barra lateral y en los botones.
- **Estados claros:** el verde de "acierto", el rojo de "fallo" y el ámbar de "editar" se distinguen bien sobre azul.
- **Colores de caja:** el degradado rojo, naranja, amarillo y verde de las cajas se ve nítido sobre un fondo azul grisáceo.
- **Modo oscuro:** el casi negro azulado ya sirve como fondo oscuro.
- **Naranja como acento:** el naranja que ya existía combina bien con el azul y se puede conservar solo para la acción "Estudiar".

---

## 2. Paleta

Los hex son aproximados, tomados de la imagen.

| Variable | Hex | Uso |
|---|---|---|
| `--tinta` | `#1C262B` | Texto, títulos, fondo del modo oscuro |
| `--azul-700` | `#114E78` | Barra lateral, botones principales |
| `--azul-500` | `#3481BC` | Acentos, enlaces, relleno de progreso |
| `--azul-100` | `#BCE0FA` | Botones secundarios, fondos suaves, barras |
| `--fondo` | `#F4F9FD` | Fondo de la página |
| `--naranja` | `#EA580C` | Acento de acción ("Estudiar"), opcional |

### Variables CSS

```css
:root {
  /* Paleta de la imagen */
  --tinta: #1C262B;
  --azul-700: #114E78;
  --azul-500: #3481BC;
  --azul-100: #BCE0FA;

  /* Superficies y texto */
  --fondo: #F4F9FD;
  --superficie: #FFFFFF;
  --borde: #D5E4F0;
  --texto: #1C262B;
  --texto-suave: #5F7280;

  /* Acento opcional para "Estudiar" */
  --naranja: #EA580C;
  --naranja-hover: #C2410C;

  /* Estados */
  --ok: #2E8B57;      --ok-fondo: #DDF2E6;
  --error: #D64545;   --error-fondo: #FCE4E4;
  --editar: #B7791F;  --editar-fondo: #FBF0D5;

  /* Cajas Leitner: de "reciente" a "dominada" */
  --caja-1: #EF4444;
  --caja-2: #F97316;
  --caja-3: #EAB308;
  --caja-4: #22C55E;
  --caja-5: #0D9488;

  --radio: 14px;
  --sombra: 0 1px 2px rgba(28, 38, 43, .06), 0 4px 12px rgba(28, 38, 43, .06);
}
```

### Aplicación a los componentes

```css
/* Barra lateral y base */
.sidebar           { background: var(--azul-700); color: #fff; }
.sidebar .active   { background: rgba(255, 255, 255, .16); border-left-color: var(--azul-100); }
body, .main        { background: var(--fondo); color: var(--texto); }
.card              { background: var(--superficie); border: 1px solid var(--borde); box-shadow: var(--sombra); }
h1, h2             { color: var(--azul-700); }

/* Botones */
.btn-primary        { background: var(--azul-700); color: #fff; }
.btn-primary:hover  { background: var(--tinta); }
.btn-secondary      { background: var(--azul-100); color: var(--azul-700); }

/* Acción "Estudiar" (acento naranja, opcional) */
.btn-study          { background: var(--naranja); color: #fff; }
.btn-study:hover    { background: var(--naranja-hover); }

/* Progreso */
.progress-bar       { background: var(--azul-100); }
.progress-fill      { background: var(--azul-500); }

/* Logo y badge de pendientes */
.logo-icon          { background: var(--naranja); color: #fff; }
.badge              { background: var(--naranja); color: #fff; }

/* Enlaces ("Ver tarjetas") */
a                   { color: var(--azul-500); }
```

### Contraste

- `#114E78` con texto blanco: alrededor de 8.8:1 (muy bueno).
- `#3481BC` con texto blanco: alrededor de 4.2:1, justo en el límite. Para botones con texto pequeño usar `#114E78`, o dejar `#3481BC` solo para elementos grandes, íconos y relleno de barras.
- `#EA580C` con texto blanco: alrededor de 3.6:1. Usarlo con texto en negrita y tamaño mediano o grande; para textos pequeños, usar `--naranja-hover`.

### Modo oscuro

Redefinir las mismas variables bajo `[data-theme="dark"]`:

```css
[data-theme="dark"] {
  --fondo: #1C262B;
  --superficie: #243239;
  --borde: #34464F;
  --texto: #E8F1F8;
  --texto-suave: #9FB4C2;
  --azul-100: #2B4558;
  --editar-fondo: #3A3220;
  --error-fondo: #3A2323;
  --ok-fondo: #1F3529;
}
```

---

## 3. Filtros de Tarjetas

Quedan solo: **Buscar**, **Mazo**, **Caja** y **Ordenar por**. Se eliminan **Etiqueta** y **Repaso**.

### HTML

Borrar los bloques de Etiqueta y Repaso de la barra de filtros.

### JavaScript

Quitar también el estado y la condición de esos dos filtros en la función que filtra la lista, para no dejar lógica muerta.

### CSS: corrección del desborde

En la captura anterior la fila de filtros se desbordaba: "Mazo" se montaba sobre "Buscar" y el último select se salía por la derecha. Con grid se arregla:

```css
.filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 16px;
  align-items: end;
}
.filters > * { min-width: 0; }        /* evita que se desborden */
.filters select,
.filters input { width: 100%; }

@media (max-width: 900px) {
  .filters { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .filters { grid-template-columns: 1fr; }
}
```

---

## 4. Hover de los íconos de acción

| Acción | Color al pasar el cursor | Fondo |
|---|---|---|
| Editar (lápiz) | Ámbar `#B7791F` | `#FBF0D5` |
| Borrar (tacho) | Rojo `#D64545` | `#FCE4E4` |
| Estudiar (play) | Verde `#2E8B57` | `#DDF2E6` |

### CSS

```css
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 0;
  background: transparent;
  color: var(--texto-suave);
  cursor: pointer;
  transition: background .15s ease, color .15s ease, transform .15s ease;
}
.icon-btn:hover { transform: translateY(-1px); }

.icon-btn.edit:hover,
.icon-btn.edit:focus-visible   { background: var(--editar-fondo); color: var(--editar); }

.icon-btn.delete:hover,
.icon-btn.delete:focus-visible { background: var(--error-fondo);  color: var(--error); }

.icon-btn.study:hover,
.icon-btn.study:focus-visible  { background: var(--ok-fondo);     color: var(--ok); }
```

### HTML

Añadir `aria-label` y `title` para que el significado de cada color sea explícito (también ayuda a lectores de pantalla y a móviles, donde no existe hover).

```html
<button class="icon-btn edit"   aria-label="Editar tarjeta"   title="Editar">…lápiz…</button>
<button class="icon-btn study"  aria-label="Estudiar tarjeta" title="Estudiar">…play…</button>
<button class="icon-btn delete" aria-label="Borrar tarjeta"   title="Borrar">…tacho…</button>
```

`:focus-visible` hace que el mismo efecto aparezca al navegar con teclado.

---

## 5. Detalle a revisar

El ámbar de "editar" (`#B7791F`) y el amarillo de la Caja 3 (`#EAB308`) son parecidos. No chocan porque aparecen en contextos distintos, pero si resulta confuso, cambiar la Caja 3 a un tono más lima, por ejemplo `#B9C25A`.

---

## 6. Lista de verificación

- [ ] Variables de color agregadas en `:root`
- [ ] Barra lateral, botones, logo y badge migrados a la paleta azul
- [ ] Acento naranja aplicado solo a "Estudiar" (o eliminado, si se prefiere solo azul)
- [ ] Colores de caja revisados en Cajas, Tarjetas y Estudiar
- [ ] Filtros Etiqueta y Repaso eliminados (HTML y JS)
- [ ] Grid de filtros aplicado y sin desborde
- [ ] Hover amarillo en lápiz, rojo en tacho, verde en play
- [ ] `aria-label` y `title` en los botones de ícono
- [ ] Modo oscuro revisado con las nuevas variables
- [ ] Contraste de textos pequeños verificado (sobre todo con `#3481BC` y el naranja)

---

## 7. Decisiones finales (implementadas)

- **Paleta azul**: definitiva. Se eliminaron las variables verdes previas.
- **Colores de mazo** (`DECK_COLORS`): set curado de saturación media, evitando rojo/ámbar/naranja (ya significan borrar, editar y "Estudiar"):
  ```js
  const DECK_COLORS = [
    '#3481BC', // azul
    '#0284C7', // celeste (subido desde #0EA5E9 para que el ícono blanco se lea)
    '#0D9488', // teal
    '#6366F1', // índigo
    '#8B5CF6', // violeta
    '#D9468F', // rosa
    '#2E8B57', // verde
    '#64748B', // gris pizarra
  ];
  const DECK_COLOR_FALLBACK = '#3481BC';
  ```
- **Caja 3**: lima `#B9C25A` (no `#EAB308`), con texto oscuro `#1C262B` sobre el color.
- **Naranja**: solo en el botón "Estudiar" y en el badge de pendientes. El logo queda `--azul-100` con el ícono en `--azul-700`.
- **Modo oscuro**: se mantiene el selector `.dark` (no `[data-theme="dark"]`); solo se trasladan los valores oscuros de la spec.