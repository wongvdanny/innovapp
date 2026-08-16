import Head from 'next/head'
import { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const CONVERSACION = [
  { rol: 'cliente', texto: 'Hola! Tenéis hueco para un tinte esta semana?' },
  { rol: 'agente', texto: '¡Hola! 👋 Sí, tenemos hueco el jueves a las 17:00 o el viernes a las 11:00. ¿Cuál te viene mejor?' },
  { rol: 'cliente', texto: 'El jueves a las 17 perfecto' },
  { rol: 'agente', texto: 'Genial, te reservo tinte el jueves 17:00 ✅ ¿Me confirmas tu nombre?' },
]

function ChatDemo() {
  const [visibles, setVisibles] = useState(0)

  useEffect(() => {
    if (visibles >= CONVERSACION.length) return
    const t = setTimeout(() => setVisibles(v => v + 1), visibles === 0 ? 600 : 1300)
    return () => clearTimeout(t)
  }, [visibles])

  return (
    <div style={{ background: '#1c1f27', border: '1px solid #2e333f', borderRadius: 18, padding: 20, width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 300 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid #2e333f', marginBottom: 4 }}>
        <img src="/agentes-ia-logo.svg" alt="" width={22} height={22} />
        <div>
          <div style={{ fontSize: 14, color: '#ece9e2', fontWeight: 600 }}>Peluquería Demo</div>
          <div style={{ fontSize: 11, color: '#6fcf87' }}>en línea</div>
        </div>
      </div>
      {CONVERSACION.slice(0, visibles).map((m, i) => (
        <div key={i} style={{ alignSelf: m.rol === 'cliente' ? 'flex-start' : 'flex-end', maxWidth: '82%', background: m.rol === 'cliente' ? '#242832' : '#3a2f14', color: '#ece9e2', padding: '9px 13px', borderRadius: 10, fontSize: 13, lineHeight: 1.4 }}>
          {m.texto}
        </div>
      ))}
    </div>
  )
}

export default function AgentesIaPage() {
  const mensajeWhatsapp = encodeURIComponent('Hola! Quiero información sobre Agentes Innovapp para mi negocio.')

  return (
    <>
      <Head>
        <title>Agentes IA — Agente de IA por WhatsApp para tu negocio | innovapp</title>
        <meta name="description" content="Un agente de IA que atiende tu WhatsApp 24 horas: responde dudas, reserva citas y conoce tu negocio desde el primer día. Pide tu cotización personalizada." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Agentes IA — Agente de IA por WhatsApp" />
        <meta property="og:description" content="Responde, reserva citas y conoce tu negocio por WhatsApp, sin que tú tengas que estar ahí." />
        <meta property="og:url" content="https://innovapp.es/agentes-ia" />
        <meta property="og:image" content="https://innovapp.es/logo.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://innovapp.es/agentes-ia" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              name: 'Agentes IA',
              serviceType: 'Agente de IA por WhatsApp para negocios locales',
              provider: { '@type': 'Organization', name: 'innovapp', url: 'https://innovapp.es' },
              areaServed: 'ES',
            }),
          }}
        />
      </Head>

      <Nav />

      <section style={{ background: '#12141a', padding: '150px 24px 90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <img src="/agentes-ia-logo.svg" alt="Agentes IA" width={40} height={40} />
              <div style={{ fontSize: 22, fontWeight: 700, color: '#ece9e2' }}>Agentes <span style={{ color: '#e8a33d' }}>IA</span></div>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', maxWidth: 560, margin: '0 0 20px', lineHeight: 1.15 }}>
              Tu negocio, respondiendo por WhatsApp <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>día y noche</span>
            </h1>
            <p style={{ fontSize: 17, color: '#97a0ac', maxWidth: 460, margin: '0 0 36px', lineHeight: 1.7 }}>
              Un agente de IA que conoce tus servicios, tus precios y tu forma de hablar — responde dudas, reserva citas y avisa a tu equipo cuando hace falta una persona.
            </p>
            <a
              href={`https://wa.me/34644801943?text=${mensajeWhatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
            >
              Contáctanos para tu cotización →
            </a>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
            <ChatDemo />
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {[
            ['⚡', 'Responde al instante', 'Nada de esperar horas — el agente contesta en segundos, a cualquier hora del día.'],
            ['📅', 'Reserva citas solo', 'Entiende fechas relativas, consulta disponibilidad y confirma la reserva sin intervención.'],
            ['🧠', 'Conoce tu negocio', 'Servicios, precios, horarios y catálogo — todo cargado desde el primer día.'],
          ].map(([icon, title, desc]) => (
            <div key={String(title)} style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#3d2f1a', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#faf8f4', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
          ¿Vendes por WhatsApp? Podemos ir más lejos
        </h2>
        <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 520, margin: '0 auto 40px' }}>
          Si tienes tienda online, el agente también puede buscar clientes, guardar direcciones y generar el enlace de pago con el carrito ya listo.
        </p>
        <a
          href={`https://wa.me/34644801943?text=${mensajeWhatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#12141a', color: '#e8a33d', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
        >
          Contáctanos para tu cotización →
        </a>
      </section>

      <Footer />
    </>
  )
}
