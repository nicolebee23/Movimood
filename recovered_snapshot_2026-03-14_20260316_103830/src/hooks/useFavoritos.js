import { useState, useCallback } from 'react';

const STORAGE_KEY = 'movimood-favoritos';

export const LISTAS = {
  VER_LUEGO: 'ver-mas-tarde',
  YA_VISTA: 'ya-vista',
  IMPRESCINDIBLES: 'imprescindibles',
  NO_INTERESA: 'no-interesa',
};

function normalizeEntry(entry) {
  const normalizedFlags = {
    imprescindible: Boolean(entry?.flags?.imprescindible),
  };

  let normalizedList = entry?.lista || LISTAS.VER_LUEGO;

  if (normalizedList === LISTAS.IMPRESCINDIBLES) {
    normalizedList = LISTAS.YA_VISTA;
    normalizedFlags.imprescindible = true;
  }

  if (![LISTAS.VER_LUEGO, LISTAS.YA_VISTA, LISTAS.NO_INTERESA].includes(normalizedList)) {
    normalizedList = LISTAS.VER_LUEGO;
  }

  return {
    ...entry,
    lista: normalizedList,
    flags: normalizedFlags,
  };
}

function normalizeCollection(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter((item) => item?.movie?.id)
    .map(normalizeEntry);
}

function getStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return normalizeCollection(parsed);
  } catch {
    return [];
  }
}

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState(getStored);

  const persist = useCallback((items) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, []);

  const setLista = useCallback((movie, questionnaire, lista) => {
    setFavoritos((prev) => {
      const normalizedPrev = normalizeCollection(prev);
      const existing = normalizedPrev.find((f) => f.movie.id === movie.id);
      const now = new Date().toISOString();
      let updated;

      if (!existing) {
        if (lista === LISTAS.NO_INTERESA) {
          updated = [
            ...normalizedPrev,
            {
              movie,
              questionnaire,
              lista: LISTAS.NO_INTERESA,
              flags: { imprescindible: false },
              savedAt: now,
            },
          ];
        } else if (lista === LISTAS.IMPRESCINDIBLES) {
          updated = [
            ...normalizedPrev,
            {
              movie,
              questionnaire,
              lista: LISTAS.YA_VISTA,
              flags: { imprescindible: true },
              savedAt: now,
            },
          ];
        } else {
          updated = [
            ...normalizedPrev,
            {
              movie,
              questionnaire,
              lista,
              flags: { imprescindible: false },
              savedAt: now,
            },
          ];
        }
      } else {
        if (lista === LISTAS.IMPRESCINDIBLES) {
          updated = normalizedPrev.map((item) => {
            if (item.movie.id !== movie.id) {
              return item;
            }

            const nextEssential = !Boolean(item.flags?.imprescindible);
            return {
              ...item,
              movie,
              questionnaire,
              lista: nextEssential ? LISTAS.YA_VISTA : item.lista,
              flags: {
                ...item.flags,
                imprescindible: nextEssential,
              },
              savedAt: now,
            };
          });
        } else if (lista === LISTAS.NO_INTERESA) {
          updated = normalizedPrev.map((item) => {
            if (item.movie.id !== movie.id) {
              return item;
            }

            if (item.lista === LISTAS.NO_INTERESA) {
              return {
                ...item,
                movie,
                questionnaire,
                lista: LISTAS.VER_LUEGO,
                savedAt: now,
              };
            }

            return {
              ...item,
              movie,
              questionnaire,
              lista: LISTAS.NO_INTERESA,
              savedAt: now,
            };
          });
        } else {
          if (existing.lista === lista && lista === LISTAS.VER_LUEGO && !existing.flags?.imprescindible) {
            updated = normalizedPrev.filter((item) => item.movie.id !== movie.id);
          } else {
            updated = normalizedPrev.map((item) =>
              item.movie.id === movie.id
                ? {
                    ...item,
                    movie,
                    questionnaire,
                    lista,
                    savedAt: now,
                  }
                : item
            );
          }
        }
      }

      persist(updated);
      return updated;
    });
  }, [persist]);

  const getMovieState = useCallback(
    (movieId) => {
      const entry = favoritos.find((item) => item.movie.id === movieId);

      return {
        isInLibrary: Boolean(entry),
        isSeen: entry?.lista === LISTAS.YA_VISTA,
        isEssential: Boolean(entry?.flags?.imprescindible),
        isIgnored: entry?.lista === LISTAS.NO_INTERESA,
        baseList: entry?.lista || null,
      };
    },
    [favoritos]
  );

  const toggleSeen = useCallback((movie, questionnaire) => {
    const current = favoritos.find((item) => item.movie.id === movie.id);
    if (!current) {
      setLista(movie, questionnaire, LISTAS.YA_VISTA);
      return;
    }

    if (current.lista === LISTAS.NO_INTERESA) {
      setLista(movie, questionnaire, LISTAS.YA_VISTA);
      return;
    }

    setLista(movie, questionnaire, current.lista === LISTAS.YA_VISTA ? LISTAS.VER_LUEGO : LISTAS.YA_VISTA);
  }, [favoritos, setLista]);

  const toggleEssential = useCallback((movie, questionnaire) => {
    setLista(movie, questionnaire, LISTAS.IMPRESCINDIBLES);
  }, [setLista]);

  const getLista = useCallback(
    (movieId) => {
      const entry = favoritos.find((f) => f.movie.id === movieId);
      if (!entry) {
        return null;
      }

      if (entry.lista === LISTAS.NO_INTERESA) {
        return LISTAS.NO_INTERESA;
      }

      if (entry.flags?.imprescindible) {
        return LISTAS.IMPRESCINDIBLES;
      }

      return entry.lista;
    },
    [favoritos]
  );

  const getNoInteresaIds = useCallback(
    () =>
      new Set(
        favoritos
          .filter((f) => f.lista === LISTAS.NO_INTERESA)
          .map((f) => f.movie.id)
      ),
    [favoritos]
  );

  return {
    favoritos,
    setLista,
    getLista,
    getNoInteresaIds,
    getMovieState,
    toggleSeen,
    toggleEssential,
  };
}
