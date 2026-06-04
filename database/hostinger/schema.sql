-- MoviMood MySQL schema for Hostinger
--
-- Recommended flow in Hostinger:
-- 1) Create the database in hPanel.
-- 2) Create a database user and grant all privileges to that DB.
-- 3) Import this file into the empty database from phpMyAdmin.
--
-- Recommended database name: movimood_db
-- Recommended charset: utf8mb4

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;

CREATE TABLE IF NOT EXISTS movimood_users (
  id VARCHAR(36) NOT NULL,
  username VARCHAR(18) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT NULL,
  notifications_app TINYINT(1) NOT NULL DEFAULT 1,
  notifications_email TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_movimood_users_username (username),
  UNIQUE KEY uq_movimood_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimood_user_follows (
  follower_user_id VARCHAR(36) NOT NULL,
  followed_user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_user_id, followed_user_id),
  KEY idx_movimood_user_follows_followed_user_id (followed_user_id),
  CONSTRAINT fk_movimood_user_follows_follower
    FOREIGN KEY (follower_user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_movimood_user_follows_followed
    FOREIGN KEY (followed_user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE IF NOT EXISTS movimood_favorite_movies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  movie_id BIGINT UNSIGNED NOT NULL,
  movie_json JSON NOT NULL,
  questionnaire_json JSON NULL,
  list_type ENUM('ver-mas-tarde', 'ya-vista', 'no-interesa') NOT NULL DEFAULT 'ver-mas-tarde',
  is_essential TINYINT(1) NOT NULL DEFAULT 0,
  saved_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_movimood_favorite_movies_user_movie (user_id, movie_id),
  KEY idx_movimood_favorite_movies_user_id (user_id),
  KEY idx_movimood_favorite_movies_list_type (list_type),
  CONSTRAINT fk_movimood_favorite_movies_user
    FOREIGN KEY (user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimood_movie_reviews (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  movie_id BIGINT UNSIGNED NOT NULL,
  movie_json JSON NOT NULL,
  mood VARCHAR(32) NULL,
  author VARCHAR(120) NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimood_movie_reviews_user_id (user_id),
  KEY idx_movimood_movie_reviews_movie_id (movie_id),
  KEY idx_movimood_movie_reviews_mood (mood),
  CONSTRAINT fk_movimood_movie_reviews_user
    FOREIGN KEY (user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimood_review_likes (
  review_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  KEY idx_movimood_review_likes_user_id (user_id),
  CONSTRAINT fk_movimood_review_likes_review
    FOREIGN KEY (review_id) REFERENCES movimood_movie_reviews (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_movimood_review_likes_user
    FOREIGN KEY (user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimood_collections (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimood_collections_user_id (user_id),
  CONSTRAINT fk_movimood_collections_user
    FOREIGN KEY (user_id) REFERENCES movimood_users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimood_collection_movies (
  collection_id VARCHAR(36) NOT NULL,
  movie_id BIGINT UNSIGNED NOT NULL,
  movie_json JSON NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (collection_id, movie_id),
  KEY idx_movimood_collection_movies_movie_id (movie_id),
  CONSTRAINT fk_movimood_collection_movies_collection
    FOREIGN KEY (collection_id) REFERENCES movimood_collections (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET foreign_key_checks = 1;
