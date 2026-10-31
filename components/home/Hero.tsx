// Hero de la home: el único h1 de la página. Pensado para verse entero sin scroll a 390 px
// de ancho (iPhone), por eso sin imagen ni demo: la demo está en #demo.
export default function Hero() {
  return (
    <section className="home-hero" style={{ background: 'linear-gradient(160deg,#1e1e1e 0%,#1e1e1e 60%,#33261c 100%)', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', top: -180, right: -180, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle,rgba(238,117,40,.14) 0%,transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
        <h1 style={{ fontSize: 'clamp(31px,6.5vw,60px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: 'white', margin: '0 0 18px' }}>
          Software y automatización con IA <span style={{ color: '#f4a15c' }}>a medida para tu negocio</span>
        </h1>
        <p style={{ fontSize: 'clamp(16px,2.2vw,19px)', color: 'rgba(255,255,255,.72)', lineHeight: 1.6, maxWidth: 640, margin: '0 0 28px' }}>
          Agentes que atienden tu WhatsApp y tu teléfono, tiendas online y aplicaciones hechas para tu forma de trabajar.
        </p>
        <div className="home-hero-ctas">
          <a href="#demo" style={{ padding: '15px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#f4a15c,#ee7528)', color: '#1e1e1e', fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
            Prueba el agente
          </a>
          <a href="#contacto" style={{ padding: '15px 28px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)', color: 'white', fontWeight: 600, fontSize: 16, textAlign: 'center' }}>
            Pide presupuesto
          </a>
        </div>
      </div>
      <style>{`
        .home-hero { padding: 112px 16px 48px; }
        .home-hero-ctas { display: flex; flex-direction: column; gap: 12px; }
        @media (min-width: 600px) {
          .home-hero { padding: 160px 24px 110px; }
          .home-hero-ctas { flex-direction: row; flex-wrap: wrap; }
        }
      `}</style>
    </section>
  )
}
