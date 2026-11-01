import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import AdminLayout, { SectionTabs, useTab } from '../../components/admin/AdminLayout'
import { Button, EmptyState, Field, Modal, Notice } from '../../components/admin/ui'
import Resumen, { DatosResumen } from '../../components/admin/contabilidad/Resumen'
import Ingresos, { ProyectoMin } from '../../components/admin/contabilidad/Ingresos'
import Gastos from '../../components/admin/contabilidad/Gastos'
import Metas from '../../components/admin/contabilidad/Metas'
import Fiscal from '../../components/admin/contabilidad/Fiscal'
import type { Gasto, Ingreso } from '../../lib/accounting/calculos'
import { exigirAdmin } from '../../lib/facturacion/api'
import { hoyMadrid } from '../../lib/facturacion/fechas'

const PESTANAS: [string, string][] = [['resumen', 'Resumen'], ['ingresos', 'Ingresos'], ['gastos', 'Gastos'], ['metas', 'Metas'], ['fiscal', 'Fiscal']]
type Datos = DatosResumen & { ingresos: Ingreso[]; gastos: Gasto[]; sinFactura: Ingreso[] }

function Exportar({ hoy, onCerrar }: { hoy: string; onCerrar: () => void }) {
  const [tipo, setTipo] = useState('ingresos')
  const [desde, setDesde] = useState(`${hoy.slice(0, 4)}-01-01`)
  const [hasta, setHasta] = useState(hoy)
  return (
    <Modal title="Exportar CSV" onClose={onCerrar} width={440}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Field label="Qué">
          <select className="adm-input" value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="ingresos">Ingresos (facturas y cobros sin factura)</option>
            <option value="gastos">Gastos (registrados y previstos)</option>
          </select>
        </Field>
        <div className="adm-grid" style={{ ['--min' as any]: '160px', gap: 14 }}>
          <Field label="Desde"><input className="adm-input" type="date" value={desde} onChange={e => setDesde(e.target.value)} /></Field>
          <Field label="Hasta"><input className="adm-input" type="date" value={hasta} onChange={e => setHasta(e.target.value)} /></Field>
        </div>
        <p className="adm-muted adm-peq" style={{ margin: 0 }}>Formato de Excel en español: «;» como separador y coma decimal.</p>
        <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCerrar}>Cerrar</Button>
          <a className="adm-btn primario" href={`/api/admin/accounting/export?tipo=${tipo}&desde=${desde}&hasta=${hasta}`} download>Descargar CSV</a>
        </div>
      </div>
    </Modal>
  )
}

export default function Contabilidad({ hoy }: { hoy: string }) {
  const router = useRouter()
  const tab = useTab(PESTANAS.map(p => p[0]), 'resumen')
  const mesUrl = typeof router.query.mes === 'string' && /^\d{4}-\d{2}$/.test(router.query.mes) ? router.query.mes : hoy.slice(0, 7)
  const [d, setD] = useState<Datos | null>(null)
  const [proyectos, setProyectos] = useState<ProyectoMin[]>([])
  const [error, setError] = useState('')
  const [exportando, setExportando] = useState(false)

  const cargar = useCallback(() => {
    setError('')
    fetch(`/api/admin/accounting/resumen?mes=${mesUrl}`)
      .then(r => (r.ok ? r.json() : r.json().then(x => Promise.reject(new Error(x.error || `Error ${r.status}`)))))
      .then(setD).catch(e => setError(e.message))
    fetch('/api/admin/proyectos').then(r => (r.ok ? r.json() : [])).then(ps => setProyectos(ps.map((p: any) => ({ id: p.id, nombre: p.nombre }))))
  }, [mesUrl])
  useEffect(() => { cargar() }, [cargar])

  const cambiarMes = (mes: string) => router.replace({ pathname: router.pathname, query: { ...router.query, mes } }, undefined, { shallow: true, scroll: false })

  return (
    <AdminLayout title="Contabilidad" actions={<>
      {tab !== 'fiscal' && tab !== 'metas' && (
        <input type="month" className="adm-input" style={{ width: 'auto' }} value={mesUrl} max={hoy.slice(0, 7)} onChange={e => e.target.value && cambiarMes(e.target.value)} aria-label="Mes" />
      )}
      <Button onClick={() => setExportando(true)}>Exportar CSV</Button>
    </>}>
      <SectionTabs tabs={PESTANAS} current={tab} />
      {error && <Notice tone="error">⚠️ {error}</Notice>}
      {tab === 'fiscal' ? <Fiscal hoy={hoy} /> : !d ? (!error && <EmptyState title="Calculando…" />) : (
        <>
          {tab === 'resumen' && <Resumen d={d} />}
          {tab === 'ingresos' && <Ingresos mes={d.mes} ingresos={d.ingresos} sinFactura={d.sinFactura} lineas={d.lineas} proyectos={proyectos} recargar={cargar} />}
          {tab === 'gastos' && <Gastos mes={d.mes} gastos={d.gastos} lineas={d.lineas} proyectos={proyectos} recargar={cargar} />}
          {tab === 'metas' && <Metas metas={d.metas} lineas={d.lineas} hoy={hoy} recargar={cargar} />}
        </>
      )}
      {exportando && <Exportar hoy={hoy} onCerrar={() => setExportando(false)} />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: { hoy: hoyMadrid() } }
