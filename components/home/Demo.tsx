import ChatDemo from '../ChatDemo'
import VozDemo from '../VozDemo'
import { WHATSAPP_AGENT_NUMBER } from '../WhatsAppBubble'

const MENSAJE_AGENTES_WHATSAPP = encodeURIComponent('Hola! Quiero información sobre Agentes IA para mi negocio.')

// #demo: los dos bloques de prueba que ya tenía la home (chat de WhatsApp y llamada al
// agente de voz). VozDemo lleva su propio id="agentes-voz".
export default function Demo() {
  return (
    <>
      <section id="demo" style={{ background: '#12141a', padding: 'clamp(56px,10vw,90px) 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 'min(100%,300px)' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(232,163,61,.12)', border: '1px solid rgba(232,163,61,.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
              <span style={{ color: '#e8a33d', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Prueba el agente</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', margin: '0 0 18px', lineHeight: 1.15 }}>
              Un agente de IA que atiende tu WhatsApp <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>día y noche</span>
            </h2>
            <p style={{ fontSize: 16, color: '#b4bcc6', maxWidth: 480, margin: '0 0 28px', lineHeight: 1.7 }}>
              Para peluquerías, clínicas, inmobiliarias, gimnasios, talleres, veterinarias y cualquier negocio local: responde dudas, gestiona citas sin dobles reservas y atiende 24 horas, sin que tú tengas que estar detrás del móvil.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_AGENT_NUMBER}?text=${MENSAJE_AGENTES_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '15px 28px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 16 }}
            >
              Habla con nuestro agente →
            </a>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', justifyContent: 'center' }}>
            <ChatDemo />
          </div>
        </div>
      </section>
      <VozDemo tema="claro" />
    </>
  )
}
