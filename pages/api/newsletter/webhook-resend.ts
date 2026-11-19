import { NextApiRequest, NextApiResponse } from 'next'
import { Resend } from 'resend'
import { procesarEvento } from '../../../lib/newsletter/webhook'

// Webhook de Resend (firmado con Svix). La firma se comprueba sobre el cuerpo en bruto.
export const config = { api: { bodyParser: false } }

async function cuerpoEnBruto(req: NextApiRequest) {
  const trozos: Buffer[] = []
  for await (const t of req) trozos.push(typeof t === 'string' ? Buffer.from(t) : t)
  return Buffer.concat(trozos).toString('utf8')
}

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const secreto = process.env.RESEND_WEBHOOK_SECRET
  if (!secreto) return res.status(503).json({ error: 'Webhook sin configurar' })
  const payload = await cuerpoEnBruto(req)
  let evt: any
  try {
    evt = resend.webhooks.verify({
      payload, webhookSecret: secreto,
      headers: { id: String(req.headers['svix-id'] ?? ''), timestamp: String(req.headers['svix-timestamp'] ?? ''), signature: String(req.headers['svix-signature'] ?? '') },
    })
  } catch {
    return res.status(401).json({ error: 'Firma no válida' })
  }
  try {
    return res.status(200).json({ ok: true, resultado: await procesarEvento(evt) })
  } catch (e) {
    console.error('[newsletter/webhook-resend]', e)
    return res.status(500).json({ error: 'Error al procesar el evento' }) // Resend lo reintentará
  }
}
