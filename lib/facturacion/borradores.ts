import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { D, fmt2 } from './decimal'
import { calcularLinea, calcularTotales } from './calculos'
import { fechaDb, hoyMadrid, sumarDias } from './fechas'
import { aplicaRetencionPorDefecto } from './validacion'
import { FacturacionError } from './errores'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { obtenerAjustes } from './emision'
import { texto, textoONull } from './api'

// Borradores: se editan libremente, se recalculan en servidor y no consumen número.

export const TIPOS_IVA = ['21', '10', '4', '0'] as const
export const EXENCIONES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'] as const
export const CALIFICACIONES = ['S1', 'S2', 'N1', 'N2'] as const

export interface LineaInput {
  descripcion: string
  cantidad: string | number
  precio_unitario: string | number
  descuento_pct?: string | number
  tipo_iva: string | number
  calificacion?: string
  operacion_exenta?: string | null
}

function numero(v: unknown, campo: string): string {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new FacturacionError('DATOS_INVALIDOS', `${campo} no es un número válido`)
  return s
}

export function prepararLineas(lineas: LineaInput[]) {
  if (!Array.isArray(lineas) || !lineas.length) throw new FacturacionError('SIN_LINEAS', 'Añade al menos una línea')
  return lineas.map((l, i) => {
    const descripcion = texto(l.descripcion)
    if (!descripcion) throw new FacturacionError('DATOS_INVALIDOS', `La línea ${i + 1} no tiene descripción`)
    const cantidad = numero(l.cantidad, `Cantidad (línea ${i + 1})`)
    const precio_unitario = numero(l.precio_unitario, `Precio (línea ${i + 1})`)
    const descuento_pct = numero(l.descuento_pct ?? 0, `Descuento (línea ${i + 1})`)
    if (D(descuento_pct).lessThan(0) || D(descuento_pct).greaterThan(100)) throw new FacturacionError('DATOS_INVALIDOS', `Descuento fuera de rango (línea ${i + 1})`)
    const tipo_iva = numero(l.tipo_iva, `IVA (línea ${i + 1})`)
    if (!TIPOS_IVA.includes(String(Number(tipo_iva)) as any)) throw new FacturacionError('DATOS_INVALIDOS', `Tipo de IVA no válido (línea ${i + 1})`)
    const operacion_exenta = l.operacion_exenta && EXENCIONES.includes(l.operacion_exenta as any) ? l.operacion_exenta : null
    const calificacion = CALIFICACIONES.includes(l.calificacion as any) ? l.calificacion! : 'S1'
    if (D(tipo_iva).isZero() && !operacion_exenta && !calificacion.startsWith('N'))
      throw new FacturacionError('DATOS_INVALIDOS', `IVA 0 %: indica si la línea ${i + 1} es exenta (E1–E6) o no sujeta (N1/N2)`)
    if (!D(tipo_iva).isZero() && (operacion_exenta || calificacion.startsWith('N')))
      throw new FacturacionError('DATOS_INVALIDOS', `Una línea exenta o no sujeta no puede llevar IVA (línea ${i + 1})`)
    const { base, cuota } = calcularLinea({ cantidad, precio_unitario, descuento_pct, tipo_iva })
    return { orden: i, descripcion, cantidad, precio_unitario, descuento_pct, tipo_iva, calificacion, operacion_exenta, base: fmt2(base), cuota: fmt2(cuota) }
  })
}

export interface BorradorInput {
  tipo_factura?: 'F1' | 'F2'
  cliente_id?: string | null
  destinatario_simplificada?: { razon_social?: string; nif?: string } | null
  fecha_operacion?: string | null
  fecha_vencimiento?: string | null
  descripcion_operacion?: string
  tipo_retencion?: string | number | null
  notas?: string
  lineas: LineaInput[]
}

const fechaONull = (v: unknown) => {
  const s = texto(v)
  if (!s) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new FacturacionError('DATOS_INVALIDOS', 'Fecha no válida')
  return fechaDb(s)
}

/** Crea (id = null) o actualiza un borrador. Líneas y totales se recalculan siempre aquí. */
export async function guardarBorrador(id: string | null, b: BorradorInput, actor: Actor) {
  const ajustes = await obtenerAjustes()
  const lineas = prepararLineas(b.lineas)

  return prisma.$transaction(async tx => {
    await identificarActor(tx, actor)
    const actual = id ? await tx.fac_facturas.findUnique({ where: { id } }) : null
    if (id && !actual) throw new FacturacionError('NO_ENCONTRADA', 'Borrador no encontrado')
    if (actual && actual.estado !== 'borrador') throw new FacturacionError('ESTADO_INVALIDO', 'Solo se pueden editar borradores')

    const cliente = b.cliente_id ? await tx.fac_clientes.findUnique({ where: { id: b.cliente_id } }) : null
    if (b.cliente_id && !cliente) throw new FacturacionError('DATOS_INVALIDOS', 'Cliente no encontrado')

    // Rectificativas conservan su tipo; el resto es F1 con cliente o F2 sin él (o si se elige).
    const esRect = actual?.tipo_factura.startsWith('R')
    const tipo_factura = esRect ? actual!.tipo_factura : (b.tipo_factura === 'F2' || !cliente ? 'F2' : 'F1')

    const tipo_retencion = b.tipo_retencion !== undefined && b.tipo_retencion !== null && String(b.tipo_retencion) !== ''
      ? numero(b.tipo_retencion, 'Retención')
      : (cliente?.aplica_retencion ?? (cliente ? aplicaRetencionPorDefecto(cliente.tipo, cliente.pais) : false)) ? ajustes.retencion_defecto.toString() : '0'
    if (D(tipo_retencion).lessThan(0) || D(tipo_retencion).greaterThan(50)) throw new FacturacionError('DATOS_INVALIDOS', 'Retención fuera de rango')

    // Borrador de un cobro online (IVA incluido): las líneas que no cambian conservan su base y
    // cuota originales, para que el total siga cuadrando al céntimo con lo cobrado.
    if (actual?.pago_ref) {
      const previas = await tx.fac_lineas.findMany({ where: { factura_id: actual.id }, orderBy: { orden: 'asc' } })
      lineas.forEach((l, i) => {
        const p = previas[i]
        if (p && p.descripcion === l.descripcion && D(p.cantidad).equals(l.cantidad) && D(p.precio_unitario).equals(l.precio_unitario)
          && D(p.descuento_pct).equals(l.descuento_pct) && D(p.tipo_iva).equals(l.tipo_iva)) {
          l.base = fmt2(p.base); l.cuota = fmt2(p.cuota)
        }
      })
    }

    const tot = calcularTotales(lineas, tipo_retencion)
    const descripcion = (texto(b.descripcion_operacion) || lineas[0].descripcion).slice(0, 500)
    const dest = b.destinatario_simplificada
    const data = {
      tipo_factura,
      serie_codigo: esRect ? 'R' : tipo_factura === 'F2' ? 'S' : 'F',
      cliente_id: cliente?.id ?? null,
      cliente_snapshot: !cliente && dest && (texto(dest.razon_social) || texto(dest.nif))
        ? { razon_social: texto(dest.razon_social), nif: texto(dest.nif).toUpperCase() } as Prisma.InputJsonValue
        : undefined,
      fecha_operacion: fechaONull(b.fecha_operacion),
      fecha_vencimiento: fechaONull(b.fecha_vencimiento),
      descripcion_operacion: descripcion,
      tipo_retencion,
      base_imponible: fmt2(tot.base_imponible),
      cuota_iva: fmt2(tot.cuota_iva),
      importe_total: fmt2(tot.importe_total),
      cuota_retencion: fmt2(tot.cuota_retencion),
      liquido_a_cobrar: fmt2(tot.liquido_a_cobrar),
      notas: textoONull(b.notas),
      bloqueo_motivo: null,
      updated_at: new Date(),
    }

    if (actual) {
      await tx.fac_lineas.deleteMany({ where: { factura_id: actual.id } })
      const f = await tx.fac_facturas.update({ where: { id: actual.id }, data: { ...data, fac_lineas: { create: lineas } } })
      await registrarEvento(tx, actor, 'borrador.actualizado', 'factura', f.id, { total: fmt2(tot.importe_total) })
      return f
    }
    const f = await tx.fac_facturas.create({ data: { ...data, origen: 'manual', created_by: actor.usuario, fac_lineas: { create: lineas } } })
    await registrarEvento(tx, actor, 'borrador.creado', 'factura', f.id, { total: fmt2(tot.importe_total) })
    return f
  })
}

export async function eliminarBorrador(id: string, actor: Actor) {
  const f = await prisma.fac_facturas.findUnique({ where: { id } })
  if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Borrador no encontrado')
  if (f.estado !== 'borrador') throw new FacturacionError('ESTADO_INVALIDO', 'Solo se pueden eliminar borradores')
  await prisma.fac_facturas.delete({ where: { id } })
  await registrarEvento(prisma, actor, 'borrador.eliminado', 'factura', id, { total: fmt2(f.importe_total), origen: f.origen })
}

/** Nuevo borrador con el mismo cliente y líneas (vencimiento recalculado al emitir). */
export async function duplicarFactura(id: string, actor: Actor) {
  const f = await prisma.fac_facturas.findUnique({ where: { id }, include: { fac_lineas: { orderBy: { orden: 'asc' } } } })
  if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
  if (f.tipo_factura.startsWith('R')) throw new FacturacionError('DATOS_INVALIDOS', 'Las rectificativas no se duplican')
  const nuevo = await guardarBorrador(null, {
    tipo_factura: f.tipo_factura as 'F1' | 'F2',
    cliente_id: f.cliente_id,
    destinatario_simplificada: !f.cliente_id ? (f.cliente_snapshot as any) : null,
    descripcion_operacion: f.descripcion_operacion,
    tipo_retencion: f.tipo_retencion.toString(),
    notas: f.notas ?? undefined,
    lineas: f.fac_lineas.map(l => ({
      descripcion: l.descripcion, cantidad: l.cantidad.toString(), precio_unitario: l.precio_unitario.toString(),
      descuento_pct: l.descuento_pct.toString(), tipo_iva: l.tipo_iva.toString(), calificacion: l.calificacion, operacion_exenta: l.operacion_exenta,
    })),
  }, actor)
  await registrarEvento(prisma, actor, 'factura.duplicada', 'factura', nuevo.id, { origen: f.num_serie_factura ?? f.id })
  return nuevo
}

/** Vencimiento por defecto para mostrar en el editor. */
export function vencimientoPorDefecto(dias: number) {
  return sumarDias(hoyMadrid(), dias)
}
