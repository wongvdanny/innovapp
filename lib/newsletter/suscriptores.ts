import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import { FacturacionError } from '../facturacion/errores'
import { EMAIL_RE, MEDIOS, Medio, Sector, TEXTO_CONSENTIMIENTO_WEB, esMedio, esSector, normalizarEmail } from './tipos'
import type { FilaImportacion } from './csv'
import { enviarConfirmacion } from './envio'

// Suscriptores de la newsletter (solo servidor). Reglas:
//   · Alta pública = doble opt-in: queda «pendiente» y no recibe nada hasta confirmar.
//   · Alta manual e importación exigen la prueba del consentimiento y entran «confirmado».
//   · Una baja (o rebote) es definitiva: solo se reactiva si la persona vuelve a suscribirse ella misma.
//   · Todo cambio queda en newsletter_historial.

const err = (m: string) => new FacturacionError('DATOS_INVALIDOS', m)
const nuevoToken = () => crypto.randomBytes(32).toString('hex')
export const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')
const CONFIRMACION_VALIDA_MS = 7 * 24 * 60 * 60 * 1000
const ESPERA_REENVIO_MS = 2 * 60 * 1000
const txt = (v: unknown, max = 200) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

type Db = Prisma.TransactionClient | typeof prisma

export function historial(db: Db, suscriptorId: string, accion: string, detalle?: Record<string, unknown>, ip?: string | null, usuario?: string | null) {
  return db.newsletter_historial.create({
    data: { suscriptor_id: suscriptorId, accion, detalle: (detalle ?? undefined) as any, ip: ip ?? null, usuario: usuario ?? null },
  })
}

/**
 * Alta desde el formulario público. Nunca revela si el email ya existía.
 * Confirmado → no hace nada; pendiente → reenvía la confirmación (como mucho cada 2 min);
 * baja/rebotado/nuevo → «pendiente» con el consentimiento nuevo y correo de confirmación.
 */
export async function altaPublica(b: { email: unknown; nombre?: unknown; empresa?: unknown; sector?: unknown }, ip: string | null) {
  const email = normalizarEmail(b.email)
  if (!EMAIL_RE.test(email)) throw err('El email no es válido')
  const previo = await prisma.newsletter_suscriptores.findUnique({ where: { email } })
  if (previo?.estado === 'confirmado') return
  if (previo?.estado === 'pendiente' && previo.confirmacion_enviada_at && Date.now() - previo.confirmacion_enviada_at.getTime() < ESPERA_REENVIO_MS) return

  const token = nuevoToken()
  const ahora = new Date()
  const datos = {
    nombre: txt(b.nombre) ?? previo?.nombre ?? null,
    empresa: txt(b.empresa) ?? previo?.empresa ?? null,
    sector: esSector(b.sector) ? (b.sector as Sector) : previo?.sector ?? 'otro',
    estado: 'pendiente', origen: 'formulario_web', consentimiento_medio: null, consentimiento_nota: null,
    consentimiento_texto: TEXTO_CONSENTIMIENTO_WEB, consentimiento_fecha: ahora, consentimiento_ip: ip,
    token_confirmacion_hash: hashToken(token), confirmacion_enviada_at: ahora, confirmado_at: null,
    baja_at: null, baja_motivo: null, rebotado_at: null, updated_at: ahora,
  }
  const s = await prisma.$transaction(async tx => {
    const s = previo
      ? await tx.newsletter_suscriptores.update({ where: { id: previo.id }, data: datos })
      : await tx.newsletter_suscriptores.create({ data: { ...datos, email, token_baja: nuevoToken() } })
    await historial(tx, s.id, previo ? (previo.estado === 'pendiente' ? 'reenvio_confirmacion' : 'resuscripcion') : 'alta',
      { origen: 'formulario_web', estado_previo: previo?.estado ?? null }, ip)
    return s
  })
  await enviarConfirmacion(s, token)
}

export type ResultadoConfirmacion = 'confirmado' | 'ya_confirmado' | 'caducado' | 'no_valido'

/** Doble opt-in: el enlace del correo de confirmación. Válido 7 días. */
export async function confirmar(token: unknown, ip: string | null): Promise<ResultadoConfirmacion> {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return 'no_valido'
  const s = await prisma.newsletter_suscriptores.findUnique({ where: { token_confirmacion_hash: hashToken(token) } })
  if (!s) return 'no_valido'
  if (s.estado === 'confirmado') return 'ya_confirmado'
  if (s.estado !== 'pendiente') return 'no_valido'
  if (!s.confirmacion_enviada_at || Date.now() - s.confirmacion_enviada_at.getTime() > CONFIRMACION_VALIDA_MS) return 'caducado'
  await prisma.$transaction(async tx => {
    await tx.newsletter_suscriptores.update({ where: { id: s.id }, data: { estado: 'confirmado', confirmado_at: new Date(), token_confirmacion_hash: null, updated_at: new Date() } })
    await historial(tx, s.id, 'confirmacion', { via: 'doble opt-in' }, ip)
  })
  return 'confirmado'
}

export type ResultadoBaja = 'baja' | 'ya_estaba' | 'no_valido'

/** Baja con el token del enlace o de List-Unsubscribe-Post. Inmediata e idempotente. */
export async function darDeBaja(token: unknown, motivo: 'enlace' | 'one_click' | 'queja' | 'admin', ip: string | null, usuario?: string): Promise<ResultadoBaja> {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return 'no_valido'
  const s = await prisma.newsletter_suscriptores.findUnique({ where: { token_baja: token } })
  if (!s) return 'no_valido'
  if (s.estado === 'baja') return 'ya_estaba'
  await prisma.$transaction(async tx => {
    await tx.newsletter_suscriptores.update({ where: { id: s.id }, data: { estado: 'baja', baja_at: new Date(), baja_motivo: motivo, token_confirmacion_hash: null, updated_at: new Date() } })
    await historial(tx, s.id, 'baja', { motivo, estado_previo: s.estado }, ip, usuario)
  })
  return 'baja'
}

/** Bloquea altas del admin sobre quien se dio de baja o rebotó: solo puede volver suscribiéndose él. */
function comprobarReactivable(estado: string, email: string) {
  if (estado === 'confirmado') throw err(`${email} ya está suscrito`)
  if (estado === 'baja') throw err(`${email} se dio de baja: solo puede volver suscribiéndose desde la web`)
  if (estado === 'rebotado') throw err(`${email} rebotó: su dirección no recibe correo`)
}

/** Alta manual desde el admin: obligatorio indicar cómo se obtuvo el consentimiento. */
export async function altaManual(b: any, usuario: string) {
  const email = normalizarEmail(b?.email)
  if (!EMAIL_RE.test(email)) throw err('El email no es válido')
  if (!esMedio(b?.medio)) throw err('Indica cómo dio su consentimiento (llamada, visita, reunión…)')
  const medio = b.medio as Medio
  const nota = txt(b?.nota, 1000)
  if (medio === 'otro' && !nota) throw err('Con «Otro», explica en la nota cómo dio su consentimiento')
  const previo = await prisma.newsletter_suscriptores.findUnique({ where: { email } })
  if (previo) comprobarReactivable(previo.estado, email)
  const ahora = new Date()
  const datos = {
    nombre: txt(b.nombre), empresa: txt(b.empresa), sector: esSector(b.sector) ? (b.sector as Sector) : 'otro',
    estado: 'confirmado', origen: 'alta_manual', confirmado_at: ahora, token_confirmacion_hash: null,
    consentimiento_medio: medio, consentimiento_nota: nota, consentimiento_fecha: ahora, consentimiento_ip: null,
    consentimiento_texto: `Consentimiento verbal o por escrito obtenido por ${MEDIOS[medio].toLowerCase()}${nota ? `: ${nota}` : ''}. Registrado en el panel por ${usuario}.`,
    updated_at: ahora,
  }
  return prisma.$transaction(async tx => {
    const s = previo
      ? await tx.newsletter_suscriptores.update({ where: { id: previo.id }, data: datos })
      : await tx.newsletter_suscriptores.create({ data: { ...datos, email, token_baja: nuevoToken() } })
    await historial(tx, s.id, 'alta', { origen: 'alta_manual', medio, nota }, null, usuario)
    return s
  })
}

/** Importación CSV ya validada: crea los nuevos «confirmado»; los existentes no se tocan. */
export async function importar(filas: FilaImportacion[], usuario: string) {
  const existentes = new Map((await prisma.newsletter_suscriptores.findMany({
    where: { email: { in: filas.map(f => f.email) } }, select: { email: true, estado: true },
  })).map(s => [s.email, s.estado]))
  const omitidos: { email: string; motivo: string }[] = []
  let creados = 0
  for (const f of filas) {
    const estado = existentes.get(f.email)
    if (estado) { omitidos.push({ email: f.email, motivo: estado === 'baja' ? 'se dio de baja' : estado === 'rebotado' ? 'rebotó' : `ya existe (${estado})` }); continue }
    await prisma.$transaction(async tx => {
      const s = await tx.newsletter_suscriptores.create({
        data: {
          email: f.email, nombre: f.nombre, empresa: f.empresa, sector: f.sector, estado: 'confirmado', origen: 'importacion',
          consentimiento_texto: f.consentimiento, consentimiento_fecha: f.fecha, confirmado_at: new Date(), token_baja: nuevoToken(),
        },
      })
      await historial(tx, s.id, 'alta', { origen: 'importacion' }, null, usuario)
    })
    creados++
  }
  return { creados, omitidos }
}

/** Edición de datos no relacionados con el consentimiento. */
export async function editar(id: string, b: any, usuario: string) {
  const datos = { nombre: txt(b?.nombre), empresa: txt(b?.empresa), sector: esSector(b?.sector) ? (b.sector as Sector) : 'otro', updated_at: new Date() }
  return prisma.$transaction(async tx => {
    const s = await tx.newsletter_suscriptores.update({ where: { id }, data: datos })
    await historial(tx, id, 'edicion', datos, null, usuario)
    return s
  })
}

/** Baja desde el admin (p. ej. lo pide por teléfono). */
export async function bajaAdmin(id: string, usuario: string) {
  const s = await prisma.newsletter_suscriptores.findUniqueOrThrow({ where: { id }, select: { token_baja: true } })
  return darDeBaja(s.token_baja, 'admin', null, usuario)
}

/**
 * Envía (o reenvía) el correo de doble opt-in a un suscriptor «pendiente». Lo usa el admin, p. ej.
 * para los suscriptores migrados del formulario antiguo, que nunca recibieron confirmación.
 */
export async function enviarConfirmacionPendiente(id: string, usuario: string) {
  const s = await prisma.newsletter_suscriptores.findUniqueOrThrow({ where: { id } })
  if (s.estado !== 'pendiente') throw err('Solo se envía la confirmación a suscriptores pendientes')
  const token = nuevoToken()
  await prisma.$transaction(async tx => {
    await tx.newsletter_suscriptores.update({ where: { id }, data: { token_confirmacion_hash: hashToken(token), confirmacion_enviada_at: new Date(), updated_at: new Date() } })
    await historial(tx, id, 'envio_confirmacion', { via: 'admin' }, null, usuario)
  })
  await enviarConfirmacion(s, token)
}

/** Confirmación a todos los pendientes que nunca la recibieron (como mucho un correo por segundo). */
export async function enviarConfirmacionesPendientes(usuario: string) {
  const pendientes = await prisma.newsletter_suscriptores.findMany({ where: { estado: 'pendiente', confirmacion_enviada_at: null }, select: { id: true, email: true } })
  const errores: string[] = []
  for (const p of pendientes) {
    const inicio = Date.now()
    try { await enviarConfirmacionPendiente(p.id, usuario) } catch (e: any) { errores.push(`${p.email}: ${e.message}`) }
    await new Promise(r => setTimeout(r, Math.max(0, 1000 - (Date.now() - inicio))))
  }
  return { enviadas: pendientes.length - errores.length, errores }
}
