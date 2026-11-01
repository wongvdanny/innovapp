import { ReactNode, useEffect, useState } from 'react'
import { Column, DataTable, EmptyState, KpiCard, KpiGrid, Notice, Section } from '../ui'

export interface ConfigMetricas<T = any> {
  /** Endpoint que devuelve las filas del periodo (?from&to). */
  endpoint: string
  titulo: string
  vacio: string
  kpis: (filas: T[]) => [string, ReactNode][]
  columnas: Column<T>[]
  orden?: (a: T, b: T) => number
  /** Bloque adicional que se carga con el mismo periodo (p. ej. costes de APIs). */
  extra?: { endpoint: string; render: (datos: any) => ReactNode }
}

const PERIODOS: [string, string][] = [['30d', '30 días'], ['6m', '6 meses'], ['1y', '1 año'], ['custom', 'Personalizado']]

function rango(p: string): [string, string] {
  const hasta = new Date()
  const desde = new Date()
  if (p === '30d') desde.setDate(hasta.getDate() - 30)
  if (p === '6m') desde.setMonth(hasta.getMonth() - 6)
  if (p === '1y') desde.setFullYear(hasta.getFullYear() - 1)
  return [desde.toISOString(), hasta.toISOString()]
}

/** Métricas de uso de un producto leídas de su propia BD, con filtro de periodo. */
export default function MetricasProducto({ config, color }: { config: ConfigMetricas; color: string }) {
  const [filas, setFilas] = useState<any[]>([])
  const [extra, setExtra] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [periodo, setPeriodo] = useState('30d')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')

  const cargar = async ([from, to]: [string, string]) => {
    setCargando(true); setError('')
    const qs = new URLSearchParams({ from, to }).toString()
    try {
      const [r, e] = await Promise.all([
        fetch(`${config.endpoint}?${qs}`).then(x => (x.ok ? x.json() : Promise.reject(new Error(`Error ${x.status}`)))),
        config.extra ? fetch(`${config.extra.endpoint}?${qs}`).then(x => (x.ok ? x.json() : null)).catch(() => null) : null,
      ])
      setFilas(Array.isArray(r) ? r : [])
      setExtra(e)
    } catch (err: any) {
      setError(err.message || 'No se han podido cargar los datos')
    }
    setCargando(false)
  }

  useEffect(() => { cargar(rango('30d')) }, [config.endpoint])

  const elegir = (p: string) => { setPeriodo(p); if (p !== 'custom') cargar(rango(p)) }
  const ordenadas = config.orden ? [...filas].sort(config.orden) : filas

  return (
    <div className="adm-stack">
      <div className="adm-filtros">
        <span className="adm-fuerte" style={{ fontSize: 13 }}>Periodo:</span>
        {PERIODOS.map(([k, l]) => <button key={k} type="button" className={`adm-chip${periodo === k ? ' activo' : ''}`} onClick={() => elegir(k)}>{l}</button>)}
        {periodo === 'custom' && <>
          <input type="date" className="adm-input" style={{ width: 'auto' }} value={desde} onChange={e => setDesde(e.target.value)} aria-label="Desde" />
          <span className="adm-muted">→</span>
          <input type="date" className="adm-input" style={{ width: 'auto' }} value={hasta} onChange={e => setHasta(e.target.value)} aria-label="Hasta" />
          <button type="button" className="adm-btn primario peq" disabled={!desde || !hasta}
            onClick={() => cargar([new Date(desde).toISOString(), new Date(hasta + 'T23:59:59').toISOString()])}>Aplicar</button>
        </>}
      </div>

      {error && <Notice tone="error">⚠️ {error}</Notice>}

      <KpiGrid>
        {config.kpis(filas).map(([label, valor]) => <KpiCard key={label} label={label} value={cargando ? '…' : valor} color={color} />)}
      </KpiGrid>

      {config.extra && extra && config.extra.render(extra)}

      <Section padded={false} title={config.titulo} actions={cargando ? <span className="adm-muted adm-peq">⏳ Cargando…</span> : undefined}>
        {cargando
          ? <EmptyState title="Cargando datos…" />
          : <DataTable columns={config.columnas} rows={ordenadas} rowKey={r => r.id} empty={<EmptyState title={config.vacio} />} />}
      </Section>
    </div>
  )
}
