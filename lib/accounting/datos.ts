import { prisma } from '../prisma'
import { cuotaMensual } from '../admin/metricas'
import { cuotasPagadasAgentes, ofertasAgentes } from '../admin/agentes'
import { Contrato, DatosContables, Gasto, Ingreso, Linea, r2 } from './calculos'

// Carga de datos de Contabilidad (solo servidor). Reglas para no contar nada dos veces:
//   · Una factura emitida/pagada es el ingreso, por su base (ni borradores ni anuladas), en el mes de
//     su devengo: fecha de operación o, si no hay, de expedición — el mismo criterio que el 303.
//     Su cobro (Invoice o cuota de Agentes) ya no cuenta aparte.
//   · Cobros sin factura emitida (incluye los que solo tienen borrador) cuentan aparte como «sin factura».
//   · Nunca cuentan pruebas: Invoice/Subscription.isTest, cuotas u ofertas esPrueba, suscripciones borradas.

const dia = (d: Date | string) => new Date(d).toISOString().slice(0, 10)
const n = (v: unknown) => Number(v ?? 0)

/** Base de un importe con IVA incluido (los precios de los planes y cuotas lo incluyen). */
const baseDe = (total: number, iva: number) => r2(total / (1 + iva / 100))

export interface PendienteCobro { id: string; num: string; cliente: string; fecha: string; vencimiento: string | null; importe: number }

/** Facturas emitidas aún no pagadas (importe = líquido a cobrar). */
export async function pendientesDeCobro(): Promise<PendienteCobro[]> {
  const filas = await prisma.$queryRaw<any[]>`
    SELECT f.id, f.num_serie_factura AS num, f.fecha_expedicion AS fecha, f.fecha_vencimiento AS vence, f.liquido_a_cobrar AS importe,
           coalesce(fc.razon_social, f.cliente_snapshot->>'razon_social', '—') AS cliente
    FROM fac_facturas f LEFT JOIN fac_clientes fc ON fc.id = f.cliente_id
    WHERE f.estado = 'emitida' AND f.liquido_a_cobrar > 0
    ORDER BY f.fecha_vencimiento NULLS LAST, f.fecha_expedicion`
  return filas.map(f => ({ id: f.id, num: f.num, cliente: f.cliente, fecha: dia(f.fecha), vencimiento: f.vence ? dia(f.vence) : null, importe: n(f.importe) }))
}

export async function cargarDatosContables(): Promise<DatosContables & { lineas: { slug: Linea; nombre: string }[]; avisos: string[] }> {
  const avisos: string[] = []
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const iva = n(ajustes.iva_defecto)

  const [productos, facturas, cobros, gastos, subs] = await Promise.all([
    prisma.product.findMany({ select: { slug: true, name: true }, orderBy: { createdAt: 'asc' } }),
    prisma.$queryRaw<any[]>`
      SELECT f.id, f.num_serie_factura AS num, coalesce(f.fecha_operacion, f.fecha_expedicion) AS fecha,
             f.base_imponible AS base, f.cuota_iva AS iva, f.descripcion_operacion AS descripcion, f.proyecto_id, f.invoice_id, f.pago_ref, f.origen,
             coalesce(fc.razon_social, f.cliente_snapshot->>'razon_social', '—') AS cliente,
             coalesce(f.producto_slug, pr.slug, CASE WHEN f.proyecto_id IS NOT NULL THEN 'proyectos' END, 'otros') AS linea
      FROM fac_facturas f
      LEFT JOIN fac_clientes fc ON fc.id = f.cliente_id
      LEFT JOIN "Invoice" i ON i.id = f.invoice_id
      LEFT JOIN "Subscription" s ON s.id = i."subscriptionId"
      LEFT JOIN "Plan" p ON p.id = s."planId"
      LEFT JOIN "Product" pr ON pr.id = p."productId"
      WHERE f.estado IN ('emitida', 'pagada')`,
    prisma.$queryRaw<any[]>`
      SELECT i.id, i.amount, i."paidAt" AS pagado, i.provider, u.name AS cliente, pr.slug AS linea, p.name AS plan,
             (SELECT b.id FROM fac_facturas b WHERE b.invoice_id = i.id AND b.estado = 'borrador' LIMIT 1) AS borrador_id
      FROM "Invoice" i
      JOIN "User" u ON u.id = i."userId"
      JOIN "Subscription" s ON s.id = i."subscriptionId"
      JOIN "Plan" p ON p.id = s."planId"
      LEFT JOIN "Product" pr ON pr.id = p."productId"
      WHERE i.status = 'paid' AND NOT i."isTest" AND i.amount > 0 AND i."paidAt" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM fac_facturas f WHERE f.invoice_id = i.id AND f.estado IN ('emitida', 'pagada'))`,
    prisma.fac_gastos.findMany(),
    prisma.$queryRaw<any[]>`
      SELECT s.id, s.status, s."startDate" AS inicio, s."updatedAt" AS actualizada, u.name AS cliente, p.price, p.interval, pr.slug AS linea
      FROM "Subscription" s JOIN "User" u ON u.id = s."userId" JOIN "Plan" p ON p.id = s."planId" LEFT JOIN "Product" pr ON pr.id = p."productId"
      WHERE NOT s."isTest" AND s."deletedAt" IS NULL AND s."startDate" IS NOT NULL AND s.status IN ('active', 'cancelled', 'expired')`,
  ])

  const ingresos: Ingreso[] = [
    ...facturas.filter(f => f.fecha).map(f => ({
      fecha: dia(f.fecha), base: n(f.base), iva: n(f.iva), linea: f.linea, origen: 'factura' as const, ref: f.num ?? '—',
      cliente: f.cliente, descripcion: f.descripcion, facturaId: f.id, proyectoId: f.proyecto_id,
    })),
    ...cobros.map(c => {
      const base = baseDe(n(c.amount), iva)
      return {
        fecha: dia(c.pagado), base, iva: r2(n(c.amount) - base), linea: c.linea ?? 'otros', origen: 'sin_factura' as const,
        ref: `${c.provider} · ${c.id.slice(-8)}`, cliente: c.cliente, descripcion: `Cobro online · ${c.plan}`, invoiceId: c.id, facturaId: c.borrador_id,
      }
    }),
  ]

  // Agentes IA: cuotas cobradas sin factura emitida (las facturadas ya están en `facturas`)
  let ofertas: Awaited<ReturnType<typeof ofertasAgentes>> = []
  try {
    const [cuotas, ofs, facturadas] = await Promise.all([
      cuotasPagadasAgentes(),
      ofertasAgentes(),
      prisma.fac_facturas.findMany({ where: { origen: 'agentes', estado: { not: 'anulada' } }, select: { id: true, pago_ref: true, estado: true } }),
    ])
    ofertas = ofs
    const porCuota = new Map(facturadas.map(f => [f.pago_ref, f]))
    for (const c of cuotas) {
      const f = porCuota.get(c.id)
      if (f && f.estado !== 'borrador') continue
      const base = baseDe(c.importe, iva)
      ingresos.push({
        fecha: c.pagadaEn, base, iva: r2(c.importe - base), linea: 'agentes', origen: 'sin_factura', ref: `cuota · ${c.id.slice(-8)}`,
        cliente: c.razonSocial || c.negocio, descripcion: `Cuota Agentes IA ${c.periodoDesde} – ${c.periodoHasta}`, cuotaId: c.id, facturaId: f?.id ?? null,
      })
    }
  } catch (e: any) {
    console.error('[accounting] agentes_db:', e.message)
    avisos.push('No se ha podido leer la base de datos de Agentes IA: sus cuotas y ofertas no aparecen.')
  }

  const lineaGasto = (g: { producto_slug: string | null; proyecto_id: string | null }) => g.producto_slug ?? (g.proyecto_id ? 'proyectos' : 'otros')
  const listaGastos: Gasto[] = gastos.map(g => {
    const cuota = n(g.cuota_iva)
    const deducible = g.iva_deducible ? r2((cuota * n(g.deducible_pct)) / 100) : 0
    return {
      id: g.id, fecha: dia(g.fecha), base: n(g.base_imponible), coste: r2(n(g.base_imponible) + cuota - deducible), ivaDeducible: deducible,
      estado: g.estado as Gasto['estado'], linea: lineaGasto(g), categoria: g.categoria, proveedor: g.proveedor, recurrenteId: g.recurrente_id, proyectoId: g.proyecto_id,
    }
  })

  const contratos: Contrato[] = [
    ...subs.map(s => ({
      id: s.id, linea: s.linea ?? 'otros', cliente: s.cliente, mensual: cuotaMensual({ price: n(s.price), interval: s.interval }),
      inicio: dia(s.inicio), baja: s.status === 'active' ? null : dia(s.actualizada),
    })),
    ...ofertas.filter(o => o.pagadoAt).map(o => ({
      id: o.id, linea: 'agentes', cliente: o.negocio, mensual: o.mensual, inicio: o.pagadoAt,
      baja: o.canceladoAt ?? (['cancelado', 'fallido'].includes(o.estado) ? o.pagadoAt : null),
    })),
  ]

  const lineas = [
    ...productos.map(p => ({ slug: p.slug, nombre: p.name })),
    { slug: 'proyectos', nombre: 'Proyectos a medida' },
    { slug: 'otros', nombre: 'Otros / general' },
  ]
  return { ingresos, gastos: listaGastos, contratos, lineas, avisos }
}
