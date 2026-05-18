# 📋 MoviMood - Stack Tecnológico Completo

## Análisis exhaustivo de tecnologías, librerías, herramientas y arquitectura

**Fecha del análisis:** Mayo 2026  
**Versión del proyecto:** 0.1.0

---

## 1. FRONTEND - React (JavaScript)

### 1.1 Versiones y Runtime
- **Node.js**: `>=20 <21` (compatible con v20, no v24 - evita DEP0176)
- **React**: `^19.2.3`
- **React DOM**: `^19.2.3`
- **Build tool**: Create React App (CRA) con `react-scripts 5.0.1`

### 1.2 Enrutamiento
- **react-router-dom**: `^7.11.0`
  - Gestión de rutas del lado del cliente
  - Rutas protegidas con `ProtectedRoute.jsx`
  - Rutas actuales: `/`, `/cuestionario`, `/resultados`, `/videoteca`, `/perfil`, `/configuracion`, `/buscar`, `/pelicula/:id`, `/login`, `/registro`, `/recuperar-password`, `/privacidad`, `/aviso-legal`

### 1.3 Librerías de Utilidad
- **lottie-react**: `^2.4.1`
  - Animaciones Lottie en formato JSON
  - Uso: Animaciones de carga, efectos visuales

- **react-easy-crop**: `^5.5.6`
  - Herramienta de recorte de imágenes para avatares
  - Interfaz interactiva para editar áreas de imágenes

- **react-slick**: `^0.31.0`
  - Carrusel/Slider de películas
  - Pares con `slick-carousel`

- **slick-carousel**: `^1.8.1`
  - CSS y dependencias de renderización para carrusel
  - Incluye estilos base y jQuery

### 1.4 Testing
- **@testing-library/react**: `^16.3.1` - Pruebas unitarias de componentes React
- **@testing-library/jest-dom**: `^6.9.1` - Matchers adicionales para DOM
- **@testing-library/dom**: `^10.4.1` - Utilidades para testing del DOM
- **@testing-library/user-event**: `^13.5.0` - Simulación de eventos del usuario

### 1.5 Performance
- **web-vitals**: `^2.1.4`
  - Monitoreo de métricas de rendimiento (LCP, FID, CLS, TTFB, INP)
  - Reporte de Core Web Vitals

---

## 2. ESTRUCTURA FRONTEND

### 2.1 Árbol de Componentes
```
src/
├── App.js (Router principal con BrowserRouter)
├── App.css
├── index.js (Entry point con AuthProvider)
├── index.css
├── componentes/
│   ├── Navbar.jsx / Navbar.css (Navegación con barra de búsqueda)
│   ├── Footer.jsx / Footer.css (Pie de página)
│   ├── CookieBanner.jsx / CookieBanner.css (Consentimiento de cookies)
│   ├── ProtectedRoute.jsx (HOC para rutas autenticadas)
│   ├── BotonMood.jsx / BotonMood.css (Botones con iconos SVG de emociones)
│   └── SliderAnios.jsx / SliderAnios.css (Controles de rango de años)
│
├── paginas/
│   ├── Home.jsx / Home.css (Portada)
│   ├── Cuestionario.jsx (Cuestionario de emociones)
│   ├── Resultados.jsx / Resultados.css (Películas recomendadas)
│   ├── Videoteca.jsx / Videoteca.css (Colección de películas del usuario)
│   ├── Perfil.jsx / Perfil.css (Perfil de usuario)
│   ├── Configuracion.jsx / Configuracion.css (Preferencias)
│   ├── Buscar.jsx / Buscar.css (Búsqueda de películas)
│   ├── Pelicula.jsx / Pelicula.css (Detalles de película)
│   ├── Login.jsx (Autenticación)
│   ├── Registro.jsx (Creación de cuenta)
│   ├── RecuperarPassword.jsx (Reset de contraseña)
│   ├── Auth.css (Estilos compartidos de autenticación)
│   ├── Privacidad.jsx / Privacidad.css (Política de privacidad)
│   └── AvisoLegal.jsx / AvisoLegal.css (Aviso legal)
│
├── hooks/
│   ├── useAuth.js (Context API para autenticación - gestiona usuarios + sesión)
│   ├── useFavoritos.js (Hook para gestionar películas favoritas)
│   └── useMovieReviews.js (Hook para gestionar reseñas de películas)
│
└── utils/
    ├── movimoodApi.js (Cliente fetch para llamadas a /api/)
    └── recommendations.js (Algoritmo de recomendación client-side)
```

### 2.2 Estrategia de Autenticación
- **AuthProvider (useAuth.js)**:
  - Context API para estado global de usuario
  - Almacenamiento dual: localStorage + sesión PHP
  - Gestión de registro, login, recuperación de contraseña
  - Sincronización automática con backend

### 2.3 Almacenamiento Local
```javascript
localStorage keys:
- 'movimood-users' → Array de usuarios registrados localmente
- 'movimood-session-user' → Usuario actualmente logueado
- 'movimood-favoritos' → Películas favoritas (ver-mas-tarde, ya-vista, no-interesa)
- 'movimood-movie-reviews' → Reseñas de películas (mood, rating, comentario)
- 'movimood-cuestionario' → Respuestas del cuestionario de emociones
```

### 2.4 Configuración de Build
- **Homepage**: `/movimood-frontend/` (rutas relativas en producción)
- **Proxy API**: `http://localhost/movimood-frontend` (desarrollo local)
- **Scripts npm**:
  - `npm start` → `react-scripts start` (dev mode en localhost:3000)
  - `npm build` → `react-scripts build` (producción, carpeta `/build`)
  - `npm test` → `react-scripts test` (modo watch)

---

## 3. BACKEND - PHP

### 3.1 Versión y Runtime
- **PHP**: 7.4+ (Tipado estricto: `declare(strict_types=1)`)
- **Arquitectura**: API REST con endpoints disparados por parámetros GET/POST
- **CORS**: Habilitado para localhost:3000, 3001, 3002 y 127.0.0.1

### 3.2 Estructura de APIs (`/api/`)

#### **Rutas de autenticación (movimood.php)**
```
GET  /api/movimood.php?action=me
     Devuelve: Usuario actual de sesión PHP
     Fallback: Acepta ?profileId=uuid desde query si sesión no existe

POST /api/movimood.php?action=register
     Body: { username, email, password, name }
     Devuelve: Usuario creado + token de sesión

POST /api/movimood.php?action=login
     Body: { email, password }
     Devuelve: Usuario autenticado + sesión PHP iniciada

POST /api/movimood.php?action=logout
     Devuelve: { success: true }

GET  /api/movimood.php?action=users
     Devuelve: Array de todos los usuarios (públicamente)

POST /api/movimood.php?action=recoverPassword
     Body: { email }
     Devuelve: Link de recuperación (envía email)
```

#### **Rutas de películas TMDB (tmdb-search.php, tmdb-discover.php, tmdb-movie.php)**
```
GET /api/tmdb-search.php?query=Inception&language=es-ES
    Devuelve: Array de películas del TMDB search API

GET /api/tmdb-discover.php?with_genres=28&sort_by=popularity.desc&...
    Devuelve: Películas descubiertas según filters
    Parámetros: with_genres, sort_by, vote_count.gte, with_runtime.gte/lte, etc.

GET /api/tmdb-movie.php?id=550&language=es-ES
    Devuelve: Detalles completos de una película
```

#### **Rutas de favoritos y reseñas**
```
POST /api/movimood.php?action=saveFavorite
     Body: { movieId, listType: 'ver-mas-tarde'|'ya-vista'|'no-interesa' }
     Devuelve: { id, savedAt }

POST /api/movimood.php?action=addMovieReview
     Body: { movieId, mood, rating, comment, author }
     Devuelve: Review creada

GET  /api/movimood.php?action=movieReviews&movieId=550
     Devuelve: Array de reseñas para película
```

### 3.3 Utilidades PHP (bootstrap.php / _lib/)

```php
// Funciones core
sendJson(int $statusCode, array $payload): void
  → Envía respuesta JSON con headers correctos

allowCors(): void
  → Configura headers CORS para localhost

configureSession(): void
  → Inicia sesión PHP con cookies SameSite=Lax, HttpOnly, 30 días

loadEnvValue(string $key): ?string
  → Lee variables de .env con fallback a getenv()

buildTmdbUrl(string $apiKey): string
  → Construye URL válida para TMDB API v3/v4

requestMethod(): string
  → Retorna método HTTP actual

normalizeBool(mixed $value): bool
  → Convierte valores a booleano

decodeJsonField(mixed $value): array
  → Parse seguro de campos JSON de MySQL

moviePayload(array $movieJson, ?array $questionnaireJson, array $row): array
  → Formatea respuesta de película para frontend

reviewPayload(array $row): array
  → Formatea reseña para respuesta JSON
```

### 3.4 Manejo de Bases de Datos
- **Librería**: PDO (Prepared Statements)
- **Modelo de conexión**: MySQLi indirectamente via PDO
- **Inicialización**: En bootstrap.php (conexión centralizada)

---

## 4. BASE DE DATOS - MySQL

### 4.1 Configuración
- **Hosting**: Hostinger (recomendado) / XAMPP local
- **Charset**: `utf8mb4` (soporte completo Unicode)
- **Nombre**: `movimood_db` (recomendado en Hostinger)
- **Engine**: InnoDB (transacciones, foreign keys)

### 4.2 Esquema de Tablas

#### **movimood_users**
```sql
id (VARCHAR 36, UUID)
username (VARCHAR 18, UNIQUE)
name (VARCHAR 120)
email (VARCHAR 255, UNIQUE)
password_hash (VARCHAR 255, bcrypt/argon2)
avatar_url (TEXT, nullable)
notifications_app (TINYINT 1, default 1)
notifications_email (TINYINT 1, default 0)
created_at (TIMESTAMP, AUTO)
updated_at (TIMESTAMP, AUTO)
```

#### **movimood_favorite_movies**
```sql
id (BIGINT, AUTO_INCREMENT)
user_id (VARCHAR 36, FK → movimood_users)
movie_id (BIGINT, from TMDB)
movie_json (JSON, snapshot de TMDB data)
questionnaire_json (JSON, respuestas del cuestionario, nullable)
list_type (ENUM: 'ver-mas-tarde'|'ya-vista'|'no-interesa')
is_essential (TINYINT 1, default 0)
saved_at (TIMESTAMP)
updated_at (TIMESTAMP)
UNIQUE(user_id, movie_id)
```

#### **movimood_movie_reviews**
```sql
id (VARCHAR 36, UUID)
user_id (VARCHAR 36, FK → movimood_users)
movie_id (BIGINT, from TMDB)
movie_json (JSON, snapshot)
mood (VARCHAR 32, ej: 'feliz'|'triste'|'relajado'|...)
author (VARCHAR 120, nombre del reviewador)
rating (TINYINT, 1-10)
comment (TEXT, opinión)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### **movimood_user_follows**
```sql
follower_user_id (VARCHAR 36, FK)
followed_user_id (VARCHAR 36, FK)
created_at (TIMESTAMP)
PRIMARY KEY(follower_user_id, followed_user_id)
```

#### **movimood_review_likes**
```sql
review_id (VARCHAR 36, FK → movimood_movie_reviews)
user_id (VARCHAR 36, FK → movimood_users)
created_at (TIMESTAMP)
PRIMARY KEY(review_id, user_id)
```

### 4.3 Relaciones
- Usuario → Películas favoritas (1:N, CASCADE DELETE)
- Usuario → Reseñas (1:N, CASCADE DELETE)
- Usuario → Seguidores (N:N, tabla movimood_user_follows)
- Reseña → Likes (N:N, tabla movimood_review_likes)

---

## 5. APIs EXTERNAS

### 5.1 TMDB (The Movie Database)
- **Versión**: API v3 (con fallback a v4)
- **Autenticación**: API Key (`TMDB_API_KEY` en .env del servidor)
- **Endpoints utilizados**:
  - `/search/movie` - Búsqueda de películas
  - `/discover/movie` - Descubrimiento con filtros
  - `/movie/{id}` - Detalles de película
  - Parámetros: `language`, `sort_by`, `with_genres`, `vote_count.gte`, `primary_release_date`, `with_runtime`

- **Rate limits**: Cumplir límites de TMDB (típicamente 40 requests/segundo)
- **Datos almacenados**: Snapshots JSON en `movie_json` campos para auditoría

### 5.2 Email (SMTP)
- **Servicio**: Hostinger SMTP (configurado vía PHP mail() o PHPMailer)
- **Uso**: Envío de links de recuperación de contraseña
- **Archivo**: `api/test_email.php` (para debug)

---

## 6. VARIABLES DE ENTORNO

### 6.1 Frontend (bakeadas en build time)
```
REACT_APP_API_BASE_URL=http://localhost/movimood-frontend/api
  → URL base para llamadas fetch a endpoints PHP
```

### 6.2 Backend (runtime en .env)
```
TMDB_API_KEY=your_key_here
  → API key de TMDB

DB_HOST=localhost
DB_USER=root
DB_PASS=...
DB_NAME=movimood_db

SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...

NODE_ENV=development|production
```

---

## 7. HERRAMIENTAS Y SERVICIOS DE BUILD

### 7.1 NPM Scripts
```json
{
  "start": "react-scripts start",           // Dev server en port 3000
  "build": "react-scripts build",           // Producción: /build/
  "test": "react-scripts test",             // Watch mode
  "eject": "react-scripts eject"            // Exponer config de CRA
}
```

### 7.2 Toolchain Implícito
- **Webpack**: Manejado por `react-scripts`
- **Babel**: Transpilación JSX + ES6+
- **ESLint**: Linting configurado en `eslintConfig`
- **Jest**: Test runner para testing-library

### 7.3 Ambiente y Soporto
- **Browsers**: Chrome, Firefox, Safari (últimas versiones)
- **Targeted browsers** en `browserslist`:
  - Production: >0.2% market share, not dead, not op_mini
  - Development: latest versions

### 7.4 Routing (Producción)
- **index.php**: Router simple que:
  - Redirige `/privacidad`, `/perfil/:id`, `/buscar` → `/build/index.html`
  - Excepciones: `/api/`, `/build/`, `/public/`, `/static/`
- **.htaccess**: Configuración de reescritura de URL para Apache
- **Estático**: Archivos en `/public/` servidos directamente

---

## 8. ESTRUCTURA DE CARPETAS DEL PROYECTO

```
movimood-frontend/
├── public/                    # Archivos estáticos (html, manifest, robots.txt)
│   ├── index.html
│   ├── manifest.json         # PWA manifest
│   ├── robots.txt
│   ├── assets/
│   │   └── how-it-works/
│   └── prototipos/           # Diseños previos HTML
│
├── src/                       # Código fuente React
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   ├── index.css
│   ├── componentes/           # Componentes reutilizables
│   ├── paginas/              # Páginas (rutas)
│   ├── hooks/                # React Hooks personalizados
│   └── utils/                # Utilidades
│
├── api/                       # Backend PHP
│   ├── movimood.php          # API principal (auth, favoritos, reseñas)
│   ├── tmdb-search.php       # Búsqueda TMDB
│   ├── tmdb-discover.php     # Descubrimiento TMDB
│   ├── tmdb-movie.php        # Detalles película TMDB
│   ├── test_email.php        # Debug email
│   └── _lib/
│       └── bootstrap.php     # Funciones compartidas
│
├── database/                  # Esquema SQL
│   ├── hostinger/
│   │   ├── schema.sql        # Tablas MySQL
│   │   └── seed.sql          # Datos iniciales
│
├── build/                     # Output de producción (post build)
│   ├── index.html
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   └── asset-manifest.json
│
├── package.json              # npm dependencies + meta
├── package-lock.json         # Lock de versiones exactas
├── README.md
├── .env                       # Variables de entorno (gitignored)
├── .gitignore
├── index.php                  # Router para rutas React en producción
├── .htaccess                  # Reescritura de URL para Apache
└── build_log.txt            # Log de últimos builds
```

---

## 9. CARACTERÍSTICAS AVANZADAS

### 9.1 Recomendación de Películas
- **Algoritmo**: Client-side ranking en `utils/recommendations.js`
- **Factores**: Género, mood, año de lanzamiento, duración
- **Datos**: TMDB API → localStorage → presentación

### 9.2 Autenticación y Sesiones
- **Sesión PHP**: 30 días, HttpOnly, SameSite=Lax
- **Almacenamiento dual**: MySQL + localStorage (fallback)
- **UUID**: Para IDs de usuarios (VARCHAR 36)
- **Contraseñas**: Hash seguro (bcrypt/argon2 recomendado)

### 9.3 Respon Adaptativo
- **Mobile first**: Estilos CSS para 320px+
- **Breakpoints**: Tablet (768px), Desktop (1024px+)
- **Componentes**: SliderAnios, BotonMood responsivos

### 9.4 Internacionalización
- **Idioma**: Español (es-ES)
- **TMDB API**: Parámetro `language=es-ES` en todas las llamadas
- **UI**: Textos en español (componentes + páginas)

---

## 10. TECNOLOGÍAS NO UTILIZADAS (Descartadas)

- ❌ **Vite**: Proyecto usa CRA (Create React App), NO Vite
- ❌ **TypeScript**: Código JavaScript puro con JSDoc opcional
- ❌ **Redux/Zustand**: State management via Context API + localStorage
- ❌ **GraphQL**: API REST con PHP puro
- ❌ **JWT**: Sesiones PHP con cookies
- ❌ **Next.js**: CRA en lugar de SSR
- ❌ **Docker**: XAMPP local, Hostinger cloud (sin containerización)

---

## 11. CHECKLIST DE DEPENDENCIES REALES

### npm packages (13 librerías)
- [x] react@19.2.3
- [x] react-dom@19.2.3
- [x] react-router-dom@7.11.0
- [x] react-scripts@5.0.1
- [x] lottie-react@2.4.1
- [x] react-easy-crop@5.5.6
- [x] react-slick@0.31.0
- [x] slick-carousel@1.8.1
- [x] @testing-library/react@16.3.1
- [x] @testing-library/jest-dom@6.9.1
- [x] @testing-library/dom@10.4.1
- [x] @testing-library/user-event@13.5.0
- [x] web-vitals@2.1.4

### Tecnologías Backend
- [x] PHP 7.4+ (typado)
- [x] MySQL 5.7+ (InnoDB)
- [x] PDO (base de datos)
- [x] TMDB API v3
- [x] SMTP (email)
- [x] Apache (.htaccess)

### Infraestructura
- [x] XAMPP (desarrollo)
- [x] Hostinger (hosting)
- [x] Node.js 20.x (build)

---

## 12. NOTAS PARA TFG

### Puntos clave para documentación:
1. **Arquitectura híbrida**: Frontend React moderno + Backend PHP clásico
2. **Persistencia dual**: MySQL central + localStorage para UX offline
3. **APIs externas**: Integración robusta con TMDB (100k+ películas)
4. **Recomendación**: Algoritmo client-side basado en mood, género, año, duración
5. **Escalabilidad**: Sesiones persistentes, favoritos sincronizados, reseñas sociales
6. **Seguridad**: CORS limitado, prepared statements, bcrypt passwords, HttpOnly cookies
7. **Performance**: Caching local, pagina lazy loading, CSS grid para grillas

### Validación de stack:
- ✅ Frontend: React 19 + Router 7 + TL (testing library)
- ✅ Backend: PHP 7.4+ con PDO + MySQL InnoDB
- ✅ Externa: TMDB API v3
- ✅ Deployment: Apache/Hostinger + npm build
- ✅ Versionado: Node 20, npm lockfile, ESLint config

---

**Documento generado:** Mayo 4, 2026  
**Revisor:** Análisis automatizado del codebase  
**Status:** ✅ Stack verificado y completo
