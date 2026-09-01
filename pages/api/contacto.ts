import type { NextApiRequest, NextApiResponse } from 'next'
import { sendContactEmail } from '../../lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PRODUCTS = ['Servix', 'GymStack', 'Agentes IA', 'Otro']

// --- Rate limiting básico en memoria: 5 envíos por IP cada 10 min ---
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return true
  }
  recent.push(now)
  hits.set(ip, recent)
  // limpieza oportunista para que el Map no crezca sin límite
  if (hits.size > 500) {
    hits.forEach((v, k) => {
      if (v.every(t => now - t >= WINDOW_MS)) hits.delete(k)
    })
  }
  return false
}

function clientIp(req: NextApiRequest): string {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  if (Array.isArray(fwd) && fwd.length) return fwd[0]
  return req.socket.remoteAddress || 'unknown'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const message = String(body.message ?? '').trim()
  const productRaw = String(body.product ?? '').trim()
  const product = PRODUCTS.includes(productRaw) ? productRaw : ''
  const honeypot = String(body.website ?? '').trim()

  // Bot: honeypot relleno -> fingimos éxito sin enviar nada
  if (honeypot) return res.status(200).json({ ok: true })

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nombre, email y mensaje son obligatorios.' })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' })
  }
  if (message.length > 5000 || name.length > 200) {
    return res.status(400).json({ error: 'El mensaje es demasiado largo.' })
  }

  if (rateLimited(clientIp(req))) {
    return res.status(429).json({ error: 'Demasiados envíos. Inténtalo de nuevo en unos minutos.' })
  }

  try {
    await sendContactEmail({ name, email, phone, product, message })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[api/contacto] fallo al enviar email:', err)
    return res.status(500).json({ error: 'No se ha podido enviar el mensaje. Inténtalo más tarde.' })
  }
}
