-- Migration para añadir la tabla de bloqueos de usuario en MoviMood

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
