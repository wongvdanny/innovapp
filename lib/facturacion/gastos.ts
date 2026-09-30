import { prisma } from '../prisma'
import { D, r2, fmt2 } from './decimal'
import { fechaDb } from './fechas'
import { FacturacionError } from './errores'
import { Actor, registrarEvento } from './eventos'
import { texto, textoONull } from './api'
import { validarNifEspanol, paisIso } from './validacion'

export const CATEGORIAS_GASTO = [
  'software', 'hardware', 'hosting', 'telefonia', 'formacion', 'asesoria', 'cuota_autonomo',
  'material_oficina', 'publicidad', 'desplazamientos', 'suministros', 'comisiones_bancarias', 'otros',
] as const

const num = (v: unknown, campo: string, def = '0') => {
  const s = String(v ?? '').trim().replace(',', '.') || def
  if (!/^-?\d+(\.\d+)?$/.test(s)) throw new FacturacionError('DATOS_INVALIDOS', `${campo} no es un número válido`)
  return s
}

/** Valida y calcula un gasto. La cuota de IVA se calcula salvo que se indique (facturas con varios tipos). */
export function normalizarGasto(b: Record<string, any>) {
  const proveedor = texto(b.proveedor)
  if (!proveedor) throw new FacturacionError('DATOS_INVALIDOS', 'El proveedor es obligatorio')
  const fecha = texto(b.fecha)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new FacturacionError('DATOS_INVALIDOS', 'Fecha no válida')
  const proveedor_pais = paisIso(texto(b.proveedor_pais) || 'ES') || 'ES'
  let proveedor_nif = textoONull(b.proveedor_nif)
  if (proveedor_nif && proveedor_pais === 'ES') {
    const r = validarNifEspanol(proveedor_nif)
    if (!r.valido) throw new FacturacionError('DATOS_INVALIDOS', `NIF del proveedor no válido: ${r.error}`)
    proveedor_nif = r.normalizado
  }
  const categoria = CATEGORIAS_GASTO.includes(b.categoria) ? b.categoria : 'otros'
  const base = r2(num(b.base_imponible, 'Base imponible'))
  const tipo_iva = D(num(b.tipo_iva, 'Tipo de IVA', '21'))
  const cuota_iva = texto(String(b.cuota_iva ?? '')) ? r2(num(b.cuota_iva, 'Cuota de IVA')) : r2(base.times(tipo_iva).dividedBy(100))
  const tipo_retencion = D(num(b.tipo_retencion, 'Retención'))
  const cuota_retencion = r2(base.times(tipo_retencion).dividedBy(100))
  const deducible_pct = D(num(b.deducible_pct, '% deducible', '100'))
  if (deducible_pct.lessThan(0) || deducible_pct.greaterThan(100)) throw new FacturacionError('DATOS_INVALIDOS', '% deducible fuera de rango')

  return {
    proveedor, proveedor_nif, proveedor_pais,
    numero: textoONull(b.numero), concepto: textoONull(b.concepto), notas: textoONull(b.notas), categoria,
    fecha: fechaDb(fecha),
    base_imponible: fmt2(base), tipo_iva: tipo_iva.toString(), cuota_iva: fmt2(cuota_iva),
    tipo_retencion: tipo_retencion.toString(), cuota_retencion: fmt2(cuota_retencion),
    total: fmt2(base.plus(cuota_iva).minus(cuota_retencion)),
    deducible_pct: deducible_pct.toString(),
    iva_deducible: b.iva_deducible === undefined ? true : b.iva_deducible === true || b.iva_deducible === 'true',
  }
}

export async function guardarGasto(id: string | null, b: Record<string, any>, adjunto: { path: string; mime: string } | null, actor: Actor) {
  const data = { ...normalizarGasto(b), ...(adjunto ? { adjunto_path: adjunto.path, adjunto_mime: adjunto.mime } : {}) }
  const g = id
    ? await prisma.fac_gastos.update({ where: { id }, data: { ...data, updated_at: new Date() } })
    : await prisma.fac_gastos.create({ data })
  await registrarEvento(prisma, actor, id ? 'gasto.actualizado' : 'gasto.creado', 'gasto', g.id,
    { proveedor: g.proveedor, numero: g.numero, total: fmt2(g.total), adjunto: !!adjunto })
  return g
}

export async function eliminarGasto(id: string, actor: Actor) {
  const g = await prisma.fac_gastos.delete({ where: { id } })
  // El adjunto se conserva en disco: la eliminación queda trazada en fac_eventos con su ruta.
  await registrarEvento(prisma, actor, 'gasto.eliminado', 'gasto', id, {
    proveedor: g.proveedor, numero: g.numero, fecha: g.fecha.toISOString().slice(0, 10), total: fmt2(g.total), adjunto_path: g.adjunto_path,
  })
}
