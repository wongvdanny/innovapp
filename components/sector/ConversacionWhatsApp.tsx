import type { MensajeChat } from '../../data/sectores'

/** Mockup de una conversación de WhatsApp en HTML/CSS (sin imágenes). Aquí sí van emojis. */
export default function ConversacionWhatsApp({ nombre, mensajes, etiqueta }: {
  nombre: string
  mensajes: MensajeChat[]
  /** aria-label del bloque: «Ejemplo de conversación por WhatsApp con…». */
  etiqueta: string
}) {
  const iniciales = nombre.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="wa-movil" aria-label={etiqueta} role="group">
      <div style={{ background: '#075e54', color: 'white', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span aria-hidden style={{ fontSize: 18 }}>‹</span>
        <div aria-hidden style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--agentes-oro)', color: '#12141a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>{iniciales}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{nombre}</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>en línea</div>
        </div>
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: '14px 10px 18px', display: 'flex', flexDirection: 'column', gap: 8, background: '#efeae2' }}>
        <li aria-hidden style={{ alignSelf: 'center', background: '#fff', color: '#54656f', fontSize: 12, padding: '4px 10px', borderRadius: 8, marginBottom: 4 }}>HOY</li>
        {mensajes.map((m, i) => {
          const cliente = m.de === 'cliente'
          return (
            <li key={i} style={{
              alignSelf: cliente ? 'flex-end' : 'flex-start', maxWidth: '84%',
              background: cliente ? '#d9fdd3' : '#ffffff', color: '#111b21',
              padding: '7px 10px 6px', borderRadius: 8, fontSize: 15, lineHeight: 1.4,
              borderTopRightRadius: cliente ? 2 : 8, borderTopLeftRadius: cliente ? 8 : 2,
              boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
            }}>
              <span className="sr-only">{cliente ? 'Cliente: ' : 'Agente: '}</span>
              {m.texto}
              <span aria-hidden style={{ display: 'block', textAlign: 'right', fontSize: 11, color: '#54656f', marginTop: 2 }}>
                {m.hora}{cliente && <span style={{ color: '#53bdeb', marginLeft: 4 }}>✓✓</span>}
              </span>
            </li>
          )
        })}
      </ol>
      <style>{`
        .wa-movil { width: 100%; max-width: 380px; margin: 0 auto; border-radius: 22px; overflow: hidden; border: 6px solid #12141a; box-shadow: 0 10px 30px rgba(0,0,0,.15); }
      `}</style>
    </div>
  )
}
