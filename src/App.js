import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Footer from './componentes/Footer';
import CookieBanner from './componentes/CookieBanner';
import UserMenu from './componentes/UserMenu';
import ProtectedRoute from './componentes/ProtectedRoute';
import Home from './paginas/Home';
import Cuestionario from './paginas/Cuestionario';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import RecuperarPassword from './paginas/RecuperarPassword';
import Resultados from './paginas/Resultados';
import Videoteca from './paginas/Videoteca';
import Perfil from './paginas/Perfil';
import Colecciones from './paginas/Colecciones';
import Likes from './paginas/Likes';
import Seguidos from './paginas/Seguidos';
import Seguidores from './paginas/Seguidores';
import Vistas from './paginas/Vistas';
import Configuracion from './paginas/Configuracion';
import Buscar from './paginas/Buscar';
import Explorar from './paginas/Explorar';
import Pelicula from './paginas/Pelicula';
import Privacidad from './paginas/Privacidad';
import AvisoLegal from './paginas/AvisoLegal';
import { useAuth } from './hooks/useAuth';
import './App.css';

function AppContent({ currentUser, logout }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isPerfilRoute =
    location.pathname === '/perfil' || location.pathname.startsWith('/perfil/');

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {currentUser && (
        <div
          className={`app-user-menu-floating${isScrolled ? ' hidden-on-scroll' : ''}${isPerfilRoute ? ' perfil-route' : ''}`}
        >
          <UserMenu currentUser={currentUser} logout={logout} />
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cuestionario" element={<ProtectedRoute><Cuestionario /></ProtectedRoute>} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/videoteca" element={<ProtectedRoute><Videoteca /></ProtectedRoute>} />
        <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
        <Route path="/seguidos" element={<ProtectedRoute><Seguidos /></ProtectedRoute>} />
        <Route path="/seguidores" element={<ProtectedRoute><Seguidores /></ProtectedRoute>} />
        <Route path="/vistas" element={<ProtectedRoute><Vistas /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        <Route path="/perfil/:id" element={<Perfil />} />
        <Route path="/colecciones" element={<ProtectedRoute><Colecciones /></ProtectedRoute>} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/explorar" element={<Explorar />} />
        <Route path="/pelicula/:id" element={<Pelicula />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/aviso-legal" element={<AvisoLegal />} />
      </Routes>
      <Footer />
      <CookieBanner />
    </>
  );
}

function App() {
  const basename = process.env.REACT_APP_BASENAME || '';
  const { currentUser, logout } = useAuth();

  return (
    <BrowserRouter basename={basename}>
      <AppContent currentUser={currentUser} logout={logout} />
    </BrowserRouter>
  );
}

export default App;