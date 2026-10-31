import ChatDemo from '../ChatDemo'
import VozDemo from '../VozDemo'
import { COMMERCIAL_PHONE, telLink, waLink } from '../../lib/constants'

// #demo: los dos bloques de prueba que ya tenía la home (chat de WhatsApp y llamada al
// agente de voz). VozDemo lleva su propio id="agentes-voz".
export default function Demo() {
  return (
    <>
      <section id="demo" style={{ background: '#12141a', padding: 'clamp(56px,10vw,90px) 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 380px', minWidth: 'min(100%,300px)' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(var(--agentes-oro-rgb),.12)', border: '1px solid rgba(var(--agentes-oro-rgb),.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>
              <span style={{ color: 'var(--agentes-oro)', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>✦ Prueba el agente</span>
            </div>
            <h2 style={{ fontSize: 'clamp(26px,4.5vw,44px)', fontWeight: 500, letterSpacing: -1, color: '#ece9e2', margin: '0 0 18px', lineHeight: 1.15 }}>
              Un agente de IA que atiende tu WhatsApp <span style={{ fontStyle: 'italic', color: 'var(--agentes-oro)' }}>día y noche</span>
            </h2>
            <p style={{ fontSize: 16, color: '#b4bcc6', maxWidth: 480, margin: '0 0 28px', lineHeight: 1.7 }}>
              Para peluquerías, clínicas, inmobiliarias, gimnasios, talleres, veterinarias y cualquier negocio local: responde dudas, gestiona citas sin dobles reservas y atiende 24 horas, sin que tú tengas que estar detrás del móvil.
            </p>
            <a
              href={waLink('Hola! Quiero información sobre Agentes IA para mi negocio.')}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '15px 28px', borderRadius: 12, background: 'var(--agentes-oro)', color: '#12141a', fontWeight: 700, fontSize: 16 }}
            >
              Habla con nuestro agente →
            </a>
            <p style={{ fontSize: 15, color: '#b4bcc6', lineHeight: 1.6, margin: '18px 0 0' }}>
              Escríbenos o llámanos: te responde nuestro agente IA.{' '}
              <a href={telLink()} data-cta="llamada-voz-demo" style={{ color: 'var(--agentes-oro)', fontWeight: 700, whiteSpace: 'nowrap' }}>{COMMERCIAL_PHONE}</a>
            </p>
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
