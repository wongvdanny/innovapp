export type PasoComoFunciona = { title: string; description: string }

type ComoFuncionaProps = {
  intro: string
  steps: PasoComoFunciona[]
}

/**
 * Sección "Cómo funciona", reutilizada (con contenido distinto) en las landings de
 * Agentes IA. El id="como-funciona" se usa como ancla de un sitelink de Google Ads —
 * no cambiar.
 */
export default function ComoFunciona({ intro, steps }: ComoFuncionaProps) {
  return (
    <section id="como-funciona" style={{ padding: '90px 24px', background: '#faf8f4' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div style={{ display: 'inline-block', background: 'white', border: '1px solid #f1ece0', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#c98826', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
            Cómo funciona
          </div>
          <p style={{ fontSize: 17, color: '#5a5142', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            {intro}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {steps.map((step, i) => (
            <div key={step.title} style={{ background: 'white', border: '1px solid #f1ece0', borderRadius: 18, padding: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#faf1de', color: '#c98826', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, marginBottom: 14 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1a140d', marginBottom: 6 }}>{step.title}</div>
              <div style={{ fontSize: 13, color: '#8a7a5a', lineHeight: 1.65 }}>{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
