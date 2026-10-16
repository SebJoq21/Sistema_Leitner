---
tipo: project
estado: en-progreso
area: "[[02 - Areas/Desarrollo de Software]]"
creado: 2026-10-15
deadline: ""
tags:
  - project
---
**Área:** [[02 - Areas/Desarrollo de Software]] | **Estado:** 🟢 En progreso

# MVP Sistema Leitner (Spaced Repetition App)

> [!abstract] Objetivo (Definition of Done)
> **Meta clara:** Construir una aplicación web funcional y segura de repetición espaciada que permita a los usuarios autenticados crear mazos de tarjetas, evaluarse mediante el algoritmo de Leitner (5 cajas), e identificar automáticamente qué tarjetas deben repasar cada día basándose en sus aciertos y errores.

---

## 1. Arquitectura y Recursos Vinculados

*   **Frontend (React/TS):** Arquitectura orientada a componentes (Atomic Design o Feature-based), desplegado en Vercel.
*   **Backend (Node.js/TS):** Arquitectura modular (separación por dominios: Controladores, Servicios y Repositorios), desplegado en Render.
*   **Base de Datos y ORM:** PostgreSQL alojada en Supabase, utilizando Prisma como ORM.
*   **Seguridad y Autenticación:** Supabase Auth (JWT) para gestión de sesiones y protección de endpoints.
*   **Conocimiento Base (03 - Resources):** [[Sistema-Leitner]] · [[Modelo-Relacional-PostgreSQL]] · [[Arquitectura-Modular-Node]]

---

## 2. Especificación Técnica y Reglas del MVP

### 2.1 El Algoritmo Leitner (Máquina de Estados)
El sistema debe manejar 5 cajas con intervalos de días fijos:
*   **Caja 1:** Repaso cada 1 día (diario).
*   **Caja 2:** Repaso cada 3 días.
*   **Caja 3:** Repaso cada 7 días (semanal).
*   **Caja 4:** Repaso cada 15 días.
*   **Caja 5:** Repaso cada 30 días.

**Lógica de Transición (Reglas de Negocio Backend):**
*   **Al crear una tarjeta:** Entra automáticamente a la `cajaActual = 1` y `proximaRevision = HOY`.
*   **Evento Respuesta Correcta:** `cajaActual` incrementa en 1. Se calcula `proximaRevision = fechaActual + intervalo_dias(nueva_caja)`.
*   **Evento Respuesta Incorrecta:** `cajaActual` vuelve a 1. Se calcula `proximaRevision = fechaActual + 1 dia`.

### 2.2 Patrones de Arquitectura del Sistema
Para garantizar escalabilidad y mantenimiento, el código no estará acoplado en un solo bloque:

**Backend (Arquitectura Modular en Node.js):**
Cada dominio de la aplicación (`Auth`, `Decks`, `Cards`, `Reviews`) tendrá su propio módulo independiente con tres capas:
1.  **Capa de Rutas/Controladores:** Recibe la petición HTTP, valida el token JWT y los datos de entrada (DTOs).
2.  **Capa de Servicios:** Contiene la lógica de negocio pura (ej. el cálculo de fechas del algoritmo de Leitner). No sabe nada de HTTP.
3.  **Capa de Repositorio (Prisma):** Se encarga exclusivamente de las consultas a la base de datos de Supabase.

**Frontend (Arquitectura por Componentes en React):**
El proyecto se estructurará agrupando archivos por funcionalidad (*Feature-Sliced*):
1.  **Componentes UI Reutilizables:** Botones, Inputs, Tarjetas genéricas (`/components/ui`).
2.  **Módulos de Dominio (Features):** Componentes complejos acoplados a la lógica de negocio (ej. `DeckList`, `StudyCard`, `LeitnerControls`).
3.  **Páginas (Views):** Contenedores que importan los componentes, manejan el enrutamiento (React Router) y gestionan el estado global o las llamadas a la API.

### 2.3 Seguridad y Flujo de Autenticación
1.  **Frontend:** El usuario inicia sesión y obtiene un JWT desde Supabase Auth.
2.  **Peticiones HTTP:** React envía el JWT en el header `Authorization: Bearer <token>`.
3.  **Backend:** Un *Middleware* en el módulo de seguridad intercepta la petición, verifica la firma, extrae el `userId` y lo inyecta en la petición.
4.  **Aislamiento de Datos:** El Repositorio de Prisma incluye obligatoriamente `where: { userId: req.user.id }` en cada consulta.

### 2.4 Esquema de Base de Datos (Prisma Models)

| Modelo Prisma | Atributos Clave | Propósito |
| :--- | :--- | :--- |
| **User** | `id` (UUID), `email`, `createdAt` | Sincronizado con Supabase Auth. |
| **Deck** | `id`, `userId` (FK), `nombre`, `descripcion` | Agrupa las tarjetas por dominio. |
| **Card** | `id`, `deckId` (FK), `frontText`, `backText`, `cajaActual`, `proximaRevision` | Estado algorítmico de Leitner. |
| **Review** | `id`, `cardId` (FK), `resultado` (Boolean), `fechaRevision` | Historial de aprendizaje. |

### 2.5 Sistema de Diseño y UI/UX (Tailwind CSS)
El enfoque visual será minimalista para evitar distracciones cognitivas durante las sesiones de estudio ("Zen Mode"), priorizando el contraste y las micro-interacciones.

*   **Paleta de Colores:**
    *   **Base:** Fondos limpios y neutros (`bg-slate-50` para claro, `bg-slate-900` para modo oscuro).
    *   **Primario/Marca:** Acentos en tonos índigo o violeta (`text-indigo-600`, `bg-indigo-600`) para botones principales y navegación.
    *   **Feedback Algorítmico:** Verde esmeralda (`bg-emerald-500`) para la acción "Acerté" y rojo/rosa (`bg-rose-500`) para "Fallé".
*   **Tipografía:** Sans-serif moderna (ej. *Inter* o *Geist*). Títulos audaces y texto de las tarjetas de estudio centrado, grande y de alto contraste (`text-2xl font-medium`).
*   **Interfaces Clave:**
    *   **Tarjetas (Cards):** Uso de bordes redondeados (`rounded-2xl`), sombras suaves (`shadow-sm`) y bordes sutiles (`border border-slate-200`) para dar profundidad táctil.
    *   **Modo Estudio:** Animación CSS 3D (`rotate-y-180`) con una transición suave (`duration-500`) al voltear la tarjeta para revelar la respuesta.
    *   **Dashboard:** Un layout de cuadrícula (`grid-cols-1 md:grid-cols-3`) para mostrar los mazos como contenedores limpios que indican visualmente el progreso o las tarjetas pendientes.

---

## 3. Alcance y Backlog de Ejecución

### Crítico / Hacer Ya (Sprint 1: Core, Lógica y Arquitectura Backend)
- [ ] **Configurar Base de Datos:** Inicializar proyecto en Supabase y definir esquema Prisma.
- [ ] **Estructura Modular Backend:** Crear el *scaffolding* de carpetas para Controladores, Servicios y Repositorios.
- [ ] **Middleware JWT:** Implementar la validación del token de Supabase en las rutas.
- [ ] **Módulo Decks:** Construir Controlador y Servicio para el CRUD de mazos, aislando los datos por usuario.
- [ ] **Módulo Cards (Motor Leitner):** Crear el Servicio independiente que reciba el resultado del repaso, aplique la máquina de estados y guarde la nueva fecha en Prisma.

### Planificado / Interfaz (Sprint 2: Arquitectura Frontend, UI y Diseño)
- [ ] **Setup Frontend Modular:** Inicializar React y crear la estructura de carpetas (`/components`, `/features`, `/pages`).
- [ ] **Sistema de Diseño Base:** Configurar variables en `tailwind.config.js` y crear componentes atómicos (`Button`, `Card`, `InputField`).
- [ ] **Feature Auth:** Construir el formulario de Login/Registro y el contexto de estado de sesión.
- [ ] **Feature Study (UI):** Desarrollar el componente `Flashcard` implementando la animación 3D de giro y botones de feedback (Verde/Rojo).
- [ ] **Ensamblaje de Vistas:** Unir los componentes en las páginas de `Dashboard` y `StudySession`.

---

## 4. Bitácora y Decisiones (Changelog)
*   **2026-10-15:** Inicio del proyecto.
*   **Decisión Arquitectónica (Backend):** Implementación de patrón modular y separación en capas (Controlador-Servicio-Repositorio) para facilitar la mantenibilidad y futuras integraciones.
*   **Decisión Arquitectónica (Frontend):** Separación estricta entre componentes visuales puros y componentes lógicos (Features) para maximizar la reutilización.
*   **Diseño (UX/UI):** Se adopta un enfoque minimalista con animaciones clave en las tarjetas para maximizar la concentración durante el estudio.
*   **Seguridad:** Delegación de credenciales a Supabase Auth.