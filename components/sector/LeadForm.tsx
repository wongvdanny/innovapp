import { useState } from 'react'
import { CircleCheck } from 'lucide-react'
import Icono from '../Icono'
import { useRecaptcha } from '../Recaptcha'
import { track } from '../../lib/track'
import { CONSENTIMIENTO_LEAD, LIMITES_LEAD, TELEFONO_RE } from '../../lib/lead'

// Formulario de lead de las landings de Agentes IA (restaurantes y sectores). Envía a /api/lead
// con el origen (source), que decide el registro, el aviso a contacto@ y la respuesta automática.

type Estado = 'idle' | 'sending' | 'success' | 'error'

const FORM_VACIO = { nombre: '', negocio: '', telefono: '', email: '', localidad: '', mensaje: '', consentimiento: false, website: '' }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '13px 14px', borderRadius: 10, border: '1.5px solid #e6dfcf',
  fontSize: 16, outline: 'none', fontFamily: 'var(--font-gabarito), system-ui, sans-serif',
  boxSizing: 'border-box', background: 'white', color: '#1a140d',
}
const lblStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#1a140d', display: 'block', marginBottom: 6 }

export default function LeadForm({ source, etiquetaNegocio }: {
  /** Clave de FUENTES_LEAD (data/sectores.ts): 'restaurantes', 'peluquerias'… */
  source: string
  /** Etiqueta del campo del negocio: «Restaurante», «Clínica»… */
  etiquetaNegocio: string
}) {
  const [form, setForm] = useState(FORM_VACIO)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')
  const captcha = useRecaptcha()

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }))
  const enviando = estado === 'sending'

  const fallo = (msg: string) => { setEstado('error'); setError(msg) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (enviando) return
    const d = {
      nombre: form.nombre.trim(), negocio: form.negocio.trim(), telefono: form.telefono.trim(),
      email: form.email.trim(), localidad: form.localidad.trim(), mensaje: form.mensaje.trim(),
    }
    if (!d.nombre || !d.negocio || !d.telefono || !d.email || !d.localidad) {
      return fallo(`Rellena nombre, ${etiquetaNegocio.toLowerCase()}, teléfono, email y localidad.`)
    }
    if (!TELEFONO_RE.test(d.telefono)) return fallo('Revisa el teléfono.')
    if (!EMAIL_RE.test(d.email)) return fallo('El email no tiene un formato válido.')
    if (!form.consentimiento) return fallo('Para que te contactemos tienes que marcar la casilla de consentimiento.')
    const recaptchaToken = captcha.token()
    if (captcha.activo && !recaptchaToken) return fallo('Marca la casilla «No soy un robot» antes de enviar.')

    setEstado('sending'); setError('')
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, source, consentimiento: true, website: form.website, recaptchaToken }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) return fallo(data.error || 'No se ha podido enviar. Inténtalo de nuevo en unos minutos.')
      setEstado('success')
      // Sin datos personales en el dataLayer; GTM aplica el Consent Mode a cada etiqueta.
      track('generate_lead', { form: source, page_path: window.location.pathname })
      setForm(FORM_VACIO)
    } catch {
      fallo('No se ha podido enviar. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.')
    } finally {
      // Token de un solo uso: se resetea tanto si fue bien como si falló.
      captcha.reset()
    }
  }

  if (estado === 'success') {
    return (
      <div role="status" style={{ textAlign: 'center', padding: '24px 4px' }}>
        <div style={{ marginBottom: 12, color: '#15803d', display: 'flex', justifyContent: 'center' }}><Icono icono={CircleCheck} size={44} /></div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#1a140d', margin: '0 0 10px' }}>¡Recibido!</h3>
        <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, margin: 0 }}>
          Te llamamos en cuanto podamos para concertar la visita. Te hemos enviado un email de confirmación.
        </p>
      </div>
    )
  }

  const campo = (id: 'nombre' | 'negocio' | 'telefono' | 'email' | 'localidad', label: string, type: string, autoComplete: string) => (
    <div>
      <label style={lblStyle} htmlFor={`lead-${id}`}>{label} *</label>
      <input
        id={`lead-${id}`} name={id} type={type} autoComplete={autoComplete} style={inputStyle}
        value={form[id]} onChange={e => set(id, e.target.value)} maxLength={LIMITES_LEAD[id]}
        required disabled={enviando}
      />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} onFocus={captcha.cargar} noValidate>
      {/* honeypot: invisible para humanos, tentador para bots */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="lead-website">No rellenar este campo</label>
        <input id="lead-website" name="website" type="text" tabIndex={-1} autoComplete="off"
          value={form.website} onChange={e => set('website', e.target.value)} />
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <div className="lead-fila">
          {campo('nombre', 'Nombre', 'text', 'name')}
          {campo('negocio', etiquetaNegocio, 'text', 'organization')}
        </div>
        <div className="lead-fila">
          {campo('telefono', 'Teléfono', 'tel', 'tel')}
          {campo('email', 'Email', 'email', 'email')}
        </div>
        {campo('localidad', 'Localidad', 'text', 'address-level2')}
        <div>
          <label style={lblStyle} htmlFor="lead-mensaje">Mensaje (opcional)</label>
          <textarea id="lead-mensaje" name="mensaje" rows={3} style={{ ...inputStyle, resize: 'vertical' }}
            value={form.mensaje} onChange={e => set('mensaje', e.target.value)} maxLength={LIMITES_LEAD.mensaje} disabled={enviando} />
        </div>

        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 14, color: '#4a3f2e', lineHeight: 1.5, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.consentimiento} onChange={e => set('consentimiento', e.target.checked)}
            disabled={enviando} required
            style={{ marginTop: 2, width: 20, height: 20, flexShrink: 0, accentColor: 'var(--agentes-oro-texto)' }} />
          <span>
            {CONSENTIMIENTO_LEAD}{' '}
            <a href="/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--agentes-oro-texto)', fontWeight: 600, textDecoration: 'underline' }}>Política de privacidad</a>. *
          </span>
        </label>

        {captcha.widget}

        {estado === 'error' && (
          <p role="alert" style={{ fontSize: 14, color: '#991b1b', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', margin: 0 }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={enviando}
          style={{ padding: '16px 28px', borderRadius: 12, border: 'none', background: '#12141a', color: 'var(--agentes-oro)', fontSize: 16, fontWeight: 700, cursor: enviando ? 'default' : 'pointer', opacity: enviando ? 0.75 : 1 }}>
          {enviando ? 'Enviando…' : 'Quiero que me llaméis'}
        </button>
      </div>

      <style>{`
        .lead-fila { display: grid; gap: 16px; }
        @media (min-width: 600px) { .lead-fila { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </form>
  )
}
