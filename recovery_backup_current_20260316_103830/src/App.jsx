import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Footer from './componentes/Footer';
import Home from './paginas/Home';
import Cuestionario from './paginas/Cuestionario';
import Login from './paginas/Login';
import Registro from './paginas/Registro';
import Resultados from './paginas/Resultados';
import Videoteca from './paginas/Videoteca';
import Perfil from './paginas/Perfil';
import Configuracion from './paginas/Configuracion';
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
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;