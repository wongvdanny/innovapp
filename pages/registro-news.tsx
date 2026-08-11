import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const COUNTRIES = [
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
]

export default function RegistroNews() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', country: 'ES' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!form.name.trim()) return 'Introduce tu nombre'
    if (!form.email.trim() || !form.email.includes('@')) return 'Email no válido'
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/subscriptions/free-signup-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al registrarte'); setLoading(false); return }
      window.location.href = 'https://news.innovapp.es/login'
    } catch (e) {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1.5px solid #eef1f4', fontSize: 15, outline: 'none',
    fontFamily: 'system-ui', boxSizing: 'border-box', background: '#f8fafb',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e 0%,#3d2b6f 50%,#e6672a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3d2b6f,#e6672a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎙️</div>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e' }}>news<span style={{ color: '#e6672a' }}>.</span></span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Crea tu cuenta gratis</h2>
        <p style={{ fontSize: 14, color: '#8a8aa3', margin: '0 0 24px' }}>Tu resumen de noticias en audio, cada mañana</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input style={inputStyle} placeholder="Tu nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input style={inputStyle} type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          <input style={inputStyle} type="password" placeholder="Contraseña (mín. 8 caracteres)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
          <select style={inputStyle} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>

          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#ccc' : 'linear-gradient(135deg,#3d2b6f,#e6672a)', color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? '⏳ Creando cuenta...' : 'Crear cuenta gratis →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: '#8a8aa3', textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
