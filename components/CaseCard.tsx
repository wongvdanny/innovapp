import Image from 'next/image'
import Link from 'next/link'
import type { Case } from '../data/cases'
import { tieneValor } from '../lib/rellenar'

const BLOQUES: [keyof Case, string][] = [['challenge', 'Reto'], ['solution', 'Solución'], ['result', 'Resultado']]

/** Tarjeta de caso (home #casos y /casos). Los campos con '[RELLENAR]' no se pintan. */
export default function CaseCard({ caso, titulo = 'h3' }: { caso: Case; titulo?: 'h2' | 'h3' }) {
  const Titulo = titulo
  return (
    <article style={{ display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid #eef1f4', borderRadius: 20, overflow: 'hidden' }}>
      {tieneValor(caso.image) && (
        <Image src={caso.image} alt="" width={1200} height={750} sizes="(max-width: 700px) 100vw, 400px"
          style={{ width: '100%', height: 'auto', display: 'block' }} />
      )}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {tieneValor(caso.sector) && (
          <div style={{ fontSize: 13, fontWeight: 700, color: '#b2561a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{caso.sector}</div>
        )}
        <Titulo style={{ fontSize: 20, fontWeight: 800, color: '#1e1e1e', margin: '0 0 14px' }}>{caso.title}</Titulo>
        <dl style={{ margin: '0 0 18px', display: 'grid', gap: 12, flex: 1 }}>
          {BLOQUES.filter(([k]) => tieneValor(caso[k])).map(([k, etiqueta]) => (
            <div key={k}>
              <dt style={{ fontSize: 13, fontWeight: 700, color: '#1e1e1e', marginBottom: 2 }}>{etiqueta}</dt>
              <dd style={{ margin: 0, fontSize: 15, color: '#4a6572', lineHeight: 1.65 }}>{caso[k]}</dd>
            </div>
          ))}
        </dl>
        {tieneValor(caso.link) && (
          <Link href={caso.link} style={{ fontSize: 15, fontWeight: 700, color: '#b2561a' }}>Ver {caso.title} →</Link>
        )}
      </div>
    </article>
  )
}
