import { useState } from 'react'
import Link from 'next/link'
import AuthCard, { BotonPrincipal, Mensaje, estiloEnlace, estiloInput, estiloLabel } from '../components/AuthCard'

export default function Recuperar() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [hecho, setHecho] = useState('')
  const [error, setError] = useState('')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEnviando(true); setError('')
    const r = await fetch('/api/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => null)
    const d = r?.ok ? await r.json() : null
    setEnviando(false)
    if (d?.mensaje) setHecho(d.mensaje)
    else setError('No se ha podido enviar la solicitud. Inténtalo de nuevo en unos minutos.')
  }

  return (
    <AuthCard titulo="¿Olvidaste tu contraseña?" subtitulo="Te enviamos un enlace por email para crear una nueva."
      seoTitulo="Recuperar contraseña — innovapp" canonical="/recuperar"
      pie={<Link href="/login" style={estiloEnlace}>← Volver a iniciar sesión</Link>}>
      {hecho ? <Mensaje tipo="ok">{hecho}</Mensaje> : (
        <form onSubmit={enviar}>
          <div style={{ marginBottom: 20 }}>
            <label htmlFor="email" style={estiloLabel}>Email de tu cuenta</label>
            <input id="email" name="email" type="email" autoComplete="username" inputMode="email" autoCapitalize="none" spellCheck={false}
              style={estiloInput} value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required />
          </div>
          {error && <Mensaje tipo="error">⚠️ {error}</Mensaje>}
          <BotonPrincipal cargando={enviando}>{enviando ? '⏳ Enviando...' : 'Enviar enlace'}</BotonPrincipal>
        </form>
      )}
    </AuthCard>
  )
}
