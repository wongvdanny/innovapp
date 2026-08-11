import Head from 'next/head'
import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

export default function Home() {
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
    <>
      <Head>
        <title>innovapp — Desarrollo de Aplicaciones Web y Software a Medida</title>
        <meta name="description" content="innovapp es una empresa española de desarrollo de aplicaciones web y software SaaS. Creamos soluciones digitales a medida para empresas y negocios. Nuestros productos, Servix (TPV para restaurantes) y GymStack (gestión de gimnasios), digitalizan negocios de principio a fin." />
        <meta name="keywords" content="desarrollo aplicaciones web, software a medida, empresa tecnología España, SaaS hostelería, TPV restaurante, innovapp, aplicaciones móviles, digitalización empresas" />
        <meta property="og:title" content="innovapp — Desarrollo de Aplicaciones Web y Software a Medida" />
        <meta property="og:description" content="Empresa española de tecnología web. Desarrollamos aplicaciones SaaS, software a medida y soluciones digitales para negocios modernos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://innovapp.es" />
        <meta property="og:image" content="https://innovapp.es/logo.webp" />
        <meta name="robots" content="index, follow" />
        <meta name="author" content="innovapp" />
        <link rel="canonical" href="https://innovapp.es" />
        <link rel="icon" href="/favicon.ico" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "innovapp",
          "url": "https://innovapp.es",
          "logo": "https://innovapp.es/logo.webp",
          "description": "Empresa española de desarrollo de aplicaciones web y software SaaS",
          "address": { "@type": "PostalAddress", "addressCountry": "ES" },
          "makesOffer": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "SoftwareApplication",
                "name": "Servix",
                "url": "https://innovapp.es/servix",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web"
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "SoftwareApplication",
                "name": "GymStack",
                "url": "https://innovapp.es/gymstack",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web"
              }
            }
          ]
        })}} />
      </Head>

      <Nav />

      <section style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0d1f2d 0%,#1a3d4f 55%,#0f4a5c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '130px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,179,170,.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(78,205,196,.08) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(42,179,170,.12)', border: '1px solid rgba(42,179,170,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 28 }}>
          <span style={{ color: '#4ecdc4', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Empresa española de tecnología web</span>
        </div>
        <h1 style={{ fontSize: 'clamp(34px,6vw,78px)', fontWeight: 800, color: 'white', lineHeight: 1.06, letterSpacing: -2, marginBottom: 24, maxWidth: 860 }}>
          Desarrollamos aplicaciones<br />que hacen crecer tu <span style={{ background: 'linear-gradient(135deg,#4ecdc4,#2ab3aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>negocio</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,19px)', color: 'rgba(255,255,255,.6)', maxWidth: 580, lineHeight: 1.75, marginBottom: 48 }}>
          En innovapp creamos software SaaS, aplicaciones web a medida y herramientas digitales para empresas que quieren crecer. Tecnología moderna, soporte en español, sin complicaciones.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          <a href="#productos" style={{ padding: '15px 30px', borderRadius: 12, background: 'linear-gradient(135deg,#4ecdc4,#2ab3aa)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 24px rgba(78,205,196,.35)' }}>Ver nuestros productos →</a>
          <a href="#empresa" style={{ padding: '15px 30px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Quiénes somos</a>
        </div>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Sectores en los que trabajamos</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['🍽️ Hostelería','🏪 Comercio','🏥 Salud','🏨 Turismo','🏗️ Servicios'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 100, padding: '7px 16px', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 24px', background: 'white' }} id="empresa">
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 60, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', background: 'rgba(42,179,170,.1)', border: '1px solid rgba(42,179,170,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>Quiénes somos</div>
              <h2 style={{ fontSize: 'clamp(26px,3.5vw,46px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 20, color: '#0d1f2d' }}>Tecnología web hecha<br />para el mundo real</h2>
              <p style={{ fontSize: 16, color: '#5a7a87', lineHeight: 1.85, marginBottom: 16 }}>innovapp es una empresa española de desarrollo de software especializada en aplicaciones web SaaS y soluciones digitales a medida. Creemos que la tecnología debe ser accesible, funcional y rentable para cualquier tipo de negocio.</p>
              <p style={{ fontSize: 16, color: '#5a7a87', lineHeight: 1.85, marginBottom: 32 }}>Desarrollamos productos propios y colaboramos con empresas que necesitan digitalizar sus procesos. Nuestro enfoque combina diseño moderno, arquitectura escalable y un soporte cercano en español.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['⚡','Desarrollo ágil'],['🎯','Enfoque en resultados'],['🔒','Seguridad y RGPD'],['🤝','Soporte en español'],['☁️','100% en la nube'],['📱','Multidispositivo']].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafb', border: '1px solid #eef1f4', borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a3d4f' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['💡','Aplicaciones SaaS','Desarrollamos productos en la nube con modelo de suscripción. Escalables desde el primer día, sin infraestructura propia.'],
                ['🛠️','Software a medida','Analizamos tu negocio y construimos la herramienta exacta que necesitas. Sin funciones que sobren, sin carencias.'],
                ['📊','Digitalización de procesos','Convertimos procesos manuales en flujos digitales eficientes. Menos errores, más velocidad, más control.'],
              ].map(([icon, title, desc]) => (
                <div key={String(title)} style={{ background: 'linear-gradient(145deg,#f8fafb,#f0f9f8)', border: '1px solid #e8f4f3', borderRadius: 20, padding: '24px 28px', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,rgba(42,179,170,.15),rgba(78,205,196,.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a3d4f', marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#5a7a87', lineHeight: 1.7 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '100px 24px', background: '#f8fafb' }} id="productos">
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(42,179,170,.1)', border: '1px solid rgba(42,179,170,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Nuestros productos</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,46px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 16, color: '#0d1f2d' }}>Software listo para usar,<br />desde hoy</h2>
          <p style={{ fontSize: 16, color: '#5a7a87', maxWidth: 500, margin: '0 auto 56px', lineHeight: 1.75 }}>Productos SaaS propios que resuelven problemas reales. Empieza gratis y escala cuando lo necesites.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ background: 'white', border: '2px solid #e8f4f3', borderRadius: 24, padding: '36px 32px', textAlign: 'left', boxShadow: '0 8px 40px rgba(26,61,79,.07)', transition: 'transform .2s,box-shadow .2s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(26,61,79,.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(26,61,79,.07)' }}>
              <div style={{ display: 'inline-block', background: '#e8f9f8', border: '1px solid rgba(42,179,170,.2)', borderRadius: 8, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', marginBottom: 20 }}>✦ Disponible</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>🍴</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#1a3d4f', lineHeight: 1 }}>serv<span style={{ color: '#2ab3aa' }}>ix</span></div>
                  <div style={{ fontSize: 12, color: '#88a8b0', marginTop: 2 }}>TPV para restaurantes</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#5a7a87', lineHeight: 1.75, marginBottom: 24 }}>Sistema completo de gestión para restaurantes, bares y cafeterías. Mesas, cocina, carta QR, reservas, informes y pagos con tarjeta, todo en un solo panel.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 28 }}>
                {['Mesas y zonas en tiempo real','Carta digital QR','Pantalla de cocina','Pagos con Redsys','Informes y analytics'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#1a3d4f' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(42,179,170,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#2ab3aa', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href="/servix#precios" style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(42,179,170,.3)' }}>Ver planes →</a>
                <a href="/servix" style={{ flex: 1, padding: '11px', background: '#f8fafb', border: '1px solid #eef1f4', color: '#1a3d4f', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Más info</a>
              </div>
            </div>
            <div style={{ background: 'white', border: '2px solid #f1eef4', borderRadius: 24, padding: '36px 32px', textAlign: 'left', boxShadow: '0 8px 40px rgba(61,26,79,.07)', transition: 'transform .2s,box-shadow .2s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 20px 60px rgba(61,26,79,.12)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(61,26,79,.07)' }}>
              <div style={{ display: 'inline-block', background: '#f5f0ff', border: '1px solid rgba(168,85,247,.2)', borderRadius: 8, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#a855f7', marginBottom: 20 }}>✦ Disponible</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>💪</div>
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#3d1a4f', lineHeight: 1 }}>gym<span style={{ color: '#a855f7' }}>stack</span></div>
                  <div style={{ fontSize: 12, color: '#a88ab0', marginTop: 2 }}>Gestión para gimnasios</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#7a5a87', lineHeight: 1.75, marginBottom: 24 }}>Sistema completo de gestión para gimnasios y centros deportivos. Socios, reservas de clases, control de accesos y seguimiento de rutinas, todo en un solo panel.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 28 }}>
                {['Gestión de socios','Reservas de clases','Control de accesos','Rutinas y seguimiento','Informes y analytics'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#3d1a4f' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(168,85,247,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#a855f7', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href="/gymstack#precios" style={{ flex: 1, padding: '11px', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: 'white', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 14px rgba(168,85,247,.3)' }}>Ver planes →</a>
                <a href="/gymstack" style={{ flex: 1, padding: '11px', background: '#f8fafb', border: '1px solid #eef1f4', color: '#1a3d4f', borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: 'none', textAlign: 'center' }}>Más info</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg,#f0f9f8,#e8f4f3)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: -1, marginBottom: 16, color: '#0d1f2d' }}>¿Por qué ofrecemos un plan gratuito?</h2>
          <p style={{ fontSize: 16, color: '#5a7a87', lineHeight: 1.85, maxWidth: 640, margin: '0 auto 40px' }}>Porque creemos que la tecnología no debería ser una barrera de entrada. Queremos que cualquier negocio, grande o pequeño, pueda digitalizarse sin riesgo. Cuando compruebes el valor real de nuestros productos, el paso a Pro es natural.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {[['🚀','Sin riesgo','Prueba todas las funciones básicas sin poner la tarjeta. Cero compromiso.'],['📈','Crece a tu ritmo','Cuando tu restaurante crezca y necesites más mesas o empleados, el upgrade es instantáneo.'],['🔓','Sin trampas','El plan gratis no caduca. No te forzamos a pagar con presión artificial.']].map(([icon, title, desc]) => (
              <div key={String(title)} style={{ background: 'white', borderRadius: 20, padding: '28px 24px', border: '1px solid rgba(42,179,170,.12)', boxShadow: '0 4px 20px rgba(26,61,79,.05)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a3d4f', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#5a7a87', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(135deg,#1a3d4f,#0f4a5c)', padding: '80px 24px', textAlign: 'center' }} id="contacto">
        <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, color: 'white', letterSpacing: -1.5, marginBottom: 12 }}>Mantente al día</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', marginBottom: 32, maxWidth: 420, margin: '0 auto 32px', lineHeight: 1.75 }}>Nuevos productos, funcionalidades y consejos para digitalizar tu negocio. Sin spam.</p>
        {subscribed ? (
          <div style={{ background: 'rgba(42,179,170,.15)', border: '1px solid rgba(42,179,170,.3)', borderRadius: 14, padding: '14px 28px', display: 'inline-block', color: '#4ecdc4', fontWeight: 700 }}>✅ ¡Suscrito! Gracias por unirte.</div>
        ) : (
          <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
              style={{ flex: 1, minWidth: 220, padding: '13px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 14, outline: 'none' }} />
            <button type="submit" disabled={subscribing}
              style={{ padding: '13px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#4ecdc4,#2ab3aa)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {subscribing ? '⏳' : 'Suscribirme →'}
            </button>
          </form>
        )}
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', marginTop: 16 }}>Al suscribirte aceptas nuestra <a href="/privacidad" style={{ color: 'rgba(255,255,255,.4)', textDecoration: 'underline' }}>política de privacidad</a>.</p>
      </section>

      <Footer />
    </>
  )
}
