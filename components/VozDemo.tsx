import Link from 'next/link'

/** Número de demo del agente de voz de Innovapp (el propio agente, en ElevenLabs). */
export const VOZ_DEMO_TEL = '+34984276259'
export const VOZ_DEMO_TEL_VISIBLE = '+34 984 276 259'

const PUNTOS = [
  ['📲', 'Desvío desde tu móvil cuando no contestas'],
  ['📅', 'Citas con disponibilidad real'],
  ['📝', 'Recados y llamadas de vuelta'],
  ['📄', 'Transcripción y resumen en tu panel'],
]

const TEXTOS = {
  completa:
    'Si no puedes coger una llamada, la atiende tu agente de IA con una voz natural: informa, agenda citas, toma recados y te deja un resumen. Sigues usando tu número de siempre.',
  ecommerce:
    'Por teléfono el agente informa de productos, variantes, precios y stock. Los pedidos se cierran en la web o por WhatsApp.',
}

const TEMAS = {
  // Para colocarlo entre secciones claras (landings de Agentes IA).
  oscuro: { fondo: '#12141a', titulo: '#ece9e2', texto: '#97a0ac', tarjeta: '#1c1f27', borde: '#2e333f', punto: 'rgba(255,255,255,.04)' },
  // Para colocarlo entre secciones oscuras (home, hero de /agentes-voz).
  claro: { fondo: 'white', titulo: '#1a140d', texto: '#8a7a5a', tarjeta: '#12141a', borde: '#f1ece0', punto: '#faf8f4' },
}

type VozDemoProps = {
  variante?: keyof typeof TEXTOS
  tema?: keyof typeof TEMAS
  /** Enlace "Ver planes de voz" a /agentes-voz -- desactivarlo en la propia /agentes-voz. */
  enlacePlanes?: boolean
}

/**
 * Sección "Agentes de voz" con la llamada de demo. id="agentes-voz" es el ancla del aviso
 * de la home. Cada enlace tel: lleva data-cta="llamada-voz-demo" para medirlo en GTM.
 */
export default function VozDemo({ variante = 'completa', tema = 'oscuro', enlacePlanes = true }: VozDemoProps) {
  const c = TEMAS[tema]

  return (
    <section id="agentes-voz" style={{ padding: '90px 24px', background: c.fondo }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 56, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px', minWidth: 280 }}>
          <div style={{ display: 'inline-block', background: 'rgba(232,163,61,.12)', border: '1px solid rgba(232,163,61,.3)', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#e8a33d', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 18 }}>
            ✦ Nuevo
          </div>
          <h2 style={{ fontSize: 'clamp(26px,3.8vw,42px)', fontWeight: 600, letterSpacing: -1, lineHeight: 1.15, color: c.titulo, margin: '0 0 18px' }}>
            Tu negocio coge el teléfono, <span style={{ fontStyle: 'italic', color: '#e8a33d' }}>aunque tú no puedas</span>
          </h2>
          <p style={{ fontSize: 16, color: c.texto, lineHeight: 1.7, margin: '0 0 28px', maxWidth: 540 }}>
            {TEXTOS[variante]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
            {PUNTOS.map(([icono, texto]) => (
              <div key={texto} style={{ display: 'flex', alignItems: 'center', gap: 10, background: c.punto, border: `1px solid ${c.borde}`, borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ fontSize: 18 }}>{icono}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: c.titulo }}>{texto}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: '1 1 340px', minWidth: 280, background: c.tarjeta, border: `1px solid ${tema === 'oscuro' ? c.borde : '#12141a'}`, borderRadius: 20, padding: '32px 28px', textAlign: 'center' }}>
          <div className="voz-numero-grande" style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7480', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Llama y pruébalo</div>
            <a href={`tel:${VOZ_DEMO_TEL}`} data-cta="llamada-voz-demo" style={{ fontSize: 'clamp(28px,3vw,38px)', fontWeight: 700, letterSpacing: -0.5, color: '#ece9e2', textDecoration: 'none' }}>
              {VOZ_DEMO_TEL_VISIBLE}
            </a>
          </div>
          <a
            href={`tel:${VOZ_DEMO_TEL}`}
            data-cta="llamada-voz-demo"
            style={{ display: 'block', padding: '16px 22px', borderRadius: 12, background: '#e8a33d', color: '#12141a', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
          >
            📞 Llama a nuestro agente: {VOZ_DEMO_TEL_VISIBLE}
          </a>
          <p style={{ fontSize: 13, color: '#97a0ac', lineHeight: 1.6, margin: '14px 0 0' }}>
            Es nuestro propio agente de voz. Pregúntale lo que quieras sobre Innovapp.
          </p>
          <p style={{ fontSize: 12, color: '#6b7480', margin: '10px 0 0' }}>El agente se presenta como asistente virtual.</p>
          {enlacePlanes && (
            <Link href="/agentes-voz" style={{ display: 'inline-block', marginTop: 18, fontSize: 14, fontWeight: 700, color: '#e8a33d', textDecoration: 'none' }}>
              Ver planes de voz →
            </Link>
          )}
        </div>
      </div>
      <style>{`
        @media(max-width: 768px) { .voz-numero-grande { display: none; } }
      `}</style>
    </section>
  )
}
