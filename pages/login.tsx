import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { setInternalBrowser } from '../lib/track'
import AuthCard, { BotonPrincipal, Mensaje, estiloEnlace, estiloInput, estiloLabel } from '../components/AuthCard'
import PasswordInput from '../components/PasswordInput'

export default function Login() {
  const router = useRouter()
  const [form, setForm]       = useState({ email: '', password: '', remember: false })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const aviso = router.query.restablecida === '1' ? 'Contraseña actualizada. Ya puedes iniciar sesión con la nueva.'
    : router.query.sesion === 'cerrada' ? 'Tu sesión se ha cerrado. Vuelve a iniciar sesión.' : ''

  // Submit real del <form> (no un onClick): así el gestor de contraseñas ofrece guardarla
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await signIn('credentials', {
      email: form.email.trim().toLowerCase(), password: form.password, remember: String(form.remember), redirect: false,
    })
    if (res?.error) { setError('Email o contraseña incorrectos'); setLoading(false); return }
    const session = await fetch('/api/auth/session').then(r => r.json())
    if (session?.user?.role === 'admin') {
      setInternalBrowser(true)
      // Vuelta a la página de admin de la que venía (p. ej. el enlace del email de un borrador)
      const destino = typeof router.query.callbackUrl === 'string' ? router.query.callbackUrl : ''
      // Carga completa (no router.push): el panel no lleva GTM y así no hereda el de esta página
      window.location.assign(/^\/admin(\/|$)/.test(destino) ? destino : '/admin')
    }
    else router.push('/dashboard')
  }

  return (
    <AuthCard titulo="Bienvenido de vuelta" subtitulo="Accede a tu panel de suscripción" seoTitulo="Iniciar sesión — innovapp" canonical="/login"
      pie={<>¿No tienes cuenta? <Link href="/registro" style={estiloEnlace}>Regístrate</Link></>}>
      <form onSubmit={handleSubmit} method="post" action="/login">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <div>
            <label htmlFor="email" style={estiloLabel}>Email</label>
            <input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
              style={estiloInput} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@email.com" required />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label htmlFor="password" style={estiloLabel}>Contraseña</label>
              <Link href="/recuperar" style={{ ...estiloEnlace, fontSize: 13 }}>¿Olvidaste tu contraseña?</Link>
            </div>
            <PasswordInput id="password" name="password" autoComplete="current-password" style={estiloInput}
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" required />
          </div>
          <label htmlFor="remember" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1e1e1e', cursor: 'pointer' }}>
            <input id="remember" name="remember" type="checkbox" checked={form.remember} onChange={e => setForm(f => ({ ...f, remember: e.target.checked }))}
              style={{ width: 16, height: 16, accentColor: '#c85f1b' }} />
            Recordarme durante 30 días
          </label>
        </div>
        {aviso && !error && <Mensaje tipo="ok">{aviso}</Mensaje>}
        {error && <Mensaje tipo="error">⚠️ {error}</Mensaje>}
        <BotonPrincipal cargando={loading}>{loading ? '⏳ Entrando...' : 'Iniciar sesión →'}</BotonPrincipal>
      </form>
    </AuthCard>
  )
}
