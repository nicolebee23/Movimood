<?php

declare(strict_types=1);

require_once __DIR__ . '/_lib/bootstrap.php';
// Ensure API responses are sent without implicit gzip encoding from the server
// to avoid clients receiving compressed bytes without the proper header.
header("Content-Encoding: identity");

allowCors();

if (requestMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function currentSessionUserId(): ?string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $userId = $_SESSION['movimood_user_id'] ?? null;
    return is_string($userId) && $userId !== '' ? $userId : null;
}

function requireSessionUserId(): string
{
    $userId = currentSessionUserId();

    if ($userId === null) {
        $body = readJsonBody();
        $fallback = trim((string) ($body['user_id'] ?? $body['profileId'] ?? ''));

        if ($fallback !== '') {
            if (session_status() !== PHP_SESSION_ACTIVE) {
                session_start();
            }

            $_SESSION['movimood_user_id'] = $fallback;
            return $fallback;
        }

        sendJson(401, ['message' => 'Debes iniciar sesion para continuar.']);
    }

    return $userId;
}

function userRowToPublicArray(array $row): array
{
    return [
        'id' => $row['id'],
        'username' => $row['username'],
        'name' => $row['name'],
        'avatar' => $row['avatar_url'] ?? '',
        'email' => $row['email'],
        'createdAt' => $row['created_at'],
        'notifications' => [
            'app' => normalizeBool($row['notifications_app'] ?? true),
            'email' => normalizeBool($row['notifications_email'] ?? false),
        ],
    ];
}

function decodeJsonField(mixed $value): array
{
    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function normalizeMovieForStorage(array $movie): array
{
    if (!isset($movie['id']) || !is_numeric($movie['id'])) {
        return [];
    }

    $normalized = [
        'id' => (int) $movie['id'],
        'title' => trim((string) ($movie['title'] ?? $movie['name'] ?? '')),
        'original_title' => trim((string) ($movie['original_title'] ?? $movie['original_name'] ?? '')),
        'original_language' => trim((string) ($movie['original_language'] ?? '')),
        'overview' => trim((string) ($movie['overview'] ?? '')),
        'poster_path' => trim((string) ($movie['poster_path'] ?? '')),
        'backdrop_path' => trim((string) ($movie['backdrop_path'] ?? '')),
        'release_date' => trim((string) ($movie['release_date'] ?? $movie['first_air_date'] ?? '')),
        'genre_ids' => is_array($movie['genre_ids'] ?? null) ? array_values($movie['genre_ids']) : [],
        'vote_average' => isset($movie['vote_average']) ? (float) $movie['vote_average'] : null,
        'vote_count' => isset($movie['vote_count']) ? (int) $movie['vote_count'] : null,
        'popularity' => isset($movie['popularity']) ? (float) $movie['popularity'] : null,
        'adult' => normalizeBool($movie['adult'] ?? false),
        'video' => normalizeBool($movie['video'] ?? false),
    ];

    return array_filter($normalized, static fn($value) => $value !== null && $value !== [] && $value !== '');
}

function moviePayload(array $movieJson, ?array $questionnaireJson, array $row): array
{
    $movie = $movieJson;
    $questionnaire = $questionnaireJson ?? [];

    return [
        'movie' => $movie,
        'questionnaire' => $questionnaire,
        'lista' => $row['list_type'],
        'flags' => [
            'imprescindible' => normalizeBool($row['is_essential'] ?? 0),
        ],
        'savedAt' => $row['saved_at'],
    ];
}

function reviewPayload(array $row): array
{
    return [
        'id' => $row['id'],
        'movieId' => (int) $row['movie_id'],
        'profileId' => $row['user_id'],
        'movie' => decodeJsonField($row['movie_json']),
        'mood' => $row['mood'],
        'author' => $row['author'],
        'rating' => (int) $row['rating'],
        'comment' => $row['comment'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at'],
    ];
}

function fetchUserById(PDO $pdo, string $userId): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM movimood_users WHERE id = :id LIMIT 1');
    $stmt->execute(['id' => $userId]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function fetchUserByIdentifier(PDO $pdo, string $identifier): ?array
{
    $stmt = $pdo->prepare('SELECT * FROM movimood_users WHERE id = :id_identifier OR username = :username_identifier OR email = :email_identifier LIMIT 1');
    $stmt->execute([
        'id_identifier' => $identifier,
        'username_identifier' => $identifier,
        'email_identifier' => $identifier,
    ]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function userSummary(PDO $pdo, array $userRow): array
{
    $userId = $userRow['id'];

    $followersStmt = $pdo->prepare('SELECT COUNT(*) FROM movimood_user_follows WHERE followed_user_id = :user_id');
    $followersStmt->execute(['user_id' => $userId]);

    $followingStmt = $pdo->prepare('SELECT COUNT(*) FROM movimood_user_follows WHERE follower_user_id = :user_id');
    $followingStmt->execute(['user_id' => $userId]);

    $favoritesStmt = $pdo->prepare('SELECT COUNT(*) FROM movimood_favorite_movies WHERE user_id = :user_id');
    $favoritesStmt->execute(['user_id' => $userId]);

    $reviewsStmt = $pdo->prepare('SELECT COUNT(*) FROM movimood_movie_reviews WHERE user_id = :user_id');
    $reviewsStmt->execute(['user_id' => $userId]);

    return array_merge(userRowToPublicArray($userRow), [
        'followersCount' => (int) $followersStmt->fetchColumn(),
        'followingCount' => (int) $followingStmt->fetchColumn(),
        'favoritesCount' => (int) $favoritesStmt->fetchColumn(),
        'reviewsCount' => (int) $reviewsStmt->fetchColumn(),
    ]);
}

function fetchBlockedUsers(PDO $pdo, string $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT u.id, u.username, u.name, u.avatar_url, u.email, u.created_at
         FROM movimood_user_blocks b
         INNER JOIN movimood_users u ON u.id = b.blocked_user_id
         WHERE b.blocker_user_id = :user_id
         ORDER BY b.created_at DESC'
    );
    $stmt->execute(['user_id' => $userId]);

    return $stmt->fetchAll();
}

function isBlocked(PDO $pdo, string $blockerUserId, string $blockedUserId): bool
{
    $stmt = $pdo->prepare(
        'SELECT 1 FROM movimood_user_blocks WHERE blocker_user_id = :blocker_user_id AND blocked_user_id = :blocked_user_id LIMIT 1'
    );
    $stmt->execute([
        'blocker_user_id' => $blockerUserId,
        'blocked_user_id' => $blockedUserId,
    ]);

    return (bool) $stmt->fetchColumn();
}

function listUsers(PDO $pdo): array
{
    $stmt = $pdo->query('SELECT * FROM movimood_users ORDER BY created_at DESC');
    return array_map(static fn(array $row) => userSummary($pdo, $row), $stmt->fetchAll());
}

function normalizeListType(?string $listType, bool $isEssential): string
{
    $listType = $listType ?: 'ver-mas-tarde';

    if ($isEssential) {
        return 'ya-vista';
    }

    return in_array($listType, ['ver-mas-tarde', 'ya-vista', 'no-interesa'], true)
        ? $listType
        : 'ver-mas-tarde';
}

function getRequestMovieId(array $payload): ?int
{
    $movie = $payload['movie'] ?? null;
    if (is_array($movie) && isset($movie['id']) && is_numeric($movie['id'])) {
        return (int) $movie['id'];
    }

    if (isset($payload['movieId']) && is_numeric($payload['movieId'])) {
        return (int) $payload['movieId'];
    }

    return null;
}

function handleAuth(PDO $pdo): void
{
    $method = requestMethod();
    $body = readJsonBody();
    $action = strtolower(trim((string) ($_GET['action'] ?? ($body['action'] ?? ''))));

    if ($method === 'GET' && $action === 'me') {
        $userId = currentSessionUserId();
        if ($userId === null) {
            sendJson(200, ['user' => null]);
        }

        $user = fetchUserById($pdo, $userId);
        if (!$user) {
            sendJson(200, ['user' => null]);
        }

        sendJson(200, ['user' => userSummary($pdo, $user)]);
    }

    if ($method === 'POST' && $action === 'logout') {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();

        sendJson(200, ['message' => 'Sesion cerrada.']);
    }

    if ($method === 'GET' && $action === 'users') {
        sendJson(200, ['items' => listUsers($pdo)]);
    }

    if ($method === 'POST' && $action === 'register') {
        $username = strtolower(trim((string) ($body['username'] ?? '')));
        $name = trim((string) ($body['name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $avatar = trim((string) ($body['avatar'] ?? ''));

        if ($username === '' || $name === '' || $email === '' || $password === '') {
            sendJson(422, ['message' => 'Faltan datos obligatorios para registrarse.']);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJson(422, ['message' => 'Email invalido.']);
        }

        $existing = fetchUserByIdentifier($pdo, $username) ?? fetchUserByIdentifier($pdo, $email);
        if ($existing) {
            sendJson(409, ['message' => 'Ya existe un usuario con ese nombre o email.']);
        }

        $userId = function_exists('random_bytes') ? bin2hex(random_bytes(16)) : uniqid('user_', true);
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare(
            'INSERT INTO movimood_users (id, username, name, email, password_hash, avatar_url, notifications_app, notifications_email)
             VALUES (:id, :username, :name, :email, :password_hash, :avatar_url, 1, 0)'
        );
        $stmt->execute([
            'id' => $userId,
            'username' => $username,
            'name' => $name,
            'email' => $email,
            'password_hash' => $passwordHash,
            'avatar_url' => $avatar !== '' ? $avatar : null,
        ]);

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $_SESSION['movimood_user_id'] = $userId;

        $user = fetchUserById($pdo, $userId);
        sendJson(201, ['user' => userSummary($pdo, $user)]);
    }

    if ($method === 'POST' && $action === 'update') {
        $userId = requireSessionUserId();
        $currentUser = fetchUserById($pdo, $userId);

        if (!$currentUser) {
            sendJson(404, ['message' => 'Usuario no encontrado.']);
        }

        $name = trim((string) ($body['name'] ?? $currentUser['name']));
        $username = strtolower(trim((string) ($body['username'] ?? $currentUser['username'])));
        $email = strtolower(trim((string) ($body['email'] ?? $currentUser['email'])));
        $avatar = trim((string) ($body['avatar'] ?? ($currentUser['avatar_url'] ?? '')));
        $notifications = normalizeArray($body['notifications'] ?? []);
        $notificationsApp = array_key_exists('app', $notifications) ? normalizeBool($notifications['app']) : normalizeBool($currentUser['notifications_app'] ?? true);
        $notificationsEmail = array_key_exists('email', $notifications) ? normalizeBool($notifications['email']) : normalizeBool($currentUser['notifications_email'] ?? false);

        if ($name === '' || $username === '' || $email === '') {
            sendJson(422, ['message' => 'Nombre, usuario y email son obligatorios.']);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJson(422, ['message' => 'Email invalido.']);
        }

        $duplicateStmt = $pdo->prepare('SELECT id FROM movimood_users WHERE (username = :username OR email = :email) AND id <> :id LIMIT 1');
        $duplicateStmt->execute([
            'username' => $username,
            'email' => $email,
            'id' => $userId,
        ]);

        if ($duplicateStmt->fetchColumn()) {
            sendJson(409, ['message' => 'Ya existe otro usuario con ese nombre o email.']);
        }

        $stmt = $pdo->prepare(
            'UPDATE movimood_users
             SET name = :name,
                 username = :username,
                 email = :email,
                 avatar_url = :avatar_url,
                 notifications_app = :notifications_app,
                 notifications_email = :notifications_email,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id'
        );
        $stmt->execute([
            'id' => $userId,
            'name' => $name,
            'username' => $username,
            'email' => $email,
            'avatar_url' => $avatar !== '' ? $avatar : null,
            'notifications_app' => $notificationsApp ? 1 : 0,
            'notifications_email' => $notificationsEmail ? 1 : 0,
        ]);

        sendJson(200, ['user' => userSummary($pdo, fetchUserById($pdo, $userId))]);
    }

    if ($method === 'POST' && $action === 'password') {
        $userId = requireSessionUserId();
        $currentUser = fetchUserById($pdo, $userId);

        if (!$currentUser) {
            sendJson(404, ['message' => 'Usuario no encontrado.']);
        }

        $currentPassword = (string) ($body['currentPassword'] ?? '');
        $newPassword = (string) ($body['newPassword'] ?? '');
        $confirmPassword = (string) ($body['confirmPassword'] ?? '');

        if ($currentPassword === '' || $newPassword === '' || $confirmPassword === '') {
            sendJson(422, ['message' => 'Debes completar la contraseña actual y la nueva.']);
        }

        if (!password_verify($currentPassword, $currentUser['password_hash'])) {
            sendJson(401, ['message' => 'La contraseña actual no es correcta.']);
        }

        if ($newPassword !== $confirmPassword) {
            sendJson(422, ['message' => 'La nueva contraseña y su confirmación no coinciden.']);
        }

        if (strlen($newPassword) < 8) {
            sendJson(422, ['message' => 'La nueva contraseña debe tener al menos 8 caracteres.']);
        }

        $stmt = $pdo->prepare('UPDATE movimood_users SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
        $stmt->execute([
            'id' => $userId,
            'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);

        $updatedUser = fetchUserById($pdo, $userId);
        sendJson(200, [
            'success' => true,
            'message' => 'Contraseña actualizada.',
            'user' => $updatedUser,
        ]);
    }

    if ($method === 'POST' && ($action === 'recover-password' || $action === 'forgot-password')) {
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJson(422, ['message' => 'Introduce un email valido.']);
        }

        $user = fetchUserByIdentifier($pdo, $email);
        $temporaryPassword = null;
        $subject = 'MoviMood - Recuperacion de contrasena';

        if ($user) {
            $temporaryPassword = 'Movi' . random_int(100000, 999999) . 'A';
            $temporaryHash = password_hash($temporaryPassword, PASSWORD_DEFAULT);

            $stmt = $pdo->prepare('UPDATE movimood_users SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE id = :id');
            $stmt->execute([
                'id' => $user['id'],
                'password_hash' => $temporaryHash,
            ]);

            $message = "Hola {$user['name']},\n\n" .
                "Hemos generado una contrasena temporal para tu cuenta:\n\n" .
                "{$temporaryPassword}\n\n" .
                "Inicia sesion y cambiala desde Configuracion.\n\n" .
                "Equipo MoviMood";
        } else {
            $message = "Hola,\n\n" .
                "Hemos recibido tu solicitud de recuperacion de contrasena para esta direccion.\n\n" .
                "Si tienes una cuenta en MoviMood, prueba a iniciar sesion o vuelve a pedir la recuperacion desde la aplicacion.\n\n" .
                "Equipo MoviMood";
        }

        $mailResult = sendEmail($email, $subject, $message);
        $mailSent = normalizeBool($mailResult['sent'] ?? false);
        $mailProvider = (string) ($mailResult['provider'] ?? 'unknown');

        $responsePayload = [
            'message' => 'Te hemos enviado un correo de recuperacion a esa direccion.',
            'mailSent' => $mailSent,
            'mailProvider' => $mailProvider,
        ];

        if (!$mailSent && isset($mailResult['error']) && is_string($mailResult['error']) && trim($mailResult['error']) !== '') {
            $responsePayload['error'] = trim($mailResult['error']);
        }

        // Solo devolver la contraseña si el email fue a una cuenta existente y el envío falló.
        if (!$mailSent) {
            if ($temporaryPassword !== null) {
                $responsePayload['temporaryPassword'] = $temporaryPassword;
            }
        }

        sendJson(200, $responsePayload);
    }

    if ($method === 'POST' && $action === 'login') {
        $identifier = strtolower(trim((string) ($body['identifier'] ?? $body['email'] ?? $body['username'] ?? '')));
        $password = (string) ($body['password'] ?? '');

        if ($identifier === '' || $password === '') {
            sendJson(422, ['message' => 'Debes indicar usuario/email y contraseña.']);
        }

        $user = fetchUserByIdentifier($pdo, $identifier);
        if (!$user || !password_verify($password, $user['password_hash'])) {
            sendJson(401, ['message' => 'Credenciales incorrectas.']);
        }

        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $_SESSION['movimood_user_id'] = $user['id'];
        sendJson(200, ['user' => userSummary($pdo, $user)]);
    }

    sendJson(404, ['message' => 'Accion de auth no encontrada.']);
}

function upsertSyncUser(PDO $pdo, array $user): ?string
{
    $userId = trim((string) ($user['id'] ?? ''));
    $username = strtolower(trim((string) ($user['username'] ?? '')));
    $name = trim((string) ($user['name'] ?? ''));
    $email = strtolower(trim((string) ($user['email'] ?? '')));
    $avatar = trim((string) ($user['avatar'] ?? $user['avatar_url'] ?? ''));
    $passwordHash = trim((string) ($user['password_hash'] ?? ''));
    $password = (string) ($user['password'] ?? '');

    if ($userId === '' || $username === '' || $name === '' || $email === '') {
        return null;
    }

    if ($passwordHash === '' && $password !== '') {
        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    }

    if ($passwordHash === '') {
        $passwordHash = password_hash('Password123', PASSWORD_DEFAULT);
    }

    $notifications = normalizeArray($user['notifications'] ?? []);
    $notificationsApp = array_key_exists('app', $notifications) ? normalizeBool($notifications['app']) : normalizeBool($user['notifications_app'] ?? true);
    $notificationsEmail = array_key_exists('email', $notifications) ? normalizeBool($notifications['email']) : normalizeBool($user['notifications_email'] ?? false);

    $stmt = $pdo->prepare(
        'INSERT INTO movimood_users (id, username, name, email, password_hash, avatar_url, notifications_app, notifications_email, created_at, updated_at)
         VALUES (:id, :username, :name, :email, :password_hash, :avatar_url, :notifications_app, :notifications_email, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            username = VALUES(username),
            name = VALUES(name),
            email = VALUES(email),
            password_hash = VALUES(password_hash),
            avatar_url = VALUES(avatar_url),
            notifications_app = VALUES(notifications_app),
            notifications_email = VALUES(notifications_email),
            updated_at = NOW()'
    );
    $stmt->execute([
        'id' => $userId,
        'username' => $username,
        'name' => $name,
        'email' => $email,
        'password_hash' => $passwordHash,
        'avatar_url' => $avatar !== '' ? $avatar : null,
        'notifications_app' => $notificationsApp ? 1 : 0,
        'notifications_email' => $notificationsEmail ? 1 : 0,
    ]);

    return $userId;
}

function upsertSyncFavorite(PDO $pdo, string $userId, array $favorite): void
{
    $movie = normalizeArray($favorite['movie'] ?? []);
    $movieId = getRequestMovieId(['movie' => $movie]) ?? (isset($favorite['movieId']) && is_numeric($favorite['movieId']) ? (int) $favorite['movieId'] : null);
    if ($movieId === null || $movie === []) {
        return;
    }

    $questionnaire = normalizeArray($favorite['questionnaire'] ?? []);
    $isEssential = normalizeBool($favorite['flags']['imprescindible'] ?? $favorite['imprescindible'] ?? false);
    $listType = normalizeListType((string) ($favorite['lista'] ?? null), $isEssential);
    $savedAt = (string) ($favorite['savedAt'] ?? date('c'));

    $stmt = $pdo->prepare(
        'INSERT INTO movimood_favorite_movies
            (user_id, movie_id, movie_json, questionnaire_json, list_type, is_essential, saved_at, updated_at)
         VALUES
            (:user_id, :movie_id, :movie_json, :questionnaire_json, :list_type, :is_essential, :saved_at, NOW())
         ON DUPLICATE KEY UPDATE
            movie_json = VALUES(movie_json),
            questionnaire_json = VALUES(questionnaire_json),
            list_type = VALUES(list_type),
            is_essential = VALUES(is_essential),
            saved_at = VALUES(saved_at),
            updated_at = NOW()'
    );
    $stmt->execute([
        'user_id' => $userId,
        'movie_id' => $movieId,
        'movie_json' => json_encode(normalizeMovieForStorage($movie), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'questionnaire_json' => $questionnaire !== [] ? json_encode($questionnaire, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
        'list_type' => $isEssential ? 'ya-vista' : $listType,
        'is_essential' => $isEssential ? 1 : 0,
        'saved_at' => $savedAt,
    ]);
}

function upsertSyncReview(PDO $pdo, string $defaultUserId, array $review): void
{
    $reviewId = trim((string) ($review['id'] ?? '')) ?: bin2hex(random_bytes(16));
    $profileId = trim((string) ($review['profileId'] ?? $review['user_id'] ?? ''));
    if ($profileId === '' || $profileId !== $defaultUserId) {
        $profileId = $defaultUserId;
    }
    $movie = normalizeArray($review['movie'] ?? []);
    $movieId = getRequestMovieId(['movie' => $movie]) ?? (isset($review['movieId']) && is_numeric($review['movieId']) ? (int) $review['movieId'] : null);
    if ($profileId === '' || $movieId === null || $movie === []) {
        return;
    }

    $rating = isset($review['rating']) ? max(0, min(10, (int) $review['rating'])) : 5;
    $comment = trim((string) ($review['comment'] ?? ''));
    $mood = trim((string) ($review['mood'] ?? '')) ?: null;
    $author = trim((string) ($review['author'] ?? ''));
    $createdAt = (string) ($review['createdAt'] ?? date('c'));
    $updatedAt = (string) ($review['updatedAt'] ?? $createdAt);

    $stmt = $pdo->prepare(
        'INSERT INTO movimood_movie_reviews
            (id, user_id, movie_id, movie_json, mood, author, rating, comment, created_at, updated_at)
         VALUES
            (:id, :user_id, :movie_id, :movie_json, :mood, :author, :rating, :comment, :created_at, :updated_at)
         ON DUPLICATE KEY UPDATE
            movie_json = VALUES(movie_json),
            mood = VALUES(mood),
            author = VALUES(author),
            rating = VALUES(rating),
            comment = VALUES(comment),
            updated_at = VALUES(updated_at)'
    );
    $stmt->execute([
        'id' => $reviewId,
        'user_id' => $profileId,
        'movie_id' => $movieId,
        'movie_json' => json_encode(normalizeMovieForStorage($movie), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        'mood' => $mood,
        'author' => $author,
        'rating' => $rating,
        'comment' => $comment,
        'created_at' => $createdAt,
        'updated_at' => $updatedAt,
    ]);
}

function handleSync(PDO $pdo): void
{
    if (requestMethod() !== 'POST') {
        sendJson(405, ['message' => 'Metodo no permitido para sync.']);
    }

    $body = readJsonBody();
    error_log('SYNC: Received body with ' . count($body['users'] ?? []) . ' users');
    $users = normalizeArray($body['users'] ?? []);
    $favorites = normalizeArray($body['favorites'] ?? []);
    $reviews = normalizeArray($body['reviews'] ?? []);

    $primaryUserId = trim((string) ($body['ownerUserId'] ?? ''));
    if ($primaryUserId === '' && isset($users[0]) && is_array($users[0])) {
        $primaryUserId = trim((string) ($users[0]['id'] ?? ''));
    }

    $syncedUsers = [];
    foreach ($users as $user) {
        if (!is_array($user)) {
            continue;
        }

        $syncedUserId = upsertSyncUser($pdo, $user);
        error_log('SYNC: Synced user ' . ($syncedUserId ? $syncedUserId : 'null') . ' for email ' . ($user['email'] ?? 'unknown'));
        if ($syncedUserId) {
          $syncedUsers[] = $syncedUserId;
        }
    }

    if ($primaryUserId === '' && $syncedUsers !== []) {
        $primaryUserId = $syncedUsers[0];
    }

    if ($primaryUserId !== '') {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            session_start();
        }

        $_SESSION['movimood_user_id'] = $primaryUserId;
    }

    $syncedFavorites = 0;
    foreach ($favorites as $favorite) {
        if (!is_array($favorite) || $primaryUserId === '') {
            continue;
        }

        upsertSyncFavorite($pdo, $primaryUserId, $favorite);
        $syncedFavorites++;
    }

    $syncedReviews = 0;
    foreach ($reviews as $review) {
        if (!is_array($review) || $primaryUserId === '') {
            continue;
        }

        upsertSyncReview($pdo, $primaryUserId, $review);
        $syncedReviews++;
    }

    sendJson(200, [
        'message' => 'Sincronizacion completada.',
        'usersSynced' => count($syncedUsers),
        'favoritesSynced' => $syncedFavorites,
        'reviewsSynced' => $syncedReviews,
        'primaryUserId' => $primaryUserId,
        'sessionUserId' => $primaryUserId,
    ]);
}

function fetchFavorites(PDO $pdo, string $userId): array
{
    $stmt = $pdo->prepare(
        'SELECT * FROM movimood_favorite_movies WHERE user_id = :user_id ORDER BY saved_at DESC, updated_at DESC'
    );
    $stmt->execute(['user_id' => $userId]);

    $items = [];
    foreach ($stmt->fetchAll() as $row) {
        $items[] = moviePayload(
            decodeJsonField($row['movie_json']),
            decodeJsonField($row['questionnaire_json']),
            $row
        );
    }

    return $items;
}

function handleFavorites(PDO $pdo): void
{
    $method = requestMethod();
    $body = readJsonBody();
    $userId = currentSessionUserId();
    $targetUserId = trim((string) ($_GET['user_id'] ?? $body['user_id'] ?? ''));

    if ($method === 'GET') {
        $lookupUserId = $targetUserId !== '' ? $targetUserId : $userId;
        if ($lookupUserId === null || $lookupUserId === '') {
            sendJson(200, ['items' => []]);
        }

        sendJson(200, ['items' => fetchFavorites($pdo, $lookupUserId)]);
    }

    $userId = requireSessionUserId();

    if ($method === 'POST') {
        $movieId = getRequestMovieId($body);
        $movie = normalizeArray($body['movie'] ?? null);
        $questionnaire = normalizeArray($body['questionnaire'] ?? null);

        if ($movieId === null || $movie === []) {
            sendJson(422, ['message' => 'Falta la pelicula para guardar el favorito.']);
        }

        $isEssential = normalizeBool($body['flags']['imprescindible'] ?? $body['imprescindible'] ?? false);
        $listType = normalizeListType((string) ($body['lista'] ?? null), $isEssential);
        $savedAt = (string) ($body['savedAt'] ?? date('c'));

        $stmt = $pdo->prepare(
            'INSERT INTO movimood_favorite_movies
                (user_id, movie_id, movie_json, questionnaire_json, list_type, is_essential, saved_at)
             VALUES
                (:user_id, :movie_id, :movie_json, :questionnaire_json, :list_type, :is_essential, :saved_at)
             ON DUPLICATE KEY UPDATE
                movie_json = VALUES(movie_json),
                questionnaire_json = VALUES(questionnaire_json),
                list_type = VALUES(list_type),
                is_essential = VALUES(is_essential),
                updated_at = CURRENT_TIMESTAMP,
                saved_at = VALUES(saved_at)'
        );
        $stmt->execute([
            'user_id' => $userId,
            'movie_id' => $movieId,
            'movie_json' => json_encode(normalizeMovieForStorage($movie), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'questionnaire_json' => $questionnaire !== [] ? json_encode($questionnaire, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) : null,
            'list_type' => $isEssential ? 'ya-vista' : $listType,
            'is_essential' => $isEssential ? 1 : 0,
            'saved_at' => $savedAt,
        ]);

        sendJson(200, ['items' => fetchFavorites($pdo, $userId)]);
    }

    if ($method === 'DELETE') {
        $movieId = getRequestMovieId($body) ?? (isset($_GET['movie_id']) && is_numeric($_GET['movie_id']) ? (int) $_GET['movie_id'] : null);
        if ($movieId === null) {
            sendJson(422, ['message' => 'Indica movie_id para eliminar el favorito.']);
        }

        $stmt = $pdo->prepare('DELETE FROM movimood_favorite_movies WHERE user_id = :user_id AND movie_id = :movie_id');
        $stmt->execute([
            'user_id' => $userId,
            'movie_id' => $movieId,
        ]);

        sendJson(200, ['items' => fetchFavorites($pdo, $userId)]);
    }

    sendJson(405, ['message' => 'Metodo no permitido para favorites.']);
}

function fetchReviews(PDO $pdo, string $userId): array
{
    $stmt = $pdo->prepare('SELECT * FROM movimood_movie_reviews WHERE user_id = :user_id ORDER BY updated_at DESC, created_at DESC');
    $stmt->execute(['user_id' => $userId]);

    return array_map(static fn(array $row) => reviewPayload($row), $stmt->fetchAll());
}

function fetchReviewsByMovie(PDO $pdo, int $movieId): array
{
    $stmt = $pdo->prepare(
        'SELECT r.*, u.username, u.name, u.avatar_url
         FROM movimood_movie_reviews r
         LEFT JOIN movimood_users u ON u.id = r.user_id
         WHERE r.movie_id = :movie_id
         ORDER BY r.created_at DESC'
    );
    $stmt->execute(['movie_id' => $movieId]);

    return array_map(static function (array $row): array {
        $payload = reviewPayload($row);
        $payload['authorUsername'] = $row['username'] ?? null;
        $payload['authorName'] = $row['name'] ?? null;
        $payload['authorAvatar'] = $row['avatar_url'] ?? null;
        return $payload;
    }, $stmt->fetchAll());
}

function handleReviews(PDO $pdo): void
{
    $method = requestMethod();
    $body = readJsonBody();
    $userId = currentSessionUserId();
    
    $targetUserId = trim((string) ($_GET['user_id'] ?? $body['user_id'] ?? ''));
    $targetMovieId = isset($_GET['movie_id']) && is_numeric($_GET['movie_id']) ? (int) $_GET['movie_id'] : null;

    // GETs son públicos - no requieren autenticación
    if ($method === 'GET') {
        if ($targetMovieId !== null) {
            sendJson(200, ['items' => fetchReviewsByMovie($pdo, $targetMovieId)]);
        }

        $lookupUserId = $targetUserId !== '' ? $targetUserId : $userId;
        if ($lookupUserId === null || $lookupUserId === '') {
            sendJson(200, ['items' => []]);
        }

        sendJson(200, ['items' => fetchReviews($pdo, $lookupUserId)]);
    }

    // Para POSTs y DELETEs, requerir autenticación de sesión
    $userId = requireSessionUserId();

    if ($method === 'POST') {
        $movieId = getRequestMovieId($body);
        $movie = normalizeArray($body['movie'] ?? null);
        $rating = isset($body['rating']) ? max(1, min(10, (int) $body['rating'])) : 5;
        $comment = trim((string) ($body['comment'] ?? ''));
        $mood = trim((string) ($body['mood'] ?? '')) ?: null;
        $author = trim((string) ($body['author'] ?? ''));
        $reviewId = trim((string) ($body['id'] ?? ''));

        if ($movieId === null || $movie === []) {
            sendJson(422, ['message' => 'Falta movie para guardar la reseña.']);
        }

        if ($reviewId === '') {
            $existingStmt = $pdo->prepare('SELECT id FROM movimood_movie_reviews WHERE user_id = :user_id AND movie_id = :movie_id LIMIT 1');
            $existingStmt->execute([
                'user_id' => $userId,
                'movie_id' => $movieId,
            ]);
            $existingId = $existingStmt->fetchColumn();
            $reviewId = is_string($existingId) && $existingId !== '' ? $existingId : bin2hex(random_bytes(16));
        }

        $stmt = $pdo->prepare(
            'INSERT INTO movimood_movie_reviews
                (id, user_id, movie_id, movie_json, mood, author, rating, comment)
             VALUES
                (:id, :user_id, :movie_id, :movie_json, :mood, :author, :rating, :comment)
             ON DUPLICATE KEY UPDATE
                movie_json = VALUES(movie_json),
                mood = VALUES(mood),
                author = VALUES(author),
                rating = VALUES(rating),
                comment = VALUES(comment),
                updated_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'id' => $reviewId,
            'user_id' => $userId,
            'movie_id' => $movieId,
            'movie_json' => json_encode($movie, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'mood' => $mood,
            'author' => $author,
            'rating' => $rating,
            'comment' => $comment,
        ]);

        sendJson(200, ['items' => fetchReviews($pdo, $userId)]);
    }

    if ($method === 'DELETE') {
        $reviewId = trim((string) ($body['id'] ?? ($_GET['id'] ?? '')));
        $movieId = getRequestMovieId($body) ?? (isset($_GET['movie_id']) && is_numeric($_GET['movie_id']) ? (int) $_GET['movie_id'] : null);

        if ($reviewId === '' && $movieId === null) {
            sendJson(422, ['message' => 'Indica id o movie_id para eliminar la reseña.']);
        }

        if ($reviewId !== '') {
            $stmt = $pdo->prepare('DELETE FROM movimood_movie_reviews WHERE id = :id AND user_id = :user_id');
            $stmt->execute([
                'id' => $reviewId,
                'user_id' => $userId,
            ]);
        } else {
            $stmt = $pdo->prepare('DELETE FROM movimood_movie_reviews WHERE user_id = :user_id AND movie_id = :movie_id');
            $stmt->execute([
                'user_id' => $userId,
                'movie_id' => $movieId,
            ]);
        }

        sendJson(200, ['items' => fetchReviews($pdo, $userId)]);
    }

    sendJson(405, ['message' => 'Metodo no permitido para reviews.']);
}

function handleFollows(PDO $pdo): void
{
    $method = requestMethod();
    $body = readJsonBody();
    $userId = currentSessionUserId();
    $targetUserId = trim((string) ($_GET['user_id'] ?? $body['user_id'] ?? ''));

    if ($method === 'GET') {
        if ($targetUserId === '') {
            sendJson(200, ['followers' => [], 'following' => []]);
        }

        $followersStmt = $pdo->prepare(
            'SELECT u.id, u.username, u.name, u.avatar_url, u.email, u.created_at
             FROM movimood_user_follows f
             INNER JOIN movimood_users u ON u.id = f.follower_user_id
             WHERE f.followed_user_id = :user_id
             ORDER BY f.created_at DESC'
        );
        $followersStmt->execute(['user_id' => $targetUserId]);

        $followingStmt = $pdo->prepare(
            'SELECT u.id, u.username, u.name, u.avatar_url, u.email, u.created_at
             FROM movimood_user_follows f
             INNER JOIN movimood_users u ON u.id = f.followed_user_id
             WHERE f.follower_user_id = :user_id
             ORDER BY f.created_at DESC'
        );
        $followingStmt->execute(['user_id' => $targetUserId]);

        sendJson(200, [
            'followers' => array_map(static fn(array $row) => userRowToPublicArray($row), $followersStmt->fetchAll()),
            'following' => array_map(static fn(array $row) => userRowToPublicArray($row), $followingStmt->fetchAll()),
        ]);
    }

    $userId = requireSessionUserId();

    if ($method === 'POST') {
        $followedUserId = trim((string) ($body['followed_user_id'] ?? $body['target_user_id'] ?? ''));
        if ($followedUserId === '' || $followedUserId === $userId) {
            sendJson(422, ['message' => 'No puedes seguirte a ti mismo.']);
        }

        if (isBlocked($pdo, $userId, $followedUserId) || isBlocked($pdo, $followedUserId, $userId)) {
            sendJson(422, ['message' => 'No puedes seguir a este usuario porque existe un bloqueo.']);
        }

        $stmt = $pdo->prepare(
            'INSERT INTO movimood_user_follows (follower_user_id, followed_user_id)
             VALUES (:follower_user_id, :followed_user_id)
             ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP'
        );
        $stmt->execute([
            'follower_user_id' => $userId,
            'followed_user_id' => $followedUserId,
        ]);

        sendJson(200, ['message' => 'Usuario seguido.']);
    }

    if ($method === 'DELETE') {
        $followedUserId = trim((string) ($body['followed_user_id'] ?? $body['target_user_id'] ?? ($_GET['followed_user_id'] ?? '')));
        if ($followedUserId === '') {
            sendJson(422, ['message' => 'Indica el usuario a dejar de seguir.']);
        }

        $stmt = $pdo->prepare(
            'DELETE FROM movimood_user_follows WHERE follower_user_id = :follower_user_id AND followed_user_id = :followed_user_id'
        );
        $stmt->execute([
            'follower_user_id' => $userId,
            'followed_user_id' => $followedUserId,
        ]);

        sendJson(200, ['message' => 'Usuario dejado de seguir.']);
    }

    sendJson(405, ['message' => 'Metodo no permitido para follows.']);
}

function handleBlocks(PDO $pdo): void
{
    $method = requestMethod();
    $body = readJsonBody();
    $userId = currentSessionUserId();

    if ($method === 'GET') {
        $targetUserId = trim((string) ($_GET['user_id'] ?? $body['user_id'] ?? ''));
        if ($targetUserId === '' && $userId !== null) {
            $targetUserId = $userId;
        }

        if ($targetUserId === '' || $targetUserId !== $userId) {
            sendJson(200, ['blocked' => [], 'blockedBy' => []]);
        }

        $blockedUsers = fetchBlockedUsers($pdo, $targetUserId);
        
        // Obtén usuarios que han bloqueado a este usuario
        $blockedByStmt = $pdo->prepare(
            'SELECT u.id, u.username, u.name, u.avatar_url, u.email, u.created_at
             FROM movimood_user_blocks b
             INNER JOIN movimood_users u ON u.id = b.blocker_user_id
             WHERE b.blocked_user_id = :user_id
             ORDER BY b.created_at DESC'
        );
        $blockedByStmt->execute(['user_id' => $targetUserId]);
        
        sendJson(200, [
            'blocked' => array_map(static fn(array $row) => userRowToPublicArray($row), $blockedUsers),
            'blockedBy' => array_map(static fn(array $row) => userRowToPublicArray($row), $blockedByStmt->fetchAll()),
        ]);
    }

    $userId = requireSessionUserId();

    if ($method === 'POST') {
        $blockedUserId = trim((string) ($body['blocked_user_id'] ?? $body['target_user_id'] ?? ''));
        if ($blockedUserId === '' || $blockedUserId === $userId) {
            sendJson(422, ['message' => 'No puedes bloquearte a ti mismo.']);
        }

        if (fetchUserById($pdo, $blockedUserId) === null) {
            sendJson(404, ['message' => 'El usuario a bloquear no existe.']);
        }

        try {
            $cleanupStmt = $pdo->prepare(
                'DELETE FROM movimood_user_follows
                 WHERE (follower_user_id = :user_id_1 AND followed_user_id = :blocked_user_id_1)
                    OR (follower_user_id = :blocked_user_id_2 AND followed_user_id = :user_id_2)'
            );
            $cleanupStmt->execute([
                'user_id_1' => $userId,
                'blocked_user_id_1' => $blockedUserId,
                'blocked_user_id_2' => $blockedUserId,
                'user_id_2' => $userId,
            ]);

            $stmt = $pdo->prepare(
                'INSERT IGNORE INTO movimood_user_blocks (blocker_user_id, blocked_user_id)
                 VALUES (:blocker_user_id, :blocked_user_id)'
            );
            $stmt->execute([
                'blocker_user_id' => $userId,
                'blocked_user_id' => $blockedUserId,
            ]);
        } catch (Throwable $exception) {
            error_log('movimood.php handleBlocks POST error: ' . $exception->getMessage());
            sendJson(500, ['message' => 'Error al guardar el bloqueo.']);
        }

        sendJson(200, ['message' => 'Usuario bloqueado.', 'blocked' => true]);
    }

    if ($method === 'DELETE') {
        $blockedUserId = trim((string) ($body['blocked_user_id'] ?? $body['target_user_id'] ?? ($_GET['blocked_user_id'] ?? '')));
        if ($blockedUserId === '') {
            sendJson(422, ['message' => 'Indica el usuario a desbloquear.']);
        }

        if (fetchUserById($pdo, $blockedUserId) === null) {
            sendJson(404, ['message' => 'El usuario a desbloquear no existe.']);
        }

        try {
            $stmt = $pdo->prepare(
                'DELETE FROM movimood_user_blocks
                 WHERE blocker_user_id = :blocker_user_id AND blocked_user_id = :blocked_user_id'
            );
            $stmt->execute([
                'blocker_user_id' => $userId,
                'blocked_user_id' => $blockedUserId,
            ]);
        } catch (Throwable $exception) {
            error_log('movimood.php handleBlocks DELETE error: ' . $exception->getMessage());
            sendJson(500, ['message' => 'Error al desbloquear al usuario.']);
        }

        sendJson(200, ['message' => 'Usuario desbloqueado.', 'blocked' => false]);
    }

    sendJson(405, ['message' => 'Metodo no permitido para blocks.']);
}

function handleProfile(PDO $pdo): void
{
    $target = trim((string) ($_GET['user_id'] ?? $_GET['username'] ?? ''));
    if ($target === '') {
        $target = currentSessionUserId() ?? '';
    }

    if ($target === '') {
        sendJson(404, ['message' => 'Usuario no encontrado.']);
    }

    $user = fetchUserByIdentifier($pdo, $target);
    if (!$user) {
        sendJson(404, ['message' => 'Usuario no encontrado.']);
    }

    // If the profile owner has blocked the current user, respond as non-existent.
    $currentUserId = currentSessionUserId();
    if ($currentUserId !== null && $currentUserId !== $user['id']) {
        if (isBlocked($pdo, $user['id'], $currentUserId)) {
            sendJson(404, ['message' => 'Usuario no encontrado.']);
        }
    }

    sendJson(200, [
        'user' => userSummary($pdo, $user),
        'favorites' => fetchFavorites($pdo, $user['id']),
        'reviews' => fetchReviews($pdo, $user['id']),
    ]);
}

allowCors();
$pdo = db();
$resource = strtolower(trim((string) ($_GET['resource'] ?? '')));

if ($resource === '') {
    sendJson(200, [
        'message' => 'MoviMood backend listo.',
        'resources' => ['auth', 'profile', 'favorites', 'reviews', 'follows', 'blocks', 'review-likes'],
    ]);
}

switch ($resource) {
    case 'auth':
        handleAuth($pdo);
        break;
    case 'sync':
        handleSync($pdo);
        break;
    case 'profile':
        handleProfile($pdo);
        break;
    case 'favorites':
        handleFavorites($pdo);
        break;
    case 'reviews':
        handleReviews($pdo);
        break;
        case 'review-likes':
            handleReviewLikes($pdo);
            break;
    case 'follows':
        handleFollows($pdo);
        break;
    case 'blocks':
        handleBlocks($pdo);
        break;
    case 'collections':
        handleCollections($pdo);
        break;
    case 'collection-movies':
        handleCollectionMovies($pdo);
        break;
    default:
        sendJson(404, ['message' => 'Recurso no encontrado.']);
}

function fetchReviewLikeCount(PDO $pdo, string $reviewId): int
{
    $stmt = $pdo->prepare('SELECT COUNT(*) as c FROM movimood_review_likes WHERE review_id = :review_id');
    $stmt->execute([':review_id' => $reviewId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return (int) ($row['c'] ?? 0);
}

function handleReviewLikes(PDO $pdo): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $reviewId = isset($_GET['review_id']) ? trim((string) $_GET['review_id']) : null;

        // If a specific review_id is provided, return count (backwards compatible)
        if ($reviewId !== null && $reviewId !== '') {
            $count = fetchReviewLikeCount($pdo, $reviewId);
            $includeUsers = isset($_GET['include_users']) && in_array(trim((string) $_GET['include_users']), ['1', 'true', 'yes'], true);
            if ($includeUsers) {
                $stmt = $pdo->prepare(
                    'SELECT u.*
                     FROM movimood_review_likes rl
                     INNER JOIN movimood_users u ON u.id = rl.user_id
                     WHERE rl.review_id = :review_id
                     ORDER BY rl.created_at ASC'
                );
                $stmt->execute(['review_id' => $reviewId]);
                $users = array_map(static fn(array $row) => userRowToPublicArray($row), $stmt->fetchAll(PDO::FETCH_ASSOC));
                sendJson(200, ['count' => $count, 'users' => $users]);
            }
            sendJson(200, ['count' => $count]);
        }

        // Otherwise, return the list of reviews liked by a user
        // If `user_id` is provided in the query string, return that user's liked reviews (public).
        // Otherwise require session and return current user's liked reviews.
        $lookupUser = isset($_GET['user_id']) ? trim((string) $_GET['user_id']) : null;
        if ($lookupUser === null || $lookupUser === '') {
            $lookupUser = currentSessionUserId();
            if ($lookupUser === null) {
                sendJson(401, ['message' => 'Debes iniciar sesion para ver tus likes']);
            }
        }

        $stmt = $pdo->prepare(
            'SELECT rl.review_id AS review_id, rl.created_at AS liked_at,
                    r.id AS id, r.user_id AS user_id, r.movie_id AS movie_id, r.movie_json AS movie_json,
                    r.mood AS mood, r.author AS author, r.rating AS rating, r.comment AS comment, r.created_at AS review_created_at, r.updated_at AS review_updated_at
             FROM movimood_review_likes rl
             LEFT JOIN movimood_movie_reviews r ON r.id = rl.review_id
             WHERE rl.user_id = :user_id
             ORDER BY rl.created_at DESC'
        );
        $stmt->execute(['user_id' => $lookupUser]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = array_map(function ($row) {
            $movie = [];
            if (!empty($row['movie_json'])) {
                $decoded = json_decode($row['movie_json'], true);
                if (is_array($decoded)) $movie = $decoded;
            }

            return [
                'reviewId' => $row['review_id'],
                'likedAt' => $row['liked_at'],
                'review' => $row['id'] ? [
                    'id' => $row['id'],
                    'userId' => $row['user_id'],
                    'movieId' => $row['movie_id'],
                    'movie' => $movie,
                    'mood' => $row['mood'],
                    'author' => $row['author'],
                    'rating' => $row['rating'],
                    'comment' => $row['comment'],
                    'createdAt' => $row['review_created_at'],
                    'updatedAt' => $row['review_updated_at'],
                ] : null,
            ];
        }, $rows);

        sendJson(200, ['items' => $items]);
    }

    // POST -> add like (requires session)
    if ($method === 'POST') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewId = isset($data['review_id']) ? trim((string) $data['review_id']) : null;
        if ($reviewId === null || $reviewId === '') {
            sendJson(400, ['message' => 'review_id es requerido']);
        }

        try {
            $stmt = $pdo->prepare('INSERT INTO movimood_review_likes (review_id, user_id, created_at) VALUES (:review_id, :user_id, :created_at)');
            $stmt->execute([
                ':review_id' => $reviewId,
                ':user_id' => $userId,
                ':created_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (PDOException $e) {
            // ignore duplicate key errors or other integrity issues
        }

        $count = fetchReviewLikeCount($pdo, $reviewId);
        sendJson(200, ['count' => $count]);
    }

    // DELETE -> remove like (requires session)
    if ($method === 'DELETE') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $reviewId = isset($data['review_id']) ? trim((string) $data['review_id']) : null;
        if ($reviewId === null || $reviewId === '') {
            sendJson(400, ['message' => 'review_id es requerido']);
        }

        $stmt = $pdo->prepare('DELETE FROM movimood_review_likes WHERE review_id = :review_id AND user_id = :user_id');
        $stmt->execute([':review_id' => $reviewId, ':user_id' => $userId]);

        $count = fetchReviewLikeCount($pdo, $reviewId);
        sendJson(200, ['count' => $count]);
    }

    sendJson(405, ['message' => 'Method not allowed']);
}

function uuidv4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function handleCollections(PDO $pdo): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $lookupUser = isset($_GET['user_id']) && trim((string)$_GET['user_id']) !== '' ? trim((string)$_GET['user_id']) : currentSessionUserId();
        if ($lookupUser === null) {
            sendJson(401, ['message' => 'Debes iniciar sesion para ver colecciones.']);
        }

        $stmt = $pdo->prepare('SELECT id, user_id, title, description, created_at FROM movimood_collections WHERE user_id = :user_id ORDER BY created_at DESC');
        $stmt->execute(['user_id' => $lookupUser]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Attach up to 4 posters per collection for preview and compute updated_at
        $items = [];
        $posterStmt = $pdo->prepare('SELECT movie_json FROM movimood_collection_movies WHERE collection_id = :collection_id ORDER BY added_at DESC LIMIT 4');
        $lastMovieStmt = $pdo->prepare('SELECT MAX(added_at) as last_movie FROM movimood_collection_movies WHERE collection_id = :collection_id');
        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM movimood_collection_movies WHERE collection_id = :collection_id');
        foreach ($rows as $r) {
            $posterStmt->execute(['collection_id' => $r['id']]);
            $posterRows = $posterStmt->fetchAll(PDO::FETCH_ASSOC);
            $posters = [];
            foreach ($posterRows as $pr) {
                $decoded = json_decode($pr['movie_json'], true);
                if (is_array($decoded)) $posters[] = $decoded;
            }

            $lastMovieStmt->execute(['collection_id' => $r['id']]);
            $lastMovie = $lastMovieStmt->fetchColumn();
            $updatedAt = $r['created_at'];
            if ($lastMovie && strtotime($lastMovie) > strtotime($updatedAt)) {
                $updatedAt = $lastMovie;
            }

            $countStmt->execute(['collection_id' => $r['id']]);
            $moviesCount = (int) $countStmt->fetchColumn();

            $items[] = array_merge($r, ['posters' => $posters, 'movies_count' => $moviesCount, 'updated_at' => $updatedAt]);
        }

        sendJson(200, ['items' => $items]);
    }

    if ($method === 'POST') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $title = trim((string) ($data['title'] ?? ''));
        $description = trim((string) ($data['description'] ?? ''));

        if ($title === '') {
            sendJson(400, ['message' => 'title es requerido']);
        }

        $id = uuidv4();
        $stmt = $pdo->prepare('INSERT INTO movimood_collections (id, user_id, title, description, created_at) VALUES (:id, :user_id, :title, :description, :created_at)');
        $stmt->execute([
            ':id' => $id,
            ':user_id' => $userId,
            ':title' => $title,
            ':description' => $description,
            ':created_at' => date('Y-m-d H:i:s'),
        ]);

        $item = ['id' => $id, 'user_id' => $userId, 'title' => $title, 'description' => $description, 'created_at' => date('Y-m-d H:i:s')];
        sendJson(201, ['item' => $item]);
    }

    if ($method === 'DELETE') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $collectionId = isset($data['collection_id']) ? trim((string)$data['collection_id']) : null;
        if (!$collectionId) sendJson(400, ['message' => 'collection_id es requerido']);

        // ensure ownership
        $stmt = $pdo->prepare('SELECT user_id FROM movimood_collections WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $collectionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) sendJson(404, ['message' => 'Colección no encontrada']);
        if ($row['user_id'] !== $userId) sendJson(403, ['message' => 'No tienes permiso para eliminar esta colección']);

        $del = $pdo->prepare('DELETE FROM movimood_collection_movies WHERE collection_id = :id');
        $del->execute(['id' => $collectionId]);
        $del2 = $pdo->prepare('DELETE FROM movimood_collections WHERE id = :id');
        $del2->execute(['id' => $collectionId]);

        sendJson(200, ['deleted' => true]);
    }

    sendJson(405, ['message' => 'Method not allowed']);
}

function handleCollectionMovies(PDO $pdo): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $collectionId = isset($_GET['collection_id']) ? trim((string)$_GET['collection_id']) : null;
        if (!$collectionId) sendJson(400, ['message' => 'collection_id es requerido']);
        $stmt = $pdo->prepare('SELECT movie_id, movie_json, added_at FROM movimood_collection_movies WHERE collection_id = :collection_id ORDER BY added_at DESC');
        $stmt->execute(['collection_id' => $collectionId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $items = array_map(function($r){ return ['movie_id' => (int)$r['movie_id'], 'movie' => json_decode($r['movie_json'], true) ?: null, 'added_at' => $r['added_at']]; }, $rows);
        sendJson(200, ['items' => $items]);
    }

    if ($method === 'POST') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $collectionId = isset($data['collection_id']) ? trim((string)$data['collection_id']) : null;
        $movie = isset($data['movie']) && is_array($data['movie']) ? $data['movie'] : null;
        if (!$collectionId || !$movie) sendJson(400, ['message' => 'collection_id y movie son requeridos']);

        // verify ownership of collection
        $stmt = $pdo->prepare('SELECT user_id FROM movimood_collections WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $collectionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) sendJson(404, ['message' => 'Colección no encontrada']);
        if ($row['user_id'] !== $userId) sendJson(403, ['message' => 'No tienes permiso para modificar esta colección']);

        $movieId = isset($movie['id']) ? (int)$movie['id'] : null;
        if (!$movieId) sendJson(400, ['message' => 'movie.id inválido']);

        $stmt = $pdo->prepare('INSERT INTO movimood_collection_movies (collection_id, movie_id, movie_json, added_at) VALUES (:collection_id, :movie_id, :movie_json, :added_at)');
        try {
            $stmt->execute([
                ':collection_id' => $collectionId,
                ':movie_id' => $movieId,
                ':movie_json' => json_encode($movie, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                ':added_at' => date('Y-m-d H:i:s'),
            ]);
        } catch (PDOException $e) {
            // ignore duplicates
        }

        sendJson(201, ['added' => true]);
    }

    if ($method === 'DELETE') {
        $userId = requireSessionUserId();
        $data = json_decode(file_get_contents('php://input'), true) ?: [];
        $collectionId = isset($data['collection_id']) ? trim((string)$data['collection_id']) : null;
        $movieId = isset($data['movie_id']) ? (int)$data['movie_id'] : null;
        if (!$collectionId || !$movieId) sendJson(400, ['message' => 'collection_id y movie_id son requeridos']);

        // verify ownership
        $stmt = $pdo->prepare('SELECT user_id FROM movimood_collections WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $collectionId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) sendJson(404, ['message' => 'Colección no encontrada']);
        if ($row['user_id'] !== $userId) sendJson(403, ['message' => 'No tienes permiso para modificar esta colección']);

        $del = $pdo->prepare('DELETE FROM movimood_collection_movies WHERE collection_id = :collection_id AND movie_id = :movie_id');
        $del->execute(['collection_id' => $collectionId, 'movie_id' => $movieId]);

        sendJson(200, ['deleted' => true]);
    }

    sendJson(405, ['message' => 'Method not allowed']);
}