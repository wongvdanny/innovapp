import type { Prisma, fac_ajustes, fac_clientes } from '@prisma/client'
import { prisma } from '../prisma'
import { D, fmt2 } from './decimal'
import { calcularTotales } from './calculos'
import { hoyMadrid, isoFecha, fechaDb, sumarDias } from './fechas'
import { validarNifEspanol, validarNifIva } from './validacion'
import { siguienteNumero, serieDeTipo } from './numeracion'
import { crearRegistroAlta, crearRegistroAnulacion } from './verifactu/registro'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { FacturacionError } from './errores'

type Tx = Prisma.TransactionClient

const OPCIONES_TX = { timeout: 20_000, maxWait: 10_000 }

export async function obtenerAjustes(db: Tx | typeof prisma = prisma): Promise<fac_ajustes> {
  const a = await db.fac_ajustes.findUnique({ where: { id: 1 } })
  if (!a) throw new FacturacionError('EMISOR_INCOMPLETO', 'Faltan los ajustes de facturación')
  return a
}

/** Comprueba que el emisor tiene los datos obligatorios (art. 6 RD 1619/2012). */
export function validarEmisor(a: fac_ajustes) {
  const faltan: string[] = []
  if (!a.emisor_nombre.trim()) faltan.push('nombre')
  if (!validarNifEspanol(a.nif).valido) faltan.push('NIF válido')
  if (!a.direccion.trim()) faltan.push('dirección')
  if (!a.cp.trim()) faltan.push('código postal')
  if (!a.municipio.trim()) faltan.push('municipio')
  if (faltan.length)
    throw new FacturacionError('EMISOR_INCOMPLETO',
      `No se puede emitir: faltan datos del emisor en Ajustes (${faltan.join(', ')})`, { faltan, enlace: '/admin/facturacion/ajustes' })
}

export function snapshotEmisor(a: fac_ajustes) {
  return {
    nombre: a.emisor_nombre, nombre_comercial: a.nombre_comercial, nif: validarNifEspanol(a.nif).normalizado,
    direccion: a.direccion, cp: a.cp, municipio: a.municipio, provincia: a.provincia, pais: a.pais,
    email: a.email, telefono: a.telefono, iban: a.iban, logo_path: a.logo_path,
  }
}

export function snapshotCliente(c: fac_clientes) {
  return {
    id: c.id, tipo: c.tipo, razon_social: c.razon_social, nombre_comercial: c.nombre_comercial,
    nif: c.nif, tipo_id: c.tipo_id, pais: c.pais,
    direccion: c.direccion, cp: c.cp, municipio: c.municipio, provincia: c.provincia, email: c.email,
  }
}

/** Datos del destinatario exigidos en una factura completa (F1/F3/R1-R4). */
export function validarClienteCompleto(c: fac_clientes | null) {
  if (!c) throw new FacturacionError('CLIENTE_INCOMPLETO', 'Una factura completa necesita un cliente')
  const faltan: string[] = []
  if (!c.razon_social.trim()) faltan.push('nombre o razón social')
  if (!c.nif?.trim()) faltan.push('NIF')
  else if (c.pais === 'ES' && !validarNifEspanol(c.nif).valido) faltan.push('NIF válido')
  else if (c.tipo_id === '02' && !validarNifIva(c.nif).valido) faltan.push('NIF-IVA válido')
  if (!c.direccion?.trim()) faltan.push('dirección')
  if (faltan.length)
    throw new FacturacionError('CLIENTE_INCOMPLETO', `Faltan datos del cliente: ${faltan.join(', ')}`, { faltan, clienteId: c.id })
}

async function bloquearFactura(tx: Tx, id: string) {
  const filas = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM fac_facturas WHERE id = ${id} FOR UPDATE`
  if (!filas.length) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
}

export interface OpcionesEmision {
  /** Reloj inyectable (tests). La fecha de expedición es siempre la de hoy en Madrid. */
  ahora?: Date
}

/**
 * Emite un borrador dentro de una transacción ya abierta:
 * valida, recalcula totales, asigna número correlativo, guarda snapshots y crea el
 * registro VeriFactu de alta encadenado. Si algo falla, no se consume número.
 */
export async function emitirEnTx(tx: Tx, facturaId: string, actor: Actor, opts: OpcionesEmision = {}) {
  const ahora = opts.ahora ?? new Date()
  await identificarActor(tx, actor)
  await bloquearFactura(tx, facturaId)

  const f = await tx.fac_facturas.findUniqueOrThrow({
    where: { id: facturaId },
    include: { fac_lineas: true, fac_clientes: true, fac_facturas: true },
  })
  if (f.estado !== 'borrador') throw new FacturacionError('ESTADO_INVALIDO', `La factura ya está ${f.estado}`)

  const ajustes = await obtenerAjustes(tx)
  validarEmisor(ajustes)

  const hoy = hoyMadrid(ahora)
  if (hoy < isoFecha(ajustes.fecha_inicio_actividad))
    throw new FacturacionError('ANTES_INICIO_ACTIVIDAD', `No se puede emitir antes del inicio de actividad (${isoFecha(ajustes.fecha_inicio_actividad)})`)

  // Destinatario y tipo de factura
  const tipo = f.tipo_factura
  const esSimplificada = tipo === 'F2' || tipo === 'R5'
  if (!esSimplificada) validarClienteCompleto(f.fac_clientes)

  if (tipo.startsWith('R')) {
    const orig = f.fac_facturas
    if (!orig || !['emitida', 'pagada'].includes(orig.estado))
      throw new FacturacionError('RECTIFICADA_INVALIDA', 'La factura rectificada debe estar emitida')
    if ((tipo === 'R5') !== (orig.tipo_factura === 'F2' || orig.tipo_factura === 'R5'))
      throw new FacturacionError('RECTIFICADA_INVALIDA', 'R5 solo rectifica facturas simplificadas, y una simplificada solo con R5')
    if (f.tipo_rectificacion === 'S' && (f.base_rectificada === null || f.cuota_rectificada === null))
      throw new FacturacionError('RECTIFICADA_INVALIDA', 'Una rectificativa por sustitución necesita la base y cuota rectificadas')
  }

  // Líneas: coherencia base/cuota y totales recalculados en servidor
  if (!f.fac_lineas.length) throw new FacturacionError('SIN_LINEAS', 'La factura no tiene líneas')
  for (const l of f.fac_lineas) {
    const esperada = D(l.base).times(D(l.tipo_iva)).dividedBy(100)
    if (esperada.minus(D(l.cuota)).abs().greaterThan('0.01'))
      throw new FacturacionError('LINEA_INCOHERENTE', `La cuota de la línea "${l.descripcion}" no corresponde a su base y tipo de IVA`)
  }
  const tot = calcularTotales(f.fac_lineas, f.tipo_retencion)
  if (!tipo.startsWith('R') && !tot.importe_total.greaterThan(0))
    throw new FacturacionError('IMPORTE_INVALIDO', 'El importe total debe ser mayor que cero')
  if (tipo === 'F2' && tot.importe_total.greaterThan(D(ajustes.limite_simplificada)))
    throw new FacturacionError('SIMPLIFICADA_SUPERA_LIMITE',
      `Una factura simplificada no puede superar ${fmt2(ajustes.limite_simplificada)} € (IVA incluido)`)

  // Número correlativo (bloquea la serie hasta el COMMIT)
  const codigo = serieDeTipo(tipo)
  const num = await siguienteNumero(tx, codigo, +hoy.slice(0, 4))
  if (num.ultima_fecha && hoy < isoFecha(num.ultima_fecha))
    throw new FacturacionError('FECHA_NO_CORRELATIVA', 'La fecha es anterior a la de la última factura de la serie')

  const operacion = f.fecha_operacion && isoFecha(f.fecha_operacion) !== hoy ? f.fecha_operacion : null
  const vencimiento = f.fecha_vencimiento ?? fechaDb(sumarDias(hoy, ajustes.dias_vencimiento))

  const emitida = await tx.fac_facturas.update({
    where: { id: f.id },
    data: {
      estado: 'emitida',
      serie_codigo: codigo,
      serie_id: num.serie_id,
      numero: num.numero,
      num_serie_factura: num.num_serie_factura,
      fecha_expedicion: fechaDb(hoy),
      fecha_operacion: operacion,
      fecha_vencimiento: vencimiento,
      emisor_snapshot: snapshotEmisor(ajustes),
      cliente_snapshot: f.fac_clientes ? snapshotCliente(f.fac_clientes) : ((f.cliente_snapshot ?? {}) as Prisma.InputJsonValue),
      base_imponible: fmt2(tot.base_imponible),
      cuota_iva: fmt2(tot.cuota_iva),
      importe_total: fmt2(tot.importe_total),
      cuota_retencion: fmt2(tot.cuota_retencion),
      liquido_a_cobrar: fmt2(tot.liquido_a_cobrar),
      modo_verifactu: ajustes.verifactu_activo,
      emitida_at: ahora,
      updated_at: ahora,
    },
  })

  await crearRegistroAlta(tx, {
    id: emitida.id,
    num_serie_factura: emitida.num_serie_factura!,
    fecha_expedicion: emitida.fecha_expedicion!,
    tipo_factura: emitida.tipo_factura,
    cuota_iva: emitida.cuota_iva,
    importe_total: emitida.importe_total,
  }, validarNifEspanol(ajustes.nif).normalizado, ahora)

  return emitida
}

export function emitirFactura(facturaId: string, actor: Actor, opts?: OpcionesEmision) {
  return prisma.$transaction(tx => emitirEnTx(tx, facturaId, actor, opts), OPCIONES_TX)
}

/**
 * Anula una factura emitida por error. Solo si no se entregó ni se cobró (tampoco online);
 * en otro caso hay que rectificar. Estado y registro de anulación van en la misma transacción.
 */
export async function anularEnTx(tx: Tx, facturaId: string, motivo: string, actor: Actor, ahora = new Date()) {
  if (!motivo?.trim()) throw new FacturacionError('DATOS_INVALIDOS', 'Indica el motivo de la anulación')
  await identificarActor(tx, actor)
  await bloquearFactura(tx, facturaId)
  const f = await tx.fac_facturas.findUniqueOrThrow({ where: { id: facturaId } })
  if (f.estado !== 'emitida' || f.entregada_at || f.fecha_pago || f.pago_ref)
    throw new FacturacionError('USAR_RECTIFICATIVA',
      'Solo se anulan facturas emitidas por error que no se hayan entregado ni cobrado. Emite una rectificativa.')

  const emisor = (f.emisor_snapshot as { nif: string }).nif
  await crearRegistroAnulacion(tx, { id: f.id, num_serie_factura: f.num_serie_factura!, fecha_expedicion: f.fecha_expedicion! }, emisor, ahora)
  const anulada = await tx.fac_facturas.update({ where: { id: f.id }, data: { estado: 'anulada', updated_at: ahora } })
  await registrarEvento(tx, actor, 'factura.anulada', 'factura', f.id, { num_serie_factura: f.num_serie_factura, motivo: motivo.trim() })
  return anulada
}

export function anularFactura(facturaId: string, motivo: string, actor: Actor) {
  return prisma.$transaction(tx => anularEnTx(tx, facturaId, motivo, actor), OPCIONES_TX)
}

export const METODOS_PAGO = ['transferencia', 'tarjeta', 'stripe', 'redsys', 'efectivo', 'domiciliacion', 'otro'] as const
export type MetodoPago = typeof METODOS_PAGO[number]

export async function marcarPagadaEnTx(tx: Tx, facturaId: string, pago: { fecha: string; metodo: MetodoPago }, actor: Actor) {
  if (!METODOS_PAGO.includes(pago.metodo)) throw new FacturacionError('DATOS_INVALIDOS', 'Método de pago no válido')
  await identificarActor(tx, actor)
  await bloquearFactura(tx, facturaId)
  const f = await tx.fac_facturas.findUniqueOrThrow({ where: { id: facturaId } })
  if (f.estado !== 'emitida') throw new FacturacionError('ESTADO_INVALIDO', `No se puede marcar como pagada una factura ${f.estado}`)
  return tx.fac_facturas.update({
    where: { id: facturaId },
    data: { estado: 'pagada', fecha_pago: fechaDb(pago.fecha), metodo_pago: pago.metodo, updated_at: new Date() },
  })
}

export function marcarPagada(facturaId: string, pago: { fecha: string; metodo: MetodoPago }, actor: Actor) {
  return prisma.$transaction(tx => marcarPagadaEnTx(tx, facturaId, pago, actor), OPCIONES_TX)
}

/** Deshace un "marcar como pagada" manual. Un cobro online confirmado no se puede deshacer. */
export function desmarcarPagada(facturaId: string, actor: Actor) {
  return prisma.$transaction(async tx => {
    await identificarActor(tx, actor)
    await bloquearFactura(tx, facturaId)
    const f = await tx.fac_facturas.findUniqueOrThrow({ where: { id: facturaId } })
    if (f.estado !== 'pagada') throw new FacturacionError('ESTADO_INVALIDO', 'La factura no está pagada')
    if (f.pago_ref) throw new FacturacionError('COBRO_ONLINE', 'Un cobro online confirmado no se puede deshacer')
    return tx.fac_facturas.update({
      where: { id: facturaId },
      data: { estado: 'emitida', fecha_pago: null, metodo_pago: null, updated_at: new Date() },
    })
  }, OPCIONES_TX)
}

/**
 * Marca la factura como entregada al cliente. Solo al enviar el email con éxito o con el
 * botón "Marcar como entregada"; la descarga del PDF desde el admin NO cuenta (es vista previa).
 */
export async function marcarEntregadaEnTx(tx: Tx, facturaId: string, via: 'email' | 'manual', actor: Actor) {
  await bloquearFactura(tx, facturaId)
  const f = await tx.fac_facturas.findUniqueOrThrow({ where: { id: facturaId } })
  if (!['emitida', 'pagada'].includes(f.estado)) throw new FacturacionError('ESTADO_INVALIDO', `No se puede entregar una factura ${f.estado}`)
  if (f.entregada_at) return f
  const upd = await tx.fac_facturas.update({ where: { id: facturaId }, data: { entregada_at: new Date(), entregada_via: via, updated_at: new Date() } })
  await registrarEvento(tx, actor, 'factura.entregada', 'factura', facturaId, { via, num_serie_factura: f.num_serie_factura })
  return upd
}

export function marcarEntregada(facturaId: string, via: 'email' | 'manual', actor: Actor) {
  return prisma.$transaction(tx => marcarEntregadaEnTx(tx, facturaId, via, actor), OPCIONES_TX)
}

