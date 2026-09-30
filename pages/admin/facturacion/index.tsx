import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useState } from 'react'
import { prisma } from '../../../lib/prisma'
import { exigirAdmin, aJson } from '../../../lib/facturacion/api'
import { resumenDashboard, cobrosSinFactura } from '../../../lib/facturacion/dashboard'
import { validarEmisor } from '../../../lib/facturacion/emision'
import { hoyMadrid } from '../../../lib/facturacion/fechas'
import { D } from '../../../lib/facturacion/decimal'
import { Layout, Card, Kpi, Btn, Aviso, Euros, Estado, estadoVisible, fechaCorta, api, C } from '../../../components/admin/facturacion/ui'

export default function Dashboard({ r, cobros, ultimas, emisorError, verifactuActivo, hoy }: any) {
  const [integridad, setIntegridad] = useState<any>(null)
  const [verificando, setVerificando] = useState(false)
  const t = `${r.periodo.trimestre}T ${r.periodo.anio}`
  const ivaNeto = D(r.ivaRepercutido.trimestre).minus(D(r.ivaSoportado.trimestre)).toFixed(2)

  const verificar = async () => {
    setVerificando(true)
    const res = await api('/api/admin/facturacion/integridad')
    setIntegridad(res.ok ? res.data : { ok: false, errores: [{ detalle: res.error }] })
    setVerificando(false)
  }

  return (
    <Layout titulo="Resumen" acciones={<>
      <Btn onClick={verificar} disabled={verificando}>{verificando ? '⏳ Verificando…' : '🔗 Verificar integridad'}</Btn>
      <Link href="/admin/facturacion/facturas/nueva"><Btn variante="primario">+ Nueva factura</Btn></Link>
    </>}>
      {emisorError && (
        <Aviso tipo="aviso">⚠️ {emisorError} <Link href="/admin/facturacion/ajustes" style={{ color: C.ambar, fontWeight: 700 }}>Completar en Ajustes →</Link></Aviso>
      )}
      {integridad && (integridad.ok
        ? <Aviso tipo="ok">✅ Cadena íntegra: {integridad.registros} registros y {integridad.facturasEmitidas} facturas verificados.</Aviso>
        : <Aviso tipo="error">⚠️ Problemas de integridad:<ul style={{ margin: '6px 0 0 18px' }}>{integridad.errores.map((e: any, i: number) => <li key={i}>{e.detalle}</li>)}</ul></Aviso>)}

      <div className="fac-g4" style={{ marginBottom: 16 }}>
        <Kpi label={`Facturado ${t} (base)`} valor={<Euros v={r.facturado.trimestre} />} nota={<>Año: <Euros v={r.facturado.anio} /></>} />
        <Kpi label="Pendiente de cobro" valor={<Euros v={r.pendienteCobro.importe} />} nota={`${r.pendienteCobro.facturas} factura(s)`} />
        <Kpi label="Vencido" valor={<Euros v={r.vencido.importe} />} nota={`${r.vencido.facturas} factura(s)`} color={r.vencido.facturas ? C.rojo : undefined} />
        <Kpi label={`Retenciones ${t}`} valor={<Euros v={r.retenciones.trimestre} />} nota={<>Año: <Euros v={r.retenciones.anio} /> · a cuenta del IRPF</>} />
      </div>
      <div className="fac-g4" style={{ marginBottom: 24 }}>
        <Kpi label={`IVA repercutido ${t}`} valor={<Euros v={r.ivaRepercutido.trimestre} />} nota={<>Año: <Euros v={r.ivaRepercutido.anio} /></>} />
        <Kpi label={`IVA soportado ${t}`} valor={<Euros v={r.ivaSoportado.trimestre} />} nota={<>Año: <Euros v={r.ivaSoportado.anio} /></>} />
        <Kpi label={`Resultado IVA ${t}`} valor={<Euros v={ivaNeto} />} nota={D(ivaNeto).greaterThanOrEqualTo(0) ? 'A ingresar (estimación 303)' : 'A compensar'}
          color={D(ivaNeto).greaterThan(0) ? C.naranjaOsc : C.verde} />
        <Kpi label={`Gastos deducibles ${t}`} valor={<Euros v={r.gastosDeducibles.trimestre} />} nota={<>Año: <Euros v={r.gastosDeducibles.anio} /></>} />
      </div>

      {cobros.length > 0 && (
        <Card titulo={`⚠️ Cobros sin factura (${cobros.length})`} style={{ marginBottom: 24, borderColor: '#fcd34d' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="fac-tabla">
              <thead><tr><th>Fecha cobro</th><th>Cliente</th><th>Pasarela</th><th className="fac-num">Importe</th><th>Motivo</th><th></th></tr></thead>
              <tbody>{cobros.map((c: any) => (
                <tr key={c.invoice_id}>
                  <td>{fechaCorta(c.pagado)}</td>
                  <td>{c.nombre}<div style={{ fontSize: 11, color: C.gris }}>{c.email}</div></td>
                  <td>{c.provider}</td>
                  <td className="fac-num"><Euros v={c.importe} /></td>
                  <td style={{ color: C.ambar }}>{c.bloqueo_motivo || 'Sin factura generada'}</td>
                  <td>{c.borrador_id && <Link href={`/admin/facturacion/facturas/${c.borrador_id}`} style={{ color: C.naranjaOsc, fontWeight: 700 }}>Revisar →</Link>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Card>
      )}

      <Card titulo="Últimas facturas" extra={<Link href="/admin/facturacion/facturas" style={{ fontSize: 13, color: C.naranjaOsc, fontWeight: 700 }}>Ver todas →</Link>}>
        {ultimas.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: C.gris }}>
            Aún no hay facturas. <Link href="/admin/facturacion/facturas/nueva" style={{ color: C.naranjaOsc, fontWeight: 700 }}>Crea la primera →</Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="fac-tabla">
              <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Estado</th><th className="fac-num">Total</th></tr></thead>
              <tbody>{ultimas.map((f: any) => (
                <tr key={f.id} className="fac-click" onClick={() => location.assign(`/admin/facturacion/facturas/${f.id}`)}>
                  <td style={{ fontWeight: 700 }}>{f.num_serie_factura || <span style={{ color: C.gris }}>Borrador</span>}</td>
                  <td>{fechaCorta(f.fecha_expedicion)}</td>
                  <td>{f.fac_clientes?.razon_social || f.cliente_snapshot?.razon_social || '—'}</td>
                  <td><Estado estado={estadoVisible(f, hoy)} /></td>
                  <td className="fac-num"><Euros v={f.importe_total} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <div style={{ fontSize: 12, color: C.gris, marginTop: 16 }}>
        VeriFactu: {verifactuActivo ? 'modo activo' : 'modo desactivado'} · {r.registrosPendientesEnvio} registro(s) pendientes de envío (el envío a la AEAT aún no está implementado) · {r.borradores} borrador(es)
      </div>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [r, cobros, ultimas, ajustes] = await Promise.all([
    resumenDashboard(),
    cobrosSinFactura(),
    prisma.fac_facturas.findMany({
      orderBy: [{ emitida_at: { sort: 'desc', nulls: 'first' } }, { created_at: 'desc' }], take: 10,
      select: { id: true, num_serie_factura: true, fecha_expedicion: true, fecha_vencimiento: true, estado: true, importe_total: true, cliente_snapshot: true, fac_clientes: { select: { razon_social: true } } },
    }),
    prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } }),
  ])
  let emisorError: string | null = null
  try { validarEmisor(ajustes) } catch (e: any) { emisorError = e.message }
  return { props: aJson({ r, cobros, ultimas, emisorError, verifactuActivo: ajustes.verifactu_activo, hoy: hoyMadrid() }) }
}
