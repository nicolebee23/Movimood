import { useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function Admin() {
  const { currentUser, getPublicUsers } = useAuth();
  const users = getPublicUsers();
  const isAdmin = Boolean(currentUser?.isAdmin);

  const summary = useMemo(() => {
    return {
      totalUsers: users.length,
      totalAdmins: users.filter((user) => Boolean(user.isAdmin)).length,
    };
  }, [users]);

  return (
    <main className="admin-page page-container" style={{ padding: '32px 20px', minHeight: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p className="page-eyebrow">Administración</p>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Panel de administración</h1>
        </div>
        <div style={{ marginTop: 16 }}>
          <Link to="/configuracion" className="btn btn-secondary">Volver a configuración</Link>
        </div>
      </div>

      {!currentUser ? (
        <div className="card card-muted" style={{ padding: 24 }}>
          <p>Debes iniciar sesión para acceder al panel de administración.</p>
        </div>
      ) : !isAdmin ? (
        <div className="card card-muted" style={{ padding: 24 }}>
          <h2>Acceso restringido</h2>
          <p>No tienes permisos para ver esta página. Si crees que es un error, inicia sesión con una cuenta de administrador.</p>
        </div>
      ) : (
        <>
          <section className="admin-summary" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 28 }}>
            <article className="card" style={{ padding: 20 }}>
              <p className="card-title">Usuarios registrados</p>
              <p className="card-value">{summary.totalUsers}</p>
            </article>
            <article className="card" style={{ padding: 20 }}>
              <p className="card-title">Administradores</p>
              <p className="card-value">{summary.totalAdmins}</p>
            </article>
          </section>

          <section className="admin-users card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Gestión de usuarios</h2>
                <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)' }}>Activa o desactiva permisos de administrador para cuentas existentes.</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 8px' }}>Usuario</th>
                    <th style={{ padding: '12px 8px' }}>Email</th>
                    <th style={{ padding: '12px 8px' }}>Creado</th>
                    <th style={{ padding: '12px 8px' }}>Admin</th>
                    <th style={{ padding: '12px 8px' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <strong>{user.name || user.username || 'Usuario'}</strong>
                        <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{user.username || '–'}</div>
                      </td>
                      <td style={{ padding: '12px 8px' }}>{user.email || '–'}</td>
                      <td style={{ padding: '12px 8px' }}>{formatDate(user.createdAt)}</td>
                      <td style={{ padding: '12px 8px' }}>{user.isAdmin ? 'Sí' : 'No'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        {user.isAdmin ? (
                          <span style={{ color: 'rgba(255,255,255,0.82)' }}>Administrador</span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Usuario</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default Admin;
