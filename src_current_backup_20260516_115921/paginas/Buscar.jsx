import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './Buscar.css';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

const TMDB_GENRES_ES = [
  { id: 28, name: 'Accion' },
  { id: 12, name: 'Aventura' },
  { id: 16, name: 'Animacion' },
  { id: 35, name: 'Comedia' },
  { id: 80, name: 'Crimen' },
  { id: 99, name: 'Documental' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Familia' },
  { id: 14, name: 'Fantasia' },
  { id: 36, name: 'Historia' },
  { id: 27, name: 'Terror' },
  { id: 10402, name: 'Musica' },
  { id: 9648, name: 'Misterio' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Ciencia ficcion' },
  { id: 10770, name: 'TV Movie' },
  { id: 53, name: 'Thriller' },
  { id: 10752, name: 'Belica' },
  { id: 37, name: 'Western' },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function mapUserToResult(user) {
  return {
    id: user.id,
    title: user.name || user.username,
    username: user.username,
    avatar: user.avatar || '',
  };
}

function Buscar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [users, setUsers] = useState([]);
  const [genres, setGenres] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'auto').toLowerCase();
  const genreId = searchParams.get('genre');
  const activeTab = type === 'movie' ? 'movie' : type === 'genre' ? 'genre' : type === 'user' ? 'user' : 'all';

  const canLoadMoreMovies = useMemo(() => {
    return (type === 'movie' || type === 'auto') && page < totalPages;
  }, [page, totalPages, type]);

  async function fetchUsersByQuery(rawQuery) {
    const q = normalize(rawQuery);
    const usersRes = await fetch(`${API_BASE_URL}/movimood.php?resource=auth&action=users`, {
      credentials: 'include',
    });

    if (!usersRes.ok) {
      throw new Error('Error al listar usuarios');
    }

    const usersPayload = await usersRes.json();
    const items = Array.isArray(usersPayload?.items) ? usersPayload.items : [];

    return items
      .filter((u) => {
        const name = normalize(u.name);
        const username = normalize(u.username);
        return name.includes(q) || username.includes(q);
      })
      .map(mapUserToResult);
  }

  function findGenresByQuery(rawQuery) {
    const q = normalize(rawQuery);
    if (!q) {
      return [];
    }

    return TMDB_GENRES_ES.filter((genre) => normalize(genre.name).includes(q));
  }

  async function fetchMoviePage(nextPage, rawQuery, selectedGenreId) {
    const language = 'es-ES';
    const includeAdult = 'false';

    const endpoint = selectedGenreId ? 'tmdb-discover.php' : 'tmdb-search.php';
    const params = new URLSearchParams({
      page: String(nextPage),
      language,
      include_adult: includeAdult,
    });

    if (selectedGenreId) {
      params.set('with_genres', String(selectedGenreId));
      params.set('sort_by', 'popularity.desc');
    } else {
      params.set('query', rawQuery.trim());
    }

    const response = await fetch(`${API_BASE_URL}/${endpoint}?${params.toString()}`);
    if (!response.ok) {
      throw new Error('Error al buscar peliculas');
    }

    const data = await response.json();
    const filteredMovies = Array.isArray(data?.results)
      ? data.results.filter((movie) => movie?.id && movie?.poster_path)
      : [];

    return {
      movies: filteredMovies,
      totalPages: data?.total_pages || 1,
    };
  }

  useEffect(() => {
    if (!query.trim() && !genreId) {
      setMovies([]);
      setUsers([]);
      setGenres([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    setMovies([]);
    setUsers([]);
    setGenres([]);
    setPage(1);
    setTotalPages(0);

    async function runSearch() {
      try {
        const currentQuery = query.trim();

        if (type === 'user') {
          const nextUsers = await fetchUsersByQuery(currentQuery);
          setUsers(nextUsers);
          setMovies([]);
          setGenres([]);
          setTotalPages(1);

          if (nextUsers.length === 0) {
            setError('No se encontraron usuarios con esa busqueda');
          }
          return;
        }

        if (type === 'genre') {
          const nextGenres = findGenresByQuery(currentQuery);
          setGenres(nextGenres);
          setMovies([]);
          setUsers([]);
          setTotalPages(1);

          if (nextGenres.length === 0) {
            setError('No se encontraron generos con esa busqueda');
          }
          return;
        }

        if (type === 'movie') {
          const movieResult = await fetchMoviePage(1, currentQuery, genreId);
          setMovies(movieResult.movies);
          setUsers([]);
          setGenres([]);
          setTotalPages(movieResult.totalPages);

          if (movieResult.movies.length === 0) {
            setError('No se encontraron peliculas con esa busqueda');
          }
          return;
        }

        const [movieResult, usersResult] = await Promise.all([
          fetchMoviePage(1, currentQuery, null),
          fetchUsersByQuery(currentQuery).catch(() => []),
        ]);

        const genreResult = findGenresByQuery(currentQuery);

        setMovies(movieResult.movies);
        setUsers(usersResult);
        setGenres(genreResult);
        setTotalPages(movieResult.totalPages);

        if (movieResult.movies.length === 0 && usersResult.length === 0 && genreResult.length === 0) {
          setError('No se encontraron resultados para esa busqueda');
        }
      } catch (err) {
        setError(err.message || 'Error al buscar');
      } finally {
        setIsLoading(false);
      }
    }

    runSearch();
  }, [genreId, query, type]);

  async function handleLoadMore() {
    if (!canLoadMoreMovies || isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const nextPage = page + 1;
      const movieResult = await fetchMoviePage(nextPage, query.trim(), genreId);
      setMovies((prev) => [...prev, ...movieResult.movies]);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || 'Error al cargar mas peliculas');
    } finally {
      setIsLoading(false);
    }
  }

  function handleMovieClick(movie) {
    navigate(`/pelicula/${movie.id}`, { state: { movieData: movie } });
  }

  function handleGenreClick(genre) {
    navigate(`/buscar?q=${encodeURIComponent(genre.name)}&type=movie&genre=${genre.id}`);
  }

  function handleTabChange(nextTab) {
    const nextParams = new URLSearchParams();

    if (query.trim()) {
      nextParams.set('q', query.trim());
    }

    if (nextTab === 'movie') {
      nextParams.set('type', 'movie');
      if (genreId) {
        nextParams.set('genre', genreId);
      }
    } else if (nextTab === 'genre') {
      nextParams.set('type', 'genre');
    } else if (nextTab === 'user') {
      nextParams.set('type', 'user');
    }

    navigate(`/buscar?${nextParams.toString()}`);
  }

  const totalResults = movies.length + users.length + genres.length;

  return (
    <div className="buscar-page">
      <div className="buscar-header">
        <button type="button" className="buscar-back-btn" onClick={() => navigate(-1)} aria-label="Volver atrás">
          <span aria-hidden="true">←</span>
        </button>
        <div className="buscar-filters" role="tablist" aria-label="Filtros de búsqueda">
          <button type="button" className={`buscar-filter-chip${activeTab === 'all' ? ' active' : ''}`} onClick={() => handleTabChange('all')}>Todos</button>
          <button type="button" className={`buscar-filter-chip${activeTab === 'movie' ? ' active' : ''}`} onClick={() => handleTabChange('movie')}>Películas</button>
          <button type="button" className={`buscar-filter-chip${activeTab === 'genre' ? ' active' : ''}`} onClick={() => handleTabChange('genre')}>Géneros</button>
          <button type="button" className={`buscar-filter-chip${activeTab === 'user' ? ' active' : ''}`} onClick={() => handleTabChange('user')}>Usuarios</button>
        </div>
        <h1 className="buscar-title">
          Resultados para: <strong>{query || 'búsqueda'}</strong>
        </h1>
        {totalResults > 0 && (
          <p className="buscar-count">
            {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading && totalResults === 0 && (
        <div className="buscar-loading">
          <div className="spinner"></div>
          <p>Buscando peliculas, generos y usuarios...</p>
        </div>
      )}

      {error && totalResults === 0 && (
        <div className="buscar-error">
          <p>{error}</p>
        </div>
      )}

      {genres.length > 0 && (
        <section className="buscar-section">
          <h2 className="buscar-section-title">Generos</h2>
          <div className="buscar-genres-list">
            {genres.map((genre) => (
              <button
                key={genre.id}
                className="buscar-genre-chip"
                type="button"
                onClick={() => handleGenreClick(genre)}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {users.length > 0 && (
        <section className="buscar-section">
          <h2 className="buscar-section-title">Usuarios</h2>
          <div className="buscar-users-list">
            {users.map((user) => (
              <div key={user.id} className="buscar-user-card">
                <div className="buscar-user-main">
                  <div className="buscar-user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.title || user.username} loading="lazy" />
                    ) : (
                      <div className="buscar-user-avatar-fallback">{(user.title || user.username || 'U').slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>
                  <div className="buscar-user-info">
                    <div className="buscar-user-name">{user.title}</div>
                    <div className="buscar-user-username">@{user.username}</div>
                  </div>
                </div>
                <div className="buscar-user-actions">
                  <Link to={`/perfil/${encodeURIComponent(user.id)}`} className="buscar-user-btn">Ver perfil</Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {movies.length > 0 && (
        <section className="buscar-section">
          <h2 className="buscar-section-title">Peliculas</h2>
          <div className="buscar-grid">
            {movies.map((movie) => (
              <button
                key={movie.id}
                className="buscar-grid-item"
                onClick={() => handleMovieClick(movie)}
                type="button"
                aria-label={`Ver ${movie.title || movie.name}`}
              >
                <div className="buscar-poster-wrapper">
                  <img
                    src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="buscar-poster"
                    loading="lazy"
                  />
                  <div className="buscar-overlay">
                    <span className="buscar-overlay-text">Ver detalles</span>
                  </div>
                </div>
                <div className="buscar-info">
                  <h3 className="buscar-movie-title">{movie.title || movie.name}</h3>
                  {movie.release_date && (
                    <p className="buscar-movie-year">{movie.release_date.split('-')[0]}</p>
                  )}
                  {movie.vote_average && (
                    <p className="buscar-movie-rating">⭐ {movie.vote_average.toFixed(1)}</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {canLoadMoreMovies && (
            <div className="buscar-load-more">
              <button
                type="button"
                className="buscar-load-more-btn"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Cargar mas'}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Buscar;
