import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, ReactNode, CSSProperties } from 'react'
import AdminLayout from '../AdminLayout'
import { Modal as ModalAdmin, Notice, Toggle } from '../ui'
import { eur } from '../../../lib/facturacion/decimal'

// Piezas de interfaz del módulo de facturación. Los colores son las variables del tema de /admin
// (styles/admin.css): la paleta C solo les da los nombres que ya usan las páginas.

export const C = {
  naranja: 'var(--adm-accent)', naranjaOsc: 'var(--adm-accent)', negro: 'var(--adm-text)', gris: 'var(--adm-muted)', grisTexto: 'var(--adm-muted)',
  borde: 'var(--adm-border)', fondo: 'var(--adm-bg)', verde: 'var(--adm-ok)', verdeFondo: 'var(--adm-ok-bg)', rojo: 'var(--adm-err)', rojoFondo: 'var(--adm-err-bg)',
  ambar: 'var(--adm-warn)', ambarFondo: 'var(--adm-warn-bg)', azul: 'var(--adm-info)', azulFondo: 'var(--adm-info-bg)',
}
const FUENTE = 'var(--font-gabarito), system-ui, sans-serif'

const NAV = [
  ['/admin/facturacion', 'Resumen'],
  ['/admin/facturacion/facturas', 'Facturas'],
  ['/admin/facturacion/clientes', 'Clientes'],
  ['/admin/facturacion/recurrentes', 'Recurrentes'],
  ['/admin/facturacion/gastos', 'Gastos'],
  ['/admin/facturacion/informes', 'Informes'],
  ['/admin/facturacion/gestor', 'Gestoría'],
  ['/admin/facturacion/ajustes', 'Ajustes'],
]

export function Layout({ titulo, acciones, children }: { titulo: string; acciones?: ReactNode; children: ReactNode }) {
  const { pathname } = useRouter()
  const activo = (href: string) => href === '/admin/facturacion' ? pathname === href : pathname.startsWith(href)
  return (
    <AdminLayout title={`Facturación · ${titulo}`} actions={acciones}>
      <nav className="adm-tabs" aria-label="Facturación">
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={`adm-tab${activo(href) ? ' activo' : ''}`} aria-current={activo(href) ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>
      {children}
    </AdminLayout>
  )
}

export function Card({ children, style, titulo, extra }: { children: ReactNode; style?: CSSProperties; titulo?: ReactNode; extra?: ReactNode }) {
  return (
    <div className="adm-card" style={style}>
      {titulo && (
        <div className="adm-card-cab">
          <h3>{titulo}</h3>
          {extra}
        </div>
      )}
      {children}
    </div>
  )
}

export function Kpi({ label, valor, nota, color }: { label: string; valor: ReactNode; nota?: ReactNode; color?: string }) {
  return (
    <div className="adm-kpi">
      <div className="adm-kpi-label">{label}</div>
      <div className="adm-kpi-valor" style={color ? { color } : undefined}>{valor}</div>
      {nota && <div className="adm-kpi-nota">{nota}</div>}
    </div>
  )
}

type Variante = 'primario' | 'secundario' | 'peligro' | 'exito' | 'fantasma'

export function Btn({ variante = 'secundario', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button {...p} className={`adm-btn${variante === 'secundario' ? '' : ' ' + variante}${className ? ' ' + className : ''}`} />
}

export const estiloInput: CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.borde}`, fontSize: 14, outline: 'none',
  fontFamily: FUENTE, boxSizing: 'border-box', background: 'var(--adm-surface-2)', color: C.negro,
}

export function Campo({ label, children, ayuda, error, style }: { label: string; children: ReactNode; ayuda?: ReactNode; error?: string | null; style?: CSSProperties }) {
  return (
    <label className="adm-campo" style={style}>
      <span>{label}</span>
      {children}
      {error ? <span className="adm-campo-error">{error}</span>
        : ayuda ? <span className="adm-campo-ayuda">{ayuda}</span> : null}
    </label>
  )
}

export function Interruptor({ valor, onChange, label, ayuda }: { valor: boolean; onChange: (v: boolean) => void; label: string; ayuda?: ReactNode }) {
  return <Toggle value={valor} onChange={onChange} label={label} help={ayuda} />
}

const ESTADOS: Record<string, [string, string]> = {
  borrador: ['Borrador', 'neutro'],
  emitida:  ['Emitida', 'info'],
  vencida:  ['Vencida', 'err'],
  pagada:   ['Pagada', 'ok'],
  anulada:  ['Anulada', 'neutro'],
  previsto: ['Previsto', 'warn'],
}

export function estadoVisible(f: { estado: string; fecha_vencimiento?: string | null }, hoy: string) {
  return f.estado === 'emitida' && f.fecha_vencimiento && f.fecha_vencimiento.slice(0, 10) < hoy ? 'vencida' : f.estado
}

export function Estado({ estado }: { estado: string }) {
  const [label, tono] = ESTADOS[estado] ?? [estado, 'neutro']
  return <span className={`adm-badge ${tono}`}>{label}</span>
}

export const Euros = ({ v, fuerte }: { v: unknown; fuerte?: boolean }) =>
  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: fuerte ? 800 : undefined, whiteSpace: 'nowrap' }}>{eur(v as string)}</span>

export const fechaCorta = (v?: string | null) => v ? `${v.slice(8, 10)}/${v.slice(5, 7)}/${v.slice(0, 4)}` : '—'

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'ok' | 'error' | 'aviso'; children: ReactNode }) {
  return <Notice tone={tipo} style={{ marginBottom: 16 }}>{children}</Notice>
}

export function Modal({ titulo, onCerrar, children, ancho = 520 }: { titulo: string; onCerrar: () => void; children: ReactNode; ancho?: number }) {
  return <ModalAdmin title={titulo} onClose={onCerrar} width={ancho}>{children}</ModalAdmin>
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
