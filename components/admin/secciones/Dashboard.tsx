import Link from 'next/link'
import { Badge, Column, DataTable, EmptyState, KpiCard, KpiGrid, Notice, Section, euros } from '../ui'
import { ProductoMenu, presentacion } from '../../../lib/admin/productos'
import { SuscripcionAdmin, cuotaMensual, productoDe, resumen, resumenPorProducto, tieneTenant } from '../../../lib/admin/metricas'

export interface DatosDashboard {
  subs: SuscripcionAdmin[]
  productos: ProductoMenu[]
  facturacion: { pendienteCobro: { importe: string; facturas: number }; vencido: { importe: string; facturas: number }; borradores: number; cobrosSinFactura: number }
}

// Productos cuyo alta crea un tenant (activate-subscription): si están activos sin tenant, falta provisionar.
const CON_TENANT = ['servix', 'gymstack']

export default function Dashboard({ subs, productos, facturacion }: DatosDashboard) {
  const total = resumen(subs)
  const porProducto = resumenPorProducto(subs)
  const filas = [
    ...productos.map(p => ({ slug: p.slug as string | null, name: p.name, ...(porProducto.find(x => x.slug === p.slug) ?? { activas: 0, pendientes: 0, canceladas: 0, mrr: 0, pagando: 0 }) })),
    ...porProducto.filter(x => x.slug === null).map(x => ({ ...x, name: 'Sin producto' })),
  ]

  const pendientes = subs.filter(s => s.status === 'pending')
  const sinTenant = subs.filter(s => s.status === 'active' && CON_TENANT.includes(productoDe(s) ?? '') && !tieneTenant(s))

  const columnas: Column<(typeof filas)[number]>[] = [
    {
      key: 'p', header: 'Producto', render: f => f.slug
        ? <Link href={`/admin/productos/${f.slug}`} className="adm-fila" style={{ fontWeight: 700 }}><span className="adm-punto" style={{ background: presentacion(f.slug).color }} />{f.name}</Link>
        : <Badge tone="warn">{f.name}</Badge>,
    },
    { key: 'a', header: 'Activas', num: true, render: f => f.activas },
    { key: 'pg', header: 'De pago', num: true, render: f => f.pagando },
    { key: 'pe', header: 'Pendientes', num: true, render: f => f.pendientes || <span className="adm-faint">0</span> },
    { key: 'b', header: 'Bajas', num: true, render: f => f.canceladas || <span className="adm-faint">0</span> },
    { key: 'm', header: 'MRR', num: true, render: f => <span className="adm-fuerte">{euros(f.mrr)}</span> },
  ]

  return (
    <div className="adm-stack">
      <Notice tone="info">
        MRR estimado con el precio actual de los planes (IVA incluido; los anuales cuentan /12). Las cifras de ingresos reales, gastos y beneficio llegan con Contabilidad.
      </Notice>

      <KpiGrid>
        <KpiCard label="MRR estimado" value={euros(total.mrr, 0)} note={`ARR ${euros(total.mrr * 12, 0)}`} color="var(--adm-accent)" />
        <KpiCard label="Suscripciones activas" value={total.activas} note={`${total.pagando} de pago`} color="var(--adm-ok)" />
        <KpiCard label="Pendientes de pago" value={total.pendientes} color="var(--adm-warn)" />
        <KpiCard label="Canceladas / expiradas" value={total.canceladas} color="var(--adm-err)" />
      </KpiGrid>

      <Section padded={false} title="Por producto" actions={<Link href="/admin/productos" className="adm-btn peq">Ver productos</Link>}>
        <DataTable columns={columnas} rows={filas} rowKey={f => f.slug ?? 'sin'} />
      </Section>

      <div className="adm-grid" style={{ ['--min' as any]: '340px', alignItems: 'start' }}>
        <Section title="Facturación" actions={<Link href="/admin/facturacion" className="adm-btn peq">Abrir</Link>}>
          <div className="adm-grid" style={{ ['--min' as any]: '140px' }}>
            <div><div className="adm-muted adm-peq">Pendiente de cobro</div><div style={{ fontSize: 20, fontWeight: 800 }}>{euros(+facturacion.pendienteCobro.importe)}</div><div className="adm-muted adm-peq">{facturacion.pendienteCobro.facturas} facturas</div></div>
            <div><div className="adm-muted adm-peq">Vencido</div><div style={{ fontSize: 20, fontWeight: 800, color: facturacion.vencido.facturas ? 'var(--adm-err)' : undefined }}>{euros(+facturacion.vencido.importe)}</div><div className="adm-muted adm-peq">{facturacion.vencido.facturas} facturas</div></div>
          </div>
          {(facturacion.cobrosSinFactura > 0 || facturacion.borradores > 0) && (
            <Notice tone="aviso" style={{ marginTop: 16 }}>
              {facturacion.cobrosSinFactura > 0 && <div>⚠️ {facturacion.cobrosSinFactura} cobro(s) online sin factura.</div>}
              {facturacion.borradores > 0 && <div>📝 {facturacion.borradores} borrador(es) de factura.</div>}
            </Notice>
          )}
        </Section>

        <Section title="Requiere atención" actions={<Link href="/admin/clientes" className="adm-btn peq">Clientes</Link>}>
          {pendientes.length === 0 && sinTenant.length === 0 ? <EmptyState icon="✅" title="Nada pendiente" /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sinTenant.map(s => (
                <div key={s.id} className="adm-lista-item"><span><strong>{s.user.name}</strong> · activa sin tenant ({productoDe(s)})</span><Badge tone="warn">Provisionar</Badge></div>
              ))}
              {pendientes.map(s => (
                <div key={s.id} className="adm-lista-item"><span><strong>{s.user.name}</strong> · {s.plan.name} {cuotaMensual(s.plan) > 0 ? `· ${s.plan.price}€` : ''}</span><Badge tone="warn">Pendiente de pago</Badge></div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
