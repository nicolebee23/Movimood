# Capítulo 4: Metodología de Desarrollo

## 4.1. Introducción

Este capítulo documenta la metodología de desarrollo empleada en la implementación de MoviMood, una plataforma de recomendación de películas basada en análisis de emociones. La metodología combina principios de desarrollo ágil, arquitectura de microservicios ligeros, y prácticas de ingeniería de software orientadas a la calidad y mantenibilidad del código.

## 4.2. Paradigma de Desarrollo

### 4.2.1. Iteración Incremental

El desarrollo de MoviMood ha seguido un enfoque iterativo incremental, dividiendo las funcionalidades en ciclos de implementación correlacionados con hitos específicos:

1. **Fase 1 (Base del sistema)**: Estructura del proyecto, autenticación y flujo de usuario inicial
2. **Fase 2 (Cuestionario y recomendaciones)**: Algoritmo de análisis emocional e integración con TMDB
3. **Fase 3 (Búsqueda y descubrimiento)**: Sistema de búsqueda, detalle de películas y paginación
4. **Fase 4 (Comunidad y persistencia)**: Sistema de reseñas, videoteca personal y gestión de sesiones

Cada iteración incluye ciclos de prueba, validación y refactorización antes de avanzar a la siguiente fase.

### 4.2.2. Ciclo de Vida Ágil

Se ha implementado una versión simplificada de metodología Scrum con:
- **Sprint planning**: Priorización de funcionalidades a implementar
- **Desarrollo iterativo**: Integración de cambios en ciclos cortos
- **Validación continua**: Testing manual y automatizado
- **Retrospectivas técnicas**: Análisis post-implementación de decisiones arquitectónicas

## 4.3. Arquitectura del Sistema

### 4.3.1. Patrón Arquitectónico: Cliente-Servidor con Separación de Responsabilidades

MoviMood implementa una arquitectura de tres capas:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│                  (Frontend: React.js v19.2)                 │
│  - React Router v7.11 (enrutamiento del lado del cliente)   │
│  - Context API (gestión de estado de autenticación)         │
│  - Componentes funcionales con Hooks                        │
└─────────────────────────────────────────────────────────────┘
                              ↕
                        (HTTP / REST API)
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                      CAPA DE APLICACIÓN                     │
│                    (Backend: PHP 7.4+)                      │
│  - Endpoints REST para autenticación, reseñas, favoritos    │
│  - Gestión de sesiones con configuración CORS-friendly      │
│  - Validación de permisos y control de acceso               │
│  - Enrutamiento de solicitudes a TMDB API                   │
└─────────────────────────────────────────────────────────────┘
                              ↕
                        (PDO MySQL)
                              ↕
┌──────────────────┬──────────────────────┬──────────────────┐
│   CAPA DE DATOS  │                      │ SERVICIOS EXTERNOS│
│  (MySQL 5.7+)    │                      │   (TMDB API)     │
│  - Usuarios      │                      │   - Películas    │
│  - Reseñas       │                      │   - Géneros      │
│  - Favoritos     │                      │   - Recomendaciones│
└──────────────────┴──────────────────────┴──────────────────┘
```

### 4.3.2. Separación de Responsabilidades

- **Frontend**: Responsable de la experiencia de usuario, enrutamiento, validación de formularios y estado temporal
- **Backend**: Responsable de seguridad, persistencia de datos, gestión de sesiones y orquestación de APIs externas
- **Base de datos**: Almacenamiento persistente y recuperable de datos de usuario
- **TMDB API**: Fuente de datos de películas, géneros y metadata cinematográfica

## 4.4. Stack Tecnológico

### 4.4.1. Frontend

| Tecnología | Versión | Propósito |
|---|---|---|
| **React** | 19.2.3 | Framework UI moderno y declarativo |
| **React DOM** | 19.2.3 | Renderizado de componentes en el DOM |
| **React Router DOM** | 7.11.0 | Enrutamiento del lado del cliente |
| **Create React App** | 5.0.1 | Herramienta de construcción y empaquetamiento |
| **Node.js** | ≥20 <21 | Runtime de JavaScript para desarrollo |
| **react-easy-crop** | 5.5.6 | Editor de imágenes para avatares |

**Estrategia de gestión de estado**:
- Context API para autenticación global (reemplaza Redux en favor de simplicidad)
- Hooks personalizados (`useAuth`, `useFavoritos`, `useMovieReviews`) para lógica reutilizable
- localStorage como persistencia temporal en cliente

### 4.4.2. Backend

| Tecnología | Versión | Propósito |
|---|---|---|
| **PHP** | 7.4+ | Lenguaje de servidor, scripts CGI |
| **Apache HTTP Server** | 2.4+ (XAMPP) | Servidor web y host virtual |
| **MySQL** | 5.7+ | Base de datos relacional |
| **PDO (PHP Data Objects)** | nativo | Abstracción de acceso a base de datos |
| **cURL / file_get_contents** | nativo | Consumo de API TMDB |
| **Resend API** | v1 | Servicio de envío de emails |

**Patrones de backend**:
- Procedural con componentes de clase para modelos
- Gestión de sesiones con cookies HttpOnly y SameSite=Lax
- Endpoints REST sin framework (vanilla PHP)

### 4.4.3. Infraestructura

- **Desarrollo local**: XAMPP (Apache + MySQL + PHP)
- **Alojamiento**: Hostinger (cPanel, PHP 7.4+, MySQL)
- **Versionamiento**: Git + GitHub
- **CI/CD**: FTP automático con scripts Python (`ftp_upload.py`)
- **API de datos**: The Movie Database (TMDB) v3

## 4.5. Procesos de Implementación

### 4.5.1. Flujo de Autenticación (Session Management)

**Problema técnico identificado**: La sesión PHP no persiste entre solicitudes fetch del cliente React, causando que `auth?action=me` devolviera sesión nula aunque el usuario estuviera logueado.

**Solución implementada**:
1. Función centralizada `configureSession()` en `bootstrap.php`:
   - Configura cookies con `SameSite=Lax` (compatible con CORS)
   - HttpOnly=true para seguridad
   - Duración: 30 días

2. Mejora en `movimood.php`:
   - `action=me` acepta fallback de `profileId` desde query params si la sesión PHP no se detecta
   - `currentSessionUserId()` usa `configureSession()` centralizada
   - Soporte dual: sesión PHP primaria, fallback localStorage secundario

3. Enrutamiento SPA en `.htaccess`:
   - `index.php` actúa como router frontal
   - Excepciones: `/api/`, `/build/`, `/public/` se sirven directamente
   - Permite React Router manejar todas las rutas internas

**Resultado**: Las rutas React ahora persisten tras recarga (ej: `/perfil/:id`, `/buscar?q=`), y la sesión se mantiene entre requests de reviews y favoritos.

### 4.5.2. Algoritmo de Recomendación

**Enfoque**: Recomendación híbrida basada en contenido con scoring multidimensional.

El algoritmo pondera múltiples factores simultáneamente:

```
Puntuación(película) = 
  (géneros_seleccionados × 4.5) +
  (géneros_mood × 2.5) +
  puntuación_keywords_mood +
  puntuación_año +
  (valoración × 0.35) +
  puntuación_popularidad
```

**Componentes**:
- **Géneros seleccionados**: Coincidencia exacta con géneros del cuestionario
- **Géneros de mood**: Géneros asociados al mood actual (Miedo→Terror, Alegría→Comedia, etc.)
- **Keywords del mood**: Búsqueda textual en título y sinopsis (ej: "venganza" para enojado)
- **Puntuación por año**: Distancia del año de estreno al centro del rango elegido
- **Valoración**: Rating de TMDB con peso moderado (×0.35)
- **Popularidad**: Normalización de métricas de TMDB

**Implementación**:
- Cuestionario almacena respuestas de emociones en localStorage con clave `movimood-cuestionario`
- Mapeo de emociones → géneros cinematográficos
- Llamada a `api/tmdb-discover.php` filtra películas por género, año, duración
- Ranking client-side en `utils/recommendations.js` ordena resultados

**Ventajas de procesamiento client-side**:
- Menor latencia (evita round-trip al servidor)
- Facilita personalización en tiempo real sin API key expuesta

### 4.5.3. Sistema de Búsqueda y Descubrimiento

**Arquitectura de búsqueda**:

| Componente | Responsabilidad |
|---|---|
| **Navbar.jsx** | Input de búsqueda, evento Enter, trigger de navegación |
| **Buscar.jsx (ruta `/buscar?q=`)** | Página de resultados, paginación |
| **api/tmdb-search.php** | Endpoint que proxifica TMDB search/movie |
| **Pelicula.jsx (ruta `/pelicula/:id`)** | Detalles completos de película |

**Flujo de búsqueda**:
1. Usuario escribe en Navbar → presiona Enter o hace clic en búsqueda
2. Navegación directa a `/buscar?q=término` con query parameter
3. `Buscar.jsx` extrae query param y realiza fetch a `api/tmdb-search.php`
4. Resultados se renderizan en grid CSS (160px min-width en desktop)
5. Click en película navega a `/pelicula/:id` pasando movie data en location state
6. Si acceso directo a URL, `Pelicula.jsx` hace fetch a `api/tmdb-movie.php` como fallback

**Optimizaciones implementadas**:
- Paginación: "Cargar más" button append siguiente página (no reemplazo)
- Estado: Carga, error, sin resultados
- Lazy loading de imágenes con `loading="lazy"`
- Búsqueda soporta ambos tipos: películas (por defecto) y usuarios (filtrado local)

### 4.5.4. Sistema de Reseñas y Videoteca

**Datos persistidos**:
- **Reseñas**: localStorage + MySQL (tabla `movie_reviews`)
- **Favoritos**: localStorage + MySQL (tabla `movie_favorites`)
- **Videoteca**: Unificación de reseñas + favoritos en tabs de usuario

**Flujo de guardado de reseña**:
1. Usuario escribe reseña en `Pelicula.jsx` form
2. `useMovieReviews` hook realiza POST a `api/auth?action=save_review`
3. Backend almacena en MySQL si usuario logueado
4. Response incluye `reviewId` para sincronización
5. Se renderiza automáticamente en "Reseñas de la Comunidad"

**Sincronización**:
- `useMovieReviews` no resetea array vacío si error remoto (mantiene datos locales)
- Manejo de 401 (no autenticado) → fallback a localStorage
- Modal localStorage como backup offline

### 4.5.5. Gestión de Dependencias y Build

**Dependencias producción actuales** (5 librerías):
```json
{
  "react": "^19.2.3",
  "react-dom": "^19.2.3",
  "react-easy-crop": "^5.5.6",
  "react-router-dom": "^7.11.0",
  "react-scripts": "5.0.1"
}
```

**Criterio de selección**: Solo dependencias con uso comprobado en componentes. Librerías para testing, animaciones complejas y carruseles fueron descartadas durante revisión de código para mantener bundling ligero.
```bash
# Instalación
npm install

# Desarrollo local
npm start

# Producción
npm run build  # Genera ./build/ con assets optimizados

# Testing
npm test --passWithNoTests
```

**Decisiones de build**:
- Create React App mantiene configuración simplificada sin eject
- `homepage` en package.json: `"/movimood-frontend/"` para URLs correctas
- Environment variables en `.env`:
  - `REACT_APP_API_BASE_URL`: Endpoint backend (local: `http://localhost/movimood-frontend/api`)
  - `REACT_APP_BASENAME`: Ruta base para React Router

**Backend**:
- Archivos PHP servidos directamente por Apache
- No hay build step en backend
- Dependencias: solo librerías internas y TMDB API HTTP

## 4.6. Testing y Validación

### 4.6.1. Estrategia de Testing

| Nivel | Herramienta | Cobertura |
|---|---|---|
| **Unit Testing** | A implementar | Utilidades, hooks, funciones puras |
| **Integration Testing** | Manual | Flujos completos (ej: Login → Recomendaciones) |
| **E2E Testing** | Manual + navegador | Búsqueda → Resultados → Detalles → Reseña |
| **Performance** | Lighthouse + DevTools | Core Web Vitals, LCP, CLS, TTFB |

**Nota**: Los tests automatizados se implementarán en fases posteriores. Actualmente, la validación se realiza de forma manual a través de flujos críticos en localhost.

### 4.6.2. Ciclo de Validación Pre-Deploy

Antes de cada despliegue a Hostinger:

1. **Build local**: `npm run build` sin errores
2. **Testing manual**: Verificación de flujos críticos en localhost
3. **Verificación de CORS**: `api/` endpoints responden sin errores de origen
4. **Performance check**: Lighthouse score ≥ 80
5. **Git commit**: Tag de versión (ej: `v0.1.0`)
6. **Upload FTP**: `python ftp_upload.py` sincroniza `build/` a servidor

### 4.6.3. Monitoreo Post-Deploy

- Performance: Validación con Lighthouse DevTools
- Error logs en navegador (console.error)

## 4.7. Manejo de Errores y Resiliencia

### 4.7.1. Estrategias de Fallback

**Autenticación fallida**:
- Si sesión PHP no existe → localStorage para datos temporales
- Si API auth no responde → modo offline local

**Búsqueda sin resultados**:
- Mensaje amigable "X películas encontradas"
- Botón "Refinar búsqueda" o "Volver"

**API TMDB no disponible**:
- Retry automático con exponential backoff (1s, 2s, 4s)
- Mensaje de error al usuario tras 3 intentos fallidos
- Datos en caché si búsqueda previa fue exitosa

**Reseñas offline**:
- Guardadas en localStorage si API falla
- Sincronización automática cuando conexión se recupera

### 4.7.2. Validación de Datos

**Frontend**:
- Validación de formularios antes de envío (email, password strength)
- Sanitización de input en búsqueda (trim, validación de caracteres)
- Type checking en componentes React con JSDoc comments

**Backend**:
- Validación de tipos en PHP `movimood.php`
- Sanitización de input SQL con prepared statements (PDO)
- Restricción de CORS solo a dominios permitidos

## 4.8. Procesos de Despliegue y Actualización

### 4.8.1. Ciclo de Deployment

```
Desarrollo Local
       ↓
   npm run build
       ↓
   Validación Manual
       ↓
   Git commit + tag
       ↓
   python ftp_upload.py
       ↓
   Hostinger (en vivo)
       ↓
   Verificación en producción
```

### 4.8.2. Estrategia de Versionado

- **Versión semántica**: MAJOR.MINOR.PATCH (ej: 0.1.0)
- **package.json**: Fuente única de verdad
- **Git tags**: Sincronización con versión semántica

### 4.8.3. Rollback

Si deployment introduce errores:
1. Revert del último git commit
2. `npm run build` con versión anterior
3. `python ftp_upload.py` restablece archivos previos
4. Verificación de integridad en producción

## 4.9. Documentación y Mantenibilidad

### 4.9.1. Convenciones de Código

**Frontend**:
- Componentes en PascalCase (ej: `Navbar.jsx`)
- Hooks personalizados en camelCase con prefijo `use` (ej: `useAuth.js`)
- Propiedades CSS en variables personalizadas `:root` en `index.css`

**Backend**:
- Funciones en snake_case (ej: `currentSessionUserId()`)
- Constantes en UPPER_SNAKE_CASE
- Endpoints en kebab-case (ej: `/tmdb-search.php`)

### 4.9.2. Documentación Técnica

- **README.md**: Instrucciones de setup local, configuración de variables
- **TECHNOLOGIES_STACK.md**: Inventario completo de dependencias
- **API documentation**: Comentarios PHPDoc en endpoints
- **Commits con historias**: Descripción de cambios arquitectónicos

### 4.9.3. Recuperación ante Pérdida de Datos

- **Git history**: Recuperación de código desde repositorio remoto
- **VS Code Local History**: Snapshots automáticos en `%APPDATA%/Code/User/History`
- **Database backups**: Exports SQL regulares desde phpMyAdmin

## 4.10. Análisis de Decisiones Técnicas

### 4.10.1. ¿Por qué Create React App en lugar de Vite?

**Ventajas de CRA**:
- Configuración cero (hide complexity)
- Soporte oficial estable para React 19
- Community amplia y documentación madura
- Abstracción de webpack + Babel

**Ventajas de Vite descartadas**:
- Vite no compatible con .htaccess routing requerido para React Router
- Build más rápido no crítico en MVP (1.2s vs 0.3s)
- Complexity innecesaria para proyecto de pequeña escala

### 4.10.2. ¿Por qué Context API en lugar de Redux?

**Ventajas de Context API**:
- Boilerplate mínimo
- No requiere middleware
- Bundling más ligero (sin Redux library)
- Suficiente para autenticación + favoritos

**Limitaciones aceptadas**:
- Performance en estado muy complejo (optimizable con useMemo)
- DevTools menos feature-rich

### 4.10.3. ¿Por qué PHP en lugar de Node.js?

**Razones de selección**:
- Hostinger proporciona hosting compartido optimizado para PHP
- Costo: PHP incluido, Node.js requiere VPS
- Latencia TMDB + autenticación no crítica
- Desarrollo más ágil sin transpilation

**Limitaciones**:
- Menos frameworks maduros
- Menor ecosystem que JavaScript

## 4.11. Conclusiones Metodológicas

La metodología empleada en MoviMood equilibra pragmatismo con escalabilidad:

1. **Arquitéctura simple pero escalable**: Separación clara de capas permite agregar features sin afectar existentes
2. **Stack ligero**: Selección intencional de tecnologías maduras y con bajo overhead
3. **Procesos ágiles**: Iteración rápida con validación continua
4. **Resiliencia**: Fallbacks y manejo de errores graceful
5. **Documentación**: Mantenibilidad a través de convenciones claras

Estos principios permiten que MoviMood pueda crecer desde MVP a aplicación completa manteniendo calidad y velocity de desarrollo.

---

**Fecha de redacción**: Mayo 2026  
**Versión del proyecto**: 0.1.0  
**Estado**: Documentación completa para defensa de TFG
