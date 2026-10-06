import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ChatDemo from '../components/ChatDemo'
import ComoFunciona from '../components/ComoFunciona'
import VozDemo from '../components/VozDemo'
import { WHATSAPP_NUMBER } from '../components/WhatsAppBubble'
import { CONTACT_EMAIL } from '../lib/constants'

const COMO_FUNCIONA_INTRO =
  'Un agente que responde por WhatsApp como lo haría tu mejor empleado: conoce tu negocio, tus horarios y tus servicios, y actúa solo.'

const COMO_FUNCIONA_STEPS = [
  {
    title: 'El cliente escribe por WhatsApp',
    description: 'A cualquier hora, sin que nadie de tu equipo tenga que estar pendiente del móvil.',
  },
  {
    title: 'El agente entiende qué necesita',
    description: 'Pedir cita, preguntar precios, saber horarios, o resolver una duda sobre el servicio.',
  },
  {
    title: 'Consulta la información real de tu negocio',
    description: 'Horarios, disponibilidad y servicios configurados, no respuestas genéricas inventadas.',
  },
  {
    title: 'Agenda la cita o resuelve la duda al momento',
    description: 'Sin que el cliente tenga que esperar a que alguien le conteste.',
  },
  {
    title: 'Si la situación lo requiere, avisa a una persona',
    description: 'Casos complejos o reclamaciones pasan a modo humano automáticamente, sin que el cliente lo note.',
  },
]

// Sección "Cómo funciona" en lenguaje llano: qué hace Innovapp con el WhatsApp del negocio
// y con los datos de sus clientes. Debe coincidir con el apartado "Servicio de agentes de
// WhatsApp" de /privacidad.
const SERVICIO_PASOS = [
  {
    icon: '🔗',
    title: 'Conectamos tu propio número de WhatsApp Business',
    description:
      'Innovapp conecta el número de WhatsApp Business de tu negocio a nuestra plataforma (agentes.innovapp.es) mediante el registro oficial de Meta. El número sigue siendo tuyo y, si ya usas la app WhatsApp Business, puedes seguir usándola.',
  },
  {
    icon: '💬',
    title: 'Un asistente automático responde a tus clientes',
    description:
      'Contesta dudas, informa de productos, precios y disponibilidad, y reserva citas. Si tienes tienda en PrestaShop o WooCommerce, también ayuda a tus clientes con sus pedidos.',
  },
  {
    icon: '🖥️',
    title: 'Tú ves todo y puedes intervenir cuando quieras',
    description:
      'Todas las conversaciones de tu negocio están en un panel privado. En cualquier momento puedes tomar el control de una conversación y contestar tú, o apagar el asistente.',
  },
]

const SERVICIO_DATOS = [
  ['Qué datos usamos', 'Solo los mensajes que tus clientes intercambian con tu negocio, su número de teléfono y su nombre en WhatsApp, y el estado de entrega de los mensajes. Si conectas tu app WhatsApp Business y lo autorizas, también tus contactos y conversaciones anteriores con clientes.'],
  ['Para qué', 'Únicamente para responder a tus clientes en nombre de tu negocio y mostrarte las conversaciones en tu panel.'],
  ['Lo que no hacemos', 'No vendemos los datos, no los usamos para publicidad y no los usamos para entrenar modelos de inteligencia artificial.'],
  ['Cada negocio, lo suyo', 'Cada negocio solo ve sus propias conversaciones. Nadie más tiene acceso a ellas.'],
  ['Desconexión y borrado', `Puedes desconectar tu número cuando quieras y pedirnos que borremos tus datos y los de tus clientes escribiendo a ${CONTACT_EMAIL}.`],
]

export default function AgentesIaPage() {
  const mensajeWhatsapp = encodeURIComponent('Hola! Quiero información sobre Agentes Innovapp para mi negocio.')

  return (
    <>
      <Seo
        title="Agentes IA para WhatsApp Business — Innovapp"
        description="Innovapp conecta el WhatsApp Business de tu negocio a un agente de IA que atiende a tus clientes 24 horas: responde dudas, informa de precios y reserva citas."
        canonical="/agentes-ia"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Agentes IA',
          serviceType: 'Agente de IA por WhatsApp para negocios locales',
          description:
            'Innovapp conecta el WhatsApp Business de tu negocio a un agente de IA que atiende a tus clientes 24 horas: responde dudas, informa de precios y reserva citas.',
          url: 'https://innovapp.es/agentes-ia',
          image: 'https://innovapp.es/brand/og-image.png',
          provider: { '@type': 'Organization', name: 'Innovapp', url: 'https://innovapp.es' },
          areaServed: 'ES',
        }}
      />

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
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeWhatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
              >
                Contáctanos para tu cotización →
              </a>
            </div>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
            <ChatDemo />
          </div>
        </div>
      </section>

      <ComoFunciona intro={COMO_FUNCIONA_INTRO} steps={COMO_FUNCIONA_STEPS} />

      <section id="como-funciona-servicio" style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              Cómo funciona el servicio
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 600, margin: '0 auto' }}>
              Qué hace Innovapp con el WhatsApp de tu negocio y con los datos de tus clientes, explicado sin tecnicismos.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginBottom: 20 }}>
            {SERVICIO_PASOS.map((paso) => (
              <div key={paso.title} style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 26 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#faf1de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{paso.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', margin: '0 0 8px' }}>{paso.title}</h3>
                <p style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65, margin: 0 }}>{paso.description}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 'clamp(22px,3vw,32px)' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a140d', margin: '0 0 18px' }}>Cómo usamos los datos</h3>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '16px 28px', margin: 0 }}>
              {SERVICIO_DATOS.map(([titulo, texto]) => (
                <div key={titulo}>
                  <dt style={{ fontSize: 14, fontWeight: 700, color: '#1a140d', marginBottom: 4 }}>{titulo}</dt>
                  <dd style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65, margin: 0 }}>{texto}</dd>
                </div>
              ))}
            </dl>
            <p style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65, margin: '18px 0 0' }}>
              Más detalle en nuestra{' '}
              <Link href="/privacidad#agentes-whatsapp" style={{ color: '#c98826', fontWeight: 600 }}>Política de privacidad</Link>.
            </p>
          </div>
        </div>
      </section>

      <VozDemo />

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

      <section style={{ padding: '90px 24px', background: '#faf8f4' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
              ¿Para qué negocios funciona?
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 520, margin: '0 auto' }}>
              Si tu negocio vive de WhatsApp y de las citas o los pedidos, esto es para ti.
            </p>
          </div>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20 }}>
            {[
              ['💇', 'Peluquerías y salones de belleza', 'Reserva citas comprobando la disponibilidad real al momento — nunca se solapan dos clientes a la misma hora.'],
              ['💆', 'Clínicas y centros de estética', 'El mismo sistema de citas, y si además vendes productos relacionados, el agente también los vende por WhatsApp.'],
              ['🔧', 'Talleres y negocios con cita previa', 'Cualquier negocio que trabaje con cita previa puede automatizar la reserva sin perder el trato cercano.'],
              ['🛍️', 'Tiendas con catálogo online', 'El agente consulta productos, precios, stock y variantes reales, y completa el pedido sin salir de WhatsApp. Compatible con PrestaShop y WooCommerce.'],
              ['💬', 'Cualquier negocio con WhatsApp muy activo', 'Si te repiten las mismas preguntas todo el día, el agente se encarga y tu equipo se centra en lo que de verdad necesita a una persona.'],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 26 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: '#faf1de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 8 }}>{title}</div>
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
              Ventajas reales, no promesas
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 560, margin: '0 auto' }}>
              Todo lo de aquí abajo ya funciona hoy — no es una hoja de ruta.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 24 }}>
            {[
              ['🌙', 'Disponible 24 horas', 'Atiende a cualquier hora, findes y festivos incluidos. El cliente no nota que habla con una IA — hasta que hace falta que hable una persona.'],
              ['📆', 'Cero dobles reservas', 'Antes de prometer un horario, comprueba la disponibilidad real de tu agenda. Nunca ofrece un hueco que no existe ni pisa una cita ya confirmada.'],
              ['🛒', 'Compra completa sin salir de WhatsApp', 'El cliente elige el producto, la talla o el color, y paga sin cambiar de app. El agente consulta tu catálogo real — nunca inventa productos ni precios.'],
              ['🔗', 'Sin contraseñas ni registros', 'El enlace de pago lleva directo a pagar, sin que el cliente tenga que crearse ni recordar ninguna contraseña.'],
              ['🔌', 'Conectado a tu tienda de siempre', 'Funciona con PrestaShop y WooCommerce, los dos motores de tienda más usados. No duplica catálogo ni stock: consulta tu tienda en tiempo real.'],
              ['🙋', 'Sabe cuándo pasar a una persona', 'Reclamos, dudas delicadas o preguntas fuera de lo que conoce: avisa a tu equipo en vez de improvisar una respuesta.'],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} style={{ display: 'flex', gap: 16 }}>
                <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 12, background: '#faf1de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#faf8f4', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#1a140d' }}>
          ¿Vendes por WhatsApp? Podemos ir más lejos
        </h2>
        <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 520, margin: '0 auto 40px' }}>
          Si tienes tienda online en PrestaShop o WooCommerce, el agente también puede buscar tus clientes, identificar la variante exacta que quieren y generar el enlace de pago listo para pagar.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#12141a', color: '#e8a33d', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            Contáctanos para tu cotización →
          </a>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 40, color: '#1a140d' }}>
            ¿Qué motor usa tu tienda online?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            <Link href="/agentes-ia-prestashop" style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 32, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>🛍️</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a140d' }}>Integración con PrestaShop →</div>
            </Link>
            <Link href="/agentes-ia-woocommerce" style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 18, padding: 32, textDecoration: 'none', display: 'block' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>🛒</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1a140d' }}>Integración con WooCommerce →</div>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
