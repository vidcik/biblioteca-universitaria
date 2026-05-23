import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function GestionPrestamos() {
  const [prestamos, setPrestamos] = useState([])
  const [tab, setTab] = useState('solicitado')
  const [devModal, setDevModal] = useState(null)
  const [obs, setObs] = useState('')
  const [multaManual, setMultaManual] = useState('')

  const cargar = async () => {
    const { data } = await api.get('/prestamos/')
    setPrestamos(data)
  }

  useEffect(() => { cargar() }, [])

  const filtrados = prestamos.filter(p => {
    if (tab === 'solicitado') return p.estado === 'solicitado'
    if (tab === 'activo') return p.estado === 'activo' || p.estado === 'vencido'
    if (tab === 'devuelto') return p.estado === 'devuelto'
    return true
  })

  const aprobar = async (id) => {
    try {
      await api.post(`/prestamos/${id}/aprobar`)
      toast.success('Préstamo aprobado')
      cargar()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const abrirDevolucion = (p) => {
    setDevModal(p)
    setObs('')
    setMultaManual('')
  }

  const devolver = async () => {
    try {
      const id = devModal.prestamo_id || devModal.id
      const { data } = await api.post(`/prestamos/${id}/devolver`, {
        observacion: obs,
        multa_manual: multaManual ? parseFloat(multaManual) : null
      })
      toast.success(`Devolución registrada. Multa: $${data.multa.toLocaleString('es-CO')} COP`)
      setDevModal(null)
      cargar()
    } catch (err) { toast.error(err.response?.data?.detail || 'Error') }
  }

  const estadoBadge = (estado, condicion) => {
    if (condicion === 'VENCIDO' || estado === 'vencido') return <span className="badge badge-red">VENCIDO</span>
    const map = { activo: 'badge-green', solicitado: 'badge-yellow', devuelto: 'badge-gray' }
    return <span className={`badge ${map[estado] || 'badge-gray'}`}>{estado.toUpperCase()}</span>
  }

  const tabs = [
    { key: 'solicitado', label: 'Solicitudes Pendientes' },
    { key: 'activo',     label: 'Préstamos Activos' },
    { key: 'devuelto',   label: 'Historial' },
  ]

  return (
    <div className="container">
      <h2 className="page-title">Gestión de Préstamos</h2>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {tabs.map(t => {
          const count = prestamos.filter(p => {
            if (t.key === 'solicitado') return p.estado === 'solicitado'
            if (t.key === 'activo') return p.estado === 'activo' || p.estado === 'vencido'
            if (t.key === 'devuelto') return p.estado === 'devuelto'
            return false
          }).length
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={tab === t.key ? 'btn-primary' : ''}
              style={tab !== t.key ? { background: 'white', border: '1px solid #cbd5e0', color: '#4a5568' } : {}}>
              {t.label} {count > 0 && (
                <span style={{
                  background: tab === t.key ? 'rgba(255,255,255,0.3)' : '#e53e3e',
                  color: 'white', borderRadius: '10px', padding: '0 6px', fontSize: '0.75rem', marginLeft: '4px'
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {filtrados.length === 0
        ? <div className="card"><p style={{ textAlign: 'center', color: '#718096' }}>No hay registros.</p></div>
        : <table>
            <thead><tr>
              <th>Usuario</th><th>Libro</th><th>Código</th>
              <th>Préstamo</th><th>Vencimiento</th><th>Estado</th>
              <th>Retraso</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.prestamo_id || p.id}>
                  <td>{p.usuario}</td>
                  <td>{p.libro}</td>
                  <td>{p.codigo_barras}</td>
                  <td>{new Date(p.fecha_prestamo).toLocaleDateString('es-CO')}</td>
                  <td>{new Date(p.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                  <td>{estadoBadge(p.estado, p.condicion)}</td>
                  <td>{p.dias_retraso > 0 ? <span style={{ color: 'red' }}>{p.dias_retraso} días</span> : '-'}</td>
                  <td>
                    {p.estado === 'solicitado' && (
                      <button className="btn-success" onClick={() => aprobar(p.prestamo_id || p.id)}>✓ Aprobar</button>
                    )}
                    {(p.estado === 'activo' || p.estado === 'vencido') && (
                      <button className="btn-warning" onClick={() => abrirDevolucion(p)}>Devolver</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
      }

      {/* Modal devolución */}
      {devModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: 440, margin: 0 }}>
            <h3 style={{ marginBottom: '1rem', color: '#1a365d' }}>Registrar Devolución</h3>

            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              <strong>{devModal.libro}</strong> — {devModal.usuario}
            </p>

            {(devModal.estado === 'vencido' || devModal.condicion === 'VENCIDO') && (
              <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ color: '#c53030', fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Préstamo Vencido</p>
                <label style={{ color: '#c53030' }}>Multa a cobrar (COP)</label>
                <input
                  type="number"
                  min="0"
                  value={multaManual}
                  onChange={e => setMultaManual(e.target.value)}
                  placeholder="Ej: 2000, 4000, 10000..."
                  style={{ borderColor: '#fc8181' }}
                />
                <p style={{ fontSize: '0.75rem', color: '#718096' }}>
                  Tarifa sugerida: $2.000 COP por día/minuto de retraso
                </p>
              </div>
            )}

            <label>Observación (opcional)</label>
            <input value={obs} onChange={e => setObs(e.target.value)} placeholder="Estado del libro al devolver..." />

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn-success" onClick={devolver} style={{ flex: 1 }}>✓ Confirmar Devolución</button>
              <button onClick={() => setDevModal(null)} style={{ flex: 1, background: '#e2e8f0', color: '#4a5568' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
