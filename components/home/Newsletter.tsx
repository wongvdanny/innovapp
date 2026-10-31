import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubscribing(true)
    try {
      await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      setSubscribed(true)
    } finally { setSubscribing(false) }
  }

  return (
    <section id="newsletter" style={{ background: 'linear-gradient(135deg,#1e1e1e,#33261c)', padding: 'clamp(56px,10vw,80px) 16px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, color: 'white', letterSpacing: -1.5, marginBottom: 12 }}>Mantente al día</h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', marginBottom: 32, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.75 }}>Nuevos productos, funcionalidades y consejos para digitalizar tu negocio. Sin spam.</p>
      {subscribed ? (
        <div style={{ background: 'rgba(238,117,40,.15)', border: '1px solid rgba(238,117,40,.3)', borderRadius: 14, padding: '14px 28px', display: 'inline-block', color: '#f4a15c', fontWeight: 700 }}>✅ ¡Suscrito! Gracias por unirte.</div>
      ) : (
        <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required aria-label="Tu email"
            style={{ flex: 1, minWidth: 220, padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 14, outline: 'none' }} />
          <button type="submit" disabled={subscribing}
            style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {subscribing ? '⏳' : 'Suscribirme →'}
          </button>
        </form>
      )}
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 16 }}>Al suscribirte aceptas nuestra <a href="/privacidad" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'underline' }}>política de privacidad</a>.</p>
    </section>
  )
}
