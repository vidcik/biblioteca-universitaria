import { useState, useEffect } from 'react'
import api from '../services/api'

export default function Reportes() {
  const [tab, setTab] = useState('libros')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  const endpoints = {
    libros: '/reportes/libros-mas-prestados',
    usuarios: '/reportes/usuarios-mas-prestamos',
    inventario: '/reportes/inventario',
    estadisticas: '/reportes/estadisticas-prestamos',
  }

  const labels = {
    libros: 'Libros más prestados',
    usuarios: 'Usuarios más activos',
    inventario: 'Inventario',
    estadisticas: 'Estadísticas mensuales',
  }

  useEffect(() => {
    setLoading(true)
    api.get(endpoints[tab])
      .then(r => setData(r.data))
      .catch(() => setData([]))
      .finally(() => setLoading(false))
  }, [tab])

  const renderTabla = () => {
    if (!data.length) return <p style={{textAlign:'center', color:'#718096'}}>Sin datos.</p>
    const cols = Object.keys(data[0])
    return (
      <table>
        <thead><tr>{cols.map(c => <th key={c}>{c.replace(/_/g,' ').toUpperCase()}</th>)}</tr></thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {cols.map(c => <td key={c}>{row[c] ?? '-'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="container">
      <h2 className="page-title">Reportes y Estadísticas</h2>
      <p style={{fontSize:'0.8rem', color:'#718096', marginBottom:'1rem'}}>
        Los reportes utilizan funciones de ventana SQL (RANK, SUM OVER, AVG OVER con ROWS BETWEEN).
      </p>

      <div style={{display:'flex', gap:'0.75rem', marginBottom:'1.5rem', flexWrap:'wrap'}}>
        {Object.entries(labels).map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            className={tab === k ? 'btn-primary' : ''}
            style={tab !== k ? {background:'white', border:'1px solid #cbd5e0', color:'#4a5568'} : {}}>
            {v}
          </button>
        ))}
      </div>

      <div className="card">
        <h3 style={{marginBottom:'1rem', color:'#1a365d'}}>{labels[tab]}</h3>
        {loading ? <p>Cargando...</p> : renderTabla()}
      </div>
    </div>
  )
}
