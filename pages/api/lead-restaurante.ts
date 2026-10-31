import { promises as fs } from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { sendLeadRestauranteAutorespuesta, sendLeadRestauranteEmail } from '../../lib/email'
import { EMAIL_RE, clientIp, rateLimited, recaptchaValido } from '../../lib/formulario-publico'
import { CONSENTIMIENTO_RESTAURANTE, LIMITES_LEAD, TELEFONO_RE, type LeadRestaurante } from '../../lib/lead-restaurante'

// Registro de leads con la prueba del consentimiento (fecha, IP, texto aceptado). Una línea
// JSON por envío, en storage/ (fuera de /public y del repo).
const REGISTRO = path.join(process.cwd(), 'storage', 'leads', 'restaurantes.jsonl')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const campo = (k: keyof LeadRestaurante) => String(body[k] ?? '').trim()
  const lead: LeadRestaurante = {
    nombre: campo('nombre'),
    restaurante: campo('restaurante'),
    telefono: campo('telefono'),
    email: campo('email'),
    localidad: campo('localidad'),
    mensaje: campo('mensaje'),
  }
  const honeypot = String(body.website ?? '').trim()
  const recaptchaToken = String(body.recaptchaToken ?? '').trim()

  // Bot: honeypot relleno -> fingimos éxito sin enviar nada
  if (honeypot) return res.status(200).json({ ok: true })

  if (!lead.nombre || !lead.restaurante || !lead.telefono || !lead.email || !lead.localidad) {
    return res.status(400).json({ error: 'Rellena nombre, restaurante, teléfono, email y localidad.' })
  }
  if (!EMAIL_RE.test(lead.email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' })
  }
  if (!TELEFONO_RE.test(lead.telefono)) {
    return res.status(400).json({ error: 'El teléfono no tiene un formato válido.' })
  }
  if ((Object.keys(LIMITES_LEAD) as (keyof LeadRestaurante)[]).some(k => lead[k].length > LIMITES_LEAD[k])) {
    return res.status(400).json({ error: 'Algún campo es demasiado largo.' })
  }
  if (body.consentimiento !== true) {
    return res.status(400).json({ error: 'Para que te contactemos tienes que aceptar la casilla de consentimiento.' })
  }

  const ip = clientIp(req)

  if (rateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados envíos. Inténtalo de nuevo en unos minutos.' })
  }

  // Antes de guardar o enviar nada (mismo reCAPTCHA v2 y misma verificación que /api/contacto)
  if (!(await recaptchaValido(recaptchaToken, ip))) {
    return res.status(400).json({ error: 'No se ha podido verificar que no eres un robot. Marca de nuevo la casilla «No soy un robot» y vuelve a enviar.' })
  }

  // El texto guardado es el del servidor, no el que mande el navegador.
  const consentimiento = { fecha: new Date().toISOString(), ip, texto: CONSENTIMIENTO_RESTAURANTE }

  try {
    await fs.mkdir(path.dirname(REGISTRO), { recursive: true })
    await fs.appendFile(
      REGISTRO,
      JSON.stringify({ ...lead, consentimiento, userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) }) + '\n',
    )
  } catch (err) {
    // El email a contacto@ lleva también fecha, IP y texto: no se pierde la prueba.
    console.error('[api/lead-restaurante] no se ha podido guardar el lead:', err)
  }

  try {
    await sendLeadRestauranteEmail({ ...lead, consentimiento })
  } catch (err) {
    console.error('[api/lead-restaurante] fallo al enviar el aviso:', err)
    return res.status(500).json({ error: 'No se ha podido enviar. Inténtalo más tarde o escríbenos por WhatsApp.' })
  }

  try {
    await sendLeadRestauranteAutorespuesta(lead.email, lead.nombre)
  } catch (err) {
    // El lead ya ha llegado: un fallo de la respuesta automática no se le muestra al usuario.
    console.error('[api/lead-restaurante] fallo en la respuesta automática:', err)
  }

  return res.status(200).json({ ok: true })
}
