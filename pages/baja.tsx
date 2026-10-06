import { useState } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { CONTACT_EMAIL } from '../lib/constants'

const SERVICES = ['Servix', 'GymStack', 'Agentes IA', 'Otro']

type Status = 'idle' | 'sending' | 'success' | 'error'

// Público a propósito (NEXT_PUBLIC_*): es la site key de reCAPTCHA, diseñada para ir en
// el HTML del cliente. La secreta (RECAPTCHA_SECRET_KEY) solo se usa en el servidor
// (lib/formulario-publico.ts).
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #eef1f4',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-gabarito), system-ui, sans-serif',
  transition: 'border-color .2s', boxSizing: 'border-box', background: 'white',
}
const lblStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Baja() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', service: '', account: '', reason: '', confirm: false, privacy: false, website: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    if (!form.name.trim() || !form.email.trim() || !form.service) {
      setStatus('error'); setError('Rellena nombre, email y el servicio que quieres dar de baja.'); return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setStatus('error'); setError('El email no tiene un formato válido.'); return
    }
    if (!form.confirm) {
      setStatus('error'); setError('Confirma que eres el titular de la cuenta y que quieres solicitar la baja.'); return
    }
    if (!form.privacy) {
      setStatus('error'); setError('Debes aceptar la política de privacidad.'); return
    }

    const recaptchaToken = RECAPTCHA_SITE_KEY ? window.grecaptcha?.getResponse() ?? '' : ''
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setStatus('error'); setError('Marca la casilla "No soy un robot" antes de enviar.'); return
    }

    setStatus('sending'); setError('')
    try {
      const res = await fetch('/api/baja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          service: form.service,
          account: form.account.trim(),
          reason: form.reason.trim(),
          website: form.website, // honeypot
          recaptchaToken,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ name: '', email: '', phone: '', service: '', account: '', reason: '', confirm: false, privacy: false, website: '' })
    } catch {
      setStatus('error')
      setError(`No se ha podido enviar la solicitud. Inténtalo de nuevo en unos minutos o escríbenos a ${CONTACT_EMAIL}.`)
    } finally {
      // El token de reCAPTCHA es de un solo uso -- se resetea tanto si fue bien como si falló.
      window.grecaptcha?.reset()
    }
  }

  const sending = status === 'sending'
  const check: React.CSSProperties = { marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#ee7528' }
  const checkLabel: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#5a7a87', lineHeight: 1.5, cursor: 'pointer' }

  return (
    <>
      <Seo
        title="Solicitar la baja de un servicio — innovapp"
        description="Formulario para solicitar la baja de Servix, GymStack o los Agentes IA de innovapp."
        canonical="/baja"
      />
      <Nav />

      {RECAPTCHA_SITE_KEY && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" async defer />
      )}

      <main style={{ background: '#f8fafb', minHeight: '100vh', padding: '140px 24px 90px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h1 style={{ fontSize: 'clamp(28px,4.5vw,42px)', fontWeight: 800, letterSpacing: -1.2, color: '#1e1e1e', marginBottom: 14 }}>
              Solicitar la <span style={{ color: '#ee7528' }}>baja</span> de un servicio
            </h1>
            <p style={{ fontSize: 16, color: '#5a7a87', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Indícanos qué servicio quieres dar de baja. Te confirmaremos por email cuando esté tramitada.
            </p>
          </div>

          <div style={{ background: 'white', border: '1px solid #eef1f4', borderRadius: 24, padding: 'clamp(24px,4vw,40px)' }}>
            {status === 'success' ? (
              <div style={{ textAlign: 'center', padding: '32px 8px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e1e1e', marginBottom: 10 }}>Solicitud enviada</h2>
                <p style={{ fontSize: 15, color: '#5a7a87', lineHeight: 1.7, margin: 0 }}>
                  Hemos recibido tu solicitud de baja. Te escribiremos al email que nos has indicado para confirmarla.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* honeypot: invisible para humanos, tentador para bots */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                  <label htmlFor="website">No rellenar este campo</label>
                  <input
                    id="website" name="website" type="text" tabIndex={-1} autoComplete="off"
                    value={form.website} onChange={e => set('website', e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={lblStyle} htmlFor="service">Servicio que quieres dar de baja *</label>
                    <select id="service" style={inputStyle} value={form.service}
                      onChange={e => set('service', e.target.value)} required disabled={sending}>
                      <option value="">Selecciona un servicio</option>
                      {SERVICES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lblStyle} htmlFor="name">Nombre y apellidos *</label>
                    <input id="name" style={inputStyle} value={form.name} autoComplete="name"
                      onChange={e => set('name', e.target.value)} required disabled={sending} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="baja-row">
                    <div>
                      <label style={lblStyle} htmlFor="email">Email de la cuenta *</label>
                      <input id="email" type="email" style={inputStyle} value={form.email} autoComplete="email"
                        onChange={e => set('email', e.target.value)} required disabled={sending} />
                    </div>
                    <div>
                      <label style={lblStyle} htmlFor="phone">Teléfono</label>
                      <input id="phone" type="tel" style={inputStyle} value={form.phone} autoComplete="tel"
                        onChange={e => set('phone', e.target.value)} disabled={sending} />
                    </div>
                  </div>
                  <div>
                    <label style={lblStyle} htmlFor="account">Nombre del negocio o de la cuenta</label>
                    <input id="account" style={inputStyle} value={form.account}
                      onChange={e => set('account', e.target.value)} disabled={sending} />
                  </div>
                  <div>
                    <label style={lblStyle} htmlFor="reason">Motivo de la baja (opcional)</label>
                    <textarea id="reason" rows={4} style={{ ...inputStyle, resize: 'vertical' }}
                      value={form.reason} onChange={e => set('reason', e.target.value)} disabled={sending} />
                  </div>

                  <label style={checkLabel}>
                    <input type="checkbox" checked={form.confirm} onChange={e => set('confirm', e.target.checked)} disabled={sending} style={check} />
                    <span>Soy el titular de la cuenta (o actúo en su nombre) y quiero solicitar la baja de este servicio. *</span>
                  </label>
                  <label style={checkLabel}>
                    <input type="checkbox" checked={form.privacy} onChange={e => set('privacy', e.target.checked)} disabled={sending} style={check} />
                    <span>
                      He leído y acepto la{' '}
                      <Link href="/privacidad" style={{ color: '#ee7528', fontWeight: 600 }}>política de privacidad</Link>. *
                    </span>
                  </label>

                  {RECAPTCHA_SITE_KEY && (
                    <div className="g-recaptcha" data-sitekey={RECAPTCHA_SITE_KEY} />
                  )}

                  {status === 'error' && (
                    <p role="alert" style={{ fontSize: 13, color: '#991b1b', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', margin: 0 }}>
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      padding: '14px 28px', borderRadius: 12, border: 'none',
                      background: sending ? '#f4a15c' : 'linear-gradient(135deg,#f4a15c,#ee7528)',
                      color: 'white', fontSize: 15, fontWeight: 700,
                      cursor: sending ? 'default' : 'pointer',
                      opacity: sending ? 0.8 : 1, transition: 'opacity .2s',
                    }}
                  >
                    {sending ? 'Enviando…' : 'Solicitar la baja'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <p style={{ fontSize: 13, color: '#5a7a87', textAlign: 'center', lineHeight: 1.7, margin: '24px 0 0' }}>
            ¿Prefieres escribirnos? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#ee7528', fontWeight: 600 }}>{CONTACT_EMAIL}</a>
            {' · '}
            <Link href="/contacto" style={{ color: '#ee7528', fontWeight: 600 }}>Contacto</Link>
          </p>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 480px) {
          .baja-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
