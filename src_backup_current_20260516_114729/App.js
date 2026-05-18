import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Footer from './componentes/Footer';
import CookieBanner from './componentes/CookieBanner';
import ProtectedRoute from './componentes/ProtectedRoute';
import Home from './paginas/Home';
import Cuestionario from './paginas/Cuestionario';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import RecuperarPassword from './paginas/RecuperarPassword';
import Resultados from './paginas/Resultados';
import Videoteca from './paginas/Videoteca';
import Perfil from './paginas/Perfil';
import Configuracion from './paginas/Configuracion';
import Buscar from './paginas/Buscar';
import Explorar from './paginas/Explorar';
import Pelicula from './paginas/Pelicula';
import Privacidad from './paginas/Privacidad';
import AvisoLegal from './paginas/AvisoLegal';
import './App.css';

function App() {
  const basename = process.env.REACT_APP_BASENAME || '';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cuestionario" element={<ProtectedRoute><Cuestionario /></ProtectedRoute>} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/videoteca" element={<ProtectedRoute><Videoteca /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
        <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
        <Route path="/perfil/:id" element={<Perfil />} />
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
    </BrowserRouter>
  );
}

export default App;