import { prisma } from '../prisma'
import { fmt2 } from './decimal'
import { calcularTotales } from './calculos'
import { hoyMadrid, isoFecha, fechaDb } from './fechas'
import { prepararLineas, LineaInput } from './borradores'
import { emitirFactura } from './emision'
import { asegurarPdf } from './documentos'
import { enviarFactura } from './envio'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { FacturacionError, esFacturacionError } from './errores'
import { texto } from './api'

// Facturas recurrentes (igualas mensuales). Las genera el cron el día indicado de cada mes.
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
  const pendientes = await prisma.fac_recurrentes.findMany({ where: { activo: true, proxima_fecha: { lte: fechaDb(hoy) } }, select: { id: true } })
  const res: ResultadoRecurrente[] = []
  for (const { id } of pendientes) {
    for (let vuelta = 0; vuelta < 12; vuelta++) { // pone al día como mucho 12 periodos atrasados
      const paso1 = await prisma.$transaction(async tx => {
        await identificarActor(tx, actor)
        const [r] = await tx.$queryRaw<any[]>`SELECT * FROM fac_recurrentes WHERE id = ${id} FOR UPDATE`
        if (!r?.activo || isoFecha(r.proxima_fecha) > hoy) return null
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
