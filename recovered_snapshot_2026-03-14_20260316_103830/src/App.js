import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Footer from './componentes/Footer';
import CookieBanner from './componentes/CookieBanner';
import Home from './paginas/Home';
import Cuestionario from './paginas/Cuestionario';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Resultados from './paginas/Resultados';
import Videoteca from './paginas/Videoteca';
import Perfil from './paginas/Perfil';
import Configuracion from './paginas/Configuracion';
import Buscar from './paginas/Buscar';
import Pelicula from './paginas/Pelicula';
import Privacidad from './paginas/Privacidad';
import AvisoLegal from './paginas/AvisoLegal';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cuestionario" element={<Cuestionario />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/videoteca" element={<Videoteca />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/perfil/:id" element={<Perfil />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/buscar" element={<Buscar />} />
        <Route path="/pelicula/:id" element={<Pelicula />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/aviso-legal" element={<AvisoLegal />} />
      </Routes>
      <Footer />
      <CookieBanner />
    </BrowserRouter>
  );
}

export default App;