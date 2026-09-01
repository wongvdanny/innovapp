import { useState } from 'react'
import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { WHATSAPP_NUMBER } from '../components/WhatsAppBubble'

const CONTACT_EMAIL = 'hola@innovapp.es'
const PRODUCTS = ['Servix', 'GymStack', 'Agentes IA', 'Otro']

type Status = 'idle' | 'sending' | 'success' | 'error'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #eef1f4',
  fontSize: 14, outline: 'none', fontFamily: 'var(--font-gabarito), system-ui, sans-serif',
  transition: 'border-color .2s', boxSizing: 'border-box', background: 'white',
}
const lblStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contacto() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', product: '', message: '', privacy: false, website: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === 'sending') return

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error'); setError('Rellena nombre, email y mensaje.'); return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setStatus('error'); setError('El email no tiene un formato válido.'); return
    }
    if (!form.privacy) {
      setStatus('error'); setError('Debes aceptar la política de privacidad.'); return
    }

    setStatus('sending'); setError('')
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          product: form.product,
          message: form.message.trim(),
          website: form.website, // honeypot
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setForm({ name: '', email: '', phone: '', product: '', message: '', privacy: false, website: '' })
    } catch {
      setStatus('error')
      setError('No se ha podido enviar el mensaje. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.')
    }
  }

  const sending = status === 'sending'

  return (
    <>
      <Seo
        title="Contacto — innovapp"
        description="¿Tienes dudas sobre Servix, GymStack o los Agentes IA? Escríbenos y te respondemos con una propuesta a medida para tu negocio."
        canonical="/contacto"
      />
      <Nav />

      <main style={{ background: '#f8fafb', minHeight: '100vh', padding: '140px 24px 90px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h1 style={{ fontSize: 'clamp(30px,4.5vw,48px)', fontWeight: 800, letterSpacing: -1.5, color: '#1e1e1e', marginBottom: 14 }}>
              Hablemos de tu <span style={{ color: '#ee7528' }}>negocio</span>
            </h1>
            <p style={{ fontSize: 17, color: '#5a7a87', maxWidth: 540, margin: '0 auto', lineHeight: 1.7 }}>
              Cuéntanos qué necesitas y te respondemos con una propuesta concreta. Sin compromiso.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 32, alignItems: 'start' }} className="contacto-grid">
            {/* --- Formulario --- */}
            <div style={{ background: 'white', border: '1px solid #eef1f4', borderRadius: 24, padding: 'clamp(24px,4vw,40px)' }}>
              {status === 'success' ? (
                <div style={{ textAlign: 'center', padding: '32px 8px' }}>
                  <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e1e1e', marginBottom: 10 }}>¡Mensaje enviado!</h2>
                  <p style={{ fontSize: 15, color: '#5a7a87', lineHeight: 1.7, marginBottom: 24 }}>
                    Gracias por escribirnos. Te responderemos al email que nos has indicado lo antes posible.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    style={{ padding: '12px 24px', borderRadius: 10, border: '1.5px solid #eef1f4', background: 'white', fontSize: 14, fontWeight: 600, color: '#1e1e1e', cursor: 'pointer' }}
                  >
                    Enviar otro mensaje
                  </button>
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
                      <label style={lblStyle} htmlFor="name">Nombre *</label>
                      <input id="name" style={inputStyle} value={form.name}
                        onChange={e => set('name', e.target.value)} required disabled={sending} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="contacto-row">
                      <div>
                        <label style={lblStyle} htmlFor="email">Email *</label>
                        <input id="email" type="email" style={inputStyle} value={form.email}
                          onChange={e => set('email', e.target.value)} required disabled={sending} />
                      </div>
                      <div>
                        <label style={lblStyle} htmlFor="phone">Teléfono</label>
                        <input id="phone" type="tel" style={inputStyle} value={form.phone}
                          onChange={e => set('phone', e.target.value)} disabled={sending} />
                      </div>
                    </div>
                    <div>
                      <label style={lblStyle} htmlFor="product">Producto de interés</label>
                      <select id="product" style={inputStyle} value={form.product}
                        onChange={e => set('product', e.target.value)} disabled={sending}>
                        <option value="">Selecciona una opción (opcional)</option>
                        {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lblStyle} htmlFor="message">Mensaje *</label>
                      <textarea id="message" rows={5} style={{ ...inputStyle, resize: 'vertical' }}
                        value={form.message} onChange={e => set('message', e.target.value)} required disabled={sending} />
                    </div>

                    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#5a7a87', lineHeight: 1.5, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.privacy}
                        onChange={e => set('privacy', e.target.checked)}
                        disabled={sending}
                        style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: '#ee7528' }} />
                      <span>
                        He leído y acepto la{' '}
                        <Link href="/privacidad" style={{ color: '#ee7528', fontWeight: 600 }}>política de privacidad</Link>. *
                      </span>
                    </label>

                    {status === 'error' && (
                      <p style={{ fontSize: 13, color: '#991b1b', background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', margin: 0 }}>
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
                      {sending ? 'Enviando…' : 'Enviar mensaje'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* --- Contacto directo --- */}
            <aside style={{ display: 'grid', gap: 16 }}>
              <div style={{ background: 'white', border: '1px solid #eef1f4', borderRadius: 20, padding: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1e1e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
                  ¿Prefieres directo?
                </div>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, quiero más información sobre Innovapp')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: '#1e1e1e', textDecoration: 'none', marginBottom: 14 }}
                >
                  <span style={{ fontSize: 20 }}>💬</span> WhatsApp: +34 641 39 96 45
                </a>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: '#1e1e1e', textDecoration: 'none' }}
                >
                  <span style={{ fontSize: 20 }}>✉️</span> {CONTACT_EMAIL}
                </a>
              </div>
              <div style={{ background: '#fdf0e8', border: '1px solid #f9dcc7', borderRadius: 20, padding: 28 }}>
                <p style={{ fontSize: 14, color: '#5a7a87', lineHeight: 1.7, margin: 0 }}>
                  Respondemos normalmente en menos de 24&nbsp;horas laborables. Si tu consulta es sobre una
                  suscripción activa, indícalo en el mensaje para priorizarla.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      <style>{`
        @media (max-width: 820px) {
          .contacto-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .contacto-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
