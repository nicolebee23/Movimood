$path = 'C:\xampp\htdocs\movimood-frontend\src\paginas\Perfil.jsx'
$content = Get-Content $path -Raw

$old1 = @'
const MOOD_GLOW_COLORS = {
  Triste: '#7e8dff',
  Nostalgico: '#8aa2ff',
  Relajado: '#49c2c9',
  Ansioso: '#ff8d66',
  Feliz: '#f4c84a',
  Motivado: '#ff7c52',
  Enojado: '#ff5b8b',
  Emocionado: '#b58cff',
};
'@
$new1 = @'
const MOOD_GLOW_COLORS = {
  Triste: '#7e8dff',
  Nostalgico: '#8aa2ff',
  Relajado: '#49c2c9',
  Ansioso: '#ff8d66',
  Feliz: '#f4c84a',
  Motivado: '#ff7c52',
  Enojado: '#ff5b8b',
  Emocionado: '#b58cff',
};

const MOOD_NORMALIZATION_MAP = {
  triste: 'Triste',
  nostalgico: 'Nostalgico',
  relajado: 'Relajado',
  ansioso: 'Ansioso',
  feliz: 'Feliz',
  motivado: 'Motivado',
  enojado: 'Enojado',
  emocionado: 'Emocionado',
};
'@
if (-not $content.Contains($old1)) { throw 'MOOD_GLOW_COLORS block not found' }
$content = $content.Replace($old1, $new1)

$old2 = @'
function getUniqueMoods(moods) {
  return Array.from(new Set((Array.isArray(moods) ? moods : []).filter(Boolean)));
}
'@
$new2 = @'
function getUniqueMoods(moods) {
  return Array.from(new Set((Array.isArray(moods) ? moods : []).filter(Boolean)));
}

function normalizeMoodName(mood) {
  if (!mood) {
    return null;
  }

  const normalized = String(mood)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

  return MOOD_NORMALIZATION_MAP[normalized] || null;
}

function getQuestionnaireMoods(questionnaire) {
  return getUniqueMoods(questionnaire?.moods)
    .map(normalizeMoodName)
    .filter(Boolean);
}
'@
if (-not $content.Contains($old2)) { throw 'getUniqueMoods block not found' }
$content = $content.Replace($old2, $new2)

$old3 = @'
  const moodStats = useMemo(() => {
    const moodKeys = Object.keys(MOOD_EMOJIS);
    const counts = moodKeys.reduce((accumulator, mood) => {
      accumulator[mood] = 0;
      return accumulator;
    }, {});
    const countedMoodPairs = new Set();

    function addMoodCount(movieId, moods) {
      const uniqueMoods = getUniqueMoods(moods);

      uniqueMoods.forEach((mood) => {
        if (!counts[mood]) {
          return;
        }

        const pairKey = `${movieKey(movieId)}::${mood}`;
        if (countedMoodPairs.has(pairKey)) {
          return;
        }

        countedMoodPairs.add(pairKey);
        counts[mood] += 1;
      });
    }

    myReviews.forEach((review) => {
      addMoodCount(review.movieId || review.movie?.id, review.mood ? [review.mood] : []);
    });

    [...favoritos, ...storedWatchedFavorites]
      .filter((fav) => fav.lista === LISTAS.YA_VISTA)
      .forEach((fav) => {
        const movieId = fav?.movie?.id;
        const questionnaireMoods = getUniqueMoods(fav?.questionnaire?.moods);
        const reviewMood = movieId ? myReviews.find((review) => movieKey(review.movieId || review.movie?.id) === movieKey(movieId))?.mood : null;
        addMoodCount(movieId, questionnaireMoods.length > 0 ? questionnaireMoods : (reviewMood ? [reviewMood] : []));
      });

    return counts;
  }, [favoritos, myReviews, storedWatchedFavorites]);
'@
$new3 = @'
  const watchedFavorites = useMemo(
    () => [...favoritos, ...storedWatchedFavorites].filter((fav) => fav.lista === LISTAS.YA_VISTA && fav.movie?.id),
    [favoritos, storedWatchedFavorites]
  );

  const moodStats = useMemo(() => {
    const moodKeys = Object.keys(MOOD_EMOJIS);
    const counts = moodKeys.reduce((accumulator, mood) => {
      accumulator[mood] = 0;
      return accumulator;
    }, {});
    const countedMoodPairs = new Set();

    function addMoodCount(movieId, moods) {
      const uniqueMoods = getUniqueMoods(moods)
        .map(normalizeMoodName)
        .filter(Boolean);

      uniqueMoods.forEach((mood) => {
        if (!counts[mood]) {
          return;
        }

        const pairKey = `${movieKey(movieId)}::${mood}`;
        if (countedMoodPairs.has(pairKey)) {
          return;
        }

        countedMoodPairs.add(pairKey);
        counts[mood] += 1;
      });
    }

    watchedFavorites.forEach((fav) => {
      const movieId = fav?.movie?.id;
      addMoodCount(movieId, getQuestionnaireMoods(fav?.questionnaire));
    });

    return counts;
  }, [watchedFavorites]);
'@
if (-not $content.Contains($old3)) { throw 'moodStats block not found' }
$content = $content.Replace($old3, $new3)

$old4 = @'
  const moodCollectionCards = useMemo(() => {
    const postersByMood = new Map();
    const seenFavoritesSorted = [...favoritos, ...storedWatchedFavorites]
      .filter((fav) => fav.lista === LISTAS.YA_VISTA)
      .sort((left, right) => new Date(right.savedAt || right.updatedAt || 0) - new Date(left.savedAt || left.updatedAt || 0));
    const reviewsSortedByDate = [...myReviews].sort(
      (left, right) => new Date(right.updatedAt || right.createdAt) - new Date(left.updatedAt || left.createdAt)
    );

    seenFavoritesSorted.forEach((fav) => {
      const movieId = fav?.movie?.id;
      const questionnaireMoods = getUniqueMoods(fav?.questionnaire?.moods);
      const reviewMood = movieId ? myReviews.find((review) => movieKey(review.movieId || review.movie?.id) === movieKey(movieId))?.mood : null;
      const moodsToAssign = questionnaireMoods.length > 0 ? questionnaireMoods : (reviewMood ? [reviewMood] : []);

      if (!movieId || moodsToAssign.length === 0) {
        return;
      }

      const resolvedMovie = mergeMovieCandidates(movieId, [
        normalizeMovieForActivity(fav.movie),
        normalizeMovieForActivity(posterFallbackByMovieId[movieId], movieId),
        storedMoviesById.get(movieKey(movieId)),
      ]);

      if (!resolvedMovie?.poster_path) {
        return;
      }

      moodsToAssign.forEach((mood) => {
        if (!MOOD_EMOJIS[mood]) {
          return;
        }

        const current = postersByMood.get(mood) || [];
        if (!current.some((movie) => movie.id === resolvedMovie.id)) {
          postersByMood.set(mood, [...current, resolvedMovie]);
        }
      });
    });

    reviewsSortedByDate.forEach((review) => {
      const reviewMovieKey = movieKey(review.movieId);
      const relatedFavorite = [...favoritos, ...storedWatchedFavorites].find((fav) => movieKey(fav?.movie?.id) === reviewMovieKey) || null;
      const questionnaireMoods = getUniqueMoods(relatedFavorite?.questionnaire?.moods);
      const moodsToAssign = review.mood ? [review.mood] : questionnaireMoods;

      if (moodsToAssign.length === 0) {
        return;
      }

      const resolvedMovie = mergeMovieCandidates(review.movieId, [
        normalizeMovieForActivity(review.movie),
        normalizeMovieForActivity(relatedFavorite?.movie),
        normalizeMovieForActivity(posterFallbackByMovieId[review.movieId], review.movieId),
        storedMoviesById.get(reviewMovieKey),
      ]);

      if (!resolvedMovie?.poster_path) {
        return;
      }

      moodsToAssign.forEach((mood) => {
        if (!MOOD_EMOJIS[mood]) {
          return;
        }

        const current = postersByMood.get(mood) || [];
        if (!current.some((movie) => movie.id === resolvedMovie.id)) {
          postersByMood.set(mood, [...current, resolvedMovie]);
        }
      });
    });

    return moodCollections.map((collection) => ({
      ...collection,
      glowColor: MOOD_GLOW_COLORS[collection.mood] || '#8aa2ff',
      posters: (postersByMood.get(collection.mood) || []).slice(0, 3),
    }));
  }, [favoritos, moodCollections, myReviews, posterFallbackByMovieId, storedMoviesById, storedWatchedFavorites]);
'@
$new4 = @'
  const moodCollectionCards = useMemo(() => {
    const postersByMood = new Map();
    const seenFavoritesSorted = [...watchedFavorites]
      .sort((left, right) => new Date(right.savedAt || right.updatedAt || 0) - new Date(left.savedAt || left.updatedAt || 0));

    seenFavoritesSorted.forEach((fav) => {
      const movieId = fav?.movie?.id;
      const moodsToAssign = getQuestionnaireMoods(fav?.questionnaire);

      if (!movieId || moodsToAssign.length === 0) {
        return;
      }

      const resolvedMovie = mergeMovieCandidates(movieId, [
        normalizeMovieForActivity(fav.movie),
        normalizeMovieForActivity(posterFallbackByMovieId[movieId], movieId),
        storedMoviesById.get(movieKey(movieId)),
      ]);

      if (!resolvedMovie?.poster_path) {
        return;
      }

      moodsToAssign.forEach((mood) => {
        if (!MOOD_EMOJIS[mood]) {
          return;
        }

        const current = postersByMood.get(mood) || [];
        if (!current.some((movie) => movie.id === resolvedMovie.id)) {
          postersByMood.set(mood, [...current, resolvedMovie]);
        }
      });
    });

    return moodCollections.map((collection) => ({
      ...collection,
      glowColor: MOOD_GLOW_COLORS[collection.mood] || '#8aa2ff',
      posters: (postersByMood.get(collection.mood) || []).slice(0, 3),
    }));
  }, [moodCollections, posterFallbackByMovieId, storedMoviesById, watchedFavorites]);
'@
if (-not $content.Contains($old4)) { throw 'moodCollectionCards block not found' }
$content = $content.Replace($old4, $new4)

Set-Content -Path $path -Value $content -Encoding UTF8
Write-Output 'Perfil.jsx updated'
