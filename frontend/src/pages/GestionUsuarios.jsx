import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const FORM_VACIO = {
  codigo: '', identificacion: '', nombres: '', correo: '',
  password: 'password123', rol: 'estudiante', carrera: '', estado: 'activo'
}

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_VACIO)

  const cargar = async () => {
    const { data } = await api.get('/usuarios/')
    setUsuarios(data)
  }

  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    if (!form.codigo || !form.identificacion || !form.nombres || !form.correo) {
      toast.error('Completa todos los campos obligatorios')
      return
    }
    try {
      await api.post('/usuarios/', form)
      toast.success('Usuario creado con contraseña: password123')
      setModal(false)
      setForm(FORM_VACIO)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al crear usuario')
    }
  }

  const toggleEstado = async (u) => {
    const nuevoEstado = u.estado === 'activo' ? 'bloqueado' : 'activo'
    try {
      await api.patch(`/usuarios/${u.id}/estado?estado=${nuevoEstado}`)
      toast.success(`Usuario ${nuevoEstado}`)
      cargar()
    } catch { toast.error('Error') }
  }

  const rolBadge = (rol) => {
    const map = { bibliotecario: 'badge-blue', docente: 'badge-green', estudiante: 'badge-gray' }
    return <span className={`badge ${map[rol] || 'badge-gray'}`}>{rol}</span>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={() => { setForm(FORM_VACIO); setModal(true) }}>
          + Nuevo Usuario
        </button>
      </div>

      <table>
        <thead><tr>
          <th>Código</th><th>Nombres</th><th>Correo</th>
          <th>Rol</th><th>Carrera</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td>{u.codigo}</td>
              <td>{u.nombres}</td>
              <td>{u.correo}</td>
              <td>{rolBadge(u.rol)}</td>
              <td>{u.carrera || '-'}</td>
              <td>
                <span className={`badge ${u.estado === 'activo' ? 'badge-green' : 'badge-red'}`}>
                  {u.estado}
                </span>
              </td>
              <td>
                <button
                  className={u.estado === 'activo' ? 'btn-danger' : 'btn-success'}
                  onClick={() => toggleEstado(u)}>
                  {u.estado === 'activo' ? 'Bloquear' : 'Activar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal crear usuario */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: 480, margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.25rem', color: '#1a365d' }}>Nuevo Usuario</h3>

            <label>Código *</label>
            <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="EST003" />

            <label>Identificación *</label>
            <input value={form.identificacion} onChange={e => setForm({ ...form, identificacion: e.target.value })} placeholder="1000000005" />

            <label>Nombres completos *</label>
            <input value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })} placeholder="Nombre Apellido" />

            <label>Correo *</label>
            <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} placeholder="usuario@email.com" />

            <label>Rol</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="bibliotecario">Bibliotecario</option>
            </select>

            <label>Carrera (opcional)</label>
            <input value={form.carrera} onChange={e => setForm({ ...form, carrera: e.target.value })} placeholder="Ingeniería de Sistemas" />

            <p style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '1rem', background: '#f7fafc', padding: '0.5rem', borderRadius: '4px' }}>
              🔑 La contraseña inicial será: <strong>password123</strong>
            </p>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={guardar} style={{ flex: 1 }}>Crear Usuario</button>
              <button onClick={() => setModal(false)}
                style={{ flex: 1, background: '#e2e8f0', color: '#4a5568' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
