import NewsletterForm from '../NewsletterForm'

export default function Newsletter() {
  return (
    <section id="newsletter" style={{ background: 'linear-gradient(135deg,#1e1e1e,#33261c)', padding: 'clamp(56px,10vw,80px) 16px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, color: 'white', letterSpacing: -1.5, marginBottom: 12 }}>Mantente al día</h2>
      {/* // COPY */}
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,.72)', marginBottom: 32, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.75 }}>Nuevos productos, funcionalidades y consejos para digitalizar tu negocio. Sin spam.</p>
      <NewsletterForm idBase="nl-home" />
    </section>
  )
}
