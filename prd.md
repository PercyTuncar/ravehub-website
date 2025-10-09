# Documento de Requisitos del Producto (PRD): Ravehub

## 1. Resumen Ejecutivo

**Ravehub** es una plataforma web integral y multifuncional para la comunidad de música electrónica en Latinoamérica. Construida con **Next.js (App Router)** y **Firebase**, combina venta de entradas, merchandising, contenido editorial, interacciones sociales, y herramientas administrativas avanzadas.

El sistema incluye:
- **Catálogo completo de eventos** con mapas interactivos y fases de venta
- **Tienda de productos** con carrito offline y pagos en cuotas
- **Blog avanzado** con reacciones, comentarios anidados y sistema de calificaciones
- **Galería de imágenes** organizada por álbumes de eventos
- **Sistema de votación y rankings** para DJs por país y año
- **Sistema de sorteos** con contraseñas y selección de posts
- **Panel de administración completo** con gestión de contenido, usuarios y analytics
- **Perfiles de usuario** con historial de compras, entradas y pagos
- **Páginas informativas** (FAQ, ayuda, contacto, políticas legales)
- **Sistema de sugerencias** para nuevos DJs
- **Funcionalidades PWA** con sincronización offline y notificaciones push
- **API REST** para integraciones externas
- **SEO avanzado** con sitemaps dinámicos y datos estructurados

Este documento sirve como una guía técnica detallada para desarrolladores, describiendo la arquitectura, la estructura del código, las funcionalidades clave y las mejores prácticas del proyecto.

## 2. Propósito del Sistema

El objetivo principal de Ravehub es ser la plataforma líder y más completa para la comunidad de música electrónica en Latinoamérica, ofreciendo una experiencia integral que combina descubrimiento, compra, interacción social y gestión de contenido.

-   **Para los Usuarios Finales:**
    -   **Descubrimiento de Eventos:** Explorar catálogo completo con filtros por proximidad, país y fecha
    -   **Compra de Entradas:** Sistema de tickets con pagos en cuotas y nominación de entradas
    -   **Tienda de Merchandise:** Productos oficiales con carrito offline y múltiples métodos de pago
    -   **Contenido Editorial:** Blog con reacciones, comentarios y sistema de calificaciones
    -   **Interacción Social:** Votación de DJs, participación en sorteos, sugerencias de artistas
    -   **Galería Visual:** Álbumes de fotos de eventos con visor modal
    -   **Perfil Personal:** Gestión completa de compras, entradas, pagos e historial
    -   **Rankings y Comunidad:** Ver rankings de DJs por país/año y participar en votaciones

-   **Para los Administradores:**
    -   **Gestión de Contenido Completa:** Eventos, productos, blog, galerías, CTAs, banners
    -   **Administración de Usuarios:** Perfiles, reseñas, comentarios, seguridad
    -   **Sistema de DJs:** Perfiles, votaciones, rankings y sugerencias
    -   **Analytics y Monitoreo:** Dashboard con estadísticas de ventas, usuarios y contenido
    -   **Configuración Avanzada:** Monedas, API, seguridad, herramientas administrativas
    -   **Moderación de Contenido:** Comentarios, reseñas, reacciones y reportes

-   **Para los Organizadores de Eventos:**
    -   **Herramientas de Publicación:** Creación de eventos con zonas, fases de venta y precios dinámicos
    -   **Gestión de Ventas:** Seguimiento de tickets vendidos y gestión de pagos
    -   **CTAs Personalizados:** Llamadas a acción con WhatsApp o enlaces directos
    -   **Contenido Asociado:** Blogs relacionados y galerías de eventos

-   **Para los Artistas/DJs:**
    -   **Perfiles Públicos:** Información detallada, redes sociales y estadísticas
    -   **Participación en Rankings:** Sistema de votación comunitaria
    -   **Sugerencias:** Posibilidad de ser sugeridos por la comunidad
    -   **Contenido Asociado:** Eventos, blogs y merchandise relacionados

## 3. Arquitectura y Tecnologías

Ravehub utiliza un stack tecnológico moderno para ofrecer un alto rendimiento, escalabilidad y una excelente experiencia de desarrollador.

-   **Framework Frontend:** [Next.js](https://nextjs.org/) 15.2.4 con **App Router**, aprovechando el renderizado del lado del servidor (SSR) y la generación de sitios estáticos (SSG) para un rendimiento óptimo y SEO.
-   **Lenguaje de Programación:** [TypeScript](https://www.typescriptlang.org/), que garantiza un código más seguro y mantenible.
-   **Backend y Base de Datos:** [Firebase](https://firebase.google.com/), utilizando:
    -   **Firestore:** Como base de datos NoSQL para almacenar eventos, productos, usuarios, etc.
    -   **Firebase Authentication:** Para la gestión de usuarios (incluido el inicio de sesión con Google).
    -   **Firebase Storage:** Para el almacenamiento de archivos como imágenes y otros medios.
-   **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para un diseño rápido y personalizable, junto con **PostCSS**.
-   **Gestión de Estado:** **React Context** para gestionar el estado global de la aplicación (autenticación, carrito de compras, moneda y geolocalización).
-   **Componentes UI:** [Shadcn/UI](https://ui.shadcn.com/) y [Radix UI](https://www.radix-ui.com/) para construir componentes de interfaz de usuario accesibles y reutilizables.
-   **PWA (Progressive Web App):** Implementado con un **Service Worker** personalizado para permitir la funcionalidad sin conexión y la instalación en dispositivos.
-   **Validación de Datos:** [Zod](https://zod.dev/) para la validación de esquemas de datos tanto en el cliente como en el servidor.

## 4. Estructura de Carpetas y Archivos

El proyecto está organizado de una manera lógica y escalable, siguiendo las convenciones de Next.js y separando las responsabilidades.

-   `app/`: Contiene todas las rutas de la aplicación, siguiendo la convención del App Router.
    -   `layout.tsx`: El layout raíz que envuelve toda la aplicación, donde se configuran los proveedores de contexto (`ThemeProvider`, `AuthProvider`, `CartProvider`, etc.).
    -   `page.tsx`: La página de inicio de la aplicación.
    -   `admin/`: Las rutas y componentes para el panel de administración.
    -   `api/`: Rutas de API para funcionalidades del lado del servidor, como webhooks o tareas de revalidación.
    -   `[slug]/`: Rutas dinámicas para mostrar detalles de eventos, productos o posts del blog.

-   `components/`: Componentes de React reutilizables.
    -   `ui/`: Componentes de interfaz de usuario básicos y genéricos (botones, inputs, diálogos), construidos sobre Shadcn/UI.
    -   `home/`, `events/`, `blog/`, etc.: Componentes específicos para cada sección de la aplicación.
    -   `navbar.tsx`: La barra de navegación principal.
    -   `footer.tsx`: El pie de página.

-   `lib/`: Lógica de negocio, utilidades y acceso a datos.
    -   `firebase/`: Funciones para interactuar con Firebase (Firestore, Auth, Storage). Cada colección (eventos, usuarios, etc.) tiene su propio archivo.
    -   `pwa/`: Lógica relacionada con la Progressive Web App, como la gestión del Service Worker y la sincronización sin conexión.
    -   `utils.ts`: Funciones de utilidad generales.
    -   `schema.ts`: Esquemas de validación de Zod.

-   `context/`: Proveedores de React Context para la gestión del estado global.
    -   `auth-context.tsx`: Gestiona el estado de autenticación del usuario.
    -   `cart-context.tsx`: Gestiona el estado del carrito de compras.
    -   `currency-context.tsx`: Gestiona la moneda seleccionada por el usuario.
    -   `geolocation-context.tsx`: Gestiona la información de geolocalización del usuario.

-   `hooks/`: Hooks de React personalizados y reutilizables.
    -   `use-offline-sync.ts`: Hook para gestionar acciones que se realizan sin conexión.

-   `public/`: Archivos estáticos, como imágenes, iconos y el `manifest.json` para la PWA.
    -   `sw.js`: El archivo del Service Worker.

-   `types/`: Definiciones de tipos de TypeScript para los modelos de datos de la aplicación (ej. `Event`, `Product`, `User`).

## 5. Páginas y Funcionalidades del Sistema

### Páginas Públicas

#### Página de Inicio (`app/page.tsx`)
- **Hero section** con llamada a acción principal
- **Eventos destacados** con carrusel
- **Sección de países** con eventos por ubicación
- **Sección de newsletter** para suscripción
- **Testimonios** de usuarios
- **CTA section** para registro

#### Catálogo de Eventos (`app/eventos/`)
- **Página principal** (`page.tsx`): Listado de eventos con filtros por país, fecha y búsqueda
- **Página de detalle** (`[slug]/page.tsx`): Información completa del evento, line-up, ubicación, fases de venta, mapa interactivo
- **Filtros avanzados**: Por proximidad, país, fecha, precio
- **Ordenación**: Eventos futuros primero (por fecha), eventos pasados después (más recientes primero)

#### Tienda de Productos (`app/tienda/`)
- **Página principal** (`page.tsx`): Catálogo de productos con filtros y categorías
- **Página de detalle** (`[slug]/page.tsx`): Información detallada del producto, variantes, imágenes, reseñas
- **Carrito de compras** (`carrito/page.tsx`): Gestión del carrito con persistencia offline
- **Categorías** (`categorias/page.tsx`): Navegación por categorías de productos
- **Productos por categoría** (`categorias/[slug]/page.tsx`): Listado filtrado por categoría
- **Checkout** (`checkout/page.tsx`): Proceso de compra con múltiples métodos de pago

#### Blog (`app/blog/`)
- **Página principal** (`page.tsx`): Listado de posts con filtros y categorías
- **Página de detalle** (`[slug]/page.tsx`): Post completo con reacciones, comentarios y compartir
- **Categorías del blog** (`categorias/[slug]/page.tsx`): Posts filtrados por categoría
- **Etiquetas del blog** (`etiquetas/[slug]/page.tsx`): Posts filtrados por etiqueta
- **Sistema de reacciones**: Like, love, laugh, etc. con animaciones
- **Comentarios anidados**: Sistema de comentarios con respuestas
- **Calificaciones**: Sistema de rating para posts

#### Galería de Imágenes (`app/galeria/`)
- **Página principal** (`page.tsx`): Álbumes organizados por eventos
- **Página de detalle** (`[slug]/page.tsx`): Visor de imágenes con navegación
- **Filtros**: Por evento, fecha, tipo de contenido

#### Sistema de Rankings (`app/top/`)
- **Rankings por país y año** (`[country]/[year]/page.tsx`): Top DJs con votaciones
- **Ranking general** (`dj-ranking/page.tsx`): Ranking global de DJs

#### Sistema de Votación (`app/votar/`)
- **Página de votación**: Interfaz para votar por DJs favoritos
- **Sistema de votación único** por usuario

#### Sistema de Sorteos (`app/sorteo/`)
- **Página principal** (`page.tsx`): Sistema de rifas con contraseña
- **Selección de posts**: Para participar en sorteos
- **Sistema de ganadores**: Display de resultados

#### Páginas Informativas
- **Equipo** (`app/team/page.tsx`): Presentación del equipo Ravehub
- **FAQ** (`app/faq/page.tsx`): Preguntas frecuentes
- **Centro de Ayuda** (`app/ayuda/page.tsx`): Guía detallada de uso
- **Contacto** (`app/contacto/page.tsx`): Formulario de contacto
- **Políticas Legales**:
  - **Privacidad** (`app/privacidad/page.tsx`)
  - **Términos de Servicio** (`app/terminos/page.tsx`)
  - **Política de Reembolsos** (`app/reembolsos/page.tsx`)

#### Autores (`app/autores/`)
- **Perfil de autor** (`[slug]/page.tsx`): Biografía y posts de cada autor

#### Sugerir DJ (`app/sugerir-dj/`)
- **Formulario de sugerencias**: Para proponer nuevos DJs a la plataforma

### Páginas de Usuario (Requieren Autenticación)

#### Perfil de Usuario (`app/perfil/`)
- **Página principal** (`page.tsx`): Información del perfil y navegación
- **Compras** (`compras/page.tsx`): Historial de pedidos y productos
- **Entradas** (`entradas/page.tsx`): Gestión de entradas adquiridas
- **Pagos** (`pagos/page.tsx`): Historial de pagos e installments
- **Ajustes** (`ajustes/page.tsx`): Configuración de cuenta y preferencias

#### Autenticación (`app/`)
- **Registro** (`registro/page.tsx`): Formulario de registro con validación
- **Inicio de Sesión** (`login/page.tsx`): Login con email/contraseña y Google
- **Recuperar Contraseña** (`recuperar-password/page.tsx`): Solicitud de reset
- **Restablecer Contraseña** (`restablecer-password/page.tsx`): Formulario de nuevo password
- **Completar Registro** (`completar-registro/page.tsx`): Finalización de registro Google

### Panel de Administración (`app/admin/`)

#### Dashboard Principal (`admin/page.tsx`)
- **Estadísticas generales**: Eventos, ventas, usuarios activos
- **Navegación** a diferentes secciones administrativas

#### Gestión de Eventos (`admin/events/`)
- **Listado** (`page.tsx`): Todos los eventos con filtros
- **Crear evento** (`new/page.tsx`): Formulario completo de creación
- **Editar evento** (`[id]/edit/page.tsx`): Edición de eventos existentes

#### Gestión de Productos (`admin/products/`)
- **Listado** (`page.tsx`): Catálogo de productos
- **Crear producto** (`new/page.tsx`): Formulario de producto
- **Editar producto** (`[id]/edit/page.tsx`): Edición de productos

#### Gestión del Blog (`admin/blog/`)
- **Listado de posts** (`page.tsx`): Gestión de contenido
- **Crear post** (`new/page.tsx`): Editor de blog
- **Editar post** (`[id]/edit/page.tsx`): Edición de posts
- **Categorías** (`categorias/`): Gestión de categorías del blog
- **Etiquetas** (`etiquetas/`): Gestión de etiquetas
- **Comentarios** (`comentarios/page.tsx`): Moderación de comentarios

#### Gestión de Categorías (`admin/categories/`)
- **Listado** (`page.tsx`): Categorías de productos
- **Crear categoría** (`new/page.tsx`)
- **Editar categoría** (`[id]/edit/page.tsx`)

#### CTAs Personalizados (`admin/ctas/`)
- **Listado** (`page.tsx`): Call-to-actions para eventos
- **Crear CTA** (`new/page.tsx`)
- **Editar CTA** (`[id]/edit/page.tsx`)

#### Gestión de DJs (`admin/djs/`)
- **Perfiles** (`profiles/page.tsx`): Gestión de perfiles de DJs
- **Sistema de votación** (`voting/page.tsx`): Configuración de votaciones

#### Galería Administrativa (`admin/galeria/`)
- **Listado de álbumes** (`page.tsx`)
- **Crear álbum** (`new/page.tsx`)
- **Editar álbum** (`[id]/edit/page.tsx`)
- **Gestión de imágenes** (`[id]/page.tsx`)

#### Reseñas y Comentarios (`admin/reviews/`)
- **Moderación** (`page.tsx`): Gestión de reseñas de productos

#### Configuración de Seguridad (`admin/seguridad/`)
- **Configuración** (`page.tsx`): Ajustes de seguridad

#### Configuración General (`admin/settings/`)
- **Ajustes generales** (`general/page.tsx`)
- **Configuración de moneda** (`currency-settings/page.tsx`)
- **API settings** (`api/page.tsx`)

#### Banners de Tienda (`admin/store/banners/`)
- **Listado** (`page.tsx`): Gestión de banners promocionales
- **Crear banner** (`new/page.tsx`)
- **Editar banner** (`[id]/edit/page.tsx`)

#### Herramientas Administrativas (`admin/tools/`)
- **Reacciones** (`reactions/page.tsx`): Gestión del sistema de reacciones

#### Datos de Prueba (`admin/fake-data/`)
- **Generación** (`page.tsx`): Herramientas para datos de desarrollo

### API Routes (`app/api/`)

#### Contacto (`api/contact/`)
- **Envío de formularios**: Procesamiento de mensajes de contacto

#### Tasas de Cambio (`api/exchange-rates/`)
- **Conversión de monedas**: API para obtener tasas de cambio actualizadas

#### Notificaciones Push (`api/push/`)
- **Registro de dispositivos** (`register/route.ts`)
- **Claves VAPID** (`vapid-key/route.ts`)
- **Claves públicas** (`key/route.ts`)

#### SEO (`api/revalidate-sitemap/`)
- **Revalidación**: Actualización automática del sitemap

#### Webhooks (`api/webhooks/`)
- **Actualización de contenido** (`content-updated/route.ts`): Integraciones externas

### Páginas Especiales

#### Página Offline (`app/offline/page.tsx`)
- **Contenido sin conexión**: Navegación básica cuando no hay internet

#### Página 404 (`app/not-found.tsx`)
- **Error 404**: Página de error para rutas no encontradas

## 5. Funcionalidades Clave

### Autenticación

-   **Implementación:** `context/auth-context.tsx` y `lib/firebase/auth.ts`.
-   **Características:**
    -   Registro e inicio de sesión con correo electrónico y contraseña.
    -   Inicio de sesión con Google.
    -   Persistencia de la sesión del usuario.
    -   Gestión de perfiles de usuario en Firestore.
    -   Rutas protegidas para el perfil de usuario y el panel de administración.

### Gestión de Eventos

-   **Implementación:** `app/eventos/`, `lib/firebase/events.ts`.
-   **Características:**
    -   Listado de eventos con filtros y ordenación por proximidad.
    -   Página de detalles para cada evento con información completa (line-up, ubicación, fases de venta).
    -   Funcionalidad para destacar eventos en la página de inicio.
    -   Gestión de eventos (crear, editar, eliminar) en el panel de administración.

### Tienda y Carrito de Compras

-   **Implementación:** `app/tienda/`, `context/cart-context.tsx`.
-   **Características:**
    -   Catálogo de productos con categorías y filtros.
    -   Página de detalles del producto.
    -   Carrito de compras persistente en `localStorage`.
    -   **Funcionalidad sin conexión:** Los usuarios pueden agregar productos al carrito sin conexión, y las acciones se sincronizan cuando se recupera la conexión.

### Progressive Web App (PWA)

-   **Implementación:** `public/sw.js`, `lib/pwa/`, `components/pwa/`.
-   **Características:**
    -   **Instalable:** Los usuarios pueden instalar la aplicación en sus dispositivos para un acceso rápido.
    -   **Soporte sin conexión:** El Service Worker cachea los recursos clave de la aplicación, permitiendo la navegación básica sin conexión.
    -   **Sincronización en segundo plano:** Las acciones realizadas sin conexión (como agregar al carrito) se guardan en IndexedDB y se sincronizan con el servidor cuando se restablece la conexión.

## 6. Flujo de Datos

El flujo de datos en Ravehub sigue un patrón claro y desacoplado:

1.  **UI (Componentes):** Los componentes de React en `components/` y `app/` renderizan la interfaz de usuario.
2.  **Estado (Context):** Los componentes interactúan con los proveedores de Context en `context/` para acceder y modificar el estado global (ej. `cartContext.addItem()`).
3.  **Lógica de Negocio (Lib):** Los proveedores de Context utilizan las funciones en `lib/` para realizar operaciones de lógica de negocio y acceso a datos (ej. `createEvent(eventData)`).
4.  **Backend (Firebase):** Las funciones en `lib/firebase/` se comunican directamente con los servicios de Firebase para leer o escribir datos.

**Ejemplo de flujo (Agregar al carrito):**

1.  El usuario hace clic en "Agregar al carrito" en un componente de producto.
2.  El componente llama a la función `addItem` del `CartContext`.
3.  `CartContext` actualiza su estado, lo que provoca una nueva renderización de los componentes relevantes.
4.  El estado del carrito se guarda en `localStorage` para persistencia.
5.  Si no hay conexión, la acción se guarda en una cola en IndexedDB a través de `use-offline-sync`.
6.  Cuando se recupera la conexión, el Service Worker procesa la cola y sincroniza los datos con Firebase.

## 7. Configuración SEO

El proyecto implementa varias estrategias avanzadas de SEO para maximizar la visibilidad en los motores de búsqueda:

-   **Sitemaps Dinámicos:** Se generan sitemaps (`app/sitemap.ts`) dinámicamente a partir de los datos en Firestore, asegurando que todo el contenido (eventos, productos, posts) esté indexado.
-   **`robots.txt`:** Se genera un archivo `robots.txt` (`app/robots.ts`) para guiar a los rastreadores, permitiendo el acceso a las páginas públicas y bloqueando las áreas privadas.
-   **Metadatos:** Se utilizan los metadatos de Next.js para generar etiquetas `<title>` y `<meta description>` dinámicas y relevantes para cada página.
-   **Datos Estructurados (JSON-LD):** Se inyectan datos estructurados (Schema.org) en las páginas de eventos, productos y posts del blog para habilitar "rich snippets" en los resultados de búsqueda de Google.

## 8. Recomendaciones y Prácticas Observadas

### Buenas Prácticas Observadas

-   **Estructura de Proyecto Escalable:** La separación de responsabilidades por carpetas (`app`, `components`, `lib`, `context`) facilita el mantenimiento y la escalabilidad.
-   **Uso de TypeScript:** El uso de tipos en toda la aplicación mejora la robustez y la experiencia de desarrollo.
-   **Componentes Reutilizables:** La creación de un conjunto de componentes de UI en `components/ui` promueve la consistencia visual.
-   **Abstracción del Acceso a Datos:** Centralizar las llamadas a Firebase en la capa `lib/` desacopla la lógica de negocio de la implementación del backend.

### Recomendaciones

-   **Habilitar Verificaciones en el Build:** En `next.config.mjs`, los flags `eslint.ignoreDuringBuilds` y `typescript.ignoreBuildErrors` están actualmente en `true`. Se recomienda establecerlos en `false` y corregir los errores de linting y tipado para garantizar una mayor calidad del código.
-   **Optimizar el Polling de Moneda:** El componente `ProductDetail` utiliza un polling agresivo para obtener la moneda del `Navbar`. Esto debería refactorizarse para utilizar un patrón más eficiente, como compartir el estado a través del `CurrencyContext`.
-   **Funcionalidades Adicionales Implementadas:**
    - **Sistema de Sorteos:** `app/sorteo/` - Sistema de rifas y sorteos para eventos con sistema de contraseñas y selección de posts.
    - **Sistema de Votación de DJs:** `app/votar/` - Permite a los usuarios votar por sus DJs favoritos.
    - **Rankings de DJs:** `app/top/[country]/[year]/` - Muestra rankings de DJs por país y año.
    - **Galería de Imágenes:** `app/galeria/` - Galería organizada por álbumes de eventos con filtros y visor modal.
    - **Equipo:** `app/team/` - Página que presenta al equipo detrás de Ravehub.
    - **Preguntas Frecuentes:** `app/faq/` - Sección de preguntas frecuentes sobre la plataforma.
    - **Ayuda:** `app/ayuda/` - Centro de ayuda con información detallada.
    - **Contacto:** `app/contacto/` - Formulario de contacto y página de contacto.
    - **Políticas Legales:** Páginas de privacidad (`privacidad`), términos de servicio (`terminos`), y política de reembolsos (`reembolsos`).
    - **Sistema de Sugerencias de DJs:** `app/sugerir-dj/` - Permite a los usuarios sugerir nuevos DJs.
    - **Bloqueo de Cuentas:** Sistema de seguridad que bloquea cuentas después de múltiples intentos fallidos de login.
    - **Banners de Tienda:** Sistema de banners promocionales en la tienda.
    - **CTAs Personalizados:** Call-to-Actions personalizables para eventos con WhatsApp o enlaces.
    - **Blog Avanzado:** Sistema de blog con reacciones, comentarios, calificaciones, y esquema estructurado.
    - **Pagos en Cuotas:** Sistema de pagos fraccionados para entradas y productos.
    - **Nominación de Entradas:** Permite nominar entradas a terceros con validación de documentos.
    - **Panel de Administración Completo:** Dashboard administrativo con pestañas para eventos, productos, blog, usuarios, pedidos, entradas, galerías, CTAs, y estadísticas.
-   **Añadir Pruebas:** Implementar pruebas unitarias para la lógica de negocio en `lib/` y `context/`, y pruebas de extremo a extremo (E2E) para los flujos de usuario críticos, como el proceso de compra.
-   **Corregir Errores de TypeScript:** Resolver los errores de funciones duplicadas en `lib/firebase/blog.ts` (pinComment y unpinComment están declaradas múltiples veces con diferentes firmas).
-   **Mejoras SEO para el Blog:**
    - **Aumentar Contenido:** El blog actualmente tiene solo 3 posts publicados. Se necesitan al menos 20-30 posts de calidad para competir en búsquedas.
    - **Estrategia de Keywords:** Implementar investigación de palabras clave específicas para "música electrónica [país]", "festivales [ciudad]", "DJ [artista]", etc.
    - **Contenido Evergreen:** Crear guías, tutoriales y reseñas que mantengan relevancia temporal.
    - **Optimización de Imágenes:** Implementar compresión automática y atributos alt descriptivos.
    - **Internal Linking:** Mejorar la estructura de enlaces internos entre posts relacionados.
    - **Velocidad de Carga:** Optimizar imágenes y implementar lazy loading más agresivo.
    - **Mobile-First:** Asegurar experiencia perfecta en dispositivos móviles.
    - **Búsqueda por Voz:** Optimizar para consultas conversacionales en español.
    - **Contenido Multimedia:** Añadir más videos, infografías y contenido interactivo.
    - **SEO Local:** Enfatizar ubicaciones específicas de eventos en Latinoamérica.
    - **Autoridad de Dominio:** Construir backlinks de calidad desde sitios relacionados con música.
-   **Configurar Variables de Entorno:** Asegurar que las claves API necesarias estén configuradas (RESEND_API_KEY para envío de emails, OPEN_EXCHANGE_RATES_API_KEY para tasas de cambio, etc.) para evitar errores en el build.
-   **Compatibilidad con Next.js 15:** Actualizar todas las rutas dinámicas para usar `await params` en lugar de acceder directamente a `params.slug`, ya que en Next.js 15 los parámetros de ruta son ahora Promises.
-   **Optimizaciones SEO Implementadas:**
    - **Título optimizado:** Aumentado de 39 a 78 caracteres para mejor cumplimiento de estándares SEO (50-60 caracteres recomendado).
    - **Meta descripción optimizada:** Reducida de 161 a 138 caracteres para cumplir con el límite recomendado de 120-160 caracteres.
    - **Schema Local Business:** Agregado schema de organización local para mejorar resultados de búsqueda locales.
    - **Protección de emails:** Emails ofuscados (info[at]ravehublatam[dot]com) para prevenir spam y mejorar seguridad.
    - **Mejora de velocidad:** Implementadas optimizaciones para reducir el tamaño de página de 6.17MB (objetivo: <5MB).

