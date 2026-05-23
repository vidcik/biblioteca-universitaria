import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const LIBRO_VACIO = {
  isbn: '', titulo: '', anio: '', descripcion: '',
  tipo_prestamo: '8dias', palabras_clave: '',
  editorial_id: '', categoria_id: '', num_ejemplares: 1
}

export default function Catalogo() {
  const [libros, setLibros] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalPrestamo, setModalPrestamo] = useState(null)
  const [modalLibro, setModalLibro] = useState(false)
  const [editLibro, setEditLibro] = useState(null)
  const [dias, setDias] = useState('8dias')
  const [form, setForm] = useState(LIBRO_VACIO)
  const [categorias, setCategorias] = useState([])
  const [editoriales, setEditoriales] = useState([])
  const rol = localStorage.getItem('rol')

  const buscar = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/libros/', { params: q ? { q } : {} })
      setLibros(data)
    } catch { toast.error('Error al cargar catálogo') }
    finally { setLoading(false) }
  }

  const cargarSelects = async () => {
    try {
      const [cats, eds] = await Promise.all([
        api.get('/libros/categorias'),
        api.get('/libros/editoriales')
      ])
      setCategorias(cats.data)
      setEditoriales(eds.data)
    } catch {}
  }

  useEffect(() => { buscar() }, [])

  const abrirModalNuevo = () => {
    cargarSelects()
    setForm(LIBRO_VACIO)
    setEditLibro(null)
    setModalLibro(true)
  }

  const abrirModalEditar = (libro) => {
    cargarSelects()
    setForm({
      isbn: libro.isbn, titulo: libro.titulo,
      anio: libro.anio || '', descripcion: libro.descripcion || '',
      tipo_prestamo: libro.tipo_prestamo,
      palabras_clave: (libro.palabras_clave || []).join(', '),
      editorial_id: '', categoria_id: '', num_ejemplares: 1
    })
    setEditLibro(libro)
    setModalLibro(true)
  }

  const guardarLibro = async () => {
    if (!form.isbn || !form.titulo) { toast.error('ISBN y título son obligatorios'); return }
    try {
      const payload = {
        ...form,
        anio: form.anio ? parseInt(form.anio) : null,
        editorial_id: form.editorial_id ? parseInt(form.editorial_id) : null,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
        palabras_clave: form.palabras_clave ? form.palabras_clave.split(',').map(s => s.trim()) : [],
        autor_ids: []
      }
      if (editLibro) {
        await api.put(`/libros/${editLibro.libro_id}`, payload)
        toast.success('Libro actualizado')
      } else {
        const { data } = await api.post('/libros/', payload)
        // Crear ejemplares
        const n = parseInt(form.num_ejemplares) || 1
        for (let i = 0; i < n; i++) {
          await api.post('/ejemplares/', {
            libro_id: data.id,
            codigo_barras: `EJ-${Date.now()}-${i}`,
            sala: 'Sala A', estante: 'Estante 1', estado: 'disponible'
          })
        }
        toast.success(`Libro agregado con ${n} ejemplar(es)`)
      }
      setModalLibro(false)
      buscar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al guardar')
    }
  }

  const eliminarLibro = async (libro) => {
    if (!window.confirm(`¿Eliminar "${libro.titulo}"?`)) return
    try {
      await api.delete(`/libros/${libro.libro_id}`)
      toast.success('Libro eliminado')
      buscar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'No se puede eliminar')
    }
  }

  const abrirModalPrestamo = (libro) => {
    setDias(libro.tipo_prestamo)
    setModalPrestamo(libro)
  }

  const solicitarPrestamo = async () => {
    try {
      const { data: ejemplares } = await api.get('/ejemplares/', { params: { libro_id: modalPrestamo.libro_id } })
      const disponible = ejemplares.find(e => e.estado === 'disponible')
      if (!disponible) { toast.error('No hay ejemplares disponibles'); return }
      await api.post('/prestamos/solicitar', { ejemplar_id: disponible.id, dias_prestamo: dias })
      toast.success('Solicitud enviada, espera aprobación del bibliotecario')
      setModalPrestamo(null)
      buscar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al solicitar')
    }
  }

  const reservar = async (libro) => {
    try {
      const { data: ejemplares } = await api.get('/ejemplares/', { params: { libro_id: libro.libro_id } })
      const prestado = ejemplares.find(e => e.estado === 'prestado')
      if (!prestado) { toast.error('No hay ejemplares para reservar'); return }
      await api.post('/reservas/', { ejemplar_id: prestado.id })
      toast.success('Reserva registrada')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al reservar')
    }
  }

  const estadoBadge = (disponibles, total) => {
    if (disponibles > 0) return <span className="badge badge-green">Disponible ({disponibles}/{total})</span>
    return <span className="badge badge-red">Sin ejemplares ({total} prestados)</span>
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Catálogo de Libros</h2>
        {rol === 'bibliotecario' && (
          <button className="btn-success" onClick={abrirModalNuevo}>+ Agregar Libro</button>
        )}
      </div>

      <div className="search-bar">
        <input placeholder="Buscar por título, autor, ISBN, palabras clave..."
          value={q} onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()} />
        <button className="btn-primary" onClick={buscar}>Buscar</button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div>
          {libros.map(libro => (
            <div className="card" key={libro.libro_id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ color: '#1a365d' }}>{libro.titulo}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#718096' }}>{libro.autores} · {libro.editorial} · {libro.anio}</p>
                  <p style={{ fontSize: '0.8rem', color: '#a0aec0' }}>ISBN: {libro.isbn} · {libro.categoria}</p>
                  {libro.descripcion && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{libro.descripcion}</p>}
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                    {estadoBadge(libro.disponibles, libro.total_ejemplares)}
                    <span className="badge badge-blue">{libro.tipo_prestamo === '1dia' ? '1 día' : '8 días'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
                  {rol === 'bibliotecario' ? (
                    <>
                      <button className="btn-primary" onClick={() => abrirModalEditar(libro)}>✏️ Editar</button>
                      <button className="btn-danger" onClick={() => eliminarLibro(libro)}>🗑️ Eliminar</button>
                    </>
                  ) : (
                    libro.disponibles > 0
                      ? <button className="btn-primary" onClick={() => abrirModalPrestamo(libro)}>Solicitar Préstamo</button>
                      : <button className="btn-warning" onClick={() => reservar(libro)}>Reservar</button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {libros.length === 0 && <p style={{ textAlign: 'center', color: '#718096' }}>No se encontraron resultados.</p>}
        </div>
      )}

      {/* Modal solicitar préstamo */}
      {modalPrestamo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 400, margin: 0 }}>
            <h3 style={{ marginBottom: '1rem', color: '#1a365d' }}>Solicitar Préstamo</h3>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}><strong>{modalPrestamo.titulo}</strong></p>
            <label>Duración del préstamo</label>
            <select value={dias} onChange={e => setDias(e.target.value)}>
              <option value="0dias">0 días (prueba profesor)</option>
              <option value="1dia">1 día</option>
              <option value="8dias">8 días</option>
            </select>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={solicitarPrestamo} style={{ flex: 1 }}>Confirmar</button>
              <button onClick={() => setModalPrestamo(null)} style={{ flex: 1, background: '#e2e8f0', color: '#4a5568' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar/editar libro */}
      {modalLibro && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 500, margin: 0, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.25rem', color: '#1a365d' }}>{editLibro ? '✏️ Editar Libro' : '+ Agregar Libro'}</h3>

            <label>ISBN *</label>
            <input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} placeholder="978-0000000000" />
            <label>Título *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título del libro" />
            <label>Año</label>
            <input type="number" value={form.anio} onChange={e => setForm({ ...form, anio: e.target.value })} placeholder="2024" />
            <label>Descripción</label>
            <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Breve descripción" />
            <label>Tipo de préstamo</label>
            <select value={form.tipo_prestamo} onChange={e => setForm({ ...form, tipo_prestamo: e.target.value })}>
              <option value="1dia">1 día</option>
              <option value="8dias">8 días</option>
            </select>
            <label>Categoría</label>
            <select value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}>
              <option value="">-- Seleccionar --</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <label>Editorial</label>
            <select value={form.editorial_id} onChange={e => setForm({ ...form, editorial_id: e.target.value })}>
              <option value="">-- Seleccionar --</option>
              {editoriales.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
            <label>Palabras clave (separadas por coma)</label>
            <input value={form.palabras_clave} onChange={e => setForm({ ...form, palabras_clave: e.target.value })} placeholder="programación, algoritmos" />
            {!editLibro && (
              <>
                <label>Número de ejemplares</label>
                <input type="number" min="1" max="20" value={form.num_ejemplares}
                  onChange={e => setForm({ ...form, num_ejemplares: e.target.value })} />
              </>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-success" onClick={guardarLibro} style={{ flex: 1 }}>
                {editLibro ? 'Guardar Cambios' : 'Crear Libro'}
              </button>
              <button onClick={() => setModalLibro(false)} style={{ flex: 1, background: '#e2e8f0', color: '#4a5568' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
