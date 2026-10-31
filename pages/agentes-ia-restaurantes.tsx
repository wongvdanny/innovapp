import Link from 'next/link'
import Seo from '../components/Seo'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import ComoFunciona from '../components/ComoFunciona'
import Faq, { faqJsonLd, type FaqItem } from '../components/Faq'
import LeadForm from '../components/sector/LeadForm'
import { MENSAJE_DEMO_RESTAURANTE } from '../data/sectores'
import { COMMERCIAL_PHONE, LEGAL_ADDRESS_ES, waLink } from '../lib/constants'

// Demo: WhatsApp comercial (nuestro agente IA) con el mensaje de demo precargado. Es un enlace
// wa.me normal, así que lo ven el trigger de GTM por Click URL y el listener de lib/track.ts
// (click_whatsapp); data-cta distingue este botón del resto de enlaces de WhatsApp.
const DEMO_WHATSAPP = waLink(MENSAJE_DEMO_RESTAURANTE)
const ANCLA_FORMULARIO = 'contacto-restaurante'

const FAQ: FaqItem[] = [
  {
    pregunta: '¿Tengo que cambiar de número?',
    respuesta:
      'No. Conectamos el WhatsApp Business de vuestro restaurante: los clientes siguen escribiendo al número de siempre y el asistente contesta desde él.',
  },
  {
    pregunta: '¿Y si el asistente no sabe algo?',
    respuesta:
      'Lo pasa a una persona. No se inventa respuestas: si una pregunta no tiene respuesta en la información del restaurante, o es una queja, una alergia grave o un grupo grande, te avisa en el móvil y la conversación queda esperando a que contestes tú.',
  },
  {
    pregunta: '¿Puedo ver las conversaciones?',
    respuesta:
      'Sí, todas. En vuestro panel veis lo que ha escrito cada cliente y lo que ha contestado el asistente, y podéis entrar en cualquier conversación para seguirla vosotros.',
  },
  {
    pregunta: '¿Mis empleados necesitan instalar algo para fichar?',
    respuesta:
      'No. Fichan desde su propio WhatsApp, escribiendo como hablan: «ya estoy», «me voy a comer», «me voy». No tienen que instalar ninguna app.',
  },
  {
    pregunta: '¿Hay permanencia?',
    respuesta: 'Sin permanencia: puedes darte de baja cuando quieras con 30 días de preaviso.',
  },
]

const BLOQUES = [
  {
    icono: '📅',
    titulo: 'Reservas de mesa 24 h',
    texto:
      'Pide fecha, hora, personas y nombre, comprueba la disponibilidad y asigna la mesa (y junta mesas si hace falta). Si no hay sitio, ofrece otras horas. Tus clientes también cancelan o cambian la reserva por WhatsApp.',
  },
  {
    icono: '🍽️',
    titulo: 'Menú del día y alérgenos',
    texto:
      'Publicas el menú desde el móvil, para hoy o con antelación, y el asistente lo explica con los 14 alérgenos. Nunca inventa platos ni precios: solo cuenta lo que tú has publicado.',
  },
  {
    icono: '⏱️',
    titulo: 'Registro de jornada por WhatsApp',
    texto:
      'El equipo ficha con sus palabras («ya estoy», «me voy a comer»). Registro inalterable, informe mensual en PDF y Excel y enlace de solo lectura para la Inspección.',
  },
  {
    icono: '🙋',
    titulo: 'Tú decides cuándo intervenir',
    texto:
      'Quejas, alergias graves y grupos grandes pasan a una persona, con aviso en el móvil (app instalable). En el panel tienes todas las conversaciones.',
  },
]

type Mensaje = { de: 'cliente' | 'asistente'; texto: string; hora: string }

const CONVERSACION: Mensaje[] = [
  { de: 'cliente', texto: 'Hola, ¿tenéis mesa para 4 el sábado a las 21:00?', hora: '18:42' },
  { de: 'asistente', texto: '¡Hola! El sábado a las 21:00 estamos completos. Para 4 personas tengo mesa a las 20:30 o a las 21:30. ¿Te va bien alguna?', hora: '18:42' },
  { de: 'cliente', texto: 'Las 21:30 perfecto', hora: '18:43' },
  { de: 'asistente', texto: 'Genial. ¿A nombre de quién la reservo?', hora: '18:43' },
  { de: 'cliente', texto: 'Marta López', hora: '18:43' },
  { de: 'asistente', texto: '✅ Reserva confirmada: sábado a las 21:30, 4 personas, a nombre de Marta López. Si necesitas cambiarla o cancelarla, escríbenos por aquí.', hora: '18:43' },
]

const PASOS = [
  { title: 'Visita de 15 minutos', description: 'Vamos a tu restaurante (o hablamos por videollamada) y vemos mesas, turnos, menú y equipo.' },
  { title: 'Lo dejamos configurado', description: 'Cargamos tus mesas, horarios y menú, y conectamos vuestro WhatsApp Business.' },
  { title: 'Lo probáis y ajustamos', description: 'Hacéis reservas de prueba y fichajes, y afinamos lo que haga falta antes de abrirlo a los clientes.' },
]

const h2Claro: React.CSSProperties = { fontSize: 'clamp(26px,5vw,38px)', fontWeight: 700, letterSpacing: -1, lineHeight: 1.2, margin: '0 0 16px', color: '#1a140d' }

function ConversacionWhatsApp() {
  return (
    <div className="wa-movil" aria-label="Ejemplo de conversación por WhatsApp con el asistente de un restaurante" role="group">
      <div style={{ background: '#075e54', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden style={{ fontSize: 18 }}>‹</span>
        <div aria-hidden style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--agentes-oro)', color: '#12141a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>RD</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Restaurante Demo</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>en línea</div>
        </div>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: '14px 10px 18px', display: 'flex', flexDirection: 'column', gap: 8, background: '#efeae2' }}>
        <li aria-hidden style={{ alignSelf: 'center', background: '#fff', color: '#54656f', fontSize: 12, padding: '4px 10px', borderRadius: 8, marginBottom: 4 }}>HOY</li>
        {CONVERSACION.map((m, i) => {
          const cliente = m.de === 'cliente'
          return (
            <li key={i} style={{
              alignSelf: cliente ? 'flex-end' : 'flex-start', maxWidth: '84%',
              background: cliente ? '#d9fdd3' : '#ffffff', color: '#111b21',
              padding: '7px 10px 6px', borderRadius: 8, fontSize: 15, lineHeight: 1.4,
              borderTopRightRadius: cliente ? 2 : 8, borderTopLeftRadius: cliente ? 8 : 2,
              boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
            }}>
              <span className="sr-only">{cliente ? 'Cliente: ' : 'Asistente: '}</span>
              {m.texto}
              <span aria-hidden style={{ display: 'block', textAlign: 'right', fontSize: 11, color: '#54656f', marginTop: 2 }}>
                {m.hora}{cliente && <span style={{ color: '#53bdeb', marginLeft: 4 }}>✓✓</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default function AgentesIaRestaurantesPage() {
  const mensajeContacto = 'Hola! Quiero información sobre el asistente de WhatsApp para restaurantes.'

  return (
    <>
      <Seo
        title="Asistente de WhatsApp para restaurantes | Reservas, menú y fichaje | Innovapp"
        description="Un asistente en el WhatsApp de tu restaurante que reserva mesas 24 h, explica el menú del día con sus alérgenos y registra la jornada del equipo. Propuesta a medida tras una visita de 15 minutos."
        canonical="/agentes-ia-restaurantes"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': 'https://innovapp.es/#localbusiness',
            name: 'Innovapp',
            url: 'https://innovapp.es',
            image: 'https://innovapp.es/og-image.png',
            email: 'contacto@innovapp.es',
            telephone: COMMERCIAL_PHONE,
            address: {
              '@type': 'PostalAddress',
              streetAddress: LEGAL_ADDRESS_ES.split(',')[0],
              postalCode: '33660',
              addressLocality: 'Oviedo',
              addressRegion: 'Asturias',
              addressCountry: 'ES',
            },
            areaServed: 'ES',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Asistente de WhatsApp para restaurantes',
            serviceType: 'Asistente de IA por WhatsApp para reservas de mesa, menú del día y registro de jornada',
            description:
              'Un asistente en el WhatsApp del restaurante que reserva mesas 24 horas, informa del menú del día con sus 14 alérgenos y registra la jornada del equipo, con paso a una persona cuando hace falta.',
            url: 'https://innovapp.es/agentes-ia-restaurantes',
            image: 'https://innovapp.es/og-image.png',
            provider: { '@id': 'https://innovapp.es/#localbusiness' },
            areaServed: 'ES',
            audience: { '@type': 'Audience', audienceType: 'Restaurantes y bares' },
          },
          faqJsonLd(FAQ),
        ]}
      />

      <Nav />

      <main>
        {/* 1. Hero */}
        <section style={{ background: '#12141a', padding: 'clamp(110px,18vw,150px) 16px clamp(56px,10vw,90px)' }}>
          <div className="lr-hero">
            <div>
              <div style={{ display: 'inline-flex', background: 'rgba(var(--agentes-oro-rgb),.12)', border: '1px solid rgba(var(--agentes-oro-rgb),.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
                <span style={{ color: 'var(--agentes-oro)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Para restaurantes</span>
              </div>
              <h1 style={{ fontSize: 'clamp(30px,7vw,50px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', margin: '0 0 18px', lineHeight: 1.15 }}>
                Tu restaurante contesta WhatsApp <span style={{ fontStyle: 'italic', color: 'var(--agentes-oro)' }}>mientras tú estás en sala.</span>
              </h1>
              <p style={{ fontSize: 'clamp(16px,4vw,18px)', color: '#b4bcc6', margin: '0 0 30px', lineHeight: 1.65, maxWidth: 520 }}>
                Un asistente que reserva mesas, informa del menú del día y registra la jornada del equipo, en el WhatsApp de siempre, 24 h.
              </p>
              <div className="lr-ctas">
                <a href={DEMO_WHATSAPP} target="_blank" rel="noopener noreferrer" data-cta="demo-restaurante"
                  style={{ padding: '16px 26px', borderRadius: 12, background: 'var(--agentes-oro)', color: '#12141a', fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
                  Habla con nuestro agente y ve la demo →
                </a>
                <a href={`#${ANCLA_FORMULARIO}`}
                  style={{ padding: '16px 26px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)', color: '#ece9e2', fontWeight: 600, fontSize: 16, textAlign: 'center' }}>
                  Quiero que me llaméis
                </a>
              </div>
              <p style={{ fontSize: 13, color: '#97a0ac', margin: '14px 0 0' }}>Abre WhatsApp y te atiende nuestro agente IA: te enseña cómo funciona el asistente para restaurantes.</p>
            </div>
            <div className="lr-aviso" aria-hidden>
              <div style={{ fontSize: 12, color: '#97a0ac', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Mientras tanto, en tu móvil</div>
              <div style={{ background: '#1c1f27', border: '1px solid #2e333f', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 22 }}>📅</div>
                <div>
                  <div style={{ fontSize: 14, color: '#ece9e2', fontWeight: 600 }}>Nueva reserva</div>
                  <div style={{ fontSize: 13, color: '#b4bcc6', lineHeight: 1.5 }}>Sábado 21:30 · 4 personas · Marta López</div>
                </div>
              </div>
              <div style={{ background: '#1c1f27', border: '1px solid #2e333f', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, marginTop: 10 }}>
                <div style={{ fontSize: 22 }}>🙋</div>
                <div>
                  <div style={{ fontSize: 14, color: '#ece9e2', fontWeight: 600 }}>Te necesita una persona</div>
                  <div style={{ fontSize: 13, color: '#b4bcc6', lineHeight: 1.5 }}>Grupo de 14 para una comida de empresa</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Problema */}
        <section style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white' }}>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            <p style={{ fontSize: 'clamp(22px,5vw,32px)', fontWeight: 700, color: '#1a140d', lineHeight: 1.35, letterSpacing: -0.5, margin: 0 }}>
              Viernes, 21:30. Sala llena. Suena el teléfono, llega un WhatsApp y nadie puede contestar.{' '}
              <span style={{ color: '#8a5a12' }}>Ese cliente reserva en otro sitio.</span>
            </p>
          </div>
        </section>

        {/* 3. Cuatro bloques */}
        <section style={{ padding: 'clamp(56px,10vw,90px) 16px', background: '#faf8f4' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, textAlign: 'center', marginBottom: 36 }}>Qué hace por tu restaurante</h2>
            <div className="lr-grid">
              {BLOQUES.map(b => (
                <div key={b.titulo} style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }} aria-hidden>{b.icono}</div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a140d', margin: '0 0 8px' }}>{b.titulo}</h3>
                  <p style={{ fontSize: 15, color: '#4a3f2e', lineHeight: 1.65, margin: 0 }}>{b.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Conversación de ejemplo */}
        <section style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white' }}>
          <div className="lr-ejemplo">
            <div>
              <h2 style={h2Claro}>Así reserva un cliente un sábado completo</h2>
              <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, margin: '0 0 14px' }}>
                A las 21:00 no queda sitio para 4. En vez de un «lo siento», el asistente ofrece las horas que sí tiene libres, recoge el nombre y deja la mesa asignada.
              </p>
              <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, margin: 0 }}>
                Tú no has tocado el móvil, y la reserva ya está en tu panel.
              </p>
            </div>
            <ConversacionWhatsApp />
          </div>
        </section>

        {/* 5. Registro de jornada */}
        <section style={{ padding: 'clamp(56px,10vw,90px) 16px', background: '#12141a' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, color: '#ece9e2' }}>El registro de jornada, resuelto desde WhatsApp</h2>
            <p style={{ fontSize: 16, color: '#b4bcc6', lineHeight: 1.7, margin: '0 0 24px' }}>
              El registro de jornada es obligatorio desde 2019 (art. 34.9 del Estatuto de los Trabajadores). El Gobierno prepara un real decreto para que sea digital y consultable a distancia por la Inspección.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 12 }}>
              {[
                ['Fichan con sus palabras', '«Ya estoy», «me voy a comer», «me voy». Desde su WhatsApp, sin instalar nada.'],
                ['Registro inalterable', 'Los fichajes no se pueden borrar ni cambiar: las correcciones quedan anotadas aparte.'],
                ['Informe mensual en PDF y Excel', 'Por trabajador o de todo el equipo, listo para firmar y archivar.'],
                ['Enlace de solo lectura para la Inspección', 'Si os lo piden, compartís un acceso que solo permite consultar.'],
              ].map(([t, d]) => (
                <li key={t} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--agentes-oro)', marginBottom: 4 }}>{t}</div>
                  <div style={{ fontSize: 15, color: '#c9cdd4', lineHeight: 1.6 }}>{d}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. Así empezamos */}
        <ComoFunciona intro="Así empezamos: en pocos días tu restaurante contesta solo." steps={PASOS} />

        {/* 7. Propuesta (sin precios en esta página) */}
        <section id="propuesta" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white' }}>
          <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center', background: '#faf8f4', border: '1.5px solid var(--agentes-oro)', borderRadius: 20, padding: 'clamp(26px,6vw,40px)' }}>
            <h2 style={{ ...h2Claro, fontSize: 'clamp(22px,4vw,28px)', marginBottom: 22 }}>Propuesta a medida tras una visita de 15 minutos</h2>
            <a href={`#${ANCLA_FORMULARIO}`} style={{ display: 'inline-block', padding: '15px 28px', borderRadius: 12, background: '#12141a', color: 'var(--agentes-oro)', fontWeight: 700, fontSize: 16 }}>
              Pide tu visita →
            </a>
          </div>
        </section>

        {/* 8. FAQ */}
        <Faq items={FAQ} titulo="Preguntas frecuentes" />

        {/* 9. Formulario */}
        <section id={ANCLA_FORMULARIO} style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white', scrollMarginTop: 70 }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, textAlign: 'center' }}>Quiero que me llaméis</h2>
            <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, textAlign: 'center', margin: '0 0 28px' }}>
              Déjanos tus datos y te llamamos para concertar la visita de 15 minutos.
            </p>
            <div style={{ background: '#faf8f4', border: '1px solid #f1ece0', borderRadius: 20, padding: 'clamp(20px,5vw,36px)', position: 'relative' }}>
              <LeadForm source="restaurantes" etiquetaNegocio="Restaurante" />
            </div>
            <p style={{ fontSize: 14, color: '#4a3f2e', textAlign: 'center', margin: '20px 0 0' }}>
              ¿Prefieres escribir?{' '}
              <a href={waLink(mensajeContacto)} target="_blank" rel="noopener noreferrer" style={{ color: '#8a5a12', fontWeight: 700, textDecoration: 'underline' }}>
                Háblanos por WhatsApp
              </a>
              {' '}· <Link href="/agentes-ia" style={{ color: '#8a5a12', fontWeight: 700, textDecoration: 'underline' }}>Agentes IA para otros negocios</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        .lr-hero { max-width: 1100px; margin: 0 auto; display: grid; gap: 40px; }
        .lr-ctas { display: flex; flex-direction: column; gap: 12px; }
        .lr-aviso { display: none; }
        .lr-grid { display: grid; gap: 16px; }
        .lr-ejemplo { max-width: 1000px; margin: 0 auto; display: grid; gap: 32px; }
        .wa-movil { width: 100%; max-width: 380px; margin: 0 auto; border-radius: 22px; overflow: hidden; border: 6px solid #12141a; box-shadow: 0 10px 30px rgba(0,0,0,.15); }
        @media (min-width: 600px) {
          .lr-ctas { flex-direction: row; flex-wrap: wrap; }
          .lr-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
        @media (min-width: 900px) {
          .lr-hero { grid-template-columns: minmax(0,1.4fr) minmax(0,1fr); align-items: center; gap: 56px; }
          .lr-aviso { display: block; }
          .lr-ejemplo { grid-template-columns: 1fr 1fr; align-items: center; gap: 56px; }
        }
      `}</style>
    </>
  )
}
