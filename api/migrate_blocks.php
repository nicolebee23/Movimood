<?php

declare(strict_types=1);

require_once __DIR__ . '/_lib/bootstrap.php';

allowCors();

if (requestMethod() === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $pdo = db();

    // Ejecutar la migración de la tabla de bloqueos
    $sql = "
    CREATE TABLE IF NOT EXISTS movimood_user_blocks (
      blocker_user_id VARCHAR(36) NOT NULL,
      blocked_user_id VARCHAR(36) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (blocker_user_id, blocked_user_id),
      KEY idx_movimood_user_blocks_blocked_user_id (blocked_user_id),
      CONSTRAINT fk_movimood_user_blocks_blocker
        FOREIGN KEY (blocker_user_id) REFERENCES movimood_users (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_movimood_user_blocks_blocked
        FOREIGN KEY (blocked_user_id) REFERENCES movimood_users (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";

    $pdo->exec($sql);

    // Verificar que la tabla existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'movimood_user_blocks'");
    $tableExists = $stmt->fetchColumn();

    if ($tableExists) {
        sendJson(200, [
            'message' => 'Tabla movimood_user_blocks creada exitosamente.',
            'table_exists' => true
        ]);
    } else {
        sendJson(500, [
            'message' => 'Error: La tabla no se pudo crear.',
            'table_exists' => false
        ]);
    }

} catch (Throwable $exception) {
    sendJson(500, [
        'message' => 'Error ejecutando migración.',
        'error' => $exception->getMessage()
    ]);
}