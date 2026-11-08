import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button, Field, Notice, Section, fecha } from '../ui'
import PasswordInput from '../../PasswordInput'

export interface CuentaAdmin { name: string; email: string; createdAt: string; passwordChangedAt: string | null }

const MIN = 8

/** Vuelve a iniciar sesión tras el cambio: la sesión actual sigue abierta y las demás se cierran. */
async function reautenticar(email: string, password: string) {
  const s = await fetch('/api/auth/session').then(r => r.json()).catch(() => null)
  const r = await signIn('credentials', { email, password, remember: String(s?.user?.remember !== false), redirect: false })
  return !r?.error
}

function CambiarPassword({ email }: { email: string }) {
  const [f, setF] = useState({ actual: '', nueva: '', repetir: '' })
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }))

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado(null)
    if (f.nueva.length < MIN) return setEstado({ ok: false, texto: `La nueva contraseña debe tener al menos ${MIN} caracteres` })
    if (f.nueva !== f.repetir) return setEstado({ ok: false, texto: 'Las contraseñas nuevas no coinciden' })
    setGuardando(true)
    const res = await fetch('/api/admin/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actual: f.actual, nueva: f.nueva }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setGuardando(false); return setEstado({ ok: false, texto: d.error || 'No se ha podido cambiar la contraseña' }) }
    const sigue = await reautenticar(email, f.nueva)
    setGuardando(false)
    setF({ actual: '', nueva: '', repetir: '' })
    if (!sigue) { window.location.assign('/login?sesion=cerrada'); return }
    setEstado({ ok: true, texto: 'Contraseña cambiada. Las sesiones abiertas en otros dispositivos se han cerrado.' })
  }

  return (
    <Section title="Cambiar contraseña" subtitle="Al cambiarla se cierran las sesiones abiertas en otros navegadores y dispositivos.">
      <form onSubmit={guardar} className="adm-stack" style={{ gap: 14, maxWidth: 420 }}>
        <input type="text" name="username" autoComplete="username" value={email} hidden readOnly />
        <Field label="Contraseña actual">
          <PasswordInput id="pwd-actual" name="current-password" autoComplete="current-password" className="adm-input" colorIcono="var(--adm-muted)"
            value={f.actual} onChange={e => set('actual', e.target.value)} required />
        </Field>
        <Field label="Nueva contraseña" help={`Mínimo ${MIN} caracteres`}>
          <PasswordInput id="pwd-nueva" name="new-password" autoComplete="new-password" minLength={MIN} className="adm-input" colorIcono="var(--adm-muted)"
            value={f.nueva} onChange={e => set('nueva', e.target.value)} required />
        </Field>
        <Field label="Repite la nueva contraseña">
          <PasswordInput id="pwd-repetir" name="confirm-password" autoComplete="new-password" minLength={MIN} className="adm-input" colorIcono="var(--adm-muted)"
            value={f.repetir} onChange={e => set('repetir', e.target.value)} required />
        </Field>
        {estado && <Notice tone={estado.ok ? 'ok' : 'error'}>{estado.ok ? '✅' : '⚠️'} {estado.texto}</Notice>}
        <div><Button type="submit" variant="primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Cambiar contraseña'}</Button></div>
      </form>
    </Section>
  )
}

function CambiarEmail({ email }: { email: string }) {
  const [f, setF] = useState({ nuevo: '', password: '' })
  const [estado, setEstado] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, setGuardando] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setEstado(null); setGuardando(true)
    const res = await fetch('/api/admin/change-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.nuevo, password: f.password }) })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setGuardando(false); return setEstado({ ok: false, texto: d.error || 'No se ha podido cambiar el email' }) }
    // La sesión lleva el email antiguo: se renueva con el nuevo
    const sigue = await reautenticar(d.email, f.password)
    window.location.assign(sigue ? '/admin/ajustes?tab=cuenta' : '/login?sesion=cerrada')
  }

  return (
    <Section title="Cambiar email" subtitle="Es tu usuario para entrar al panel. Se guarda en minúsculas.">
      <form onSubmit={guardar} className="adm-stack" style={{ gap: 14, maxWidth: 420 }}>
        <Field label="Nuevo email">
          <input id="email-nuevo" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} className="adm-input"
            value={f.nuevo} onChange={e => setF(x => ({ ...x, nuevo: e.target.value }))} required />
        </Field>
        <Field label="Contraseña actual" help="Para confirmar que eres tú">
          <PasswordInput id="email-password" name="current-password" autoComplete="current-password" className="adm-input" colorIcono="var(--adm-muted)"
            value={f.password} onChange={e => setF(x => ({ ...x, password: e.target.value }))} required />
        </Field>
        {estado && <Notice tone={estado.ok ? 'ok' : 'error'}>{estado.ok ? '✅' : '⚠️'} {estado.texto}</Notice>}
        <div><Button type="submit" variant="primario" disabled={guardando || f.nuevo.trim().toLowerCase() === email}>{guardando ? 'Guardando…' : 'Cambiar email'}</Button></div>
      </form>
    </Section>
  )
}

export default function Cuenta({ cuenta }: { cuenta: CuentaAdmin }) {
  return (
    <div className="adm-stack">
      <Section title="Tu cuenta">
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 20px', margin: 0, fontSize: 14 }}>
          <dt className="adm-muted">Nombre</dt><dd style={{ margin: 0, fontWeight: 700 }}>{cuenta.name}</dd>
          <dt className="adm-muted">Email</dt><dd style={{ margin: 0, fontWeight: 700 }}>{cuenta.email}</dd>
          <dt className="adm-muted">Rol</dt><dd style={{ margin: 0 }}>Administrador</dd>
          <dt className="adm-muted">Alta</dt><dd style={{ margin: 0 }} suppressHydrationWarning>{fecha(cuenta.createdAt)}</dd>
          <dt className="adm-muted">Contraseña cambiada</dt><dd style={{ margin: 0 }} suppressHydrationWarning>{cuenta.passwordChangedAt ? fecha(cuenta.passwordChangedAt) : 'Nunca desde el panel'}</dd>
        </dl>
      </Section>
      <div className="adm-grid" style={{ ['--min' as any]: '360px', alignItems: 'start' }}>
        <CambiarPassword email={cuenta.email} />
        <CambiarEmail email={cuenta.email} />
      </div>
    </div>
  )
}
