import { requestJson } from './movimoodApi';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

export const genreNameToId = {
  'Acción': 28,
  Aventura: 12,
  Animación: 16,
  Comedia: 35,
  Crimen: 80,
  Drama: 18,
  Familia: 10751,
  Fantasía: 14,
  Terror: 27,
  Musical: 10402,
  Misterio: 9648,
  Romance: 10749,
  'Ciencia Ficción': 878,
  Thriller: 53,
  Bélica: 10752,
  Western: 37,
};

export const genreIdToName = Object.fromEntries(
  Object.entries(genreNameToId).map(([name, id]) => [id, name])
);

const DEFAULT_DISCOVER_PAGES = 2;
const DEFAULT_OUTPUT_LIMIT = 12;

const moodGenreMap = {
  Triste: [18, 10749, 10402],
  Nostalgico: [18, 10749, 36],
  Relajado: [99, 16, 14],
  Ansioso: [53, 9648, 27],
  Feliz: [35, 10751, 16],
  Motivado: [12, 28, 10752],
  Enojado: [28, 80, 53],
  Emocionado: [12, 878, 14],
};

const moodKeywordMap = {
  Triste: ['emocion', 'familia', 'duelo', 'amor', 'superacion'],
  Nostalgico: ['pasado', 'recuerdo', 'clasico', 'historia', 'epoca'],
  Relajado: ['viaje', 'naturaleza', 'amistad', 'aventura', 'magia'],
  Ansioso: ['secreto', 'misterio', 'peligro', 'huir', 'conspiracion'],
  Feliz: ['diversion', 'fiesta', 'familia', 'amistad', 'comedia'],
  Motivado: ['superacion', 'mision', 'reto', 'victoria', 'inspirador'],
  Enojado: ['venganza', 'crimen', 'justicia', 'conflicto', 'accion'],
  Emocionado: ['descubrimiento', 'universo', 'mision', 'aventura', 'destino'],
};

const durationConfig = {
  Corta: { max: 90 },
  Media: { min: 90, max: 120 },
  Larga: { min: 120 },
};

function buildDiscoverUrl(questionnaire, page, includeGenres) {
  if (!API_BASE_URL) {
    throw new Error('Falta REACT_APP_API_BASE_URL en el entorno.');
  }

  const params = new URLSearchParams({
    language: 'es-ES',
    include_adult: 'false',
    include_video: 'false',
    page: String(page),
    sort_by: 'popularity.desc',
    'vote_count.gte': '120',
    'primary_release_date.gte': `${questionnaire.anios.min}-01-01`,
    'primary_release_date.lte': `${questionnaire.anios.max}-12-31`,
  });

  const duration = durationConfig[questionnaire.duracion];
  if (duration?.min) {
    params.set('with_runtime.gte', String(duration.min));
  }
  if (duration?.max) {
    params.set('with_runtime.lte', String(duration.max));
  }

  if (includeGenres && questionnaire.genreIds.length > 0) {
    params.set('with_genres', questionnaire.genreIds.join('|'));
  }

  return `${API_BASE_URL}/tmdb-discover.php?${params.toString()}`;
}

function normalizeQuestionnaire(questionnaire) {
  const genreIds = (questionnaire.generos || [])
    .map((genre) => genreNameToId[genre])
    .filter(Boolean);

  const moodGenreIds = [...new Set((questionnaire.moods || []).flatMap((mood) => moodGenreMap[mood] || []))];
  const moodKeywords = [...new Set((questionnaire.moods || []).flatMap((mood) => moodKeywordMap[mood] || []))];

  return {
    ...questionnaire,
    genreIds,
    moodGenreIds,
    moodKeywords,
  };
}

function getYear(movie) {
  return Number(movie.release_date?.slice(0, 4)) || 0;
}

function getYearScore(movie, questionnaire) {
  const year = getYear(movie);
  if (!year) {
    return 0;
  }

  const center = (questionnaire.anios.min + questionnaire.anios.max) / 2;
  const range = Math.max(questionnaire.anios.max - questionnaire.anios.min, 1);
  const distance = Math.abs(year - center);
  return Math.max(0, 3 - (distance / range) * 3);
}

function getMoodKeywordScore(movie, questionnaire) {
  const text = `${movie.title || ''} ${movie.overview || ''}`.toLowerCase();
  return questionnaire.moodKeywords.reduce((score, keyword) => {
    return score + (text.includes(keyword.toLowerCase()) ? 1.25 : 0);
  }, 0);
}

function rankMovie(movie, questionnaire) {
  const selectedGenres = movie.genre_ids.filter((genreId) => questionnaire.genreIds.includes(genreId)).length;
  const moodGenres = movie.genre_ids.filter((genreId) => questionnaire.moodGenreIds.includes(genreId)).length;
  const keywordScore = getMoodKeywordScore(movie, questionnaire);
  const yearScore = getYearScore(movie, questionnaire);
  const ratingScore = Math.min(movie.vote_average || 0, 10) * 0.35;
  const popularityScore = Math.min((movie.popularity || 0) / 150, 1.5);

  return (selectedGenres * 4.5) + (moodGenres * 4.0) + keywordScore + yearScore + ratingScore + popularityScore;
}

function uniqueMovies(movies) {
  const seen = new Set();

  return movies.filter((movie) => {
    if (seen.has(movie.id)) {
      return false;
    }

    seen.add(movie.id);
    return true;
  });
}

async function fetchDiscoverPage(questionnaire, page, includeGenres) {
  const discoverUrl = new URL(buildDiscoverUrl(questionnaire, page, includeGenres));
  const params = Object.fromEntries(discoverUrl.searchParams.entries());
  const data = await requestJson('/tmdb-discover.php', { params });
  return data.results || [];
}

export function getRecommendationReasons(movie, questionnaire) {
  const reasons = [];
  const matchingGenres = movie.genre_ids
    .map((genreId) => genreIdToName[genreId])
    .filter((genreName) => questionnaire.generos.includes(genreName));

  if (matchingGenres.length > 0) {
    reasons.push(`Coincide con tus géneros: ${matchingGenres.slice(0, 2).join(', ')}`);
  }

  const moodGenreMatch = movie.genre_ids.some((genreId) => questionnaire.moodGenreIds.includes(genreId));
  if (moodGenreMatch && questionnaire.moods.length > 0) {
    reasons.push(`Encaja con tu mood actual: ${questionnaire.moods.join(', ')}`);
  }

  const year = getYear(movie);
  if (year >= questionnaire.anios.min && year <= questionnaire.anios.max) {
    reasons.push(`Está dentro de la época que elegiste: ${questionnaire.anios.min}-${questionnaire.anios.max}`);
  }

  if ((movie.vote_average || 0) >= 7) {
    reasons.push(`Tiene buena valoración: ${movie.vote_average.toFixed(1)}/10`);
  }

  return reasons.slice(0, 3);
}

export async function fetchRecommendedMovies(rawQuestionnaire, options = {}) {
  const questionnaire = normalizeQuestionnaire(rawQuestionnaire);
  const discoverPages = Math.max(1, Number(options.discoverPages) || DEFAULT_DISCOVER_PAGES);
  const outputLimit = Math.max(1, Number(options.outputLimit) || DEFAULT_OUTPUT_LIMIT);

  const pages = Array.from({ length: discoverPages }, (_, index) => index + 1);

  const primaryResults = await Promise.all(
    pages.map((page) => fetchDiscoverPage(questionnaire, page, true))
  );

  let movies = uniqueMovies(primaryResults.flat()).filter((movie) => Boolean(movie.poster_path));

  if (movies.length === 0) {
    const fallbackResults = await Promise.all(
      pages.map((page) => fetchDiscoverPage(questionnaire, page, false))
    );

    movies = uniqueMovies(fallbackResults.flat()).filter((movie) => Boolean(movie.poster_path));
  }

  const rankedMovies = movies
    .map((movie) => ({
      ...movie,
      recommendationScore: rankMovie(movie, questionnaire),
    }))
    .sort((left, right) => right.recommendationScore - left.recommendationScore);

  return {
    questionnaire,
    movies: rankedMovies.slice(0, outputLimit),
  };
}