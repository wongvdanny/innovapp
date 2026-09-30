import { prisma } from '../prisma'
import { hoyMadrid } from './fechas'

export interface Periodo { anio: number; trimestre: number; desde: string; hasta: string; desdeAnio: string; hastaAnio: string }

export function periodoActual(hoy = hoyMadrid()): Periodo {
  const anio = +hoy.slice(0, 4)
  const trimestre = Math.floor((+hoy.slice(5, 7) - 1) / 3) + 1
  const mIni = (trimestre - 1) * 3 + 1
  const finTrim = new Date(Date.UTC(anio, mIni + 2, 0)).toISOString().slice(0, 10)
  return { anio, trimestre, desde: `${anio}-${String(mIni).padStart(2, '0')}-01`, hasta: finTrim, desdeAnio: `${anio}-01-01`, hastaAnio: `${anio}-12-31` }
}

const n = (v: unknown) => (v === null || v === undefined ? '0.00' : String(v))

/** Cifras del dashboard, por fecha de devengo (operación o, si no hay, expedición) como los informes.
 * Las anuladas no cuentan; las rectificativas restan (importes negativos). */
export async function resumenDashboard(p: Periodo = periodoActual()) {
  const hoy = hoyMadrid()
  const [emitidas] = await prisma.$queryRaw<any[]>`
    SELECT
      coalesce(sum(base_imponible)  FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desde}::date AND ${p.hasta}::date), 0)::numeric(12,2)::text     AS base_trim,
      coalesce(sum(base_imponible)  FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desdeAnio}::date AND ${p.hastaAnio}::date), 0)::numeric(12,2)::text AS base_anio,
      coalesce(sum(cuota_iva)       FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desde}::date AND ${p.hasta}::date), 0)::numeric(12,2)::text     AS iva_rep_trim,
      coalesce(sum(cuota_iva)       FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desdeAnio}::date AND ${p.hastaAnio}::date), 0)::numeric(12,2)::text AS iva_rep_anio,
      coalesce(sum(cuota_retencion) FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desde}::date AND ${p.hasta}::date), 0)::numeric(12,2)::text     AS ret_trim,
      coalesce(sum(cuota_retencion) FILTER (WHERE coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${p.desdeAnio}::date AND ${p.hastaAnio}::date), 0)::numeric(12,2)::text AS ret_anio,
      coalesce(sum(liquido_a_cobrar) FILTER (WHERE estado = 'emitida'), 0)::numeric(12,2)::text AS pendiente,
      count(*) FILTER (WHERE estado = 'emitida')::int AS pendientes_n,
      coalesce(sum(liquido_a_cobrar) FILTER (WHERE estado = 'emitida' AND fecha_vencimiento < ${hoy}::date), 0)::numeric(12,2)::text AS vencido,
      count(*) FILTER (WHERE estado = 'emitida' AND fecha_vencimiento < ${hoy}::date)::int AS vencidas_n
    FROM fac_facturas WHERE estado IN ('emitida', 'pagada')`
  const [gastos] = await prisma.$queryRaw<any[]>`
    SELECT
      coalesce(sum(cuota_iva * deducible_pct / 100) FILTER (WHERE iva_deducible AND fecha BETWEEN ${p.desde}::date AND ${p.hasta}::date), 0)::numeric(12,2)::text AS iva_sop_trim,
      coalesce(sum(cuota_iva * deducible_pct / 100) FILTER (WHERE iva_deducible AND fecha BETWEEN ${p.desdeAnio}::date AND ${p.hastaAnio}::date), 0)::numeric(12,2)::text AS iva_sop_anio,
      coalesce(sum(base_imponible * deducible_pct / 100) FILTER (WHERE fecha BETWEEN ${p.desde}::date AND ${p.hasta}::date), 0)::numeric(12,2)::text AS gastos_trim,
      coalesce(sum(base_imponible * deducible_pct / 100) FILTER (WHERE fecha BETWEEN ${p.desdeAnio}::date AND ${p.hastaAnio}::date), 0)::numeric(12,2)::text AS gastos_anio
    FROM fac_gastos`
  const [otros] = await prisma.$queryRaw<any[]>`
    SELECT
      (SELECT count(*) FROM fac_facturas WHERE estado = 'borrador')::int AS borradores,
      (SELECT count(*) FROM fac_registros_verifactu WHERE estado_envio = 'pendiente')::int AS registros_pendientes`

  return {
    periodo: p,
    facturado: { trimestre: n(emitidas.base_trim), anio: n(emitidas.base_anio) },
    ivaRepercutido: { trimestre: n(emitidas.iva_rep_trim), anio: n(emitidas.iva_rep_anio) },
    ivaSoportado: { trimestre: n(gastos.iva_sop_trim), anio: n(gastos.iva_sop_anio) },
    gastosDeducibles: { trimestre: n(gastos.gastos_trim), anio: n(gastos.gastos_anio) },
    retenciones: { trimestre: n(emitidas.ret_trim), anio: n(emitidas.ret_anio) },
    pendienteCobro: { importe: n(emitidas.pendiente), facturas: emitidas.pendientes_n },
    vencido: { importe: n(emitidas.vencido), facturas: emitidas.vencidas_n },
    borradores: otros.borradores,
    registrosPendientesEnvio: otros.registros_pendientes,
  }
}

/**
 * Cobros online confirmados desde el inicio de actividad sin factura emitida:
 * sin factura, o con un borrador bloqueado (bloqueo_motivo).
 */
export async function cobrosSinFactura() {
  const ajustes = await prisma.fac_ajustes.findUnique({ where: { id: 1 } })
  const inicio = ajustes?.fecha_inicio_actividad ?? new Date('2026-10-01')
  return prisma.$queryRaw<any[]>`
    SELECT i.id AS invoice_id, i.amount::text AS importe, i.provider, i."providerRef" AS ref, i."paidAt" AS pagado,
           u.name AS nombre, u.email, f.id AS borrador_id, f.bloqueo_motivo
    FROM "Invoice" i
    JOIN "User" u ON u.id = i."userId"
    LEFT JOIN fac_facturas f ON f.invoice_id = i.id
    WHERE i.status = 'paid' AND i."paidAt" >= ${inicio} AND i.amount > 0
      AND (f.id IS NULL OR f.estado = 'borrador')
    ORDER BY i."paidAt" DESC`
}
