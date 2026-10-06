import type { NextApiRequest, NextApiResponse } from 'next'
import { sendBajaEmail } from '../../lib/email'
import { EMAIL_RE, clientIp, rateLimited, recaptchaValido } from '../../lib/formulario-publico'

const SERVICES = ['Servix', 'GymStack', 'Agentes IA', 'Otro']

/** Formulario de /baja: envía la solicitud de baja de un servicio a contacto@innovapp.es. */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const name = String(body.name ?? '').trim()
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const account = String(body.account ?? '').trim()
  const reason = String(body.reason ?? '').trim()
  const service = String(body.service ?? '').trim()
  const honeypot = String(body.website ?? '').trim()
  const recaptchaToken = String(body.recaptchaToken ?? '').trim()

  // Bot: honeypot relleno -> fingimos éxito sin enviar nada
  if (honeypot) return res.status(200).json({ ok: true })

  if (!name || !email || !SERVICES.includes(service)) {
    return res.status(400).json({ error: 'Nombre, email y servicio son obligatorios.' })
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' })
  }
  if (reason.length > 5000 || name.length > 200 || account.length > 200 || phone.length > 40) {
    return res.status(400).json({ error: 'Algún campo es demasiado largo.' })
  }

  const ip = clientIp(req)

  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados envíos. Inténtalo de nuevo en unos minutos.' })
  }

  if (!(await recaptchaValido(recaptchaToken, ip))) {
    return res.status(400).json({ error: 'No se ha podido verificar que no eres un robot. Recarga la página e inténtalo de nuevo.' })
  }

  try {
    await sendBajaEmail({ name, email, phone, service, account, reason })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[api/baja] fallo al enviar email:', err)
    return res.status(500).json({ error: 'No se ha podido enviar la solicitud. Inténtalo más tarde.' })
  }
}
