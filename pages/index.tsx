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
        <title>innovapp — Software TPV para Restaurantes</title>
        <meta name="description" content="innovapp desarrolla Servix, el sistema TPV completo para restaurantes: mesas, cocina, pagos con tarjeta, reservas e informes. Desde 99€/mes." />
        <meta name="keywords" content="TPV restaurante, software restaurante, gestión mesas, Servix, innovapp, punto de venta hostelería" />
        <meta property="og:title" content="innovapp — Software para Restaurantes" />
        <meta property="og:description" content="El sistema de gestión completo para restaurantes modernos." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://innovapp.es" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://innovapp.es" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Nav />

      {/* HERO */}
      <section style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1a2533 0%,#1a3d4f 55%,#0f4a5c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '130px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -180, right: -180, width: 560, height: 560, borderRadius: '50%', background: 'radial-gradient(circle,rgba(42,179,170,.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(42,179,170,.12)', border: '1px solid rgba(42,179,170,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 28 }}>
          <span style={{ color: '#2ab3aa', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Tecnología para la hostelería española</span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px,6vw,76px)', fontWeight: 800, color: 'white', lineHeight: 1.08, letterSpacing: -2, marginBottom: 24, maxWidth: 800 }}>
          Software que transforma<br />la gestión de tu <span style={{ color: '#2ab3aa' }}>restaurante</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: 'rgba(255,255,255,.6)', maxWidth: 560, lineHeight: 1.75, marginBottom: 48 }}>
          innovapp desarrolla herramientas digitales para el sector hostelero. Nuestro producto Servix gestiona mesas, cocina, pagos, reservas e informes en un solo panel.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/registro" style={{ padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 20px rgba(42,179,170,.4)' }}>Empezar gratis →</a>
          <a href="#servix" style={{ padding: '14px 28px', borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1.5px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>Ver Servix</a>
        </div>
        <div style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 }}>Pensado para todo tipo de establecimientos</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['🍽️ Restaurantes','☕ Cafeterías','🍺 Bares','🍕 Franquicias','🏨 Hoteles'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 100, padding: '7px 14px', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.45)' }}>{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: '80px 24px' }} id="empresa">
        <div className="about-grid" style={{ maxWidth: 1100, margin: '0 auto', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(42,179,170,.1)', border: '1px solid rgba(42,179,170,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Quiénes somos</div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16 }}>Tecnología pensada desde la hostelería</h2>
            <p style={{ fontSize: 15, color: '#88a8b0', lineHeight: 1.8, marginBottom: 12 }}>En innovapp desarrollamos software especializado para el sector de la restauración. Nacimos de la necesidad real de digitalizar los restaurantes sin complicaciones ni costes desorbitados.</p>
            <p style={{ fontSize: 15, color: '#88a8b0', lineHeight: 1.8, marginBottom: 28 }}>Nuestro equipo combina experiencia en hostelería con ingeniería de software para crear herramientas que realmente funcionan en el día a día.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['⚡','Soluciones ágiles'],['🎯','Enfoque hostelero'],['🔒','Datos seguros'],['🤝','Soporte en español']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafb', border: '1px solid #eef1f4', borderRadius: 12, padding: 14 }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'linear-gradient(145deg,#f0f9f8,rgba(42,179,170,.08))', border: '1px solid rgba(42,179,170,.15)', borderRadius: 28, padding: 32, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['100%','En la nube'],['24/7','Disponibilidad'],['0€','Instalación'],['∞','Sin límites']].map(([num, label]) => (
                <div key={label} style={{ background: 'white', borderRadius: 16, padding: '20px 16px', border: '1px solid #eef1f4', boxShadow: '0 4px 16px rgba(26,61,79,.06)' }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#1a6478', lineHeight: 1 }}>{num}</div>
                  <div style={{ fontSize: 12, color: '#88a8b0', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', borderRadius: 16, padding: '18px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Nuestro producto estrella</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'white' }}>Servix TPV</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>Sistema completo para restaurantes</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVIX */}
      <section style={{ padding: '0 24px 80px', background: '#f8fafb' }} id="servix">
        <div style={{ background: 'linear-gradient(145deg,#1a3d4f,#0f3d50)', borderRadius: 28, padding: '48px 32px', maxWidth: 1100, margin: '0 auto', boxShadow: '0 40px 100px rgba(26,61,79,.25)', position: 'relative', overflow: 'hidden' }}>
          <div className="servix-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🍴</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'white' }}>serv<span style={{ color: '#2ab3aa' }}>ix</span></div>
              </div>
              <h3 style={{ fontSize: 'clamp(20px,3vw,34px)', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 16 }}>El sistema que necesita tu restaurante, todo en uno</h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.75, marginBottom: 24 }}>Servix centraliza mesas, pedidos, cocina, cobros, reservas e informes en un único panel.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {['Mesas y zonas con estado en tiempo real','Carta digital QR para pedidos desde móvil','Pantalla táctil de cocina con alertas','Pagos con tarjeta via Redsys','Reservas, informes, tickets y facturas','Gestión de empleados con PIN'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(42,179,170,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#2ab3aa', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    {f}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a href="/registro" style={{ background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', borderRadius: 12, padding: '12px 22px', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 6px 20px rgba(42,179,170,.4)' }}>Ver planes →</a>
                <a href="https://servix.innovapp.es" target="_blank" style={{ background: 'rgba(255,255,255,.06)', border: '1.5px solid rgba(255,255,255,.15)', color: 'white', borderRadius: 12, padding: '12px 22px', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Demo en vivo</a>
              </div>
            </div>
            {/* Mockup */}
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ background: 'rgba(255,255,255,.06)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
                <div style={{ flex: 1, background: 'rgba(255,255,255,.05)', borderRadius: 6, padding: '3px 10px', fontSize: 9, color: 'rgba(255,255,255,.3)', margin: '0 8px' }}>servix.innovapp.es/dashboard</div>
              </div>
              <div style={{ background: '#f0f2f5' }}>
                <div style={{ background: 'white', padding: '8px 14px', borderBottom: '1px solid #eef1f4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#1a6478', borderRadius: 100, padding: '4px 10px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ecdc4' }} />
                    <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>Estamos atendiendo</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#2ab3aa' }}>312€</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: 12 }}>
                  {[['#fca5a5','#fff1f2','#991b1b','🔴','Mesa 1','Ocupada'],['#fcd34d','#fffbeb','#92400e','🟡','Mesa 2','Cuenta'],['#86efac','#f0fdf4','#166534','🟢','Mesa 3','Libre'],['#86efac','#f0fdf4','#166534','🟢','Mesa 4','Libre'],['#fca5a5','#fff1f2','#991b1b','🔴','Mesa 5','Ocupada'],['#86efac','#f0fdf4','#166534','🟢','Mesa 6','Libre']].map(([border,bg,text,emoji,num,label])=>(
                    <div key={num} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 14 }}>{emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: text }}>{num}</span>
                      <span style={{ background: border, borderRadius: 20, padding: '1px 6px', fontSize: 8, fontWeight: 700, color: text }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '80px 24px', background: '#f8fafb' }} id="funciones">
        <div style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(42,179,170,.1)', border: '1px solid rgba(42,179,170,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Funcionalidades</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 12 }}>Todo lo que necesitas,<br />nada que sobre</h2>
          <p style={{ fontSize: 16, color: '#88a8b0', maxWidth: 520, margin: '0 auto 48px', lineHeight: 1.75 }}>Servix cubre cada punto de la operación sin necesitar otros sistemas adicionales.</p>
          <div className="features-grid">
            {[
              ['🪑','Mesas y zonas','Organiza mesas por zonas. Estado en tiempo real: libre, ocupada, pidiendo cuenta, pagada o servida.'],
              ['🧾','Comandas inteligentes','Añade productos en un toque. Divide la cuenta. Gestión completa desde el panel lateral.'],
              ['📱','Carta digital QR','QR por mesa. El cliente escanea, ve la carta y pide desde su móvil sin instalar nada.'],
              ['👨‍🍳','Pantalla de cocina','Monitor táctil con comandas en tiempo real. Alertas sonoras. Urgencia visual por tiempo.'],
              ['💳','Pagos con Redsys','Integración con TPV bancario. Cobra con tarjeta desde el panel o desde el móvil del cliente.'],
              ['📊','Informes y KPIs','Ventas, productos más pedidos, rendimiento por empleado. Filtra por cualquier periodo.'],
              ['📅','Reservas online','Gestión con disponibilidad en tiempo real. Emails automáticos en cada cambio de estado.'],
              ['👥','Personal con PIN','Cada empleado accede con PIN. Las comandas se vinculan al camarero. Control total.'],
              ['🖨️','Tickets y facturas','Numeración correlativa, IVA, impresión ESC/POS. Envío por email con un toque.'],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} style={{ background: 'white', border: '1px solid #eef1f4', borderRadius: 20, padding: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#88a8b0', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: '80px 24px' }} id="precios">
        <div style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-block', background: 'rgba(42,179,170,.1)', border: '1px solid rgba(42,179,170,.2)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#2ab3aa', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Planes Servix</div>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 12 }}>Precio claro,<br />sin sorpresas</h2>
          <p style={{ fontSize: 16, color: '#88a8b0', maxWidth: 460, margin: '0 auto 48px', lineHeight: 1.75 }}>Todo incluido. Sin comisiones por venta, sin límite de mesas ni pedidos.</p>
          <div className="pricing-grid" style={{ maxWidth: 820, margin: '0 auto' }}>
            {/* MENSUAL */}
            <div style={{ background: 'white', border: '2px solid #eef1f4', borderRadius: 24, padding: '36px 32px', textAlign: 'left' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#88a8b0', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Mensual</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: '#1a2533', lineHeight: 1 }}>99<span style={{ fontSize: 22, fontWeight: 500, color: '#88a8b0' }}>€</span></div>
              <div style={{ fontSize: 13, color: '#88a8b0', marginBottom: 24 }}>por mes · sin permanencia</div>
              <hr style={{ border: 'none', borderTop: '1px solid #eef1f4', marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {['Mesas y zonas ilimitadas','Pedidos ilimitados','Carta QR','Pantalla de cocina','Empleados con PIN','Tickets y facturas','Reservas online','Informes completos','Integración Redsys','Soporte por email'].map(f=>(
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: '#f0f9f8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#2ab3aa', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/registro?plan=plan_monthly" style={{ display: 'block', width: '100%', padding: '13px', background: '#1a2533', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Empezar ahora →</a>
            </div>
            {/* ANUAL */}
            <div style={{ background: 'linear-gradient(145deg,#1a3d4f,#0f3d50)', border: '2px solid rgba(42,179,170,.2)', borderRadius: 24, padding: '36px 32px', textAlign: 'left', boxShadow: '0 30px 80px rgba(26,61,79,.25)' }}>
              <div style={{ display: 'inline-block', background: '#f59e0b', color: 'white', borderRadius: 8, padding: '3px 12px', fontSize: 11, fontWeight: 800, marginBottom: 16 }}>⭐ Ahorra 2 meses</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Anual</div>
              <div style={{ fontSize: 52, fontWeight: 800, color: 'white', lineHeight: 1 }}>990<span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,.4)' }}>€</span></div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>por año · 82.50€/mes</div>
              <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 24 }}>💰 Ahorras 198€ al año</div>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,.1)', marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {['Todo lo del plan mensual','Soporte prioritario','Onboarding personalizado','Formación del equipo','Actualizaciones prioritarias','Personalización de marca'].map(f=>(
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(42,179,170,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#2ab3aa', fontWeight: 700, flexShrink: 0 }}>✓</div>
                    <strong>{f}</strong>
                  </li>
                ))}
              </ul>
              <a href="/registro?plan=plan_yearly" style={{ display: 'block', width: '100%', padding: '13px', background: 'white', color: '#1a6478', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none', boxSizing: 'border-box' }}>Contratar anual →</a>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#88a8b0', marginTop: 20 }}>✓ Sin comisiones · ✓ Cancela cuando quieras · ✓ Sin hardware obligatorio</p>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ background: 'linear-gradient(135deg,#1a3d4f,#0f4a5c)', padding: '64px 24px', textAlign: 'center' }} id="contacto">
        <h2 style={{ fontSize: 'clamp(24px,3vw,40px)', fontWeight: 800, color: 'white', letterSpacing: -1.5, marginBottom: 12 }}>Mantente informado</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,.55)', marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>Novedades de Servix, consejos para restaurantes y ofertas exclusivas.</p>
        {subscribed ? (
          <div style={{ background: 'rgba(42,179,170,.15)', border: '1px solid rgba(42,179,170,.3)', borderRadius: 14, padding: '14px 28px', display: 'inline-block', color: '#2ab3aa', fontWeight: 700 }}>
            ✅ ¡Suscrito! Gracias por unirte.
          </div>
        ) : (
          <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: 10, maxWidth: 460, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
              style={{ flex: 1, minWidth: 220, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 14, outline: 'none' }} />
            <button type="submit" disabled={subscribing} style={{ padding: '12px 22px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {subscribing ? '⏳' : 'Suscribirme →'}
            </button>
          </form>
        )}
      </section>

      <Footer />
</>
  )
}
