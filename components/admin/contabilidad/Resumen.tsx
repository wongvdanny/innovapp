import dynamic from 'next/dynamic'
import { Badge, Column, DataTable, EmptyState, KpiCard, KpiGrid, Notice, Section, euros, fecha } from '../ui'
import type { FilaLinea, KpisMes, Alerta } from '../../../lib/accounting/calculos'
import type { PuntoEvolucion } from './Graficas'

const IngresosGastos = dynamic(() => import('./Graficas').then(m => m.IngresosGastos), { ssr: false, loading: () => <div className="adm-grafica" /> })
const MrrPorLinea = dynamic(() => import('./Graficas').then(m => m.MrrPorLinea), { ssr: false })

export interface LineaInfo { slug: string; nombre: string }
export interface MetaProgreso {
  id: string; metrica: string; objetivo: number; periodo: string; desde: string; hasta: string; producto_slug: string | null
  actual: number; pct: number; proyeccion: number | null; proyeccionPct: number | null; diasRestantes: number; terminada: boolean
}
export interface DatosResumen {
  mes: string; hoy: string; lineas: LineaInfo[]; avisos: string[]
  kpis: KpisMes; kpisAnterior: KpisMes; evolucion: PuntoEvolucion[]; desglose: FilaLinea[]
  enfoque: { ranking: (FilaLinea & { puntuacion: number })[]; alertas: Alerta[] }
  metas: MetaProgreso[]
}

export const NOMBRE_METRICA: Record<string, string> = { mrr: 'MRR', ingresos: 'Ingresos', beneficio: 'Beneficio', clientes_activos: 'Clientes activos', altas: 'Altas' }
const EN_EUROS = ['mrr', 'ingresos', 'beneficio']
export const valorMeta = (metrica: string, v: number) => (EN_EUROS.includes(metrica) ? euros(v, 0) : String(Math.round(v)))

function Delta({ actual, anterior, inverso, puntos }: { actual: number | null; anterior: number | null; inverso?: boolean; puntos?: boolean }) {
  if (actual === null || anterior === null) return null
  const dif = actual - anterior
  if (Math.abs(dif) < 0.005) return <span className="adm-delta adm-muted">= mes anterior</span>
  const pct = !puntos && anterior !== 0 ? ` (${dif > 0 ? '+' : ''}${Math.round((dif / Math.abs(anterior)) * 100)} %)` : ''
  const bueno = inverso ? dif < 0 : dif > 0
  return <span className={`adm-delta ${bueno ? 'sube' : 'baja'}`}>{dif > 0 ? '▲' : '▼'} {puntos ? `${dif > 0 ? '+' : ''}${dif.toFixed(1)} pt` : euros(Math.abs(dif))}{pct} vs mes anterior</span>
}

export function BarraMeta({ m, nombreLinea }: { m: MetaProgreso; nombreLinea: (s: string) => string }) {
  const proy = m.proyeccionPct ?? 0
  const tono = m.pct >= 100 ? 'ok' : proy >= 100 ? 'info' : m.terminada ? 'err' : 'warn'
  return (
    <div>
      <div className="adm-fila" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="adm-fuerte">{NOMBRE_METRICA[m.metrica]}{m.producto_slug ? ` · ${nombreLinea(m.producto_slug)}` : ''}
          <span className="adm-muted adm-peq" style={{ fontWeight: 400 }}> · {fecha(m.desde)} – {fecha(m.hasta)}</span></span>
        <span><strong>{valorMeta(m.metrica, m.actual)}</strong> <span className="adm-muted">de {valorMeta(m.metrica, m.objetivo)}</span></span>
      </div>
      <div className="adm-progreso" role="progressbar" aria-valuenow={Math.round(m.pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${NOMBRE_METRICA[m.metrica]}: ${Math.round(m.pct)} %`}>
        <span style={{ width: `${Math.min(100, m.pct)}%` }} />
        {m.proyeccionPct !== null && !m.terminada && <i style={{ left: `${Math.min(99.5, proy)}%` }} title="Proyección a fin de periodo" />}
      </div>
      <div className="adm-fila adm-peq" style={{ justifyContent: 'space-between', marginTop: 6 }}>
        <span className="adm-muted">{Math.round(m.pct)} % {m.terminada ? '· periodo terminado' : `· quedan ${m.diasRestantes} días`}</span>
        {m.proyeccion !== null && !m.terminada && (
          <Badge tone={tono}>{proy >= 100 ? '✓ ' : '⚠ '}Proyección: {valorMeta(m.metrica, m.proyeccion)} ({Math.round(proy)} %)</Badge>
        )}
      </div>
    </div>
  )
}

export default function Resumen({ d }: { d: DatosResumen }) {
  const k = d.kpis, a = d.kpisAnterior
  const nombre = (s: string) => d.lineas.find(l => l.slug === s)?.nombre ?? s
  const punto = (s: string) => <span className="adm-punto" style={{ background: `var(--adm-c-${s}, var(--adm-c-otros))` }} />
  const desglose = d.desglose.filter(f => f.ingresos > 0 || f.ingresosAnterior > 0 || f.clientes > 0 || f.gastos > 0)

  const columnas: Column<FilaLinea>[] = [
    { key: 'l', header: 'Línea', render: f => <span className="adm-fila" style={{ fontWeight: 700 }}>{punto(f.linea)}{nombre(f.linea)}</span> },
    { key: 'i', header: 'Ingresos', num: true, render: f => euros(f.ingresos) },
    { key: 'c', header: 'vs mes ant.', num: true, render: f => f.crecimiento === null ? <span className="adm-faint">—</span> : <span className={`adm-delta ${f.crecimiento >= 0 ? 'sube' : 'baja'}`}>{f.crecimiento > 0 ? '+' : ''}{Math.round(f.crecimiento)} %</span> },
    { key: 'cl', header: 'Clientes', num: true, render: f => f.clientes },
    { key: 'm', header: 'MRR', num: true, render: f => euros(f.mrr, 0) },
    { key: 'g', header: 'Gastos', num: true, render: f => euros(f.gastos) },
    { key: 'mg', header: 'Margen', num: true, render: f => <span style={{ color: f.margen < 0 ? 'var(--adm-err)' : undefined, fontWeight: 700 }}>{euros(f.margen)}{f.margenPct !== null && <span className="adm-muted" style={{ fontWeight: 400 }}> · {Math.round(f.margenPct)} %</span>}</span> },
  ]

  return (
    <div className="adm-stack">
      {d.avisos.map(t => <Notice key={t} tone="aviso">⚠️ {t}</Notice>)}

      <KpiGrid min={165}>
        <KpiCard label="Ingresos del mes" value={euros(k.ingresos)} color="var(--adm-chart-ingresos)"
          note={<><Delta actual={k.ingresos} anterior={a.ingresos} />{k.ingresosSinFactura > 0 && <div>de ellos {euros(k.ingresosSinFactura)} sin factura</div>}</>} />
        <KpiCard label="Gastos del mes" value={euros(k.gastos)} color="var(--adm-chart-gastos)"
          note={<>{euros(k.gastosRegistrados)} registrados · {euros(k.gastosPrevistos)} previstos<div><Delta actual={k.gastos} anterior={a.gastos} inverso /></div></>} />
        <KpiCard label="Beneficio neto" value={<span style={{ color: k.beneficio < 0 ? 'var(--adm-err)' : undefined }}>{euros(k.beneficio)}</span>}
          note={<Delta actual={k.beneficio} anterior={a.beneficio} />} />
        <KpiCard label="MRR" value={euros(k.mrr, 0)} note={<>ARR {euros(k.arr, 0)}<div><Delta actual={k.mrr} anterior={a.mrr} /></div></>} />
        <KpiCard label="Clientes de pago" value={k.clientes} note={<>ARPU {k.arpu === null ? '—' : euros(k.arpu)}</>} />
        <KpiCard label="Altas / bajas" value={<>{k.altas} <span className="adm-muted">/</span> {k.bajas}</>}
          note={k.churn === null ? 'Churn: sin clientes al inicio del mes' : <>Churn {k.churn.toLocaleString('es-ES')} % mensual</>} />
      </KpiGrid>

      <Section title="Ingresos y gastos · 12 meses" subtitle="Base imponible. Gastos = base + IVA no deducible.">
        <IngresosGastos datos={d.evolucion} />
      </Section>

      <Section title="MRR por línea · 12 meses" subtitle="Reconstruido con las fechas de alta y baja (estimado).">
        <MrrPorLinea datos={d.evolucion} lineas={d.lineas} />
      </Section>

      <Section padded={false} title="Por línea de negocio" subtitle={`Mes ${d.mes}`}>
        <DataTable columns={columnas} rows={desglose} rowKey={f => f.linea} empty={<EmptyState icon="📊" title="Sin actividad este mes" />} />
      </Section>

      <div className="adm-grid" style={{ ['--min' as any]: '360px', alignItems: 'start' }}>
        <Section title="Dónde enfocar" subtitle="Puntuación: 40 % ingresos (3 meses), 35 % crecimiento, 25 % margen. Orientativo.">
          {d.enfoque.ranking.length === 0 && d.enfoque.alertas.length === 0 ? <EmptyState icon="🧭" title="Aún no hay datos suficientes" /> : (
            <div className="adm-stack" style={{ gap: 12 }}>
              {d.enfoque.ranking.map((r, i) => (
                <div key={r.linea}>
                  <div className="adm-fila" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="adm-fila" style={{ fontWeight: 700 }}>{i + 1}. {punto(r.linea)}{nombre(r.linea)}</span>
                    <span className="adm-muted adm-peq">{r.puntuacion}/100 · {euros(r.ingresos3m, 0)} en 3 meses</span>
                  </div>
                  <div className="adm-progreso" aria-hidden><span style={{ width: `${r.puntuacion}%`, background: `var(--adm-c-${r.linea}, var(--adm-c-otros))` }} /></div>
                </div>
              ))}
              {d.enfoque.alertas.map(al => (
                <Notice key={al.texto} tone={al.gravedad === 'alta' ? 'error' : 'aviso'}>{al.gravedad === 'alta' ? '⛔' : '⚠️'} {al.texto}</Notice>
              ))}
            </div>
          )}
        </Section>

        <Section title="Metas">
          {d.metas.length === 0 ? <EmptyState icon="🎯" title="Sin metas activas" text="Crea una en la pestaña Metas (p. ej. MRR 1.000 € este año)." /> : (
            <div className="adm-stack" style={{ gap: 18 }}>{d.metas.map(m => <BarraMeta key={m.id} m={m} nombreLinea={nombre} />)}</div>
          )}
        </Section>
      </div>
    </div>
  )
}
