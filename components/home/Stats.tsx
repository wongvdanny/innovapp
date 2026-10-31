import { STATS } from '../../data/stats'
import { tieneValor } from '../../lib/rellenar'

// Cifras (data/stats.ts). Las que tienen '[RELLENAR]' no se pintan. Con una sola cifra se
// muestra como una línea destacada; con varias, como franja.
export default function Stats() {
  const cifras = STATS.filter(s => tieneValor(s.value) && tieneValor(s.label))
  if (cifras.length === 0) return null

  if (cifras.length === 1) {
    const [c] = cifras
    return (
      <section aria-label="Trayectoria" style={{ padding: '36px 16px', background: '#1e1e1e' }}>
        <p style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', fontSize: 'clamp(19px,3vw,26px)', lineHeight: 1.4, color: 'rgba(255,255,255,.85)' }}>
          <strong style={{ color: '#f4a15c', fontWeight: 800 }}>{c.value}</strong> {c.label}
        </p>
      </section>
    )
  }

  return (
    <section aria-label="Cifras" style={{ padding: '44px 16px', background: '#1e1e1e' }}>
      <dl style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,200px),1fr))', gap: 24, textAlign: 'center' }}>
        {cifras.map(c => (
          <div key={c.value + c.label}>
            <dt style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: '#f4a15c' }}>{c.value}</dt>
            <dd style={{ margin: '4px 0 0', fontSize: 15, color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>{c.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
