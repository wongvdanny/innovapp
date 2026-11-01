import Link from 'next/link'
import { useState } from 'react'
import { Badge, Button, Column, DataTable, EmptyState, Notice, Section, euros, fecha, useFlash } from '../ui'
import type { Ingreso } from '../../../lib/accounting/calculos'
import type { LineaInfo, PendienteCobro } from './Resumen'

export interface ProyectoMin { id: string; nombre: string }

/** Selector de línea de negocio / proyecto para una factura o un gasto (PUT /api/admin/accounting/atribucion). */
export function Atribucion({ tipo, id, linea, proyectoId, lineas, proyectos, onCambio }: {
  tipo: 'factura' | 'gasto'; id: string; linea: string; proyectoId?: string | null; lineas: LineaInfo[]; proyectos: ProyectoMin[]; onCambio: () => void
}) {
  const [guardando, setGuardando] = useState(false)
  const guardar = async (producto_slug: string, proyecto_id: string) => {
    setGuardando(true)
    await fetch('/api/admin/accounting/atribucion', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, id, producto_slug: producto_slug === 'otros' ? '' : producto_slug, proyecto_id }),
    })
    setGuardando(false)
    onCambio()
  }
  return (
    <div className="adm-fila" style={{ gap: 4, flexWrap: 'nowrap' }}>
      <select className="adm-input" style={{ width: 150, padding: '5px 8px', fontSize: 12 }} value={linea} disabled={guardando}
        onChange={e => guardar(e.target.value, proyectoId ?? '')} aria-label="Línea de negocio">
        {lineas.map(l => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
      </select>
      {proyectos.length > 0 && (
        <select className="adm-input" style={{ width: 140, padding: '5px 8px', fontSize: 12 }} value={proyectoId ?? ''} disabled={guardando}
          onChange={e => guardar(e.target.value ? 'proyectos' : linea, e.target.value)} aria-label="Proyecto">
          <option value="">Sin proyecto</option>
          {proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      )}
    </div>
  )
}

export default function Ingresos({ mes, hoy, ingresos, sinFactura, pendientes, lineas, proyectos, recargar }: {
  mes: string; hoy: string; ingresos: Ingreso[]; sinFactura: Ingreso[]; pendientes: PendienteCobro[]; lineas: LineaInfo[]; proyectos: ProyectoMin[]; recargar: () => void
}) {
  const { show, Flash } = useFlash()
  const [facturando, setFacturando] = useState<string | null>(null)

  const facturar = async (i: Ingreso) => {
    if (!confirm(`Se creará un BORRADOR de factura para la cuota de ${i.cliente} (${euros(i.base + i.iva)} IVA incluido). Lo revisas y lo emites en Facturación. ¿Continuar?`)) return
    setFacturando(i.cuotaId!)
    const r = await fetch('/api/admin/accounting/facturar-cuota', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cuotaId: i.cuotaId }) })
    const d = await r.json().catch(() => ({}))
    setFacturando(null)
    if (r.ok) { show(true, d.existente ? 'Ya tenía un borrador: ábrelo en Facturación.' : 'Borrador creado en Facturación.'); recargar() }
    else show(false, d.error || 'No se ha podido crear el borrador')
  }

  const origen = (i: Ingreso) => i.origen === 'factura' ? <Badge tone="ok">Factura</Badge> : <Badge tone="warn">Sin factura</Badge>
  const columnas: Column<Ingreso>[] = [
    { key: 'f', header: 'Fecha', render: i => <span suppressHydrationWarning>{fecha(i.fecha)}</span> },
    { key: 'o', header: 'Origen', render: origen },
    { key: 'r', header: 'Referencia', render: i => i.facturaId && i.origen === 'factura' ? <Link href={`/admin/facturacion/facturas/${i.facturaId}`} style={{ color: 'var(--adm-accent)', fontWeight: 700 }}>{i.ref}</Link> : <span className="adm-muted">{i.ref}</span> },
    { key: 'c', header: 'Cliente', render: i => <><div className="adm-fuerte">{i.cliente}</div><div className="adm-muted adm-peq">{i.descripcion}</div></> },
    {
      key: 'l', header: 'Línea / proyecto', render: i => i.origen === 'factura' && i.facturaId
        ? <Atribucion tipo="factura" id={i.facturaId} linea={i.linea} proyectoId={i.proyectoId} lineas={lineas} proyectos={proyectos} onCambio={recargar} />
        : <span>{lineas.find(l => l.slug === i.linea)?.nombre ?? i.linea}</span>,
    },
    { key: 'b', header: 'Base', num: true, render: i => <span className="adm-fuerte">{euros(i.base)}</span> },
  ]

  return (
    <div className="adm-stack">
      <Flash />
      <Section padded={false} title={`Ingresos de ${mes}`} subtitle="Facturas emitidas o pagadas (base, por fecha de operación o, si no hay, de expedición, como el 303; ni borradores ni anuladas) y cobros online aún sin factura. La línea de una factura se puede cambiar: es un dato interno.">
        <DataTable columns={columnas} rows={ingresos} rowKey={i => i.facturaId ?? i.invoiceId ?? i.cuotaId ?? i.ref} empty={<EmptyState icon="💶" title="Sin ingresos este mes" />} />
      </Section>

      <Section padded={false} title={`Pendiente de cobro (${pendientes.length})`}
        subtitle="Facturas emitidas aún no pagadas, de cualquier mes. Ya cuentan como ingreso en su mes de devengo; aquí se sigue el cobro."
        actions={pendientes.length > 0 ? <strong>{euros(pendientes.reduce((a, p) => a + p.importe, 0))}</strong> : undefined}>
        {pendientes.length === 0 ? <EmptyState icon="✅" title="Todas las facturas emitidas están cobradas" /> : (
          <DataTable rows={pendientes} rowKey={p => p.id} columns={[
            { key: 'n', header: 'Factura', render: p => <Link href={`/admin/facturacion/facturas/${p.id}`} style={{ color: 'var(--adm-accent)', fontWeight: 700 }}>{p.num}</Link> },
            { key: 'c', header: 'Cliente', render: p => <span className="adm-fuerte">{p.cliente}</span> },
            { key: 'f', header: 'Expedida', render: p => <span suppressHydrationWarning>{fecha(p.fecha)}</span> },
            {
              key: 'v', header: 'Vence', render: p => p.vencimiento && p.vencimiento < hoy
                ? <Badge tone="err">Vencida · {fecha(p.vencimiento)}</Badge>
                : <span className="adm-muted" suppressHydrationWarning>{fecha(p.vencimiento)}</span>,
            },
            { key: 'i', header: 'A cobrar', num: true, render: p => <span className="adm-fuerte">{euros(p.importe)}</span> },
          ]} />
        )}
      </Section>

      <Section padded={false} title={`Cobros sin factura (${sinFactura.length})`}
        subtitle="Cuentan como ingreso una sola vez: en cuanto se emite su factura, cuentan por la factura y desaparecen de aquí.">
        {sinFactura.length === 0 ? <EmptyState icon="✅" title="Todos los cobros tienen factura" /> : (
          <DataTable rows={sinFactura} rowKey={i => i.invoiceId ?? i.cuotaId ?? i.ref} columns={[
            { key: 'f', header: 'Cobrado', render: i => <span suppressHydrationWarning>{fecha(i.fecha)}</span> },
            { key: 'c', header: 'Cliente', render: i => <><div className="adm-fuerte">{i.cliente}</div><div className="adm-muted adm-peq">{i.descripcion}</div></> },
            { key: 'l', header: 'Línea', render: i => lineas.find(l => l.slug === i.linea)?.nombre ?? i.linea },
            { key: 't', header: 'Total', num: true, render: i => euros(i.base + i.iva) },
            {
              key: 'a', header: 'Acción', render: i => i.facturaId
                ? <Link className="adm-btn peq" href={`/admin/facturacion/facturas/${i.facturaId}`}>Ver borrador</Link>
                : i.cuotaId
                  ? <Button small variant="primario" disabled={facturando === i.cuotaId} onClick={() => facturar(i)}>{facturando === i.cuotaId ? 'Creando…' : 'Facturar'}</Button>
                  : <Link className="adm-btn peq" href="/admin/facturacion">Revisar en Facturación</Link>,
            },
          ]} />
        )}
      </Section>
      <Notice tone="info">Los cobros de Stripe/Redsys se facturan solos cuando la pasarela está en producción; los que quedan aquí necesitan revisión en Facturación. Las cuotas de Agentes IA se facturan con «Facturar» (crea un borrador).</Notice>
    </div>
  )
}
