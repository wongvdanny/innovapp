import type { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { D, fmt2 } from './decimal'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { FacturacionError } from './errores'

type Tx = Prisma.TransactionClient

export type TipoRectificacion = 'S' | 'I'
export type CodigoRectificativa = 'R1' | 'R2' | 'R3' | 'R4' | 'R5'

export interface OpcionesRectificativa {
  /** S = por sustitución (líneas corregidas completas) · I = por diferencias (solo el ajuste). */
  tipo: TipoRectificacion
  motivo: string
  /** R1 por defecto (art. 80.Uno, Dos y Seis LIVA / error fundado en derecho); R5 si la original es simplificada. */
  codigo?: Exclude<CodigoRectificativa, 'R5'>
}

/**
 * Crea un borrador de rectificativa precargado desde una factura emitida:
 *  - I (diferencias): las líneas originales en negativo, para ajustar lo que proceda.
 *  - S (sustitución): las líneas originales tal cual, para corregirlas; guarda base y cuota rectificadas.
 * El borrador no consume número: se numera en la serie R al emitirlo.
 */
export async function crearRectificativaEnTx(tx: Tx, originalId: string, o: OpcionesRectificativa, actor: Actor) {
  if (!o.motivo?.trim()) throw new FacturacionError('DATOS_INVALIDOS', 'Indica el motivo de la rectificación')
  if (!['S', 'I'].includes(o.tipo)) throw new FacturacionError('DATOS_INVALIDOS', 'Tipo de rectificación no válido')
  await identificarActor(tx, actor)

  const orig = await tx.fac_facturas.findUnique({ where: { id: originalId }, include: { fac_lineas: { orderBy: { orden: 'asc' } } } })
  if (!orig) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
  if (!['emitida', 'pagada'].includes(orig.estado))
    throw new FacturacionError('RECTIFICADA_INVALIDA', `No se puede rectificar una factura ${orig.estado}`)

  const simplificada = orig.tipo_factura === 'F2' || orig.tipo_factura === 'R5'
  const signo = o.tipo === 'I' ? -1 : 1

  const borrador = await tx.fac_facturas.create({
    data: {
      serie_codigo: 'R',
      tipo_factura: simplificada ? 'R5' : (o.codigo ?? 'R1'),
      cliente_id: orig.cliente_id,
      cliente_snapshot: simplificada && !orig.cliente_id ? (orig.cliente_snapshot as Prisma.InputJsonValue) : undefined,
      descripcion_operacion: `Rectificación de ${orig.num_serie_factura}: ${o.motivo.trim()}`.slice(0, 500),
      tipo_retencion: orig.tipo_retencion,
      rectificada_id: orig.id,
      tipo_rectificacion: o.tipo,
      motivo_rectificacion: o.motivo.trim(),
      base_rectificada: o.tipo === 'S' ? orig.base_imponible : null,
      cuota_rectificada: o.tipo === 'S' ? orig.cuota_iva : null,
      origen: 'manual',
      created_by: actor.usuario,
      fac_lineas: {
        create: orig.fac_lineas.map((l, i) => ({
          orden: i,
          descripcion: l.descripcion,
          cantidad: D(l.cantidad).times(signo).toString(),
          precio_unitario: l.precio_unitario,
          descuento_pct: l.descuento_pct,
          tipo_iva: l.tipo_iva,
          clave_regimen: l.clave_regimen,
          calificacion: l.calificacion,
          operacion_exenta: l.operacion_exenta,
          base: fmt2(D(l.base).times(signo)),
          cuota: fmt2(D(l.cuota).times(signo)),
        })),
      },
    },
  })
  await registrarEvento(tx, actor, 'factura.rectificativa_creada', 'factura', borrador.id, {
    rectificada: orig.num_serie_factura, tipo: o.tipo, motivo: o.motivo.trim(),
  })
  return borrador
}

export function crearRectificativa(originalId: string, o: OpcionesRectificativa, actor: Actor) {
  return prisma.$transaction(tx => crearRectificativaEnTx(tx, originalId, o, actor))
}
