import WizardSidebar from '../componentes/WizardSidebar';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import './Colecciones.css';
import { useEffect, useState, useRef } from 'react';
import { requestJson } from '../utils/movimoodApi';

function Colecciones() {
  const { currentUser, logout } = useAuth();
  const [collections, setCollections] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [detailOpenFor, setDetailOpenFor] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchDebugInfo, setSearchDebugInfo] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [orderBy, setOrderBy] = useState('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const sortRef = useRef(null);
  const sortOptions = [
    { value: 'recent', label: 'Recientes' },
    { value: 'size', label: 'Mayor tamaño' },
    { value: 'alpha', label: 'Alfabético' }
  ];
  const [activeSortIndex, setActiveSortIndex] = useState(0);

  const storageKey = currentUser ? `movimood-collections-${currentUser.id}` : 'movimood-collections-guest';

  useEffect(() => {
    let mounted = true;

    async function loadCollections() {
      // If user is not logged, skip server request (avoids 401 logs) and use localStorage
      if (!currentUser) {
        try {
          const raw = localStorage.getItem(storageKey);
          const parsed = raw ? JSON.parse(raw) : [];
          if (!mounted) return;
          setCollections(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          if (!mounted) return;
          setCollections([]);
        }
        return;
      }

      // Try server first for logged-in users
      try {
        const resp = await requestJson('movimood.php', { params: { resource: 'collections' } });
        if (!mounted) return;
        const items = Array.isArray(resp.items) ? resp.items.map(i => ({ ...i, posters: i.posters || [] })) : [];
        setCollections(items);
        try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
        return;
      } catch (err) {
        if (err?.isAuthError || err?.status === 401) {
          logout();
          return;
        }
        // fallback to localStorage below
      }

      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!mounted) return;

        // If user is logged and we have local items, try to migrate them to server
        if (currentUser && Array.isArray(parsed) && parsed.length > 0) {
          try {
            const migrated = [];
            for (const col of parsed) {
              // create collection on server
              const resp = await requestJson('movimood.php', { method: 'POST', params: { resource: 'collections' }, body: { title: col.title || 'Sin título', description: col.description || '' } });
              const serverItem = resp?.item || null;
              if (!serverItem) continue;
              const newCol = { id: serverItem.id, title: serverItem.title, description: serverItem.description, createdAt: serverItem.created_at || serverItem.createdAt, posters: [] };
              // migrate posters/movies
              if (Array.isArray(col.posters) && col.posters.length) {
                for (const m of col.posters) {
                  try {
                    await requestJson('movimood.php', { method: 'POST', params: { resource: 'collection-movies' }, body: { collection_id: serverItem.id, movie: m } });
                    newCol.posters.push(m);
                  } catch (err) {
                    // ignore individual movie failures
                  }
                }
              }
              migrated.push(newCol);
            }
            if (migrated.length) {
              if (!mounted) return;
              setCollections(migrated);
              try { localStorage.setItem(storageKey, JSON.stringify(migrated)); } catch {}
              return;
            }
          } catch (err) {
            // migration failed -> fallback to local
          }
        }

        setCollections(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        if (!mounted) return;
        setCollections([]);
      }
    }

    loadCollections();
    return () => { mounted = false; };
  }, [storageKey, currentUser, logout]);

  async function refreshCollectionsFromServer() {
    if (!currentUser) return;
    try {
      const resp = await requestJson('movimood.php', { params: { resource: 'collections' } });
      const items = Array.isArray(resp.items) ? resp.items.map(i => ({ ...i, posters: i.posters || [] })) : [];
      setCollections(items);
      try { localStorage.setItem(storageKey, JSON.stringify(items)); } catch {}
      return items;
    } catch (err) {
      if (err?.isAuthError || err?.status === 401) {
        logout();
      }
      return null;
    }
  }

  useEffect(() => {
    function onDocClick(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function persist(list) {
    localStorage.setItem(storageKey, JSON.stringify(list));
    setCollections(list);
  }

  // Derived stats
  const totalCollections = collections.length;
  const totalMovies = collections.reduce((s, c) => s + (typeof c.movies_count === 'number' ? c.movies_count : ((c.posters && c.posters.length) || 0)), 0);
  const largestCollectionSize = collections.reduce((mx, c) => Math.max(mx, (typeof c.movies_count === 'number' ? c.movies_count : ((c.posters && c.posters.length) || 0))), 0);
  const lastUpdatedISO = collections.reduce((d, c) => {
    try {
      let t = c.updatedAt || c.updated_at || c.createdAt || c.created_at || null;
      if (!t) return d;
      // Normalize server timestamp strings like "YYYY-MM-DD HH:MM:SS" to ISO UTC: "YYYY-MM-DDTHH:MM:SSZ"
      if (typeof t === 'string') {
        if (!t.includes('T')) {
          t = t.replace(' ', 'T');
        }
        if (!t.endsWith('Z')) {
          // assume server times are UTC
          t = `${t}Z`;
        }
      }
      return (!d && t) || (t && new Date(t) > new Date(d) ? t : d);
    } catch (e) { return d; }
  }, null);
  const lastUpdated = lastUpdatedISO ? new Date(lastUpdatedISO).toLocaleString() : '—';

  function openCreate() {
    setNewTitle('');
    setNewDesc('');
    setIsModalOpen(true);
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    (async () => {
      const title = newTitle.trim();
      const description = newDesc.trim();
      try {
        await requestJson('movimood.php', { method: 'POST', params: { resource: 'collections' }, body: { title, description } });
        // refresh full list from server to avoid desync
        await refreshCollectionsFromServer();
      } catch (err) {
        // fallback: local-only
        const id = `c_${Date.now()}`;
        const item = { id, title, description, createdAt: new Date().toISOString(), posters: [] };
        const next = [item, ...collections];
        persist(next);
      } finally {
        setIsModalOpen(false);
      }
    })();
  }

  function handleDelete(id) {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Eliminar colección?')) return;
    (async () => {
      try {
        await requestJson('movimood.php', { method: 'DELETE', params: { resource: 'collections' }, body: { collection_id: id } });
        await refreshCollectionsFromServer();
      } catch (err) {
        // fallback local delete
        const next = collections.filter((c) => c.id !== id);
        persist(next);
      }
    })();
  }

  function sortAndSet(value) {
    let next = [...collections];
    if (value === 'size') next = next.sort((a, b) => ((typeof b.movies_count === 'number' ? b.movies_count : (b.posters?.length || 0)) - (typeof a.movies_count === 'number' ? a.movies_count : (a.posters?.length || 0))));
    else if (value === 'alpha') next = next.sort((a, b) => a.title.localeCompare(b.title));
    else next = next.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    persist(next);
    setOrderBy(value);
  }

  return (
    <div className="colecciones-page">
      <WizardSidebar activeLabel="Colecciones" />

      <main className="colecciones-main">
        <header className="colecciones-hero">
          <div className="colecciones-hero-inner">
            <h1 className="colecciones-title">Colecciones</h1>
            <p className="colecciones-subtitle">Organiza tus películas en colecciones y accede a tus listas personalizadas.</p>
            <div className="colecciones-actions">
              <button className="btn btn-primary" onClick={openCreate}>+ Nueva colección</button>
            </div>
          </div>
        </header>

        {(!currentUser) ? (
          <section className="colecciones-empty">
            <div className="perfil-v3-empty">
              <p>Debes iniciar sesión para ver o crear colecciones.</p>
              <Link to="/login" className="btn btn-primary">Iniciar sesión</Link>
            </div>
          </section>
        ) : (
          <section className="colecciones-grid-wrap">
            <div className="colecciones-stats">
              <div className="stat-card">
                <strong>Colecciones</strong>
                <span>{totalCollections}</span>
                <small>Total de listas creadas</small>
              </div>
              <div className="stat-card">
                <strong>Películas</strong>
                <span>{totalMovies}</span>
                <small>En todas las colecciones</small>
              </div>
              <div className="stat-card">
                <strong>Mayor colección</strong>
                <span>{largestCollectionSize}</span>
                <small>Nº de películas en la más grande</small>
              </div>
              <div className="stat-card">
                <strong>Última actualización</strong>
                <span>{lastUpdated}</span>
                <small>Fecha de última colección creada</small>
              </div>
            </div>

            <div className="colecciones-controls" style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <input className="colecciones-search" placeholder="Buscar colecciones..." value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} />
              <div className="colecciones-sort">
                <div
                  ref={sortRef}
                  className={`custom-select${sortOpen ? ' open' : ''}`}
                  tabIndex={0}
                  role="combobox"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                  aria-controls="colec-sort-list"
                  aria-activedescendant={`colec-sort-option-${activeSortIndex}`}
                  onKeyDown={(e) => {
                    if (!sortOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) { setSortOpen(true); e.preventDefault(); }
                    else if (sortOpen) {
                      if (e.key === 'ArrowDown') { setActiveSortIndex(i => (i + 1) % sortOptions.length); e.preventDefault(); }
                      else if (e.key === 'ArrowUp') { setActiveSortIndex(i => (i - 1 + sortOptions.length) % sortOptions.length); e.preventDefault(); }
                      else if (e.key === 'Enter' || e.key === ' ') { const sel = sortOptions[activeSortIndex]; if (sel) { setOrderBy(sel.value); setSortOpen(false); } e.preventDefault(); }
                      else if (e.key === 'Escape') { setSortOpen(false); e.preventDefault(); }
                    }
                  }}
                  onFocus={() => setSortOpen(true)}
                  onBlur={() => setSortOpen(false)}
                >
                  <button type="button" className="custom-select-button" onClick={() => setSortOpen(s => !s)} aria-expanded={sortOpen}>
                    {sortOptions.find(o => o.value === orderBy)?.label || 'Recientes'}
                    <span className="chev" aria-hidden>▾</span>
                  </button>
                  {sortOpen && (
                    <ul id="colec-sort-list" className="custom-select-list" role="listbox">
                      {sortOptions.map((opt, idx) => (
                        <li
                          id={`colec-sort-option-${idx}`}
                          key={opt.value}
                          role="option"
                          aria-selected={orderBy === opt.value}
                          className={`custom-select-item${orderBy === opt.value ? ' selected' : ''}`}
                          onMouseEnter={() => setActiveSortIndex(idx)}
                          onClick={() => { sortAndSet(opt.value); setSortOpen(false); }}
                        >
                          {opt.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="colecciones-view-toggle" role="tablist" aria-label="Ver">
                <button aria-pressed={viewMode==='grid'} onClick={() => setViewMode('grid')}>Cuadrícula</button>
                <button aria-pressed={viewMode==='list'} onClick={() => setViewMode('list')}>Lista</button>
              </div>
            </div>
            {collections.length === 0 ? (
              <div className="colecciones-empty-state">
                <p className="colecciones-empty-title">Aún no tienes colecciones</p>
                <p className="colecciones-empty-desc">Crea colecciones para organizar tus películas como quieras. Usa el botón <strong>+ Nueva colección</strong> para empezar.</p>
                <button className="btn btn-primary" onClick={openCreate}>Crear mi primera colección</button>
              </div>
            ) : (
              <div className={`colecciones-grid ${viewMode==='list' ? 'list' : 'grid'}`}>
                {(() => {
                  // apply filter and ordering
                  let visible = collections.filter(c => !filterQuery || c.title.toLowerCase().includes(filterQuery.toLowerCase()));
                  if (orderBy === 'size') visible = visible.sort((a,b) => ((b.posters?.length||0) - (a.posters?.length||0)));
                  else if (orderBy === 'alpha') visible = visible.sort((a,b) => a.title.localeCompare(b.title));
                  else visible = visible.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                  return visible.map((col) => (
                  <article key={col.id} className="coleccion-card">
                    <div
                      className={`coleccion-poster ${col.posters && col.posters.length ? 'has-thumbs' : ''}`}
                      style={col.posters && col.posters.length ? { backgroundImage: `url(https://image.tmdb.org/t/p/w300${col.posters[0].poster_path})` } : undefined}
                    >
                      {!col.posters || col.posters.length === 0 ? <div className="coleccion-poster--placeholder" /> : null}
                    </div>

                    {/* Preview thumbnails of saved movies (up to 4) */}
                    <div className="coleccion-preview-thumbs">
                      {(col.posters || []).filter(p => p && p.poster_path).slice(0, 4).map((m) => (
                        <img key={m.id} src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title} />
                      ))}
                      {(!col.posters || (col.posters.filter(p => p && p.poster_path).length === 0)) && (
                        <div className="coleccion-preview-empty">No hay miniaturas</div>
                      )}
                      {/* only show total movies (movies_count) */}
                    </div>
                    <div className="coleccion-meta">
                      <div>
                        <h3>{col.title}</h3>
                        {col.description && <p className="coleccion-desc">{col.description}</p>}
                        <div className="coleccion-stats-row">
                          <div className="coleccion-count"><strong>{typeof col.movies_count === 'number' ? col.movies_count : (col.posters?.length || 0)}</strong> películas</div>
                          <div className="coleccion-progress">
                            <div className="coleccion-progress-bar">
                              <div style={{ width: `${largestCollectionSize ? Math.round(((typeof col.movies_count === 'number' ? col.movies_count : (col.posters?.length||0)) / largestCollectionSize) * 100) : 0}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="coleccion-actions">
                        <button className="btn btn-small" onClick={async () => {
                          // load collection movies from server if possible
                          try {
                            const resp = await requestJson('movimood.php', { params: { resource: 'collection-movies', collection_id: col.id } });
                            const items = Array.isArray(resp.items) ? resp.items.map(it => it.movie).filter(Boolean) : [];
                            const withPosters = { ...col, posters: items };
                            setDetailOpenFor(withPosters);
                          } catch (err) {
                            setDetailOpenFor(col);
                          }
                        }}>Ver</button>
                        <button className="btn btn-small btn-danger" onClick={() => handleDelete(col.id)}>Eliminar</button>
                      </div>
                    </div>
                  </article>
                  ))
                })()}
              </div>
            )}
          </section>
        )}

        {isModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <form className="colecciones-modal" onSubmit={handleCreate}>
              <h2>Nueva colección</h2>
              <label>
                Nombre
                <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </label>
              <label>
                Descripción (opcional)
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Crear</button>
              </div>
            </form>
          </div>
        )}

        {detailOpenFor && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="coleccion-detail-modal">
              <header>
                <h2>{detailOpenFor.title}</h2>
                <p className="coleccion-desc">{detailOpenFor.description}</p>
              </header>

              <section className="coleccion-detail-body">
                  <div className="coleccion-posters-grid">
                  {(detailOpenFor.posters || []).map((m) => (
                    <div key={m.id} className="movie-thumb">
                      {m && m.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w185${m.poster_path}`} alt={m.title} />
                      ) : (
                        <div className="movie-thumb-placeholder">
                          <div className="movie-thumb-title">{m?.title || 'Sin póster'}</div>
                        </div>
                      )}
                      <button className="btn btn-small btn-danger" onClick={async () => {
                          try {
                            await requestJson('movimood.php', { method: 'DELETE', params: { resource: 'collection-movies' }, body: { collection_id: detailOpenFor.id, movie_id: m.id } });
                            // refresh collections and detail
                            const updated = await refreshCollectionsFromServer();
                            if (updated) {
                              const serverCol = updated.find(c => c.id === detailOpenFor.id);
                              if (serverCol) {
                                try {
                                  const resp = await requestJson('movimood.php', { params: { resource: 'collection-movies', collection_id: detailOpenFor.id } });
                                  const items = Array.isArray(resp.items) ? resp.items.map(it => it.movie).filter(Boolean) : [];
                                  setDetailOpenFor({ ...serverCol, posters: items });
                                } catch (e) {
                                  setDetailOpenFor(serverCol);
                                }
                              }
                            }
                          } catch (err) {
                            const next = collections.map((c) => c.id === detailOpenFor.id ? { ...c, posters: (c.posters || []).filter(x => x.id !== m.id) } : c);
                            persist(next);
                            setDetailOpenFor(next.find(c => c.id === detailOpenFor.id));
                          }
                      }}>Quitar</button>
                    </div>
                  ))}
                  {(!detailOpenFor.posters || detailOpenFor.posters.length === 0) && (
                    <div className="coleccion-empty-posters">No hay películas en esta colección.</div>
                  )}
                </div>

                <div className="coleccion-add-movie">
                  <h3>Añadir película</h3>
                  <div className="colecciones-search-row">
                    <input
                      className="colecciones-search"
                      placeholder="Buscar película en TMDB..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                      <button className="btn" onClick={async () => {
                      const q = searchQuery.trim();
                      if (q.length < 2) return setSearchError('Escribe al menos 2 caracteres');
                      setSearchLoading(true); setSearchError(''); setSearchResults([]);
                      try {
                        const params = { query: q, page: '1', language: 'es-ES', include_adult: 'false' };
                        const data = await requestJson('tmdb-search.php', { params });
                        setSearchResults(Array.isArray(data.results) ? data.results.slice(0, 20) : []);
                      } catch (err) {
                        const msg = err?.message || 'Error al buscar';
                        setSearchError(msg);
                        try {
                          const dbg = await requestJson('tmdb-search.php', { params: { query: q, page: '1', language: 'es-ES', include_adult: 'false', debug: '1' } });
                          setSearchDebugInfo(dbg);
                        } catch (dbgErr) {
                          // ignore debug fetch errors
                        }
                      } finally { setSearchLoading(false); }
                    }}>Buscar</button>
                  </div>

                  <div className="search-results">
                    {searchLoading && <p>Cargando...</p>}
                    {searchError && <p className="error">{searchError}</p>}
                    {searchDebugInfo && (
                      <pre className="colecciones-debug">{JSON.stringify(searchDebugInfo, null, 2)}</pre>
                    )}
                    {!searchLoading && !searchError && searchResults.length === 0 && (
                      <p className="colecciones-no-results">No se encontraron resultados.</p>
                    )}
                    {searchResults.map((m) => (
                      <div key={m.id} className="search-result-item">
                        <img src={`https://image.tmdb.org/t/p/w92${m.poster_path}`} alt={m.title} />
                        <div className="sr-meta">
                          <strong>{m.title}</strong>
                          <small>{m.release_date}</small>
                        </div>
                        <div>
                          <button className="btn btn-small" onClick={async () => {
                            const movie = { id: m.id, title: m.title, poster_path: m.poster_path };
                            try {
                                await requestJson('movimood.php', { method: 'POST', params: { resource: 'collection-movies' }, body: { collection_id: detailOpenFor.id, movie } });
                                // refresh collections from server and update detail view
                                const updated = await refreshCollectionsFromServer();
                                if (updated) {
                                  const serverCol = updated.find(c => c.id === detailOpenFor.id);
                                  if (serverCol) {
                                    // fetch full movie list for detail
                                    try {
                                      const resp = await requestJson('movimood.php', { params: { resource: 'collection-movies', collection_id: detailOpenFor.id } });
                                      const items = Array.isArray(resp.items) ? resp.items.map(it => it.movie).filter(Boolean) : [];
                                      setDetailOpenFor({ ...serverCol, posters: items });
                                    } catch (e) {
                                      setDetailOpenFor(serverCol);
                                    }
                                  }
                                }
                              } catch (err) {
                                // fallback local-only
                                const next = collections.map((c) => c.id === detailOpenFor.id ? { ...c, posters: [...(c.posters || []), movie] } : c);
                                persist(next);
                                setDetailOpenFor(next.find(c => c.id === detailOpenFor.id));
                              }
                          }}>Añadir</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="modal-actions" style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => { setDetailOpenFor(null); setSearchResults([]); setSearchQuery(''); }}>Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Colecciones;
