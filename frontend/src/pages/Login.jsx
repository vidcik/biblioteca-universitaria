import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const form = new URLSearchParams()
      form.append('username', correo)
      form.append('password', password)
      const { data } = await api.post('/auth/login', form)
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombres', data.nombres)
      toast.success(`Bienvenido, ${data.nombres}`)
      navigate('/catalogo')
    } catch {
      toast.error('Credenciales incorrectas')
    }
  }

  return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh'}}>
      <div className="card" style={{width:360}}>
        <h2 style={{marginBottom:'1.5rem', color:'#1a365d', textAlign:'center'}}>📚 Biblioteca</h2>
        <form onSubmit={handleLogin}>
          <label>Correo electrónico</label>
          <input type="email" value={correo} onChange={e=>setCorreo(e.target.value)} required placeholder="usuario@biblioteca.edu"/>
          <label>Contraseña</label>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"/>
          <button type="submit" className="btn-primary" style={{width:'100%', marginTop:'0.5rem'}}>
            Ingresar
          </button>
        </form>
        <p style={{fontSize:'0.8rem', color:'#718096', marginTop:'1rem', textAlign:'center'}}>
          Admin: admin@biblioteca.edu / password123
        </p>
      </div>
    </div>
  )
}
