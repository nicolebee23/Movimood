# MoviMood MySQL en Hostinger

Este directorio contiene el esquema base para crear la base de datos de MoviMood en Hostinger.

## Orden recomendado

1. En hPanel de Hostinger, crea una base de datos MySQL.
2. Crea un usuario MySQL y asígnale permisos completos sobre esa base.
3. Abre phpMyAdmin para esa base de datos.
4. Importa `schema.sql`.
5. Si quieres datos de ejemplo para probar, importa `seed.sql`.
6. Configura el archivo `.env` en la raíz del hosting con las credenciales MySQL.
7. Usa `api/movimood.php` como backend PHP para auth, perfil, favoritos, reseñas y follows.

## Variables necesarias en `.env`

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_CHARSET` opcional, recomendado `utf8mb4`

## Esquema incluido

- `movimood_users`: usuarios, credenciales y preferencias de notificaciones.
- `movimood_user_follows`: relaciones de seguimiento entre usuarios.
- `movimood_favorite_movies`: favoritos, lista base y marca de imprescindible.
- `movimood_movie_reviews`: reseñas, mood, rating y comentario.
- `movimood_review_likes`: likes por reseña.

## Nota importante

`schema.sql` solo crea la estructura. Si importas solo ese archivo, la base se verá vacía hasta que la app escriba datos o importes `seed.sql`.

La app frontend ya está preparada para migrar `localStorage` a MySQL cuando se cargue con una sesión válida.
