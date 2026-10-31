import Link from 'next/link'
import CaseCard from '../CaseCard'
import { CASES } from '../../data/cases'
import { SECCIONES_HOME } from './sections'

// #casos: productos propios y demos (aún no hay clientes publicados). Datos en data/cases.ts.
export default function Cases() {
  if (!SECCIONES_HOME.casos || CASES.length === 0) return null
  return (
    <section id="casos" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: '#f8fafb' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="label">Casos</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: '0 0 12px' }}>Lo que hemos construido</h2>
          <p style={{ fontSize: 16, color: '#4a6572', lineHeight: 1.7, maxWidth: 620, margin: '0 auto' }}>
            Productos propios y demos que puedes ver y probar.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
          {CASES.slice(0, 3).map(c => <CaseCard key={c.slug} caso={c} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/casos" style={{ display: 'inline-block', padding: '14px 28px', borderRadius: 12, background: '#1e1e1e', color: 'white', fontWeight: 700, fontSize: 16 }}>
            Ver todos
          </Link>
        </div>
      </div>
    </section>
  )
}
