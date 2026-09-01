import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ChatDemo from '../components/ChatDemo'
import ComoFunciona from '../components/ComoFunciona'
import { WHATSAPP_DEMO_ECOMMERCE_NUMBER } from '../components/WhatsAppBubble'

const COMO_FUNCIONA_INTRO =
  'Integrado con tu tienda WooCommerce, respondiendo con datos reales de producto y pedido desde tu propio WordPress.'

const COMO_FUNCIONA_STEPS = [
  {
    title: 'El cliente pregunta por WhatsApp',
    description: 'Sobre un producto, el estado de su pedido, o disponibilidad.',
  },
  {
    title: 'El agente consulta tu tienda WooCommerce en tiempo real',
    description: 'Stock, precio, variaciones y estado del pedido, sin salir de WhatsApp.',
  },
  {
    title: 'Ayuda a elegir o resuelve la duda al momento',
    description: 'Conversación natural, sin formularios ni esperas.',
  },
  {
    // Nota: el original pedía "Detecta carritos abandonados y los recupera" -- esa
    // función no existe en la integración real (sin cron ni modelo de carrito en el
    // agente), así que este paso describe lo que sí ocurre hoy: cliente y agente arman
    // el carrito y el enlace de pago en la misma conversación.
    title: 'Prepara el carrito y el enlace de pago',
    description: 'En la misma conversación, sin que el cliente tenga que ir a la web ni repetir lo que quiere.',
  },
  {
    title: 'Cierra la venta o escala a una persona',
    description: 'Casos de devoluciones o incidencias pasan a atención humana automáticamente.',
  },
]

const CONVERSACION_WOOCOMMERCE = [
  { rol: 'cliente' as const, texto: 'Hola! Tenéis la zapatilla Runner Pro en talla 42?' },
  { rol: 'agente' as const, texto: '¡Hola! 👋 Sí, tenemos la Runner Pro en talla 42, color negro, 79,90€. ¿Te la añado al carrito?' },
  { rol: 'cliente' as const, texto: 'Sí, añádela' },
  { rol: 'agente' as const, texto: 'Hecho ✅ Aquí tienes tu enlace para completar el pago: innovapp.es/pay/8f21a → válido 30 min' },
]

export default function AgentesIaWoocommercePage() {
  const mensajeDemo = encodeURIComponent('Hola! Quiero ver la demo del agente de IA para mi tienda WooCommerce.')

  const pasos = [
    ['1', 'Instala el plugin en WordPress', 'Se instala como cualquier otro plugin desde tu panel de WordPress, en unos minutos.'],
    ['2', 'Te asignamos un WhatsApp Business dedicado al agente', 'Tu número de contacto actual sigue funcionando igual para lo que ya haces con él.'],
    ['3', 'El agente ya conoce tu tienda', 'Catálogo, precios, stock y pedidos de WooCommerce quedan disponibles para el agente desde el primer momento.'],
    ['4', 'Listo, ya vendes por WhatsApp', 'Tus clientes preguntan y compran directamente en la conversación, 24 horas al día.'],
  ]

  const beneficios = [
    ['✅', 'Cero mensajes sin responder', 'El agente contesta al instante, a cualquier hora — ningún cliente se queda esperando ni se va a la competencia por falta de respuesta.'],
    ['🛒', 'Menos carritos abandonados', 'Buscar el producto y generar el enlace de pago ocurre en la misma conversación: el cliente completa la compra sin fricción, sin salir de WhatsApp ni perder el hilo.'],
    ['🌙', 'Vende mientras duermes', 'Preguntas, búsquedas y pedidos se atienden 24 horas al día, findes y festivos incluidos, sin que tengas que estar detrás del móvil.'],
    ['🔌', 'Sin duplicar catálogo ni stock', 'El agente consulta tu WooCommerce en tiempo real — mismos precios, mismo stock, sin mantener nada por duplicado.'],
  ]

  const casos = [
    ['🔍', 'Búsqueda de productos por WhatsApp', 'El cliente pregunta por un producto en lenguaje natural y el agente consulta tu catálogo real de WooCommerce — precio, stock y variantes incluidos.'],
    ['🛒', 'Carrito y enlace de pago sin salir de WhatsApp', 'El agente arma el carrito con lo que pide el cliente y genera un enlace de pago listo para completar la compra, sin que tenga que buscar nada en la web.'],
    ['📦', 'Estado del pedido bajo petición', 'Si el cliente pregunta "¿dónde está mi pedido?", el agente consulta su pedido real en WooCommerce y responde con el estado al momento.'],
  ]

  return (
    <>
      <Seo
        title="Agente de IA por WhatsApp para WooCommerce | Innovapp"
        description="Integra un agente de IA con tu tienda WooCommerce: atiende WhatsApp 24/7, busca productos en tu catálogo real, arma el carrito y envía el enlace de pago. Pide tu demo gratuita."
        canonical="/agentes-ia-woocommerce"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Agente de IA por WhatsApp para WooCommerce',
          serviceType: 'Integración de agente de IA por WhatsApp con tiendas WooCommerce',
          description:
            'Un agente de IA que atiende el WhatsApp de tu tienda WooCommerce: busca productos, arma el carrito y envía el enlace de pago, 24 horas al día.',
          url: 'https://innovapp.es/agentes-ia-woocommerce',
          image: 'https://innovapp.es/brand/og-image.png',
          provider: { '@type': 'Organization', name: 'innovapp', url: 'https://innovapp.es' },
          areaServed: 'ES',
          audience: { '@type': 'Audience', audienceType: 'Tiendas online con WooCommerce' },
        }}
      />

      <Nav />

      <section style={{ background: '#12141a', padding: '150px 24px 90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(232,163,61,.12)', border: '1px solid rgba(232,163,61,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
              <span style={{ color: '#e8a33d', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Integración con WooCommerce</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', maxWidth: 580, margin: '0 0 20px', lineHeight: 1.15 }}>
              Agente de IA por WhatsApp <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>para tu tienda WooCommerce</span>
            </h1>
            <p style={{ fontSize: 17, color: '#97a0ac', maxWidth: 480, margin: '0 0 12px', lineHeight: 1.7 }}>
              Atención automática 24/7 y ventas por WhatsApp sin que tu cliente tenga que salir de la conversación: el agente conoce tu catálogo real, arma el carrito y manda el enlace de pago.
            </p>
            <p style={{ fontSize: 13, color: '#8a7a5a', margin: '0 0 36px' }}>
              ¿Tu tienda es PrestaShop en vez de WooCommerce?{' '}
              <Link href="/agentes-ia-prestashop" style={{ color: '#e8a33d', fontWeight: 700, textDecoration: 'underline' }}>
                Mira la versión para PrestaShop →
              </Link>
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${WHATSAPP_DEMO_ECOMMERCE_NUMBER}?text=${mensajeDemo}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
              >
                Pide tu demo por WhatsApp →
              </a>
            </div>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
            <ChatDemo nombre="Tienda Demo WooCommerce" conversacion={CONVERSACION_WOOCOMMERCE} />
          </div>
        </div>
      </section>

      <ComoFunciona intro={COMO_FUNCIONA_INTRO} steps={COMO_FUNCIONA_STEPS} />

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              Lo que el agente ya hace hoy
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 560, margin: '0 auto' }}>
              Nada de promesas — esto es lo que la integración soporta ahora mismo con tu catálogo real.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {casos.map(([icon, title, desc]) => (
              <div key={title} style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 26 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#faf8f4' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              Cómo funciona la integración
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 520, margin: '0 auto' }}>
              Sin tocar código — pensado para el dueño de la tienda, no para su desarrollador.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
            {pasos.map(([n, title, desc]) => (
              <div key={title} style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: '#faf1de', color: '#c98826', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{n}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              Por qué compensa tenerlo conectado
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {beneficios.map(([icon, title, desc]) => (
              <div key={title} style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 26 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#12141a', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#ece9e2' }}>
          Prueba el agente en acción
        </h2>
        <p style={{ fontSize: 16, color: '#97a0ac', maxWidth: 520, margin: '0 auto 40px' }}>
          Te enseñamos el agente funcionando en una conversación real por WhatsApp.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={`https://wa.me/${WHATSAPP_DEMO_ECOMMERCE_NUMBER}?text=${mensajeDemo}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Pide tu demo por WhatsApp →
          </a>
          <Link href="/agentes-ia" style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}>
            Ver Agentes IA para cualquier negocio
          </Link>
        </div>
        <p style={{ fontSize: 13, color: '#97a0ac', marginTop: 20 }}>
          ¿Tu tienda es PrestaShop en vez de WooCommerce?{' '}
          <Link href="/agentes-ia-prestashop" style={{ color: '#e8a33d', fontWeight: 700, textDecoration: 'underline' }}>
            Mira la versión para PrestaShop →
          </Link>
        </p>
      </section>

      <Footer />
    </>
  )
}
