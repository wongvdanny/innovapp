import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ChatDemo from '../components/ChatDemo'
import ComoFunciona from '../components/ComoFunciona'
import VozDemo from '../components/VozDemo'
import Faq, { faqJsonLd, type FaqItem } from '../components/Faq'
import { waLink } from '../lib/constants'

const FAQ: FaqItem[] = [
  {
    pregunta: "¿Qué puede hacer la IA en mi tienda WooCommerce?",
    respuesta:
      "Atiende el WhatsApp de tu tienda las 24 horas con datos reales de tu catálogo de WooCommerce (stock, precio y variantes), ayuda a elegir producto, informa del estado de los pedidos, prepara el carrito y envía un enlace de pago con acceso automático. Cuando un caso necesita a una persona, como una devolución o una incidencia, pasa la conversación a tu equipo.",
  },
  {
    pregunta: "¿Con qué versiones de WooCommerce funciona?",
    respuesta:
      "Con las versiones actuales de WooCommerce y WordPress. Si tu tienda va con versiones antiguas de WooCommerce, WordPress o PHP, te ayudamos a actualizarla antes de conectar el agente.",
  },
  {
    pregunta: "¿Necesito un número de WhatsApp nuevo?",
    respuesta:
      "El agente atiende desde un número de WhatsApp Business dedicado que te asignamos. Tu número de contacto actual sigue funcionando igual para lo que ya haces con él.",
  },
  {
    pregunta: "¿Tengo que duplicar el catálogo o el stock?",
    respuesta:
      "No. El agente consulta tu WooCommerce en tiempo real: mismos productos, mismos precios y mismo stock, sin mantener nada por duplicado.",
  },
  {
    pregunta: "¿Cómo pagan los clientes?",
    respuesta:
      "El agente genera un enlace de pago con acceso automático para que el cliente complete la compra en tu tienda sin tener que buscar el producto ni escribir su contraseña. Es compatible con Stripe y Redsys.",
  },
  {
    pregunta: "¿Cuánto cuesta?",
    respuesta:
      "Hay dos planes: Starter, desde 109 € al mes con alta desde 339 € y hasta 500 conversaciones al mes (consultas de catálogo), y Growth, desde 149 € al mes con alta desde 499 € y hasta 800 conversaciones al mes (venta guiada hasta el pago y revisión mensual). Precios sin IVA y sin permanencia.",
  },
]

// Precios oficiales e-commerce (sin IVA, sin permanencia). Mismos datos en content/verified-facts.md.
const PLANES = [
  { nombre: 'Starter', para: 'Consultas de catálogo', mes: 109, alta: 339, incluye: ['Hasta 500 conversaciones/mes', 'Consultas de catálogo: stock, precio y variantes'] },
  { nombre: 'Growth', para: 'Venta guiada hasta el pago', mes: 149, alta: 499, destacado: true, incluye: ['Hasta 800 conversaciones/mes', 'Venta guiada hasta el pago: carrito y enlace de pago', 'Revisión mensual'] },
]

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
  const mensajeContacto = 'Hola! Quiero información sobre Agentes Innovapp para mi tienda WooCommerce.'
  const mensajeDemo = 'Hola, quiero ver una demo del agente para WooCommerce'

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
    ['🌙', 'Atención al cliente 24/7', 'Responde al momento, a cualquier hora y también en festivos, con la información real de tu tienda. Si el caso necesita a una persona, lo pasa a tu equipo.'],
    ['🎯', 'Recomendación de productos', 'Pregunta lo necesario para entender qué busca el cliente y le propone productos de tu catálogo que encajan, con su precio y disponibilidad.'],
    ['🔍', 'Búsqueda inteligente', 'El cliente describe lo que quiere con sus palabras, sin saber el nombre exacto, y el agente lo encuentra en tu catálogo de WooCommerce con sus variantes y stock.'],
    ['📦', 'Estado de pedidos por WhatsApp', 'Si el cliente pregunta "¿dónde está mi pedido?", el agente consulta su pedido real en WooCommerce y responde con el estado al momento.'],
    ['🛒', 'Carrito y enlace de pago', 'El agente arma el carrito con lo que pide el cliente y genera un enlace de pago listo para completar la compra, sin que tenga que buscar nada en la web.'],
  ]

  return (
    <>
      <Seo
        title="IA para WooCommerce | Chatbot y agentes IA para tu tienda – Innovapp"
        description="IA para WooCommerce: un agente que atiende el WhatsApp de tu tienda 24/7 con tu catálogo real, recomienda productos, informa del estado de los pedidos y envía el enlace de pago. Desde 109 €/mes."
        canonical="/agentes-ia-woocommerce"
        jsonLd={[{
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
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'EUR',
            lowPrice: 109,
            highPrice: 149,
            offerCount: PLANES.length,
            offers: PLANES.map((p) => ({
              '@type': 'Offer',
              name: p.nombre,
              priceCurrency: 'EUR',
              priceSpecification: { '@type': 'UnitPriceSpecification', price: p.mes, priceCurrency: 'EUR', unitText: 'MONTH', valueAddedTaxIncluded: false },
              description: `Desde ${p.mes} €/mes sin IVA, alta desde ${p.alta} €. ${p.incluye.join('. ')}.`,
            })),
          },
        }, faqJsonLd(FAQ)]}
      />

      <Nav />

      <section style={{ background: '#12141a', padding: '150px 24px 90px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 300 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(232,163,61,.12)', border: '1px solid rgba(232,163,61,.25)', borderRadius: 100, padding: '6px 18px', marginBottom: 24 }}>
              <span style={{ color: '#e8a33d', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Integración con WooCommerce</span>
            </div>
            <h1 style={{ fontSize: 'clamp(28px,4.5vw,50px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', maxWidth: 580, margin: '0 0 20px', lineHeight: 1.15 }}>
              IA para WooCommerce: <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>un agente que atiende y vende por WhatsApp</span>
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
                href={waLink(mensajeContacto)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
              >
                Contáctanos para tu cotización →
              </a>
            </div>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
            <ChatDemo nombre="Tienda Demo WooCommerce" conversacion={CONVERSACION_WOOCOMMERCE} />
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px 40px', background: 'white' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 20, color: '#1a140d' }}>
            Qué hace la IA para WooCommerce de Innovapp
          </h2>
          <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.8, margin: '0 0 14px' }}>
            Es un agente de inteligencia artificial conectado a tu tienda WooCommerce que atiende a tus clientes por WhatsApp.
            Consulta tu catálogo real (stock, precio y variantes) y el estado de los pedidos, ayuda a elegir producto,
            prepara el carrito y envía el enlace de pago, todo dentro de la conversación.
          </p>
          <p style={{ fontSize: 15, color: '#8a7a5a', lineHeight: 1.8, margin: 0 }}>
            No es un chatbot de menús: entiende lo que el cliente escribe con sus propias palabras. Y cuando un caso necesita
            a una persona, como una devolución o una incidencia, pasa la conversación a tu equipo.
          </p>
        </div>
      </section>

      <ComoFunciona intro={COMO_FUNCIONA_INTRO} steps={COMO_FUNCIONA_STEPS} />

      <VozDemo variante="ecommerce" />

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              Casos de uso de la IA en WooCommerce
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 560, margin: '0 auto' }}>
              Nada de promesas: esto es lo que el agente hace hoy con el catálogo real de tu tienda.
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
              Cómo se instala en tu WooCommerce
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

      <section style={{ padding: '90px 24px', background: '#faf8f4' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: 20 }}>
          <div style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 30 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a140d', margin: '0 0 6px' }}>Compatibilidad de versiones</h2>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#c98826', marginBottom: 12 }}>WooCommerce y WordPress actualizados</div>
            <p style={{ fontSize: 14, color: '#8a7a5a', lineHeight: 1.7, margin: '0 0 16px' }}>Se conecta a tu tienda WooCommerce y añade un plugin ligero de WordPress para el enlace de pago con acceso automático. Pagos compatibles con Stripe y Redsys.</p>
            <p style={{ fontSize: 14, color: '#4a3f2e', lineHeight: 1.7, margin: 0 }}>
              ¿WooCommerce, WordPress o PHP desactualizados?{' '}
              <Link href="/desarrollo-prestashop-woocommerce" style={{ color: '#c98826', fontWeight: 700, textDecoration: 'underline' }}>
                Te actualizamos la tienda primero →
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section id="precios" style={{ padding: '90px 24px', background: '#12141a' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 40, color: '#ece9e2', textAlign: 'center' }}>
            Precios
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            {PLANES.map((p) => (
              <div key={p.nombre} style={{ background: 'rgba(255,255,255,.04)', border: `1.5px solid ${p.destacado ? '#e8a33d' : 'rgba(255,255,255,.1)'}`, borderRadius: 18, padding: 30 }}>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#ece9e2', margin: '0 0 4px' }}>{p.nombre}</h3>
                <div style={{ fontSize: 14, color: '#97a0ac', marginBottom: 14 }}>{p.para}</div>
                <div style={{ fontSize: 14, color: '#97a0ac' }}>desde</div>
                <div style={{ fontSize: 42, fontWeight: 700, color: '#e8a33d', letterSpacing: -1, lineHeight: 1.1 }}>
                  {p.mes} €<span style={{ fontSize: 16, fontWeight: 500, color: '#97a0ac' }}> /mes</span>
                </div>
                <div style={{ fontSize: 14, color: '#ece9e2', margin: '6px 0 16px' }}>Alta desde {p.alta} €</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: '#c9cdd4', lineHeight: 1.8 }}>
                  {p.incluye.map((i) => <li key={i}>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '22px 26px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#ece9e2', margin: '0 0 8px' }}>
              Extra: <Link href="/agentes-voz" style={{ color: '#e8a33d', textDecoration: 'underline' }}>agente de voz</Link> para las llamadas que no coges
            </h3>
            <p style={{ fontSize: 14, color: '#c9cdd4', lineHeight: 1.8, margin: 0 }}>
              Básico 120 min +49 €/mes · Plus 220 min +79 €/mes · Pro 350 min +119 €/mes. Minuto adicional 0,30 €. Alta de voz +119 €.
            </p>
          </div>
          <p style={{ fontSize: 12, color: '#97a0ac', lineHeight: 1.7, margin: '20px 0 0', textAlign: 'center' }}>
            Precios sin IVA. Sin permanencia. Mensajes de WhatsApp de Meta incluidos hasta el volumen del plan; por encima, y en campañas de marketing, se facturan aparte a coste de Meta.
          </p>
        </div>
      </section>

      <Faq items={FAQ} titulo="Preguntas frecuentes sobre la IA para WooCommerce" />

      <section style={{ padding: '90px 24px', background: '#12141a', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#ece9e2' }}>
          Prueba el agente en acción
        </h2>
        <p style={{ fontSize: 16, color: '#97a0ac', maxWidth: 520, margin: '0 auto 40px' }}>
          Te enseñamos el agente funcionando en una conversación real por WhatsApp.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={waLink(mensajeDemo)}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Habla con nuestro agente y ve la demo →
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
        <p style={{ fontSize: 13, color: '#97a0ac', marginTop: 10 }}>
          ¿Necesitas actualizar la tienda o un plugin a medida?{' '}
          <Link href="/desarrollo-prestashop-woocommerce" style={{ color: '#e8a33d', fontWeight: 700, textDecoration: 'underline' }}>
            Desarrollo y actualización de PrestaShop y WooCommerce →
          </Link>
        </p>
      </section>

      <Footer />
    </>
  )
}
