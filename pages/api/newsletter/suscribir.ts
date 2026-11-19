import { NextApiRequest, NextApiResponse } from 'next'
import { clientIp, rateLimited, recaptchaValido } from '../../../lib/formulario-publico'
import { EMAIL_RE, normalizarEmail } from '../../../lib/newsletter/tipos'
import { altaPublica } from '../../../lib/newsletter/suscriptores'

// Alta pública con doble opt-in: siempre la misma respuesta, exista o no el email.
const MENSAJE = 'Te hemos enviado un correo para confirmar la suscripción. Hasta que no lo confirmes no recibirás nada (revisa también la carpeta de spam).'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })
  const b = req.body ?? {}
  // Bot: honeypot relleno → fingimos éxito sin hacer nada
  if (String(b.website ?? '').trim()) return res.status(200).json({ ok: true, mensaje: MENSAJE })
  const email = normalizarEmail(b.email)
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'El email no tiene un formato válido.' })
  if (b.consentimiento !== true) return res.status(400).json({ error: 'Para suscribirte tienes que aceptar recibir las novedades.' })
  const ip = clientIp(req)
  if (rateLimited(ip)) return res.status(429).json({ error: 'Demasiados envíos. Inténtalo de nuevo en unos minutos.' })
  if (!(await recaptchaValido(String(b.recaptchaToken ?? '').trim(), ip))) {
    return res.status(400).json({ error: 'No se ha podido verificar que no eres un robot. Recarga la página e inténtalo de nuevo.' })
  }
  try {
    await altaPublica({ email, nombre: b.nombre, empresa: b.empresa, sector: b.sector }, ip)
  } catch (e) {
    console.error('[api/newsletter/suscribir]', e)
    return res.status(500).json({ error: 'No se ha podido completar la suscripción. Inténtalo de nuevo en unos minutos.' })
  }
  return res.status(200).json({ ok: true, mensaje: MENSAJE })
}
