import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import Seo from '../Seo'
import Nav from '../Nav'
import Footer from '../Footer'
import ComoFunciona from '../ComoFunciona'
import Faq, { faqJsonLd } from '../Faq'
import Icono from '../Icono'
import DeviceFrame from '../DeviceFrame'
import ConversacionWhatsApp from './ConversacionWhatsApp'
import LeadForm from './LeadForm'
import { SECTORES, type Sector } from '../../data/sectores'
import { COMMERCIAL_PHONE, telLink, waLink } from '../../lib/constants'

// Plantilla de las landings sectoriales de Agentes IA (pages/agentes-ia-<slug>.tsx). Mismo
// patrón que /agentes-ia-restaurantes: hero oscuro con CTA de demo por WhatsApp, problemas,
// funciones, conversación de ejemplo, cómo funciona, FAQ (FAQPage), formulario de lead y CTA final.

const ANCLA_FORMULARIO = 'contacto-sector'

const PASOS = [
  { title: 'Conectamos tu WhatsApp', description: 'Conectamos el WhatsApp Business de tu negocio: tus clientes siguen escribiendo al número de siempre.' },
  { title: 'Configuramos tu agenda y servicios', description: 'Cargamos tus servicios, horarios y huecos, y lo que el agente debe pasar a una persona.' },
  { title: 'El agente atiende', description: 'Contesta, da citas y envía los recordatorios. Tú lo ves todo en tu panel y entras cuando quieras.' },
]

const h2Claro: React.CSSProperties = { fontSize: 'clamp(26px,5vw,38px)', fontWeight: 700, letterSpacing: -1, lineHeight: 1.2, margin: '0 0 16px', color: '#1a140d' }

export default function SectorLanding({ slug }: { slug: Sector['slug'] }) {
  const s = SECTORES[slug]
  const ruta = `/agentes-ia-${s.slug}`
  const demo = waLink(s.mensajeWhatsApp)

  const ctas = (
    <div className="sl-ctas">
      <a href={demo} target="_blank" rel="noopener noreferrer" data-cta={`demo-${s.slug}`}
        style={{ padding: '16px 26px', borderRadius: 12, background: 'var(--agentes-oro)', color: '#12141a', fontWeight: 700, fontSize: 16, textAlign: 'center' }}>
        Pide una demo →
      </a>
      <a href={telLink()} data-cta="llamada-voz-demo"
        style={{ padding: '14px 22px', borderRadius: 12, background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)', color: '#ece9e2', fontWeight: 600, fontSize: 15, textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icono icono={Phone} size={18} />
        <span>Llámanos: te atiende nuestro agente de voz <span style={{ whiteSpace: 'nowrap' }}>({COMMERCIAL_PHONE})</span></span>
      </a>
    </div>
  )

  return (
    <>
      <Seo
        title={s.tituloSeo}
        description={s.metaDescription}
        canonical={ruta}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: `Agente de WhatsApp para ${s.nombre.toLowerCase()}`,
            serviceType: `Agente de IA por WhatsApp para ${s.nombre.toLowerCase()}: citas, recordatorios y atención al cliente`,
            description: s.metaDescription,
            url: `https://innovapp.es${ruta}`,
            image: `https://innovapp.es${s.imagen}`,
            provider: { '@type': 'Organization', name: 'innovapp', url: 'https://innovapp.es' },
            areaServed: { '@type': 'Country', name: 'España' },
          },
          faqJsonLd(s.faq),
        ]}
      />

      <Nav />

      <main>
        {/* Hero */}
        <section style={{ background: 'var(--agentes-fondo)', padding: 'clamp(110px,18vw,150px) 16px clamp(56px,10vw,90px)' }}>
          <div className="sl-hero">
            <div>
              <div style={{ display: 'inline-flex', background: 'rgba(var(--agentes-oro-rgb),.12)', border: '1px solid rgba(var(--agentes-oro-rgb),.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
                <span style={{ color: 'var(--agentes-oro)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Agentes IA · {s.nombre}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(30px,7vw,48px)', fontWeight: 600, letterSpacing: -1, color: '#ece9e2', margin: '0 0 18px', lineHeight: 1.15 }}>{s.h1}</h1>
              <p style={{ fontSize: 'clamp(16px,4vw,18px)', color: '#b4bcc6', margin: '0 0 30px', lineHeight: 1.65, maxWidth: 560 }}>{s.subtitulo}</p>
              {ctas}
            </div>
            <div className="sl-hero-img">
              <div style={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: 'var(--radio-lg)', overflow: 'hidden', background: '#1c1f27' }}>
                <Image src={s.imagen} alt={s.imagenAlt} fill priority sizes="(max-width: 900px) calc(100vw - 32px), 440px"
                  style={{ objectFit: 'cover' }} />
              </div>
              {s.imagenChat && (
                <div className="sl-hero-chat">
                  <DeviceFrame variante="movil" src={s.imagenChat.src} alt={s.imagenChat.alt} width={s.imagenChat.ancho} height={s.imagenChat.alto} sizes="200px" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Problemas */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, textAlign: 'center', marginBottom: 32 }}>¿Te suena?</h2>
            <div className="sl-grid">
              {s.problemas.map(p => (
                <div key={p.titulo} style={{ background: 'var(--agentes-crema)', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a140d', margin: '0 0 8px' }}>{p.titulo}</h3>
                  <p style={{ fontSize: 15, color: '#4a3f2e', lineHeight: 1.65, margin: 0 }}>{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Qué hace el agente */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--agentes-crema)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, textAlign: 'center', marginBottom: 32 }}>Qué hace el agente por ti</h2>
            <div className="sl-grid">
              {s.funciones.map(f => (
                <div key={f.titulo} style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: '#faf1de', color: 'var(--agentes-oro-texto)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icono icono={f.icono} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a140d', margin: '0 0 8px' }}>{f.titulo}</h3>
                  <p style={{ fontSize: 15, color: '#4a3f2e', lineHeight: 1.65, margin: 0 }}>{f.texto}</p>
                </div>
              ))}
            </div>
            {s.aviso && (
              <div role="note" style={{ maxWidth: 820, margin: '28px auto 0', background: 'white', borderLeft: '4px solid var(--agentes-oro-texto)', borderRadius: 12, padding: '20px 22px' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a140d', margin: '0 0 8px' }}>{s.aviso.titulo}</h3>
                <p style={{ fontSize: 15, color: '#4a3f2e', lineHeight: 1.7, margin: 0 }}>
                  {s.aviso.texto}{' '}
                  <Link href="/privacidad" style={{ color: 'var(--agentes-oro-texto)', fontWeight: 700, textDecoration: 'underline' }}>Política de privacidad</Link>.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Conversación de ejemplo */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'white' }}>
          <div className="sl-ejemplo">
            <div>
              <h2 style={h2Claro}>Así atiende a un cliente</h2>
              <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, margin: 0 }}>
                Un ejemplo de conversación por WhatsApp: el agente pregunta lo necesario, comprueba tu agenda y deja la cita apuntada. Tú no has tenido que tocar el móvil.
              </p>
            </div>
            <ConversacionWhatsApp nombre={s.nombreChat} mensajes={s.conversacion} etiqueta={`Ejemplo de conversación por WhatsApp con el agente de ${s.nombreChat}`} />
          </div>
        </section>

        {/* Cómo funciona */}
        <ComoFunciona intro="Cómo funciona: en tres pasos, tu negocio contesta solo." steps={PASOS} />

        {/* FAQ */}
        <Faq items={s.faq} titulo="Preguntas frecuentes" />

        {/* Formulario */}
        <section id={ANCLA_FORMULARIO} style={{ padding: 'var(--seccion-y) 16px', background: 'white', scrollMarginTop: 70 }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <h2 style={{ ...h2Claro, textAlign: 'center' }}>Quiero que me llaméis</h2>
            <p style={{ fontSize: 16, color: '#4a3f2e', lineHeight: 1.7, textAlign: 'center', margin: '0 0 28px' }}>
              Déjanos tus datos y te llamamos para enseñarte el agente y ver qué necesita tu {s.etiquetaNegocio.toLowerCase()}.
            </p>
            <div style={{ background: 'var(--agentes-crema)', border: '1px solid #f1ece0', borderRadius: 20, padding: 'clamp(20px,5vw,36px)', position: 'relative' }}>
              <LeadForm source={s.slug} etiquetaNegocio={s.etiquetaNegocio} />
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section style={{ padding: 'var(--seccion-y) 16px', background: 'var(--agentes-fondo)' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ ...h2Claro, color: '#ece9e2' }}>Pruébalo tú mismo</h2>
            <p style={{ fontSize: 16, color: '#b4bcc6', lineHeight: 1.7, margin: '0 0 28px' }}>
              Escríbenos por WhatsApp o llámanos: te atiende nuestro propio agente IA y te enseña cómo funcionaría en tu negocio.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>{ctas}</div>
            <p style={{ fontSize: 14, color: '#b4bcc6', margin: '24px 0 0' }}>
              ¿Otro tipo de negocio?{' '}
              <Link href="/agentes-ia#por-sector" style={{ color: 'var(--agentes-oro)', fontWeight: 700, textDecoration: 'underline' }}>Agentes IA por sector</Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />

      <style>{`
        .sl-hero { max-width: 1100px; margin: 0 auto; display: grid; gap: 36px; }
        .sl-ctas { display: flex; flex-direction: column; gap: 12px; }
        .sl-hero-img { position: relative; width: 100%; max-width: 440px; }
        /* Captura de chat: en móvil, debajo de la foto; en escritorio, sobre su esquina inferior */
        .sl-hero-chat { width: 170px; margin: 16px auto 0; }
        .sl-grid { display: grid; gap: 16px; }
        .sl-ejemplo { max-width: 1000px; margin: 0 auto; display: grid; gap: 32px; }
        @media (min-width: 600px) {
          .sl-ctas { flex-direction: row; flex-wrap: wrap; }
          .sl-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
        }
        @media (min-width: 900px) {
          .sl-hero { grid-template-columns: minmax(0,1.3fr) minmax(0,1fr); align-items: center; gap: 56px; }
          .sl-hero-chat { position: absolute; right: -12px; bottom: -36px; margin: 0; width: 190px; }
          .sl-ejemplo { grid-template-columns: 1fr 1fr; align-items: center; gap: 56px; }
        }
      `}</style>
    </>
  )
}
