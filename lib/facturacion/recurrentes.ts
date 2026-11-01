import { prisma } from '../prisma'
import { D, fmt2 } from './decimal'
import { calcularLinea, calcularTotales } from './calculos'
import { hoyMadrid, isoFecha, fechaDb } from './fechas'
import { prepararLineas, LineaInput } from './borradores'
import { emitirFactura } from './emision'
import { asegurarPdf } from './documentos'
import { enviarFactura } from './envio'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { FacturacionError, esFacturacionError } from './errores'
import { texto } from './api'

// Facturas recurrentes (igualas mensuales). Las genera el cron el día indicado de cada mes.
// Las recurrentes de tipo 'gasto' no emiten nada: generan gastos «previstos» (procesarGastosRecurrentes).
// En la descripción de las líneas se pueden usar {mes} y {año} del periodo facturado.

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** Primera fecha con día `dia` que sea >= `desde` (YYYY-MM-DD). */
export function proximaFecha(dia: number, desde: string): string {
  const [y, m, d] = desde.split('-').map(Number)
  const f = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  if (d <= dia) return f(y, m)
  return m === 12 ? f(y + 1, 1) : f(y, m + 1)
}

/** El mismo día del mes siguiente. */
export function mesSiguiente(fecha: string, dia: number): string {
  const [y, m] = fecha.split('-').map(Number)
  return proximaFecha(dia, m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`)
}

export function sustituirPeriodo(texto: string, fecha: string) {
  const [y, m] = fecha.split('-').map(Number)
  return texto.replace(/\{mes\}/g, MESES[m - 1]).replace(/\{año\}|\{anio\}/g, String(y))
}

export async function guardarRecurrente(id: string | null, b: any, actor: Actor) {
  const cliente = b.cliente_id ? await prisma.fac_clientes.findUnique({ where: { id: String(b.cliente_id) } }) : null
  if (!cliente?.activo) throw new FacturacionError('DATOS_INVALIDOS', 'Elige un cliente activo')
  const descripcion = texto(b.descripcion)
  if (!descripcion) throw new FacturacionError('DATOS_INVALIDOS', 'Pon un nombre a la recurrente (p. ej. «Iguala mensual»)')
  const dia = parseInt(String(b.dia_mes), 10)
  if (!(dia >= 1 && dia <= 28)) throw new FacturacionError('DATOS_INVALIDOS', 'El día del mes debe estar entre 1 y 28')
  const lineas: LineaInput[] = (b.lineas || []).map((l: any) => ({
    descripcion: texto(l.descripcion), cantidad: String(l.cantidad ?? '1'), precio_unitario: String(l.precio_unitario ?? ''),
    descuento_pct: String(l.descuento_pct ?? '0'), tipo_iva: String(l.tipo_iva ?? '21'),
  }))
  prepararLineas(lineas) // valida (lanza si hay errores)
  const proxima = texto(b.proxima_fecha) || proximaFecha(dia, hoyMadrid())
  if (!/^\d{4}-\d{2}-\d{2}$/.test(proxima)) throw new FacturacionError('DATOS_INVALIDOS', 'Fecha de la próxima factura no válida')

  const data = {
    cliente_id: cliente.id, descripcion, lineas: lineas as any, dia_mes: dia, proxima_fecha: fechaDb(proxima),
    emitir_auto: b.emitir_auto !== false, enviar_email: b.enviar_email !== false, activo: b.activo !== false, updated_at: new Date(),
  }
  const r = id ? await prisma.fac_recurrentes.update({ where: { id }, data }) : await prisma.fac_recurrentes.create({ data })
  await registrarEvento(prisma, actor, id ? 'recurrente.actualizada' : 'recurrente.creada', 'recurrente', r.id,
    { cliente: cliente.razon_social, dia_mes: dia, proxima_fecha: proxima, activo: r.activo })
  return r
}

export interface ResultadoRecurrente { recurrenteId: string; periodo: string; facturaId?: string; numero?: string | null; estado: 'emitida' | 'borrador' | 'error'; detalle?: string }

/**
 * Genera las facturas de las recurrentes con proxima_fecha <= hoy. Paso 1 (una transacción):
 * bloquea la recurrente, crea el borrador y avanza la fecha — así nunca se duplica un periodo.
 * Paso 2: emite y envía; si falla, el borrador queda con bloqueo_motivo para revisarlo.
 */
export async function procesarRecurrentes(actor: Actor = { usuario: 'cron' }, ahora = new Date()): Promise<ResultadoRecurrente[]> {
  const hoy = hoyMadrid(ahora)
  const pendientes = await prisma.fac_recurrentes.findMany({ where: { tipo: 'factura', activo: true, proxima_fecha: { lte: fechaDb(hoy) } }, select: { id: true } })
  const res: ResultadoRecurrente[] = []
  for (const { id } of pendientes) {
    for (let vuelta = 0; vuelta < 12; vuelta++) { // pone al día como mucho 12 periodos atrasados
      const paso1 = await prisma.$transaction(async tx => {
        await identificarActor(tx, actor)
        const [r] = await tx.$queryRaw<any[]>`SELECT * FROM fac_recurrentes WHERE id = ${id} FOR UPDATE`
        if (!r?.activo || r.tipo !== 'factura' || isoFecha(r.proxima_fecha) > hoy) return null
        const periodo = isoFecha(r.proxima_fecha)
        const cliente = await tx.fac_clientes.findUniqueOrThrow({ where: { id: r.cliente_id } })
        const ajustes = await tx.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
        const lineas = prepararLineas((r.lineas as LineaInput[]).map(l => ({ ...l, descripcion: sustituirPeriodo(l.descripcion, periodo) })))
        const tipoRet = cliente.aplica_retencion ? ajustes.retencion_defecto.toString() : '0'
        const tot = calcularTotales(lineas, tipoRet)
        const f = await tx.fac_facturas.create({
          data: {
            serie_codigo: 'F', tipo_factura: 'F1', cliente_id: cliente.id, origen: 'recurrente', recurrente_id: r.id,
            descripcion_operacion: sustituirPeriodo(`${r.descripcion} — {mes} {año}`, periodo).slice(0, 500),
            tipo_retencion: tipoRet, created_by: actor.usuario,
            base_imponible: fmt2(tot.base_imponible), cuota_iva: fmt2(tot.cuota_iva), importe_total: fmt2(tot.importe_total),
            cuota_retencion: fmt2(tot.cuota_retencion), liquido_a_cobrar: fmt2(tot.liquido_a_cobrar),
            fac_lineas: { create: lineas },
          },
        })
        await tx.fac_recurrentes.update({ where: { id: r.id }, data: { proxima_fecha: fechaDb(mesSiguiente(periodo, r.dia_mes)), ultima_factura_id: f.id, updated_at: new Date() } })
        return { facturaId: f.id, periodo, emitir: r.emitir_auto, enviar: r.enviar_email, email: cliente.email }
      })
      if (!paso1) break

      const r: ResultadoRecurrente = { recurrenteId: id, periodo: paso1.periodo, facturaId: paso1.facturaId, estado: 'borrador' }
      if (paso1.emitir) {
        try {
          const f = await emitirFactura(paso1.facturaId, actor, { ahora })
          Object.assign(r, { estado: 'emitida', numero: f.num_serie_factura })
          await asegurarPdf(f.id).catch(() => null)
          if (paso1.enviar && paso1.email) {
            await enviarFactura(f.id, { to: paso1.email }, actor).catch(e => { r.detalle = `emitida, pero el email falló: ${e.message}` })
          }
        } catch (e: any) {
          if (!esFacturacionError(e)) throw e
          await prisma.fac_facturas.update({ where: { id: paso1.facturaId }, data: { bloqueo_motivo: `Recurrente: ${e.message}` } })
          Object.assign(r, { estado: 'error', detalle: e.message })
        }
      }
      await registrarEvento(prisma, actor, 'recurrente.generada', 'recurrente', id, { ...r })
      res.push(r)
    }
  }
  return res
}

/** El mismo día del año siguiente. */
export const anioSiguiente = (fecha: string) => `${+fecha.slice(0, 4) + 1}${fecha.slice(4)}`

export interface ResultadoGastoRecurrente { recurrenteId: string; periodo?: string; gastoId?: string; error?: string }

/** Último día del mes de `fecha` (YYYY-MM-DD). */
export function finDeMesDe(fecha: string) {
  const [y, m] = fecha.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

/**
 * Gastos de las recurrentes de tipo 'gasto' cuyo periodo cae en el mes en curso o antes
 * (proxima_fecha <= fin de este mes, para que Contabilidad los vea desde el día 1): crea el gasto «previsto»
 * (no entra en libros ni en 303/130 hasta que se adjunta la factura real) y avanza la fecha.
 * Misma transacción con bloqueo que las facturas; además, el índice único (recurrente_id, fecha)
 * impide duplicar un periodo.
 */
export async function procesarGastosRecurrentes(actor: Actor = { usuario: 'cron' }, ahora = new Date()): Promise<ResultadoGastoRecurrente[]> {
  const hoy = hoyMadrid(ahora)
  const limite = finDeMesDe(hoy)
  const pendientes = await prisma.fac_recurrentes.findMany({ where: { tipo: 'gasto', activo: true, proxima_fecha: { lte: fechaDb(limite) } }, select: { id: true } })
  const res: ResultadoGastoRecurrente[] = []
  for (const { id } of pendientes) {
    for (let vuelta = 0; vuelta < 12; vuelta++) {
      // Una recurrente con datos malos no bloquea a las demás: queda el error en el resultado del cron
      let hecho: ResultadoGastoRecurrente | null
      try { hecho = await prisma.$transaction(async tx => {
        await identificarActor(tx, actor)
        const [r] = await tx.$queryRaw<any[]>`SELECT * FROM fac_recurrentes WHERE id = ${id} FOR UPDATE`
        if (!r?.activo || r.tipo !== 'gasto' || isoFecha(r.proxima_fecha) > limite) return null
        const periodo = isoFecha(r.proxima_fecha)
        // Líneas de gasto: solo importes (prepararLineas es la validación de las facturas emitidas)
        const lineas = (r.lineas as LineaInput[]).map(l => ({ ...l, descripcion: sustituirPeriodo(l.descripcion, periodo) }))
        const calc = lineas.map(l => calcularLinea({ cantidad: l.cantidad ?? '1', precio_unitario: l.precio_unitario, descuento_pct: l.descuento_pct ?? '0', tipo_iva: l.tipo_iva ?? '21' }))
        const base = calc.reduce((a, c) => a.plus(c.base), D(0)), cuota = calc.reduce((a, c) => a.plus(c.cuota), D(0))
        const tipos = Array.from(new Set(lineas.map(l => String(l.tipo_iva ?? '21'))))
        const g = await tx.fac_gastos.create({
          data: {
            proveedor: r.proveedor, proveedor_nif: r.proveedor_nif, proveedor_pais: r.proveedor_pais, fecha: fechaDb(periodo),
            concepto: lineas.map(l => l.descripcion).join(' · ').slice(0, 500), categoria: r.categoria || 'otros',
            base_imponible: fmt2(base), tipo_iva: tipos.length === 1 ? tipos[0] : '21', cuota_iva: fmt2(cuota),
            total: fmt2(base.plus(cuota)), estado: 'previsto', producto_slug: r.producto_slug, recurrente_id: r.id,
          },
        })
        const siguiente = r.periodicidad === 'anual' ? anioSiguiente(periodo) : mesSiguiente(periodo, r.dia_mes)
        await tx.fac_recurrentes.update({ where: { id: r.id }, data: { proxima_fecha: fechaDb(siguiente), updated_at: new Date() } })
        return { recurrenteId: r.id, periodo, gastoId: g.id }
      }) } catch (e: any) {
        if (!esFacturacionError(e) && e?.code !== 'P2002') throw e
        res.push({ recurrenteId: id, error: e.message })
        break
      }
      if (!hecho) break
      await registrarEvento(prisma, actor, 'recurrente.gasto_previsto', 'recurrente', id, { ...hecho })
      res.push(hecho)
    }
  }
  return res
}
