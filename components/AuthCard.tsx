import Link from 'next/link'
import { CSSProperties, ReactNode } from 'react'
import Seo from './Seo'
import Logo from './Logo'

// Tarjeta común de las páginas de acceso (login, recuperar y restablecer contraseña).

export const estiloInput: CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #dfe3e8', fontSize: 14, outline: 'none',
  fontFamily: 'var(--font-gabarito), system-ui, sans-serif', boxSizing: 'border-box', color: '#1e1e1e', background: 'white',
}
export const estiloLabel: CSSProperties = { fontSize: 13, fontWeight: 600, color: '#1e1e1e', display: 'block', marginBottom: 6 }
export const estiloEnlace: CSSProperties = { color: '#b4540f', fontWeight: 600 }

export function BotonPrincipal({ cargando, children }: { cargando: boolean; children: ReactNode }) {
  return (
    <button type="submit" disabled={cargando} style={{
      width: '100%', padding: 14, background: cargando ? '#ccc' : 'linear-gradient(135deg,#ee7528,#c85f1b)', color: 'white',
      border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    }}>{children}</button>
  )
}

export function Mensaje({ tipo, children }: { tipo: 'error' | 'ok'; children: ReactNode }) {
  const [bg, borde, color] = tipo === 'error' ? ['#fff1f2', '#fca5a5', '#991b1b'] : ['#f0fdf4', '#86efac', '#166534']
  return <div role={tipo === 'error' ? 'alert' : 'status'} style={{ background: bg, border: `1px solid ${borde}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{children}</div>
}

export default function AuthCard({ titulo, subtitulo, seoTitulo, canonical, children, pie }: {
  titulo: string; subtitulo: string; seoTitulo: string; canonical: string; children: ReactNode; pie?: ReactNode
}) {
  return (
    <>
      <Seo title={seoTitulo} description={subtitulo} canonical={canonical} noindex />
      <div style={{ minHeight: '100vh', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
          <Link href="/" aria-label="innovapp, inicio"><Logo variant="light" height={36} style={{ marginBottom: 32 }} /></Link>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: '#1e1e1e' }}>{titulo}</h1>
          <p style={{ fontSize: 14, color: '#5f6b7a', marginBottom: 28 }}>{subtitulo}</p>
          {children}
          {pie && <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#5f6b7a' }}>{pie}</p>}
        </div>
      </div>
    </>
  )
}
