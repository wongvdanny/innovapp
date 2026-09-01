import Seo from '../components/Seo'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Logo from '../components/Logo'

export default function Login() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await signIn('credentials', { ...form, redirect: false })
    if (res?.error) { setError('Email o contraseña incorrectos'); setLoading(false) }
    else {
      const session = await fetch('/api/auth/session').then(r => r.json())
      if (session?.user?.role === 'admin') router.push('/admin')
      else router.push('/dashboard')
    }
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #eef1f4', fontSize: 14, outline: 'none', fontFamily: 'var(--font-gabarito), system-ui, sans-serif', boxSizing: 'border-box' as const }

  return (
    <>
      <Seo
        title="Iniciar sesión — innovapp"
        description="Accede a tu panel de suscripción de innovapp."
        canonical="/login"
        noindex
      />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1e1e1e,#1e1e1e)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
          <Link href="/"><Logo variant="light" height={36} style={{ marginBottom: 32 }} /></Link>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: '#1e1e1e' }}>Bienvenido de vuelta</h2>
          <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>Accede a tu panel de suscripción</p>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6 }}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="tu@email.com" required />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6 }}>Contraseña</label>
                <input style={inputStyle} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••" required />
              </div>
            </div>
            {error && <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#ccc' : 'linear-gradient(135deg,#ee7528,#c85f1b)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Entrando...' : 'Iniciar sesión →'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#88a8b0' }}>
            ¿No tienes cuenta? <Link href="/registro" style={{ color: '#c85f1b', fontWeight: 600 }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </>
  )
}
