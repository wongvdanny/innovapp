import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, ReactNode, CSSProperties } from 'react'
import Logo from '../../Logo'
import { eur } from '../../../lib/facturacion/decimal'

// Piezas de interfaz del módulo de facturación, con el mismo lenguaje visual que /admin.

export const C = {
  naranja: '#ee7528', naranjaOsc: '#c85f1b', negro: '#1e1e1e', gris: '#88a8b0', grisTexto: '#4a6572',
  borde: '#eef1f4', fondo: '#f8fafb', verde: '#166534', verdeFondo: '#f0fdf4', rojo: '#991b1b', rojoFondo: '#fff1f2',
  ambar: '#92400e', ambarFondo: '#fffbeb', azul: '#1e40af', azulFondo: '#eff6ff',
}
export const GRADIENTE = 'linear-gradient(135deg,#ee7528,#c85f1b)'
const FUENTE = 'var(--font-gabarito), system-ui, sans-serif'

const NAV = [
  ['/admin/facturacion', '📊 Resumen'],
  ['/admin/facturacion/facturas', '🧾 Facturas'],
  ['/admin/facturacion/clientes', '👥 Clientes'],
  ['/admin/facturacion/recurrentes', '🔁 Recurrentes'],
  ['/admin/facturacion/gastos', '📥 Gastos'],
  ['/admin/facturacion/ajustes', '⚙️ Ajustes'],
]

export function Layout({ titulo, acciones, children }: { titulo: string; acciones?: ReactNode; children: ReactNode }) {
  const { pathname } = useRouter()
  const activo = (href: string) => href === '/admin/facturacion' ? pathname === href : pathname.startsWith(href)
  return (
    <>
      <Head><title>{`${titulo} — Facturación — innovapp`}</title></Head>
      <style jsx global>{`
        .fac-wrap { padding: 24px 48px 48px; max-width: 1400px; margin: 0 auto; }
        .fac-g4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .fac-g3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .fac-g2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .fac-tabla { width: 100%; border-collapse: collapse; }
        .fac-tabla th { padding: 12px 14px; text-align: left; font-size: 11px; font-weight: 700; color: ${C.gris}; text-transform: uppercase; letter-spacing: 1px; background: ${C.fondo}; white-space: nowrap; }
        .fac-tabla td { padding: 12px 14px; font-size: 13px; color: ${C.negro}; border-top: 1px solid #f0f4f6; vertical-align: middle; }
        .fac-tabla tr.fac-click:hover td { background: #fdf8f4; cursor: pointer; }
        .fac-num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
        @media (max-width: 1000px) { .fac-g4 { grid-template-columns: repeat(2, 1fr); } .fac-g3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 640px) {
          .fac-wrap { padding: 16px 16px 40px; }
          .fac-g4, .fac-g3, .fac-g2 { grid-template-columns: 1fr; }
          .fac-header { padding: 14px 16px !important; }
          .fac-nav { padding: 12px 16px 0 !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: C.fondo, fontFamily: FUENTE }}>
        <div className="fac-header" style={{ background: C.negro, padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Logo variant="dark" height={26} style={{ opacity: 0.8 }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.15)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: 1, textTransform: 'uppercase' }}>Facturación</span>
          </div>
          <Link href="/admin" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>← Panel admin</Link>
        </div>
        <div className="fac-nav" style={{ padding: '20px 48px 0', maxWidth: 1400, margin: '0 auto', overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, background: 'white', border: `1px solid ${C.borde}`, borderRadius: 14, padding: 4, width: 'fit-content' }}>
            {NAV.map(([href, label]) => (
              <Link key={href} href={href} style={{
                padding: '8px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none',
                background: activo(href) ? GRADIENTE : 'transparent', color: activo(href) ? 'white' : C.grisTexto,
              }}>{label}</Link>
            ))}
          </div>
        </div>
        <div className="fac-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.negro, margin: 0 }}>{titulo}</h1>
            {acciones && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{acciones}</div>}
          </div>
          {children}
        </div>
      </div>
    </>
  )
}

export function Card({ children, style, titulo, extra }: { children: ReactNode; style?: CSSProperties; titulo?: ReactNode; extra?: ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${C.borde}`, overflow: 'hidden', ...style }}>
      {titulo && (
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.borde}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.negro, margin: 0 }}>{titulo}</h3>
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}

export function Kpi({ label, valor, nota, color }: { label: string; valor: ReactNode; nota?: ReactNode; color?: string }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '18px 22px', border: `1px solid ${C.borde}` }}>
      <div style={{ fontSize: 12, color: C.gris, fontWeight: 600, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || C.negro, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{valor}</div>
      {nota && <div style={{ fontSize: 12, color: C.gris, marginTop: 6 }}>{nota}</div>}
    </div>
  )
}

type Variante = 'primario' | 'secundario' | 'peligro' | 'exito' | 'fantasma'
const VARIANTES: Record<Variante, CSSProperties> = {
  primario:   { background: GRADIENTE, color: 'white', border: 'none' },
  secundario: { background: 'white', color: C.negro, border: `1px solid ${C.borde}` },
  peligro:    { background: C.rojoFondo, color: C.rojo, border: '1px solid #fca5a5' },
  exito:      { background: C.verdeFondo, color: C.verde, border: '1px solid #86efac' },
  fantasma:   { background: 'transparent', color: C.grisTexto, border: 'none' },
}

export function Btn({ variante = 'secundario', style, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button {...p} style={{
    padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: p.disabled ? 'not-allowed' : 'pointer',
    opacity: p.disabled ? 0.55 : 1, whiteSpace: 'nowrap', fontFamily: FUENTE, ...VARIANTES[variante], ...style,
  }} />
}

export const estiloInput: CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${C.borde}`, fontSize: 14, outline: 'none',
  fontFamily: FUENTE, boxSizing: 'border-box', background: 'white', color: C.negro,
}

export function Campo({ label, children, ayuda, error, style }: { label: string; children: ReactNode; ayuda?: ReactNode; error?: string | null; style?: CSSProperties }) {
  return (
    <label style={{ display: 'block', ...style }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: C.negro, display: 'block', marginBottom: 5 }}>{label}</span>
      {children}
      {error ? <span style={{ fontSize: 12, color: C.rojo, display: 'block', marginTop: 4 }}>{error}</span>
        : ayuda ? <span style={{ fontSize: 12, color: C.gris, display: 'block', marginTop: 4 }}>{ayuda}</span> : null}
    </label>
  )
}

export function Interruptor({ valor, onChange, label, ayuda }: { valor: boolean; onChange: (v: boolean) => void; label: string; ayuda?: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => onChange(!valor)} role="switch" aria-checked={valor}>
      <div style={{ width: 40, height: 22, borderRadius: 20, position: 'relative', flexShrink: 0, marginTop: 1, background: valor ? C.naranja : '#dde3e8', transition: 'background .15s' }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: valor ? 20 : 2, transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.negro }}>{label}</div>
        {ayuda && <div style={{ fontSize: 12, color: C.gris, marginTop: 2 }}>{ayuda}</div>}
      </div>
    </div>
  )
}

const ESTADOS: Record<string, [string, string, string]> = {
  borrador: ['Borrador', '#f1f5f9', '#475569'],
  emitida:  ['Emitida', C.azulFondo, C.azul],
  vencida:  ['Vencida', C.rojoFondo, C.rojo],
  pagada:   ['Pagada', C.verdeFondo, C.verde],
  anulada:  ['Anulada', '#f8fafb', C.gris],
}

export function estadoVisible(f: { estado: string; fecha_vencimiento?: string | null }, hoy: string) {
  return f.estado === 'emitida' && f.fecha_vencimiento && f.fecha_vencimiento.slice(0, 10) < hoy ? 'vencida' : f.estado
}

export function Estado({ estado }: { estado: string }) {
  const [label, bg, color] = ESTADOS[estado] ?? [estado, C.fondo, C.gris]
  return <span style={{ background: bg, color, borderRadius: 20, padding: '3px 11px', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{label}</span>
}

export const Euros = ({ v, fuerte }: { v: unknown; fuerte?: boolean }) =>
  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: fuerte ? 800 : undefined, whiteSpace: 'nowrap' }}>{eur(v as string)}</span>

export const fechaCorta = (v?: string | null) => v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : '—'

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'ok' | 'error' | 'aviso'; children: ReactNode }) {
  const [bg, borde, color] = {
    info: [C.azulFondo, '#bfdbfe', C.azul], ok: [C.verdeFondo, '#86efac', C.verde],
    error: [C.rojoFondo, '#fca5a5', C.rojo], aviso: [C.ambarFondo, '#fcd34d', C.ambar],
  }[tipo]
  return <div style={{ background: bg, border: `1px solid ${borde}`, borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 500, color, marginBottom: 16 }}>{children}</div>
}

export function Modal({ titulo, onCerrar, children, ancho = 520 }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: number }) {
  return (
    <div onClick={onCerrar} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: ancho, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.negro, margin: 0 }}>{titulo}</h3>
          <button onClick={onCerrar} aria-label="Cerrar" style={{ border: 'none', background: 'none', fontSize: 22, cursor: 'pointer', color: C.gris }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export interface RespuestaApi<T = any> { ok: boolean; data?: T; error?: string; code?: string; meta?: any }

/** fetch JSON con errores de negocio ({ error, code, meta }) normalizados. */
export async function api<T = any>(url: string, metodo = 'GET', cuerpo?: unknown): Promise<RespuestaApi<T>> {
  try {
    const esForm = typeof FormData !== 'undefined' && cuerpo instanceof FormData
    const res = await fetch(url, {
      method: metodo,
      headers: cuerpo && !esForm ? { 'Content-Type': 'application/json' } : undefined,
      body: cuerpo ? (esForm ? (cuerpo as FormData) : JSON.stringify(cuerpo)) : undefined,
    })
    const data = await res.json().catch(() => ({}))
    return res.ok ? { ok: true, data } : { ok: false, error: data.error || `Error ${res.status}`, code: data.code, meta: data.meta }
  } catch {
    return { ok: false, error: 'No hay conexión con el servidor' }
  }
}

/** Mensaje de error con enlace a Ajustes cuando falta algún dato del emisor. */
export function ErrorApi({ r }: { r: RespuestaApi | null }) {
  if (!r || r.ok) return null
  return (
    <Aviso tipo="error">
      ⚠️ {r.error}
      {r.code === 'EMISOR_INCOMPLETO' && <> · <Link href="/admin/facturacion/ajustes" style={{ color: C.rojo, fontWeight: 700 }}>Ir a Ajustes →</Link></>}
    </Aviso>
  )
}

export function useMensaje() {
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const mostrar = (tipo: 'ok' | 'error', texto: string) => { setMsg({ tipo, texto }); setTimeout(() => setMsg(null), 5000) }
  const Mensaje = () => msg ? <Aviso tipo={msg.tipo}>{msg.tipo === 'ok' ? '✅' : '⚠️'} {msg.texto}</Aviso> : null
  return { mostrar, Mensaje }
}
