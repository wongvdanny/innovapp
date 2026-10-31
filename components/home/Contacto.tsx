import Link from 'next/link'
import { CONTACT_EMAIL, waLink } from '../../lib/constants'

// #contacto: destino del CTA «Pide presupuesto» del hero.
export default function Contacto() {
  return (
    <section id="contacto" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: '#fdf0e8' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 14px' }}>Pide presupuesto</h2>
        <p style={{ fontSize: 16, color: '#4a6572', lineHeight: 1.75, margin: '0 0 28px' }}>
          Cuéntanos qué necesitas y te decimos qué automatizar, cuánto cuesta y en qué plazo, antes de empezar. Sin compromiso.
        </p>
        <div className="home-contacto-ctas">
          <a
            href={waLink('Hola, quiero presupuesto para automatizar un proceso.')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '15px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontWeight: 700, fontSize: 16 }}
          >
            Escríbenos por WhatsApp →
          </a>
          <Link href="/contacto" style={{ padding: '15px 28px', borderRadius: 12, background: 'white', border: '1.5px solid #f9dcc7', color: '#1e1e1e', fontWeight: 600, fontSize: 16 }}>
            Formulario de contacto
          </Link>
        </div>
        <p style={{ fontSize: 15, color: '#4a6572', margin: '20px 0 0' }}>
          O por email: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#b2561a', fontWeight: 700 }}>{CONTACT_EMAIL}</a>
        </p>
      </div>
      <style>{`
        .home-contacto-ctas { display: flex; flex-direction: column; gap: 12px; text-align: center; }
        @media (min-width: 600px) { .home-contacto-ctas { flex-direction: row; justify-content: center; } }
      `}</style>
    </section>
  )
}
