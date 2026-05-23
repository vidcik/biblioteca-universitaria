import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Catalogo from './pages/Catalogo'
import MisPrestamos from './pages/MisPrestamos'
import GestionPrestamos from './pages/GestionPrestamos'
import GestionUsuarios from './pages/GestionUsuarios'
import Reportes from './pages/Reportes'

function Navbar({ darkMode, setDarkMode }) {
  const rol = localStorage.getItem('rol')
  const nombres = localStorage.getItem('nombres')
  const [menuOpen, setMenuOpen] = useState(false)

  const logout = () => { localStorage.clear(); window.location.href = '/login' }

  return (
    <nav style={{ background: darkMode ? '#1a1a2e' : '#1a365d' }}>
      <h1>📚 Biblioteca Universitaria</h1>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link to="/catalogo">Catálogo</Link>
        {rol !== 'bibliotecario' && <Link to="/mis-prestamos">Mis Préstamos</Link>}
        {rol === 'bibliotecario' && <>
          <Link to="/gestion-prestamos">Préstamos</Link>
          <Link to="/usuarios">Usuarios</Link>
          <Link to="/reportes">Reportes</Link>
        </>}
        <div style={{ position: 'relative', marginLeft: '1rem' }}>
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)' }}>
            ⚙️ {nombres?.split(' ')[0]}
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: '110%', background: 'white',
              borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              minWidth: 200, zIndex: 999, overflow: 'hidden'
            }}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1a365d' }}>{nombres}</p>
                <p style={{ fontSize: '0.75rem', color: '#718096', textTransform: 'capitalize' }}>{rol}</p>
              </div>
              <button onClick={() => { setDarkMode(!darkMode); setMenuOpen(false) }}
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', color: '#4a5568', borderRadius: 0, border: 'none', borderBottom: '1px solid #e2e8f0' }}>
                {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
              </button>
              <button onClick={logout}
                style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', color: '#c53030', borderRadius: 0, border: 'none' }}>
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function PrivateRoute({ children }) {
  return localStorage.getItem('token') ? children : <Navigate to="/login" />
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    document.body.style.background = darkMode ? '#0f0f1a' : '#f0f4f8'
    document.body.style.color = darkMode ? '#e2e8f0' : '#1a202c'
  }, [darkMode])

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
            <Routes>
              <Route path="/catalogo"          element={<Catalogo />} />
              <Route path="/mis-prestamos"     element={<MisPrestamos />} />
              <Route path="/gestion-prestamos" element={<GestionPrestamos />} />
              <Route path="/usuarios"          element={<GestionUsuarios />} />
              <Route path="/reportes"          element={<Reportes />} />
              <Route path="*"                  element={<Navigate to="/catalogo" />} />
            </Routes>
          </PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
