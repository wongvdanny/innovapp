import { Resend } from 'resend'
import PostalMime from 'postal-mime'

// Correos que llegan a boletin.innovapp.es (Resend Receiving, evento email.received): se reenvían a
// contacto@innovapp.es para que las respuestas a las campañas no se pierdan.
//   · Leer el correo recibido exige una clave con acceso completo: RESEND_RECEIVING_KEY (solo en .env).
//     El reenvío sale con la clave de envío normal (RESEND_API_KEY).
//   · Reply-To = remitente original: al contestar desde contacto@, la respuesta va a quien escribió
//     (y no a novedades@, que la volvería a reenviar).
//   · Clave de idempotencia por correo recibido: un reintento del webhook no lo duplica.
//   · Nunca se reenvía lo que sale del propio dominio del boletín (evita bucles).

export const DOMINIO_BOLETIN = 'boletin.innovapp.es'
export const DESTINO_REENVIO = process.env.NEWSLETTER_REENVIO_A || 'contacto@innovapp.es'
const FROM_REENVIO = `Innovapp (boletín) <novedades@${DOMINIO_BOLETIN}>`
const MAX_ADJUNTOS_BYTES = 30 * 1024 * 1024

/** «Nombre <a@b.es>» → «a@b.es» (en minúsculas). */
export function extraerEmail(v: string | null | undefined) {
  const m = (v ?? '').match(/<([^>]+)>/)
  return (m ? m[1] : v ?? '').trim().toLowerCase()
}

/** Solo lo que va dirigido al dominio del boletín y no sale de él. */
export function debeReenviarse(evt: { from?: string; to?: string[] }) {
  const destinos = (evt.to ?? []).map(extraerEmail)
  if (!destinos.some(d => d.endsWith(`@${DOMINIO_BOLETIN}`))) return false
  return !extraerEmail(evt.from).endsWith(`@${DOMINIO_BOLETIN}`)
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export interface CorreoRecibido {
  id: string
  from: string
  to: string[]
  subject: string | null
  replyTo: string[] | null
  fecha: string
}
export interface Analizado {
  text?: string | null
  html?: string | null
  attachments: { filename?: string | null; content: string | ArrayBuffer; mimeType: string; contentId?: string | null }[]
}

/** Correo de reenvío (función pura): cabecera con los datos originales + contenido + adjuntos. */
export function componerReenvio(r: CorreoRecibido, a: Analizado, destino = DESTINO_REENVIO) {
  const asunto = `[Boletín] ${r.subject?.trim() || '(sin asunto)'}`
  const responderA = extraerEmail(r.replyTo?.[0] || r.from)
  const datos = [`De: ${r.from}`, `Para: ${r.to.join(', ')}`, `Fecha: ${r.fecha}`, `Asunto: ${r.subject ?? ''}`]
  const aviso = 'Respuesta recibida en el boletín de Innovapp. Si contestas a este correo, la respuesta irá directamente a quien escribió.'
  const text = `${aviso}\n\n${datos.join('\n')}\n\n──────────\n\n${a.text?.trim() || '(sin texto)'}\n`
  const cabeceraHtml = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5b6270;border-left:3px solid #EE7528;padding:8px 12px;margin:0 0 16px;background:#fff7f1;">
<strong>${esc(aviso)}</strong><br>${datos.map(esc).join('<br>')}</div>`
  const html = a.html ? `${cabeceraHtml}${a.html}` : `${cabeceraHtml}<pre style="white-space:pre-wrap;font-family:inherit;">${esc(a.text?.trim() || '(sin texto)')}</pre>`
  let total = 0
  const attachments = a.attachments
    .map(x => ({ filename: x.filename || 'adjunto', content: typeof x.content === 'string' ? x.content : Buffer.from(x.content).toString('base64'), contentType: x.mimeType, contentId: x.contentId?.replace(/^<|>$/g, '') || undefined }))
    .filter(x => (total += Math.ceil(x.content.length * 3 / 4)) <= MAX_ADJUNTOS_BYTES)
  return {
    from: FROM_REENVIO, to: destino, replyTo: responderA || undefined, subject: asunto, text, html,
    attachments: attachments.length ? attachments : undefined,
  }
}

/** email.received → reenvío a contacto@. Lanza si algo falla (el webhook responde 500 y Resend reintenta). */
export async function reenviarRecibido(evt: { data?: { email_id?: string; from?: string; to?: string[]; created_at?: string } }): Promise<string> {
  const d = evt.data ?? {}
  if (!d.email_id || !debeReenviarse(d)) return 'ignorado'
  const clave = process.env.RESEND_RECEIVING_KEY
  if (!clave) throw new Error('Falta RESEND_RECEIVING_KEY: no se puede leer el correo recibido')
  const recibido = await new Resend(clave).emails.receiving.get(d.email_id)
  if (recibido.error || !recibido.data) throw new Error(`Resend (recepción): ${recibido.error?.message ?? 'sin datos'}`)
  const r = recibido.data as any
  if (!r.raw?.download_url) throw new Error('Resend (recepción): el correo no tiene contenido descargable')
  const raw = await fetch(r.raw.download_url)
  if (!raw.ok) throw new Error(`No se ha podido descargar el correo recibido (${raw.status})`)
  const analizado = await PostalMime.parse(await raw.text(), { attachmentEncoding: 'base64' })
  const correo = componerReenvio(
    { id: d.email_id, from: r.from ?? d.from ?? '', to: r.to ?? d.to ?? [], subject: r.subject ?? null, replyTo: r.reply_to ?? null, fecha: r.created_at ?? d.created_at ?? new Date().toISOString() },
    analizado as unknown as Analizado,
  )
  const envio = await new Resend(process.env.RESEND_API_KEY).emails.send(correo, { idempotencyKey: `reenvio-recibido-${d.email_id}` })
  if (envio.error) throw new Error(`Resend (reenvío): ${envio.error.message}`)
  return 'reenviado'
}
