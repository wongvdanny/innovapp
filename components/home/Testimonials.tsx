import { TESTIMONIALS } from '../../data/testimonials'

// Testimonios de clientes (data/testimonials.ts). Sin testimonios no se pinta nada.
export default function Testimonials() {
  if (TESTIMONIALS.length === 0) return null
  return (
    <section id="testimonios" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', textAlign: 'center', margin: '0 0 36px' }}>Lo que dicen nuestros clientes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <figure key={t.name + t.quote.slice(0, 20)} style={{ margin: 0, background: 'var(--gris-50)', border: '1px solid var(--gris-200)', borderRadius: 20, padding: 26 }}>
              <blockquote style={{ margin: '0 0 16px', fontSize: 16, color: '#1e1e1e', lineHeight: 1.7 }}>«{t.quote}»</blockquote>
              <figcaption style={{ fontSize: 14, color: 'var(--gris-600)' }}>
                <strong style={{ color: '#1e1e1e' }}>{t.name}</strong> · {t.role}{t.business ? `, ${t.business}` : ''}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
