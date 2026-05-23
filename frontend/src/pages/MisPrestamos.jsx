import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function MisPrestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [tab, setTab] = useState('prestamos')
  const [pago, setPago] = useState({})

  const cargar = async () => {
    const { data } = await api.get('/prestamos/')
    setPrestamos(data)
  }

  useEffect(() => { cargar() }, [])

  const ampliar = async (id) => {
    try {
      await api.post(`/prestamos/${id}/ampliar`)
      toast.success('Fecha ampliada 8 días')
      cargar()
    } catch (err) { toast.error(err.response?.data?.detail || 'No se pudo ampliar') }
  }

  const pagarMulta = async (prestamo) => {
    const monto = parseFloat(pago[prestamo.id] || 0)
    if (!monto || monto <= 0) { toast.error('Ingresa un monto válido'); return }
    if (monto < prestamo.multa) {
      toast.error(`El monto mínimo para pagar es $${prestamo.multa}`)
      return
    }
    try {
      await api.post(`/prestamos/${prestamo.id}/pagar-multa`, { monto })
      toast.success('✅ Multa pagada correctamente')
      setPago({ ...pago, [prestamo.id]: '' })
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error al registrar pago')
    }
  }

  const estadoBadge = (estado) => {
    const map = { activo: 'badge-green', solicitado: 'badge-yellow', devuelto: 'badge-gray', vencido: 'badge-red' }
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado.toUpperCase()}</span>
  }

  const conMulta = prestamos.filter(p => p.multa > 0)
  const sinMulta = prestamos.filter(p => !p.multa || p.multa <= 0)

  return (
    <div className="container">
      <h2 className="page-title">Mi Biblioteca</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button onClick={() => setTab('prestamos')} className={tab === 'prestamos' ? 'btn-primary' : ''}
          style={tab !== 'prestamos' ? { background: 'white', border: '1px solid #cbd5e0', color: '#4a5568' } : {}}>
          Mis Préstamos
        </button>
        <button onClick={() => setTab('multas')} className={tab === 'multas' ? 'btn-danger' : ''}
          style={tab !== 'multas' ? { background: 'white', border: '1px solid #cbd5e0', color: '#4a5568' } : {}}>
          Multas {conMulta.length > 0 && (
            <span style={{ background: '#e53e3e', color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.75rem', marginLeft: '4px' }}>
              {conMulta.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'prestamos' && (
        prestamos.length === 0
          ? <div className="card"><p style={{ textAlign: 'center', color: '#718096' }}>No tienes préstamos registrados.</p></div>
          : <table>
              <thead><tr>
                <th>Libro</th><th>Código</th><th>Préstamo</th>
                <th>Vencimiento</th><th>Estado</th><th>Acción</th>
              </tr></thead>
              <tbody>
                {prestamos.map(p => (
                  <tr key={p.id}>
                    <td>{p.titulo}</td>
                    <td>{p.codigo_barras}</td>
                    <td>{new Date(p.fecha_prestamo).toLocaleDateString('es-CO')}</td>
                    <td>{new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                    <td>{estadoBadge(p.estado)}</td>
                    <td>
                      {p.estado === 'activo' && (
                        <button className="btn-warning" onClick={() => ampliar(p.id)}>Ampliar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      )}

      {tab === 'multas' && (
        <div>
          {conMulta.length === 0 ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '2rem' }}>✅</p>
              <p style={{ color: '#276749', fontWeight: 600 }}>¡No tienes multas pendientes!</p>
            </div>
          ) : (
            conMulta.map(p => (
              <div className="card" key={p.id} style={{ borderLeft: '4px solid #e53e3e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ color: '#c53030' }}>📚 {p.titulo}</h3>
                    <p style={{ fontSize: '0.85rem', color: '#718096' }}>
                      Vencimiento: {new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}
                    </p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c53030', marginTop: '0.5rem' }}>
                      Multa: ${parseFloat(p.multa).toLocaleString('es-CO')} COP
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#718096' }}>
                      Tarifa: $500 COP por día de retraso
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
                    <label style={{ fontSize: '0.82rem' }}>Monto a pagar (COP)</label>
                    <input
                      type="number"
                      min={p.multa}
                      value={pago[p.id] || ''}
                      onChange={e => setPago({ ...pago, [p.id]: e.target.value })}
                      placeholder={`Mínimo $${p.multa}`}
                      style={{ marginBottom: 0 }}
                    />
                    <button className="btn-success" onClick={() => pagarMulta(p)}>
                      💳 Pagar Multa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
