import { ReactNode, CSSProperties, useState, ButtonHTMLAttributes } from 'react'

// Kit compartido de /admin. Los colores salen de styles/admin.css (variables --adm-*).

export function Section({ title, subtitle, actions, children, padded = true, style }: {
  title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; padded?: boolean; style?: CSSProperties
}) {
  return (
    <section className="adm-card" style={style}>
      {(title || actions) && (
        <div className="adm-card-cab">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <div className="adm-card-sub">{subtitle}</div>}
          </div>
          {actions}
        </div>
      )}
      {padded ? <div className="adm-card-cuerpo">{children}</div> : children}
    </section>
  )
}

export function KpiCard({ label, value, note, color, icon }: { label: ReactNode; value: ReactNode; note?: ReactNode; color?: string; icon?: ReactNode }) {
  return (
    <div className="adm-kpi">
      {color && <span className="adm-kpi-acento" style={{ background: color }} />}
      <div className="adm-kpi-label">{icon}{label}</div>
      <div className="adm-kpi-valor">{value}</div>
      {note && <div className="adm-kpi-nota">{note}</div>}
    </div>
  )
}

export function KpiGrid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return <div className="adm-grid" style={{ ['--min' as any]: `${min}px` }}>{children}</div>
}

export type Tono = 'ok' | 'warn' | 'err' | 'info' | 'neutro'

export function Badge({ tone = 'neutro', color, children }: { tone?: Tono; color?: string; children: ReactNode }) {
  // Con color (de producto): punto de color sobre fondo neutro, para no inventar fondos por producto.
  if (color) return <span className="adm-badge neutro"><span className="adm-punto" style={{ background: color }} />{children}</span>
  return <span className={`adm-badge ${tone}`}>{children}</span>
}

export function EmptyState({ icon, title, text, children }: { icon?: ReactNode; title: ReactNode; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="adm-vacio">
      {icon && <div className="adm-vacio-icono">{icon}</div>}
      <div className="adm-vacio-titulo">{title}</div>
      {text && <div className="adm-vacio-texto">{text}</div>}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'left' | 'right' | 'center'
  num?: boolean
}

export function DataTable<T>({ columns, rows, rowKey, empty, onRowClick }: {
  columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; empty?: ReactNode; onRowClick?: (row: T) => void
}) {
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Sin datos" />}</>
  return (
    <div className="adm-tabla-wrap">
      <table className="adm-tabla">
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ textAlign: c.num ? 'right' : c.align }}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={rowKey(r)} className={onRowClick ? 'clic' : undefined} onClick={onRowClick ? () => onRowClick(r) : undefined}>
              {columns.map(c => <td key={c.key} className={c.num ? 'adm-num' : undefined} style={{ textAlign: c.num ? undefined : c.align }}>{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export type ButtonVariant = 'primario' | 'secundario' | 'peligro' | 'exito' | 'aviso' | 'fantasma'

export function Button({ variant = 'secundario', small, className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; small?: boolean }) {
  return <button type="button" {...p} className={`adm-btn ${variant === 'secundario' ? '' : variant}${small ? ' peq' : ''}${className ? ' ' + className : ''}`} />
}

export function Field({ label, children, help, error, style }: { label: ReactNode; children: ReactNode; help?: ReactNode; error?: string | null; style?: CSSProperties }) {
  return (
    <label className="adm-campo" style={style}>
      <span>{label}</span>
      {children}
      {error ? <span className="adm-campo-error">{error}</span> : help ? <span className="adm-campo-ayuda">{help}</span> : null}
    </label>
  )
}

export function Toggle({ value, onChange, label, help }: { value: boolean; onChange: (v: boolean) => void; label: ReactNode; help?: ReactNode }) {
  return (
    <button type="button" className="adm-switch" role="switch" aria-checked={value} onClick={() => onChange(!value)}>
      <span className="adm-switch-pista" />
      <span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600 }}>{label}</span>
        {help && <span style={{ display: 'block', fontSize: 12, color: 'var(--adm-muted)', marginTop: 2 }}>{help}</span>}
      </span>
    </button>
  )
}

export type NoticeTone = 'info' | 'ok' | 'error' | 'aviso'

export function Notice({ tone = 'info', children, style }: { tone?: NoticeTone; children: ReactNode; style?: CSSProperties }) {
  return <div className={`adm-aviso ${tone}`} role={tone === 'error' ? 'alert' : 'status'} style={style}>{children}</div>
}

export function Modal({ title, onClose, children, width = 520 }: { title: ReactNode; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div className="adm-modal-velo" onClick={onClose}>
      <div className="adm-modal" style={{ maxWidth: width }} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="adm-modal-cab">
          <h3>{title}</h3>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Mensaje temporal (5 s) para el resultado de una acción. */
export function useFlash() {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const show = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 5000) }
  const Flash = () => msg ? <Notice tone={msg.ok ? 'ok' : 'error'} style={{ marginBottom: 16 }}>{msg.ok ? '✅' : '⚠️'} {msg.text}</Notice> : null
  return { show, Flash }
}

export const euros = (n: number, decimales = 2) =>
  n.toLocaleString('es-ES', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }) + ' €'

export const fecha = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('es-ES') : '—')
