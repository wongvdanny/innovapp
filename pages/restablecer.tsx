import { GetServerSideProps } from 'next'
import { useState } from 'react'
import Link from 'next/link'
import AuthCard, { BotonPrincipal, Mensaje, estiloEnlace, estiloInput, estiloLabel } from '../components/AuthCard'
import PasswordInput from '../components/PasswordInput'
import { tokenVigente } from '../lib/password'

const MIN = 8

export default function Restablecer({ token, valido }: { token: string; valido: boolean }) {
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (nueva.length < MIN) return setError(`La contraseña debe tener al menos ${MIN} caracteres`)
    if (nueva !== repetir) return setError('Las contraseñas no coinciden')
    setGuardando(true)
    const r = await fetch('/api/password/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password: nueva }) }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    if (r?.ok) { window.location.assign('/login?restablecida=1'); return }
    setGuardando(false)
    setError(d.error || 'No se ha podido cambiar la contraseña. Inténtalo de nuevo.')
  }

  return (
    <AuthCard titulo="Nueva contraseña" subtitulo={valido ? 'Elige una contraseña de al menos 8 caracteres.' : 'Este enlace ya no sirve.'}
      seoTitulo="Restablecer contraseña — innovapp" canonical="/restablecer"
      pie={<Link href="/login" style={estiloEnlace}>← Volver a iniciar sesión</Link>}>
      {!valido ? (
        <>
          <Mensaje tipo="error">El enlace no es válido o ha caducado (dura 1 hora y solo se puede usar una vez).</Mensaje>
          <Link href="/recuperar" style={estiloEnlace}>Pedir un enlace nuevo →</Link>
        </>
      ) : (
        <form onSubmit={guardar}>
          {/* Campo oculto con el usuario: ayuda al gestor de contraseñas a asociar la nueva */}
          <input type="text" name="username" autoComplete="username" hidden readOnly />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
            <div>
              <label htmlFor="nueva" style={estiloLabel}>Nueva contraseña</label>
              <PasswordInput id="nueva" name="new-password" autoComplete="new-password" minLength={MIN} style={estiloInput}
                value={nueva} onChange={e => setNueva(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="repetir" style={estiloLabel}>Repite la contraseña</label>
              <PasswordInput id="repetir" name="confirm-password" autoComplete="new-password" minLength={MIN} style={estiloInput}
                value={repetir} onChange={e => setRepetir(e.target.value)} required />
            </div>
          </div>
          {error && <Mensaje tipo="error">⚠️ {error}</Mensaje>}
          <BotonPrincipal cargando={guardando}>{guardando ? '⏳ Guardando...' : 'Guardar contraseña'}</BotonPrincipal>
        </form>
      )}
    </AuthCard>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const token = typeof ctx.query.token === 'string' ? ctx.query.token : ''
  // El token no se cachea ni se envía a terceros (la página no lleva datos de la cuenta)
  ctx.res.setHeader('Referrer-Policy', 'no-referrer')
  ctx.res.setHeader('Cache-Control', 'no-store')
  return { props: { token, valido: !!(await tokenVigente(token)) } }
}
