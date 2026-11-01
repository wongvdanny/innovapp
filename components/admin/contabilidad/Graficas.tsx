import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable, euros } from '../ui'

// Gráficas de Contabilidad (solo cliente: se cargan con next/dynamic sin SSR).
// Colores: variables --adm-chart-* y --adm-c-* de styles/admin.css (validadas para la superficie oscura).

export interface PuntoEvolucion { mes: string; ingresos: number; gastosRegistrados: number; gastosPrevistos: number; beneficio: number; mrr: number; mrrPorLinea: Record<string, number> }

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
export const etiquetaMes = (m: string) => `${MESES[+m.slice(5, 7) - 1]} ${m.slice(2, 4)}`
const ejeEuros = (v: number) => (Math.abs(v) >= 1000 ? `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k` : String(Math.round(v)))
const TICK = { fill: 'var(--adm-muted)', fontSize: 11 }

function Caja({ active, payload, label, filas }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="adm-tooltip">
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{etiquetaMes(label)}</div>
      {filas(payload[0].payload).map(([k, v]: [string, string]) => <div key={k}><span className="adm-muted">{k}</span><span>{v}</span></div>)}
    </div>
  )
}

export function IngresosGastos({ datos }: { datos: PuntoEvolucion[] }) {
  const [tabla, setTabla] = useState(false)
  return (
    <div>
      <div className="adm-fila" style={{ justifyContent: 'space-between' }}>
        <div className="adm-leyenda" aria-hidden>
          <span><b style={{ background: 'var(--adm-chart-ingresos)' }} />Ingresos (base)</span>
          <span><b style={{ background: 'var(--adm-chart-gastos)' }} />Gastos registrados</span>
          <span><b style={{ background: 'repeating-linear-gradient(45deg, var(--adm-chart-gastos) 0 2px, transparent 2px 5px)', border: '1px solid var(--adm-chart-gastos)' }} />Gastos previstos</span>
        </div>
        <button type="button" className="adm-btn fantasma peq" onClick={() => setTabla(t => !t)}>{tabla ? 'Ver gráfica' : 'Ver tabla'}</button>
      </div>
      {tabla ? (
        <DataTable rows={datos} rowKey={d => d.mes} columns={[
          { key: 'm', header: 'Mes', render: d => etiquetaMes(d.mes) },
          { key: 'i', header: 'Ingresos', num: true, render: d => euros(d.ingresos) },
          { key: 'g', header: 'Gastos reg.', num: true, render: d => euros(d.gastosRegistrados) },
          { key: 'p', header: 'Gastos prev.', num: true, render: d => euros(d.gastosPrevistos) },
          { key: 'b', header: 'Beneficio', num: true, render: d => euros(d.beneficio) },
        ]} />
      ) : (
        <div className="adm-grafica" role="img" aria-label="Ingresos y gastos de los últimos 12 meses">
          <ResponsiveContainer>
            <BarChart data={datos} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <pattern id="adm-rayado" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="2" height="5" fill="var(--adm-chart-gastos)" />
                </pattern>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--adm-chart-grid)" />
              <XAxis dataKey="mes" tickFormatter={etiquetaMes} tick={TICK} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={ejeEuros} tick={TICK} axisLine={false} tickLine={false} width={44} />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} content={<Caja filas={(d: PuntoEvolucion) => [
                ['Ingresos', euros(d.ingresos)], ['Gastos registrados', euros(d.gastosRegistrados)], ['Gastos previstos', euros(d.gastosPrevistos)], ['Beneficio', euros(d.beneficio)],
              ]} />} />
              <Bar dataKey="ingresos" name="Ingresos" fill="var(--adm-chart-ingresos)" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="gastosRegistrados" name="Gastos registrados" stackId="g" fill="var(--adm-chart-gastos)" maxBarSize={22} />
              <Bar dataKey="gastosPrevistos" name="Gastos previstos" stackId="g" fill="url(#adm-rayado)" stroke="var(--adm-chart-gastos)" strokeWidth={1} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

/** MRR por línea en miniaturas (una serie cada una): con varios colores juntos no se distinguen bien. */
export function MrrPorLinea({ datos, lineas }: { datos: PuntoEvolucion[]; lineas: { slug: string; nombre: string }[] }) {
  const conDatos = lineas.filter(l => datos.some(d => (d.mrrPorLinea[l.slug] ?? 0) > 0))
  if (conDatos.length === 0) return <p className="adm-muted" style={{ margin: 0, fontSize: 13 }}>Aún no hay MRR real (las suscripciones de prueba no cuentan).</p>
  return (
    <div className="adm-grid" style={{ ['--min' as any]: '220px' }}>
      {conDatos.map(l => {
        const serie = datos.map(d => ({ mes: d.mes, v: d.mrrPorLinea[l.slug] ?? 0 }))
        const color = `var(--adm-c-${l.slug}, var(--adm-c-otros))`
        return (
          <div key={l.slug} className="adm-kpi" style={{ padding: '14px 16px' }}>
            <div className="adm-kpi-label"><span className="adm-punto" style={{ background: color }} />{l.nombre}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{euros(serie[serie.length - 1].v, 0)}<span className="adm-muted adm-peq"> /mes</span></div>
            <div style={{ height: 70 }} role="img" aria-label={`MRR de ${l.nombre} en 12 meses`}>
              <ResponsiveContainer>
                <LineChart data={serie} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                  <Tooltip content={<Caja filas={(d: { v: number }) => [['MRR', euros(d.v)]]} />} />
                  <XAxis dataKey="mes" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Line dataKey="v" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4, stroke: 'var(--adm-surface)', strokeWidth: 2 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}
