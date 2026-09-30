import { prisma } from '../prisma'
import { fmt2, D } from './decimal'
import { desglosarIvaIncluido } from './calculos'
import { hoyMadrid, isoFecha, ddmmaaaa } from './fechas'
import { validarNifEspanol, paisIso } from './validacion'
import { emitirEnTx, marcarPagadaEnTx, validarEmisor } from './emision'
import { asegurarPdf } from './documentos'
import { enviarFactura } from './envio'
import { Actor, identificarActor, registrarEvento } from './eventos'
import { esFacturacionError } from './errores'

// Facturación automática de cobros online (Stripe / Redsys), llamada desde lib/fulfillment.ts
// y reintentada por el cron. Idempotente por invoice_id / pago_ref (índices únicos).

export const WEBHOOK: Actor = { usuario: 'webhook' }

export type ResultadoCobro =
  | { estado: 'emitida'; facturaId: string; numero: string }
  | { estado: 'bloqueada'; facturaId: string; motivo: string }
  | { estado: 'existente'; facturaId: string }
  | { estado: 'omitida'; motivo: string }

const pagoRef = (i: { provider: string; providerRef: string | null; redsysOrderId: string | null; id: string }) =>
  `${i.provider}:${i.providerRef ?? i.redsysOrderId ?? i.id}`

async function cargarCobro(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { user: true, subscription: { include: { plan: { include: { Product: true } } } } },
  })
}
type Cobro = NonNullable<Awaited<ReturnType<typeof cargarCobro>>>

/** Datos de facturación del checkout (Subscription.billingData) → cliente. */
function datosCliente(c: Cobro) {
  const b = (() => { try { return JSON.parse(c.subscription.billingData || '{}') } catch { return {} } })()
  const pais = paisIso(b.country) || 'ES'
  const nifR = b.nif ? validarNifEspanol(b.nif) : null
  const nif = pais === 'ES' ? (nifR?.valido ? nifR.normalizado : null) : (b.nif?.trim().toUpperCase() || null)
  const empresa = (b.company || '').trim()
  return {
    tipo: nifR?.tipo === 'CIF' ? 'empresa' : empresa ? 'autonomo' : 'particular',
    razon_social: empresa || c.user.name,
    nif, pais,
    tipo_id: pais === 'ES' ? '01' : '04',
    direccion: (b.address || '').trim() || null,
    cp: (b.zip || '').trim() || null,
    municipio: (b.city || '').trim() || null,
    email: c.user.email.toLowerCase(),
    user_id: c.user.id,
    nifInvalido: !!b.nif && pais === 'ES' && !nifR?.valido,
  }
}

/** Qué factura corresponde a este cobro, o por qué no se puede emitir automáticamente. */
function decidir(c: Cobro, cli: ReturnType<typeof datosCliente>, ajustes: any): { tipo: 'F1' | 'F2' } | { motivo: string } {
  try { validarEmisor(ajustes) } catch (e: any) { return { motivo: e.message } }
  if (cli.pais !== 'ES') return { motivo: `Cliente fuera de España (${cli.pais}): revisar régimen de IVA y emitir manualmente` }
  const completo = !!(cli.nif && cli.direccion && cli.cp && cli.municipio)
  if (completo) return { tipo: 'F1' }
  if (D(c.amount).lessThanOrEqualTo(D(ajustes.limite_simplificada))) return { tipo: 'F2' }
  return { motivo: `Faltan ${cli.nifInvalido ? 'un NIF válido' : !cli.nif ? 'el NIF' : 'la dirección completa'} del cliente y el importe supera ${fmt2(ajustes.limite_simplificada)} € (no cabe simplificada)` }
}

function lineaCobro(c: Cobro, iva: any) {
  const plan = c.subscription.plan
  const producto = plan.Product?.name || 'innovapp'
  const s = c.subscription
  const periodo = s.startDate && s.endDate ? ` · ${ddmmaaaa(isoFecha(s.startDate)).replace(/-/g, '/')} – ${ddmmaaaa(isoFecha(s.endDate)).replace(/-/g, '/')}` : ''
  const { base, cuota } = desglosarIvaIncluido(String(c.amount), iva)
  return {
    orden: 0,
    descripcion: `${producto} · ${plan.name} (${plan.interval === 'yearly' ? 'suscripción anual' : 'suscripción mensual'})${periodo}`,
    cantidad: '1', precio_unitario: fmt2(base), descuento_pct: '0', tipo_iva: String(iva),
    calificacion: 'S1', operacion_exenta: null, base: fmt2(base), cuota: fmt2(cuota),
  }
}

/** Crea o actualiza el cliente de facturación del usuario (por usuario o por NIF). */
async function asegurarCliente(db: any, cli: ReturnType<typeof datosCliente>) {
  const { nifInvalido, ...datos } = cli
  const existente = await db.fac_clientes.findFirst({ where: { user_id: cli.user_id } })
    ?? (cli.nif ? await db.fac_clientes.findFirst({ where: { nif: cli.nif, activo: true } }) : null)
  if (existente) {
    return db.fac_clientes.update({
      where: { id: existente.id },
      data: {
        user_id: existente.user_id ?? cli.user_id,
        email: existente.email ?? cli.email,
        // Solo completa lo que falte: los datos editados a mano en el admin mandan
        nif: existente.nif ?? cli.nif,
        direccion: existente.direccion ?? cli.direccion, cp: existente.cp ?? cli.cp, municipio: existente.municipio ?? cli.municipio,
        updated_at: new Date(),
      },
    })
  }
  return db.fac_clientes.create({ data: { ...datos, aplica_retencion: datos.tipo !== 'particular' && datos.pais === 'ES' } })
}

/** ¿El cobro viene de una pasarela en modo pruebas? Esos pagos nunca se facturan. */
async function esPagoDePruebas(provider: string) {
  const cfg = provider === 'stripe' ? await prisma.stripeConfig.findFirst() : await prisma.redsysConfig.findFirst()
  return cfg?.environment !== 'production'
}

/**
 * Factura un cobro online confirmado: emite F1/F2, la marca pagada y la envía por email.
 * Si no puede emitirse, deja un borrador con bloqueo_motivo ("Cobros sin factura").
 */
export async function facturarCobro(invoiceId: string, actor: Actor = WEBHOOK, opts: { ahora?: Date } = {}): Promise<ResultadoCobro> {
  const c = await cargarCobro(invoiceId)
  if (!c) return { estado: 'omitida', motivo: 'cobro no encontrado' }
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  if (c.status !== 'paid' || !c.paidAt) return { estado: 'omitida', motivo: 'cobro no confirmado' }
  if (isoFecha(c.paidAt) < isoFecha(ajustes.fecha_inicio_actividad)) return { estado: 'omitida', motivo: 'anterior al inicio de actividad' }
  if (!(c.amount > 0)) return { estado: 'omitida', motivo: 'importe cero' }
  if (await esPagoDePruebas(c.provider)) return { estado: 'omitida', motivo: `pasarela ${c.provider} en modo pruebas` }

  const ref = pagoRef(c)
  const previa = await prisma.fac_facturas.findFirst({ where: { OR: [{ invoice_id: c.id }, { pago_ref: ref }] } })
  if (previa && (previa.estado !== 'borrador' || !previa.bloqueo_motivo)) return { estado: 'existente', facturaId: previa.id }

  const cli = datosCliente(c)
  // Si el cliente ya existe, sus datos (quizá corregidos a mano en el admin) mandan sobre el checkout
  const existente = await prisma.fac_clientes.findFirst({ where: { user_id: c.user.id } })
  if (existente) Object.assign(cli, {
    pais: existente.pais, nif: existente.nif ?? cli.nif, direccion: existente.direccion ?? cli.direccion,
    cp: existente.cp ?? cli.cp, municipio: existente.municipio ?? cli.municipio, razon_social: existente.razon_social,
    nifInvalido: existente.nif ? false : cli.nifInvalido,
  })
  const decision = decidir(c, cli, ajustes)
  const iva = ajustes.iva_defecto.toString()

  if ('motivo' in decision) {
    if (previa?.bloqueo_motivo === decision.motivo) return { estado: 'bloqueada', facturaId: previa.id, motivo: decision.motivo }
    return dejarBloqueado(c, cli, ref, iva, decision.motivo, previa?.id ?? null, actor)
  }

  let emitida
  try {
    emitida = await prisma.$transaction(async tx => {
      await identificarActor(tx, actor)
      if (previa) await tx.fac_facturas.delete({ where: { id: previa.id } })
      const cliente = await asegurarCliente(tx, cli)
      const conRetencion = ajustes.retencion_en_cobros_online && cliente.aplica_retencion
      const linea = lineaCobro(c, iva)
      const b = await tx.fac_facturas.create({
        data: {
          serie_codigo: decision.tipo === 'F2' ? 'S' : 'F', tipo_factura: decision.tipo,
          cliente_id: decision.tipo === 'F1' ? cliente.id : null,
          cliente_snapshot: decision.tipo === 'F2' ? { razon_social: cli.razon_social, ...(cli.nif ? { nif: cli.nif } : {}), email: cli.email } : undefined,
          origen: c.provider, pago_ref: ref, invoice_id: c.id,
          tipo_retencion: conRetencion ? ajustes.retencion_defecto : 0,
          descripcion_operacion: linea.descripcion, created_by: actor.usuario,
          fac_lineas: { create: [linea] },
        },
      })
      const f = await emitirEnTx(tx, b.id, actor, { ahora: opts.ahora })
      await marcarPagadaEnTx(tx, f.id, { fecha: hoyMadrid(c.paidAt!), metodo: c.provider === 'stripe' ? 'stripe' : 'redsys' }, actor)
      return f
    }, { timeout: 20_000, maxWait: 10_000 })
  } catch (e: any) {
    if (e?.code === 'P2002') { // otra ejecución (webhook repetido / cron) ganó la carrera
      const otra = await prisma.fac_facturas.findFirst({ where: { OR: [{ invoice_id: c.id }, { pago_ref: ref }] } })
      if (otra) return { estado: 'existente', facturaId: otra.id }
    }
    if (!esFacturacionError(e)) throw e
    // Error de negocio al emitir: se deja bloqueada con el motivo para revisarla en el admin
    return dejarBloqueado(c, cli, ref, iva, e.message, previa?.id ?? null, actor)
  }

  await registrarEvento(prisma, actor, 'cobro.facturado', 'factura', emitida.id, { invoice_id: c.id, pago_ref: ref, num_serie_factura: emitida.num_serie_factura })
  await entregarFacturaCobro(emitida.id, cli.email, actor)
  return { estado: 'emitida', facturaId: emitida.id, numero: emitida.num_serie_factura! }
}

/** Borrador con bloqueo_motivo (sustituye al bloqueado anterior, si lo había). Aparece en "Cobros sin factura". */
async function dejarBloqueado(c: Cobro, cli: ReturnType<typeof datosCliente>, ref: string, iva: string, motivo: string, previaId: string | null, actor: Actor): Promise<ResultadoCobro> {
  const f = await prisma.$transaction(async tx => {
    await identificarActor(tx, actor)
    if (previaId) await tx.fac_facturas.deleteMany({ where: { id: previaId, estado: 'borrador' } })
    const cliente = await asegurarCliente(tx, cli)
    const linea = lineaCobro(c, iva)
    return tx.fac_facturas.create({
      data: {
        serie_codigo: 'F', tipo_factura: 'F1', cliente_id: cliente.id, origen: c.provider, pago_ref: ref, invoice_id: c.id,
        bloqueo_motivo: motivo, descripcion_operacion: linea.descripcion, created_by: actor.usuario,
        base_imponible: linea.base, cuota_iva: linea.cuota, importe_total: fmt2(D(linea.base).plus(linea.cuota)), liquido_a_cobrar: fmt2(D(linea.base).plus(linea.cuota)),
        fac_lineas: { create: [linea] },
      },
    })
  })
  await registrarEvento(prisma, actor, 'cobro.factura_bloqueada', 'factura', f.id, { invoice_id: c.id, pago_ref: ref, motivo })
  return { estado: 'bloqueada', facturaId: f.id, motivo }
}

/** PDF + email al cliente tras facturar un cobro. Los fallos se registran, no se propagan. */
async function entregarFacturaCobro(facturaId: string, email: string, actor: Actor) {
  try {
    await asegurarPdf(facturaId)
    await enviarFactura(facturaId, { to: email }, actor)
  } catch (e: any) {
    console.error('Facturación: entrega de factura de cobro', facturaId, e.message)
  }
}

/**
 * Tras emitir a mano un borrador que venía de un cobro online (p. ej. uno bloqueado ya
 * corregido), lo concilia: lo marca pagado con la fecha y pasarela del cobro.
 */
export async function conciliarCobro(facturaId: string, actor: Actor) {
  const f = await prisma.fac_facturas.findUnique({ where: { id: facturaId } })
  if (!f?.invoice_id || f.estado !== 'emitida') return null
  const inv = await prisma.invoice.findUnique({ where: { id: f.invoice_id } })
  if (inv?.status !== 'paid' || !inv.paidAt) return null
  return prisma.$transaction(async tx => {
    await identificarActor(tx, actor)
    return marcarPagadaEnTx(tx, facturaId, { fecha: hoyMadrid(inv.paidAt!), metodo: inv.provider === 'stripe' ? 'stripe' : 'redsys' }, actor)
  })
}

/** Cobros confirmados sin factura (fallo del webhook, BD caída…): los reintenta el cron. */
export async function reintentarCobrosPendientes(actor: Actor = { usuario: 'cron' }, opts: { ahora?: Date } = {}) {
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const pendientes = await prisma.$queryRaw<{ id: string }[]>`
    SELECT i.id FROM "Invoice" i
    LEFT JOIN fac_facturas f ON f.invoice_id = i.id
    WHERE i.status = 'paid' AND i."paidAt" >= ${ajustes.fecha_inicio_actividad} AND i.amount > 0
      AND (f.id IS NULL OR (f.estado = 'borrador' AND f.bloqueo_motivo IS NOT NULL))
    ORDER BY i."paidAt"`
  const resultados: (ResultadoCobro & { invoiceId: string })[] = []
  for (const { id } of pendientes) {
    try { resultados.push({ invoiceId: id, ...(await facturarCobro(id, actor, opts)) }) }
    catch (e: any) { resultados.push({ invoiceId: id, estado: 'omitida', motivo: `error: ${e.message}` }) }
  }
  return resultados
}
