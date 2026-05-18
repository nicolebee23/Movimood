import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './componentes/Navbar';
import Footer from './componentes/Footer';
import Home from './paginas/Home';
import Cuestionario from './paginas/Cuestionario';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cuestionario" element={<Cuestionario />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;