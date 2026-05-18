-- MoviMood sample data for testing in phpMyAdmin
--
-- Import after schema.sql if you want to verify that inserts work.
-- Sample login for the first user:
--   username: demo
--   password: Password123

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO movimood_users (
  id, username, name, email, password_hash, avatar_url, notifications_app, notifications_email, created_at, updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'demo',
    'Demo User',
    'demo@movimood.local',
    '$2y$10$GV4QPJ39My6RP2n/oJZSA.fAE6wIYIVcyzmQrD3My3ScqDWwCCMoO',
    NULL,
    1,
    0,
    NOW(),
    NOW()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'cinefilo',
    'Cinefilo MoviMood',
    'cinefilo@movimood.local',
    '$2y$10$GV4QPJ39My6RP2n/oJZSA.fAE6wIYIVcyzmQrD3My3ScqDWwCCMoO',
    NULL,
    1,
    1,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  username = VALUES(username),
  name = VALUES(name),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  avatar_url = VALUES(avatar_url),
  notifications_app = VALUES(notifications_app),
  notifications_email = VALUES(notifications_email),
  updated_at = NOW();

INSERT INTO movimood_user_follows (
  follower_user_id, followed_user_id, created_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    NOW()
  )
ON DUPLICATE KEY UPDATE
  created_at = VALUES(created_at);

INSERT INTO movimood_favorite_movies (
  user_id, movie_id, movie_json, questionnaire_json, list_type, is_essential, saved_at, updated_at
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    550,
    '{"id":550,"title":"Fight Club","poster_path":"/8kNruSfhk5IoE4eZOc4UpvDn6tq.jpg","release_date":"1999-10-15"}',
    '{"moods":["Ansioso","Motivado"],"genreIds":[18,53],"year":"1999"}',
    'ya-vista',
    1,
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  movie_json = VALUES(movie_json),
  questionnaire_json = VALUES(questionnaire_json),
  list_type = VALUES(list_type),
  is_essential = VALUES(is_essential),
  updated_at = NOW();

INSERT INTO movimood_movie_reviews (
  id, user_id, movie_id, movie_json, mood, author, rating, comment, created_at, updated_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    550,
    '{"id":550,"title":"Fight Club","poster_path":"/8kNruSfhk5IoE4eZOc4UpvDn6tq.jpg","release_date":"1999-10-15"}',
    'Ansioso',
    'Demo User',
    9,
    'Una reseña de prueba para confirmar que la tabla recibe inserts.',
    NOW(),
    NOW()
  )
ON DUPLICATE KEY UPDATE
  movie_json = VALUES(movie_json),
  mood = VALUES(mood),
  author = VALUES(author),
  rating = VALUES(rating),
  comment = VALUES(comment),
  updated_at = NOW();

INSERT INTO movimood_review_likes (
  review_id, user_id, created_at
) VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    NOW()
  )
ON DUPLICATE KEY UPDATE
  created_at = VALUES(created_at);
