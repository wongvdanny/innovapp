import { CSSProperties, useState } from 'react'
import { CircleCheck, LoaderCircle } from 'lucide-react'
import Icono from './Icono'
import { useRecaptcha } from './Recaptcha'
import { SECTORES, Sector, TEXTO_CONSENTIMIENTO_WEB } from '../lib/newsletter/tipos'

/**
 * Formulario de suscripción a la newsletter (home, footer y landings). Doble opt-in: tras enviarlo,
 * la persona recibe un correo y no queda suscrita hasta confirmarlo. Mismo reCAPTCHA que /contacto.
 */
export default function NewsletterForm({ tono = 'oscuro', sector: sectorInicial = 'otro', compacto = false, idBase = 'nl' }: {
  tono?: 'oscuro' | 'claro'; sector?: Sector; compacto?: boolean; idBase?: string
}) {
  const [f, setF] = useState({ email: '', nombre: '', empresa: '', sector: sectorInicial, website: '' })
  const [consiento, setConsiento] = useState(false)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')
  const captcha = useRecaptcha()
  const oscuro = tono === 'oscuro'
  const c = {
    texto: oscuro ? 'rgba(255,255,255,.82)' : '#3f4652',
    input: { padding: '12px 14px', borderRadius: 12, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
      border: oscuro ? '1px solid rgba(255,255,255,.22)' : '1px solid #d5dae0', background: oscuro ? 'rgba(255,255,255,.08)' : '#fff', color: oscuro ? '#fff' : '#1e1e1e' } as CSSProperties,
    enlace: { color: oscuro ? '#fff' : '#b4540f', textDecoration: 'underline' } as CSSProperties,
  }
  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }))
  const [antes, despues] = TEXTO_CONSENTIMIENTO_WEB.split('política de privacidad')

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!consiento) { setEstado('error'); setMensaje('Marca la casilla para aceptar recibir las novedades.'); return }
    setEstado('enviando'); setMensaje('')
    try {
      const r = await fetch('/api/newsletter/suscribir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, consentimiento: true, recaptchaToken: captcha.token() }),
      })
      const d = await r.json().catch(() => ({}))
      if (r.ok) { setEstado('ok'); setMensaje(d.mensaje) }
      else { setEstado('error'); setMensaje(d.error || 'No se ha podido completar la suscripción.') }
    } catch {
      setEstado('error'); setMensaje('No hay conexión. Inténtalo de nuevo.')
    } finally { captcha.reset() }
  }

  if (estado === 'ok') {
    return (
      <div role="status" style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 10, textAlign: 'left', maxWidth: 520, padding: '14px 20px', borderRadius: 14,
        background: oscuro ? 'rgba(238,117,40,.15)' : '#fff4ec', border: '1px solid rgba(238,117,40,.35)', color: oscuro ? '#f4a15c' : '#8a3d0b', fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>
        <Icono icono={CircleCheck} style={{ flexShrink: 0, marginTop: 2 }} />{mensaje}
      </div>
    )
  }

  return (
    <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 520, margin: '0 auto', textAlign: 'left' }} noValidate>
      {/* Honeypot: invisible para personas */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set('website', e.target.value)}
        style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} aria-hidden />
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <label htmlFor={`${idBase}-email`} style={{ position: 'absolute', left: -9999 }}>Tu email</label>
        <input id={`${idBase}-email`} type="email" name="email" autoComplete="email" required placeholder="tu@email.com" value={f.email}
          onChange={e => set('email', e.target.value)} style={{ ...c.input, flex: '1 1 220px', width: 'auto' }} />
        {!compacto && <>
          <label htmlFor={`${idBase}-nombre`} style={{ position: 'absolute', left: -9999 }}>Tu nombre (opcional)</label>
          <input id={`${idBase}-nombre`} type="text" name="nombre" autoComplete="given-name" placeholder="Tu nombre (opcional)" value={f.nombre}
            onChange={e => set('nombre', e.target.value)} style={{ ...c.input, flex: '1 1 180px', width: 'auto' }} />
        </>}
      </div>
      {!compacto && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label htmlFor={`${idBase}-empresa`} style={{ position: 'absolute', left: -9999 }}>Empresa (opcional)</label>
          <input id={`${idBase}-empresa`} type="text" name="empresa" autoComplete="organization" placeholder="Empresa (opcional)" value={f.empresa}
            onChange={e => set('empresa', e.target.value)} style={{ ...c.input, flex: '1 1 180px', width: 'auto' }} />
          <label htmlFor={`${idBase}-sector`} style={{ position: 'absolute', left: -9999 }}>Sector</label>
          <select id={`${idBase}-sector`} name="sector" value={f.sector} onChange={e => set('sector', e.target.value)} style={{ ...c.input, flex: '1 1 180px', width: 'auto' }}>
            {Object.entries(SECTORES).map(([k, l]) => <option key={k} value={k} style={{ color: '#1e1e1e' }}>{l}</option>)}
          </select>
        </div>
      )}
      <label htmlFor={`${idBase}-consiento`} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5, color: c.texto, cursor: 'pointer' }}>
        <input id={`${idBase}-consiento`} type="checkbox" checked={consiento} onChange={e => setConsiento(e.target.checked)} required
          style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: '#ee7528' }} />
        {/* Mismo texto, palabra por palabra, que se guarda como prueba del consentimiento */}
        <span>{antes}<a href="/privacidad" target="_blank" rel="noopener" style={c.enlace}>política de privacidad</a>{despues}</span>
      </label>
      {captcha.widget}
      {estado === 'error' && <p role="alert" style={{ margin: 0, fontSize: 13, fontWeight: 600, color: oscuro ? '#fca5a5' : '#991b1b' }}>{mensaje}</p>}
      <button type="submit" disabled={estado === 'enviando'}
        style={{ alignSelf: 'flex-start', padding: '12px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        {estado === 'enviando' ? <Icono icono={LoaderCircle} size={18} style={{ verticalAlign: 'middle' }} /> : 'Suscribirme →'}
      </button>
    </form>
  )
}
