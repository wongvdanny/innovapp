import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ComoFunciona from '../components/ComoFunciona'
import VozDemo, { VOZ_DEMO_TEL, VOZ_DEMO_TEL_VISIBLE } from '../components/VozDemo'

const PROPUESTA_URL = 'https://wa.me/34641399645'
const PDF_URL = '/pdf/innovapp-agentes-voz.pdf'

const COMO_FUNCIONA_INTRO =
  'Sigues usando tu número de siempre: solo desvías a tu agente las llamadas que no puedes coger.'

const COMO_FUNCIONA_STEPS = [
  { title: 'Entra una llamada', description: 'Un cliente llama a tu número de siempre, el que ya conoce.' },
  { title: 'No contestas', description: 'Estás ocupado, con otro cliente o fuera de horario: tu móvil desvía la llamada.' },
  { title: 'Atiende el agente', description: 'Se presenta como asistente virtual y responde con la información real de tu negocio.' },
  { title: 'Cita o recado', description: 'Agenda la cita con disponibilidad real, toma el recado o programa una llamada de vuelta.' },
  { title: 'Te avisa', description: 'Tienes la transcripción y el resumen de la llamada en tu panel.' },
]

const PLANES = [
  { nombre: 'Voz Básico', precio: '+49 €', minutos: '120 min/mes' },
  { nombre: 'Voz Plus', precio: '+79 €', minutos: '220 min/mes', destacado: true },
  { nombre: 'Voz Pro', precio: '+119 €', minutos: '350 min/mes' },
]

const botonPrincipal = { display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }
const botonSecundario = { display: 'inline-block', padding: '15px 32px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.15)', color: 'white', fontWeight: 600, fontSize: 15, textDecoration: 'none' }

export default function AgentesVozPage() {
  return (
    <>
      <Seo
        title="Agentes de voz con IA — Tu negocio atiende el teléfono | innovapp"
        description="Si no puedes coger una llamada, la atiende tu agente de IA con voz natural: informa, agenda citas, toma recados y te deja un resumen. Desde +49 €/mes. Llama y pruébalo: +34 984 276 259."
        canonical="/agentes-voz"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: 'Agentes de voz',
          serviceType: 'Agente de IA por teléfono para negocios',
          description:
            'Un agente de IA que atiende las llamadas que no puedes coger: informa, agenda citas, toma recados y deja la transcripción y un resumen en tu panel.',
          url: 'https://innovapp.es/agentes-voz',
          image: 'https://innovapp.es/brand/og-image.png',
          provider: { '@type': 'Organization', name: 'innovapp', url: 'https://innovapp.es' },
          areaServed: 'ES',
        }}
      />

      <Nav />

      <section style={{ background: '#12141a', padding: '150px 24px 90px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <img src="/agentes-ia-logo.svg" alt="Agentes IA" width={40} height={40} />
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ece9e2' }}>Agentes de <span style={{ color: '#e8a33d' }}>voz</span></div>
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', margin: '0 0 20px', lineHeight: 1.15 }}>
            Ninguna llamada <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>sin atender</span>
          </h1>
          <p style={{ fontSize: 17, color: '#97a0ac', maxWidth: 600, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Cuando no puedes coger el teléfono, tu agente de IA atiende con una voz natural: informa, agenda citas, toma recados y te deja un resumen. Sigues usando tu número de siempre.
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href={`tel:${VOZ_DEMO_TEL}`} data-cta="llamada-voz-demo" style={botonPrincipal}>
              📞 Llama a nuestro agente: {VOZ_DEMO_TEL_VISIBLE}
            </a>
            <a href={PROPUESTA_URL} target="_blank" rel="noopener noreferrer" style={botonSecundario}>
              Pedir propuesta
            </a>
          </div>
        </div>
      </section>

      <VozDemo tema="claro" enlacePlanes={false} />

      <ComoFunciona intro={COMO_FUNCIONA_INTRO} steps={COMO_FUNCIONA_STEPS} />

      <section id="planes" style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 14, color: '#1a140d' }}>
              Planes de voz
            </h2>
            <p style={{ fontSize: 16, color: '#8a7a5a', maxWidth: 520, margin: '0 auto' }}>
              Se añade a tu plan de agente de WhatsApp.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 20 }}>
            {PLANES.map(plan => (
              <div
                key={plan.nombre}
                style={{ background: plan.destacado ? '#12141a' : '#faf8f4', border: `1px solid ${plan.destacado ? '#12141a' : '#f1ece0'}`, borderRadius: 20, padding: '32px 28px', textAlign: 'center' }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, color: plan.destacado ? '#e8a33d' : '#1a140d', marginBottom: 14 }}>{plan.nombre}</div>
                <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1, color: plan.destacado ? '#ece9e2' : '#1a140d' }}>
                  {plan.precio}<span style={{ fontSize: 15, fontWeight: 500, color: plan.destacado ? '#97a0ac' : '#8a7a5a' }}>/mes</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: plan.destacado ? '#97a0ac' : '#8a7a5a', marginTop: 8 }}>{plan.minutos}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 14, color: '#8a7a5a', textAlign: 'center', lineHeight: 1.8, margin: '28px auto 0', maxWidth: 640 }}>
            Minuto adicional: 0,30 €. Alta: 119 €. Precios sin IVA, sin permanencia.
          </p>
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#12141a', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#ece9e2' }}>
          Compruébalo tú mismo
        </h2>
        <p style={{ fontSize: 16, color: '#97a0ac', maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
          Llama a nuestro agente y pregúntale lo que quieras sobre Innovapp. Si te convence, te preparamos una propuesta para tu negocio.
        </p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={`tel:${VOZ_DEMO_TEL}`} data-cta="llamada-voz-demo" style={botonPrincipal}>
            📞 Llama a nuestro agente: {VOZ_DEMO_TEL_VISIBLE}
          </a>
          <a href={PROPUESTA_URL} target="_blank" rel="noopener noreferrer" style={botonSecundario}>
            Pedir propuesta
          </a>
          <a href={PDF_URL} target="_blank" rel="noopener noreferrer" style={botonSecundario}>
            Descargar PDF
          </a>
        </div>
      </section>

      <Footer />
    </>
  )
}
