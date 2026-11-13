import { useEffect, useRef, useState } from 'react'
import { CircleCheck } from 'lucide-react'
import Icono from '../Icono'
import { track } from '../../lib/track'
import { CONTACT_EMAIL, LEGAL_OWNER, LEGAL_TRADE_NAME } from '../../lib/constants'
import { CANALES_CONTACTO, INSTAGRAM_HANDLE, PROVINCIAS, SECTORES_PROMO, TEXTO_MARKETING } from '../../lib/promo/config'
import { DESCRIPCION_MAX, DESCRIPCION_MIN, validarInscripcion } from '../../lib/promo/validacion'

// Formulario de inscripción de /webgratis. Misma validación que la API (lib/promo/validacion.ts).

type Estado = 'idle' | 'sending' | 'success' | 'error'

const VACIO = {
  name: '', businessName: '', sector: '', city: '', province: '', email: '', phone: '', instagram: '',
  currentWeb: '', contactChannel: '', description: '', acceptedTerms: false, marketingConsent: false, website: '',
}

const campo: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid var(--gris-300)', fontSize: 16,
  fontFamily: 'inherit', background: 'white', color: '#1e1e1e', boxSizing: 'border-box',
}
const etiqueta: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6 }
const enlace: React.CSSProperties = { color: 'var(--color-brand-orange-texto)', fontWeight: 600, textDecoration: 'underline' }

/** Abre las bases (<details id="bases">) al seguir el enlace. */
export function abrirBases() {
  const d = document.getElementById('bases') as HTMLDetailsElement | null
  if (d) d.open = true
}

export default function FormularioPromo() {
  const [f, setF] = useState(VACIO)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')
  const cargado = useRef(0)
  useEffect(() => { cargado.current = performance.now() }, [])

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }))
  const enviando = estado === 'sending'
  const fallo = (m: string) => { setEstado('error'); setError(m) }

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return
    const r = validarInscripcion(f)
    if ('error' in r) return fallo(r.error)
    setEstado('sending'); setError('')
    try {
      const res = await fetch('/api/promo/webgratis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...r.valor, website: f.website, elapsedMs: Math.round(performance.now() - cargado.current) }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) return fallo(data.error || 'No se ha podido enviar. Inténtalo de nuevo en unos minutos.')
      setEstado('success')
      // Sin datos personales: GTM decide qué etiquetas disparar (píxel de Meta «Lead») según el consentimiento
      track('promo_lead', { promo: 'webgratis' })
    } catch {
      fallo('No se ha podido enviar. Revisa tu conexión e inténtalo de nuevo.')
    }
  }

  if (estado === 'success') {
    return (
      <div role="status" style={{ textAlign: 'center', padding: '28px 8px' }}>
        <div style={{ color: '#15803d', display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Icono icono={CircleCheck} size={48} /></div>
        <p style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', lineHeight: 1.5, margin: 0 }}>
          ¡Inscripción recibida! Revisa tu email para confirmarla. Recuerda seguir a @{INSTAGRAM_HANDLE} en Instagram.
        </p>
      </div>
    )
  }

  const texto = (id: keyof typeof VACIO, label: string, type = 'text', autoComplete?: string, extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label style={etiqueta} htmlFor={`wg-${id}`}>{label}</label>
      <input id={`wg-${id}`} name={id} type={type} autoComplete={autoComplete} style={campo} disabled={enviando}
        value={f[id] as string} onChange={e => set(id, e.target.value)} {...extra} />
    </div>
  )
  const lista = (id: keyof typeof VACIO, label: string, opciones: string[], vacio: string) => (
    <div>
      <label style={etiqueta} htmlFor={`wg-${id}`}>{label}</label>
      <select id={`wg-${id}`} name={id} style={campo} disabled={enviando} required value={f[id] as string} onChange={e => set(id, e.target.value)}>
        <option value="">{vacio}</option>
        {opciones.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
  const n = f.description.trim().length

  return (
    <form onSubmit={enviar} noValidate>
      {/* honeypot: invisible para personas */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="wg-website">No rellenar este campo</label>
        <input id="wg-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set('website', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div className="wg-fila">
          {texto('name', 'Nombre y apellidos *', 'text', 'name', { required: true, maxLength: 120 })}
          {texto('businessName', 'Nombre del negocio *', 'text', 'organization', { required: true, maxLength: 160 })}
        </div>
        <div className="wg-fila">
          {lista('sector', 'Sector *', SECTORES_PROMO, 'Elige tu sector')}
          {lista('contactChannel', '¿Cómo te contactan hoy tus clientes? *', CANALES_CONTACTO, 'Elige una opción')}
        </div>
        <div className="wg-fila">
          {texto('city', 'Localidad *', 'text', 'address-level2', { required: true, maxLength: 120 })}
          {lista('province', 'Provincia *', PROVINCIAS, 'Elige tu provincia')}
        </div>
        <div className="wg-fila">
          {texto('email', 'Email *', 'email', 'email', { required: true, maxLength: 200 })}
          {texto('phone', 'Teléfono *', 'tel', 'tel', { required: true, maxLength: 30 })}
        </div>
        <div className="wg-fila">
          {texto('instagram', 'Usuario de Instagram *', 'text', 'off', { required: true, maxLength: 40, placeholder: '@tunegocio', 'aria-describedby': 'wg-instagram-ayuda' })}
          {texto('currentWeb', 'Web o redes actuales (opcional)', 'text', 'url', { maxLength: 300 })}
        </div>
        <p id="wg-instagram-ayuda" className="sr-only">Con o sin @. Lo usamos para comprobar que sigues a @{INSTAGRAM_HANDLE}.</p>
        <div>
          <label style={etiqueta} htmlFor="wg-description">Cuéntanos tu negocio: a qué te dedicas y qué te gustaría mejorar o automatizar *</label>
          <textarea id="wg-description" name="description" rows={5} style={{ ...campo, resize: 'vertical' }} disabled={enviando} required
            minLength={DESCRIPCION_MIN} maxLength={DESCRIPCION_MAX} aria-describedby="wg-contador"
            value={f.description} onChange={e => set('description', e.target.value)} />
          <p id="wg-contador" style={{ fontSize: 13, margin: '6px 0 0', textAlign: 'right', color: n > 0 && n < DESCRIPCION_MIN ? '#b91c1c' : 'var(--gris-600)' }}>
            {n}/{DESCRIPCION_MAX} caracteres{n < DESCRIPCION_MIN ? ` (mínimo ${DESCRIPCION_MIN})` : ''}
          </p>
        </div>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--gris-700)', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.acceptedTerms} onChange={e => set('acceptedTerms', e.target.checked)} disabled={enviando} required
            style={{ marginTop: 2, width: 20, height: 20, flexShrink: 0, accentColor: '#ee7528' }} />
          <span>
            He leído y acepto las <a href="#bases" onClick={abrirBases} style={enlace}>bases de la promoción</a> y la{' '}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={enlace}>política de privacidad</a>, y autorizo la
            publicación del nombre de mi negocio y mi cuenta de Instagram si resulto ganador o suplente. *
          </span>
        </label>
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: 'var(--gris-700)', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.marketingConsent} onChange={e => set('marketingConsent', e.target.checked)} disabled={enviando}
            style={{ marginTop: 2, width: 20, height: 20, flexShrink: 0, accentColor: '#ee7528' }} />
          <span>{TEXTO_MARKETING} (opcional)</span>
        </label>

        {estado === 'error' && (
          <p role="alert" style={{ fontSize: 14, color: '#991b1b', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', margin: 0 }}>{error}</p>
        )}

        <button type="submit" disabled={enviando}
          style={{ padding: '16px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontSize: 17, fontWeight: 800, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.75 : 1 }}>
          {enviando ? 'Enviando…' : 'Quiero participar'}
        </button>

        <p style={{ fontSize: 13, color: 'var(--gris-600)', lineHeight: 1.6, margin: 0 }}>
          Responsable: {LEGAL_OWNER} ({LEGAL_TRADE_NAME}). Finalidad: gestionar tu inscripción y, si lo aceptas, enviarte comunicaciones comerciales.
          Derechos: acceso, rectificación, supresión y otros en {CONTACT_EMAIL}. Más info en la{' '}
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={enlace}>política de privacidad</a>.
        </p>
      </div>
      <style>{`
        .wg-fila { display: grid; gap: 16px; }
        @media (min-width: 640px) { .wg-fila { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </form>
  )
}
