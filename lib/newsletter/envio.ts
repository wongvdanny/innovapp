import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '../prisma'
import { FacturacionError } from '../facturacion/errores'
import { componerCorreo, ArchivoCorreo } from './contenido'
import { comprobarUrlsProduccion } from '../urls-produccion'

// Envío de la newsletter con Resend desde el subdominio de marketing (separado del transaccional).
// Lotes de 100 con la API batch, como mucho uno por segundo (el límite de Resend se comparte
// con el resto de proyectos). Sin píxel de aperturas ni seguimiento de clics.

const resend = new Resend(process.env.RESEND_API_KEY)
export const FROM = process.env.NEWSLETTER_FROM || 'Innovapp <novedades@boletin.innovapp.es>'
export const BASE_URL = process.env.NEWSLETTER_BASE_URL || 'https://innovapp.es'
const REPLY_TO = 'contacto@innovapp.es'
const LOTE = 100
const MS_ENTRE_LOTES = 1000
// Opcional: tope diario propio (además del que devuelva Resend). Al llegar, el envío se pausa hasta mañana.
const LIMITE_DIARIO = Number(process.env.NEWSLETTER_LIMITE_DIARIO) || 0

// Nunca se envía un correo con enlaces a localhost en producción (además del control del build)
function comprobarBaseUrl() {
  const p = comprobarUrlsProduccion({ ...process.env, NEWSLETTER_BASE_URL: BASE_URL })
  if (p.length) throw new FacturacionError('DATOS_INVALIDOS', `No se envía: ${p.join('; ')}`)
}

export const urlBaja = (token: string) => `${BASE_URL}/newsletter/baja?t=${token}`
export const urlBajaOneClick = (token: string) => `${BASE_URL}/api/newsletter/baja?t=${token}`
const urlConfirmar = (token: string) => `${BASE_URL}/newsletter/confirmar?t=${token}`
const urlArchivo = (archivoId: string, envioId: string | null) => `${BASE_URL}/api/newsletter/archivo/${archivoId}${envioId ? `?e=${envioId}` : ''}`

/** PDF de la campaña, si tiene, con el enlace de descarga de un envío concreto (o sin envío: prueba/vista previa). */
export async function archivoDeCampana(campanaId: string | undefined) {
  if (!campanaId) return null
  const a = await prisma.newsletter_archivos.findUnique({ where: { campana_id: campanaId }, select: { id: true, nombre: true, bytes: true } })
  return a ? (envioId: string | null): ArchivoCorreo => ({ nombre: a.nombre, bytes: a.bytes, url: urlArchivo(a.id, envioId) }) : null
}

let firmaCache: string | null = null
export function firmaHtml() {
  firmaCache ??= fs.readFileSync(path.join(process.cwd(), 'lib/newsletter/firma-newsletter.html'), 'utf8')
  return firmaCache
}

/** Cabeceras de baja: enlace + RFC 8058 (el gestor de correo hace un POST sin pasar por la web). */
export const cabecerasBaja = (token: string) => ({
  'List-Unsubscribe': `<${urlBajaOneClick(token)}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
})

const fallo = (e: { message: string }) => new FacturacionError('DATOS_INVALIDOS', `Resend: ${e.message}`)

/** Correo del doble opt-in. Sin él confirmado, la persona no recibe ninguna campaña. */
export async function enviarConfirmacion(s: { email: string; nombre: string | null }, token: string) {
  comprobarBaseUrl()
  const url = urlConfirmar(token)
  const { error } = await resend.emails.send({
    from: FROM, to: s.email, replyTo: REPLY_TO,
    subject: 'Confirma tu suscripción a las novedades de Innovapp',
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#1E1E1E;font-size:15px;line-height:24px">
      <p>Hola${s.nombre ? ` ${s.nombre.replace(/[<>&"]/g, '')}` : ''},</p>
      <p>Para empezar a recibir las novedades de Innovapp, confirma tu suscripción:</p>
      <p style="margin:28px 0"><a href="${url}" style="background:#EE7528;color:#1E1E1E;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">Confirmar suscripción</a></p>
      <p style="font-size:13px;color:#5b6270">Si no lo has pedido tú, ignora este correo: no te enviaremos nada. El enlace caduca en 7 días.</p>
    </div>`,
    text: `Hola${s.nombre ? ` ${s.nombre}` : ''},\n\nPara empezar a recibir las novedades de Innovapp, confirma tu suscripción:\n${url}\n\nSi no lo has pedido tú, ignora este correo: no te enviaremos nada. El enlace caduca en 7 días.\n`,
  })
  if (error) throw fallo(error)
}

/** Envío de prueba (no cuenta en el historial de la campaña). */
export async function enviarPrueba(c: { id?: string; asunto: string; cuerpo_md: string }, to: string) {
  comprobarBaseUrl()
  const token = 'prueba'
  const archivo = await archivoDeCampana(c.id)
  const m = componerCorreo({ asunto: c.asunto, cuerpoMd: c.cuerpo_md }, { nombre: 'Nombre de prueba', empresa: 'Empresa de prueba', urlBaja: urlBaja(token) }, firmaHtml(), archivo?.(null))
  const { data, error } = await resend.emails.send({
    from: FROM, to, replyTo: REPLY_TO, subject: `[PRUEBA] ${m.asunto}`, html: m.html, text: m.text, headers: cabecerasBaja(token),
  })
  if (error) throw fallo(error)
  return data?.id ?? null
}

/** Crea una fila de envío por cada suscriptor confirmado del segmento (los que ya tenga, se quedan). */
export async function prepararDestinatarios(campanaId: string) {
  const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id: campanaId }, select: { sectores: true } })
  return prisma.$executeRaw`
    INSERT INTO newsletter_envios (campana_id, suscriptor_id, email)
    SELECT ${campanaId}, s.id, s.email FROM newsletter_suscriptores s
    WHERE s.estado = 'confirmado' AND (cardinality(${c.sectores}::text[]) = 0 OR s.sector = ANY(${c.sectores}::text[]))
    ON CONFLICT (campana_id, suscriptor_id) DO NOTHING`
}

/** «Enviar ahora» o «Programar». Solo desde borrador o programada. */
export async function lanzarCampana(id: string, cuando: Date | null) {
  const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id } })
  if (!['borrador', 'programada'].includes(c.estado)) throw new FacturacionError('ESTADO_INVALIDO', 'Esta campaña ya se ha enviado o cancelado')
  if (!c.cuerpo_md.trim()) throw new FacturacionError('DATOS_INVALIDOS', 'La campaña no tiene contenido')
  if (cuando && cuando.getTime() > Date.now() + 60_000) {
    return prisma.newsletter_campanas.update({ where: { id }, data: { estado: 'programada', programada_para: cuando, updated_at: new Date() } })
  }
  await prisma.newsletter_campanas.update({ where: { id }, data: { estado: 'enviando', programada_para: null, iniciada_at: new Date(), updated_at: new Date() } })
  await prepararDestinatarios(id)
  return prisma.newsletter_campanas.findUniqueOrThrow({ where: { id } })
}

const esperar = (ms: number) => new Promise(r => setTimeout(r, ms))
const manana = (ahora: Date) => new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate() + 1, 0, 10))
const mesSiguiente = (ahora: Date) => new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() + 1, 1, 0, 10))

async function enviadosHoy(ahora: Date) {
  const inicio = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate()))
  return prisma.newsletter_envios.count({ where: { enviado_at: { gte: inicio } } })
}

export interface ResultadoProceso { campana: string; enviados: number; omitidos: number; errores: number; estado: string; detalle?: string }

/**
 * Lo llama el cron (cada 5 min) y «Enviar ahora». Arranca las programadas que toquen y envía
 * lotes hasta agotar el presupuesto de tiempo. Cada lote se reserva con FOR UPDATE SKIP LOCKED:
 * aunque se solapen dos ejecuciones, nadie recibe la campaña dos veces.
 */
export async function procesarCampanas(opts: { ahora?: Date; presupuestoMs?: number } = {}): Promise<ResultadoProceso[]> {
  const ahora = opts.ahora ?? new Date()
  const limite = Date.now() + (opts.presupuestoMs ?? 240_000)
  const programadas = await prisma.newsletter_campanas.findMany({ where: { estado: 'programada', programada_para: { lte: ahora } }, select: { id: true } })
  for (const p of programadas) {
    const r = await prisma.newsletter_campanas.updateMany({ where: { id: p.id, estado: 'programada' }, data: { estado: 'enviando', iniciada_at: ahora, updated_at: ahora } })
    if (r.count) await prepararDestinatarios(p.id)
  }

  const res: ResultadoProceso[] = []
  const activas = await prisma.newsletter_campanas.findMany({
    where: { estado: 'enviando', OR: [{ pausada_hasta: null }, { pausada_hasta: { lte: ahora } }] }, orderBy: { iniciada_at: 'asc' },
  })
  for (const c of activas) {
    const r: ResultadoProceso = { campana: c.id, enviados: 0, omitidos: 0, errores: 0, estado: 'enviando' }
    res.push(r)
    if (c.pausada_hasta) await prisma.newsletter_campanas.update({ where: { id: c.id }, data: { pausada_hasta: null, ultimo_error: null } })
    while (Date.now() < limite) {
      if (LIMITE_DIARIO && (await enviadosHoy(new Date())) >= LIMITE_DIARIO) {
        await prisma.newsletter_campanas.update({ where: { id: c.id }, data: { pausada_hasta: manana(new Date()), ultimo_error: `Tope diario de ${LIMITE_DIARIO} envíos alcanzado: sigue mañana` } })
        r.estado = 'pausada'; break
      }
      const inicioLote = Date.now()
      const lote = await enviarLote(c)
      r.enviados += lote.enviados; r.omitidos += lote.omitidos; r.errores += lote.errores
      if (lote.pausa) {
        await prisma.newsletter_campanas.update({ where: { id: c.id }, data: { pausada_hasta: lote.pausa.hasta, ultimo_error: lote.pausa.motivo } })
        r.estado = 'pausada'; r.detalle = lote.pausa.motivo; break
      }
      if (lote.vacio) {
        const quedan = await prisma.newsletter_envios.count({ where: { campana_id: c.id, estado: 'pendiente' } })
        if (!quedan) {
          await prisma.newsletter_campanas.update({ where: { id: c.id }, data: { estado: 'enviada', terminada_at: new Date(), updated_at: new Date() } })
          r.estado = 'enviada'
        }
        break
      }
      await esperar(Math.max(0, MS_ENTRE_LOTES - (Date.now() - inicioLote)))
    }
  }
  return res
}

interface Lote { enviados: number; omitidos: number; errores: number; vacio: boolean; pausa?: { hasta: Date; motivo: string } }

async function enviarLote(c: { id: string; asunto: string; cuerpo_md: string }): Promise<Lote> {
  comprobarBaseUrl()
  const out: Lote = { enviados: 0, omitidos: 0, errores: 0, vacio: false }
  await prisma.$transaction(async tx => {
    const filas = await tx.$queryRaw<{ id: string; email: string; estado_s: string; nombre: string | null; empresa: string | null; token_baja: string }[]>`
      SELECT e.id, e.email, s.estado AS estado_s, s.nombre, s.empresa, s.token_baja
      FROM newsletter_envios e JOIN newsletter_suscriptores s ON s.id = e.suscriptor_id
      WHERE e.campana_id = ${c.id} AND e.estado = 'pendiente'
      ORDER BY e.created_at, e.id LIMIT ${LOTE}
      FOR UPDATE OF e SKIP LOCKED`
    if (!filas.length) { out.vacio = true; return }

    // Quien se dio de baja o rebotó después de preparar la campaña, no lo recibe
    const omitir = filas.filter(f => f.estado_s !== 'confirmado')
    if (omitir.length) {
      await tx.newsletter_envios.updateMany({ where: { id: { in: omitir.map(f => f.id) } }, data: { estado: 'omitido', updated_at: new Date() } })
      out.omitidos = omitir.length
    }
    const enviar = filas.filter(f => f.estado_s === 'confirmado')
    if (!enviar.length) return

    const firma = firmaHtml()
    const archivo = await archivoDeCampana(c.id)
    const correos = enviar.map(f => {
      const m = componerCorreo({ asunto: c.asunto, cuerpoMd: c.cuerpo_md }, { nombre: f.nombre, empresa: f.empresa, urlBaja: urlBaja(f.token_baja) }, firma, archivo?.(f.id))
      return {
        from: FROM, to: f.email, replyTo: REPLY_TO, subject: m.asunto, html: m.html, text: m.text,
        headers: cabecerasBaja(f.token_baja),
        tags: [{ name: 'tipo', value: 'newsletter' }, { name: 'campana', value: c.id.replace(/[^a-zA-Z0-9_-]/g, '') }],
      }
    })
    // Misma clave para el mismo lote: si se reintenta, Resend no lo duplica
    const clave = crypto.createHash('sha256').update(enviar.map(f => f.id).join(',')).digest('hex')
    let r = await resend.batch.send(correos, { idempotencyKey: `newsletter-${clave}` })
    if (r.error?.name === 'rate_limit_exceeded') { await esperar(2000); r = await resend.batch.send(correos, { idempotencyKey: `newsletter-${clave}` }) }

    if (r.error) {
      const ahora = new Date()
      if (r.error.name === 'daily_quota_exceeded') { out.pausa = { hasta: manana(ahora), motivo: 'Límite diario de Resend alcanzado: sigue mañana' }; return }
      if (r.error.name === 'monthly_quota_exceeded') { out.pausa = { hasta: mesSiguiente(ahora), motivo: 'Límite mensual de Resend alcanzado: sigue el mes que viene' }; return }
      if (r.error.name === 'rate_limit_exceeded') { out.pausa = { hasta: new Date(ahora.getTime() + 60_000), motivo: 'Límite de velocidad de Resend: se reintenta en un minuto' }; return }
      await tx.newsletter_envios.updateMany({ where: { id: { in: enviar.map(f => f.id) } }, data: { estado: 'error', error: r.error.message.slice(0, 500), updated_at: ahora } })
      out.errores = enviar.length
      return
    }
    const ids = r.data?.data ?? []
    const ahora = new Date()
    for (let i = 0; i < enviar.length; i++) {
      await tx.newsletter_envios.update({
        where: { id: enviar[i].id },
        data: ids[i]?.id ? { estado: 'enviado', resend_id: ids[i].id, enviado_at: ahora, updated_at: ahora } : { estado: 'error', error: 'Resend no devolvió id', updated_at: ahora },
      })
    }
    out.enviados = ids.filter(x => x?.id).length
    out.errores = enviar.length - out.enviados
  }, { timeout: 60_000, maxWait: 10_000 })
  return out
}
