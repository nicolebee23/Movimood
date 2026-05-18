<?php

require_once __DIR__ . '/../api/_lib/bootstrap.php';

try {
    $pdo = db();

    $stmt = $pdo->prepare('SELECT user_id, movie_id, list_type, is_essential, movie_json, saved_at, updated_at FROM movimood_favorite_movies WHERE is_essential = 1 ORDER BY updated_at DESC LIMIT 100');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([ 'ok' => true, 'count' => count($rows), 'rows' => $rows ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    echo json_encode([ 'ok' => false, 'error' => $e->getMessage() ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
