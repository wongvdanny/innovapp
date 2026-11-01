import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DataTable, EmptyState, Notice, Section, euros } from '../ui'

interface Casilla { c: string; d: string; v: number }

/** Resumen fiscal trimestral orientativo: reutiliza los informes 303/130 de Facturación. */
export default function Fiscal({ hoy }: { hoy: string }) {
  const [anio, setAnio] = useState(+hoy.slice(0, 4))
  const [trimestre, setTrimestre] = useState(Math.floor((+hoy.slice(5, 7) - 1) / 3) + 1)
  const [d, setD] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setD(null); setError('')
    fetch(`/api/admin/accounting/fiscal?anio=${anio}&trimestre=${trimestre}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then(setD).catch(e => setError(e.message))
  }, [anio, trimestre])

  const tabla = (casillas: Casilla[]) => (
    <DataTable rows={casillas} rowKey={c => c.c + c.d} columns={[
      { key: 'c', header: 'Casilla', render: c => <span className="adm-fuerte">{c.c}</span> },
      { key: 'd', header: 'Concepto', render: c => c.d },
      { key: 'v', header: 'Importe', num: true, render: c => euros(c.v) },
    ]} />
  )

  return (
    <div className="adm-stack">
      <Notice tone="aviso">
        <strong>Estimación orientativa</strong>, no una declaración: revísala con la gestoría. Solo cuenta facturas emitidas y gastos <em>registrados</em>{' '}
        (los previstos no entran). La autoliquidación por inversión del sujeto pasivo (proveedores extranjeros) aún no está implementada.
      </Notice>
      <div className="adm-filtros">
        <select className="adm-input" style={{ width: 'auto' }} value={anio} onChange={e => setAnio(+e.target.value)} aria-label="Año">
          {[0, 1, 2].map(n => +hoy.slice(0, 4) - n).map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        {[1, 2, 3, 4].map(t => <button key={t} type="button" className={`adm-chip${trimestre === t ? ' activo' : ''}`} onClick={() => setTrimestre(t)}>{t}T</button>)}
        <Link href="/admin/facturacion/informes" className="adm-btn peq" style={{ marginLeft: 'auto' }}>Informes completos y libros</Link>
      </div>
      {error && <Notice tone="error">⚠️ {error}</Notice>}
      {!d ? <EmptyState title="Calculando…" /> : (
        <div className="adm-grid" style={{ ['--min' as any]: '380px', alignItems: 'start' }}>
          <Section padded={false} title={`Modelo 303 · IVA · ${trimestre}T ${anio}`}
            actions={<strong style={{ color: d.r303.resultado > 0 ? 'var(--adm-accent)' : 'var(--adm-ok)' }}>{euros(d.r303.resultado)}</strong>}>
            {tabla(d.r303.casillas)}
          </Section>
          <Section padded={false} title={`Modelo 130 · IRPF · ${d.r130.periodo}`}
            actions={<strong style={{ color: d.r130.resultado > 0 ? 'var(--adm-accent)' : 'var(--adm-ok)' }}>{euros(Math.max(0, d.r130.resultado))}</strong>}>
            {tabla(d.r130.casillas)}
          </Section>
        </div>
      )}
      {d && <p className="adm-muted adm-peq" style={{ margin: 0 }}>{d.expedidas} factura(s) emitida(s) y {d.recibidas} gasto(s) registrado(s) en el trimestre.</p>}
    </div>
  )
}
