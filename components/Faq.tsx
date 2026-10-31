// Preguntas frecuentes: la lista visible y su JSON-LD FAQPage salen de los mismos datos,
// para que Google nunca vea preguntas que no están en la página.

export type FaqItem = { pregunta: string; respuesta: string }

export function faqJsonLd(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ pregunta, respuesta }) => ({
      '@type': 'Question',
      name: pregunta,
      acceptedAnswer: { '@type': 'Answer', text: respuesta },
    })),
  }
}

type Tema = { fondo: string; tarjeta: string; borde: string; titulo: string; texto: string; acento: string }

const TEMAS: Record<'agentes' | 'marca', Tema> = {
  // Paleta de las landings de Agentes IA (dorado sobre crema)
  agentes: { fondo: '#faf8f4', tarjeta: 'white', borde: '#f1ece0', titulo: '#1a140d', texto: '#6b5d45', acento: 'var(--agentes-oro-texto)' },
  // Paleta de marca innovapp (#EE7528 / #1E1E1E)
  marca: { fondo: 'var(--gris-50)', tarjeta: 'white', borde: 'var(--gris-200)', titulo: '#1e1e1e', texto: 'var(--gris-600)', acento: '#ee7528' },
}

export default function Faq({ items, titulo = 'Preguntas frecuentes', tema = 'agentes' }: { items: FaqItem[]; titulo?: string; tema?: keyof typeof TEMAS }) {
  const t = TEMAS[tema]
  return (
    <section style={{ padding: '90px 24px', background: t.fondo }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: -1, marginBottom: 36, color: t.titulo, textAlign: 'center' }}>
          {titulo}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(({ pregunta, respuesta }) => (
            <details key={pregunta} style={{ background: t.tarjeta, border: `1px solid ${t.borde}`, borderRadius: 14, padding: '18px 22px' }}>
              <summary style={{ cursor: 'pointer', fontSize: 16, fontWeight: 700, color: t.titulo, listStyle: 'none', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{pregunta}</h3>
                <span aria-hidden style={{ color: t.acento, flexShrink: 0 }}>+</span>
              </summary>
              <p style={{ fontSize: 15, color: t.texto, lineHeight: 1.75, margin: '12px 0 0' }}>{respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
