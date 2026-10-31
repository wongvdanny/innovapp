import { promises as fs } from 'fs'
import path from 'path'
import type { NextApiRequest, NextApiResponse } from 'next'
import { sendLeadAutorespuesta, sendLeadEmail } from '../../lib/email'
import { EMAIL_RE, clientIp, rateLimited, recaptchaValido } from '../../lib/formulario-publico'
import { CONSENTIMIENTO_LEAD, LIMITES_LEAD, TELEFONO_RE, type Lead } from '../../lib/lead'
import { FUENTES_LEAD } from '../../data/sectores'

// Leads de las landings de Agentes IA (restaurantes y sectores). El registro guarda la prueba del
// consentimiento (fecha, IP, texto aceptado): una línea JSON por envío en
// storage/leads/<origen>.jsonl (fuera de /public y del repo).
const DIR_LEADS = path.join(process.cwd(), 'storage', 'leads')

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const body = (req.body ?? {}) as Record<string, unknown>
  const campo = (k: keyof Lead) => String(body[k] ?? '').trim()
  const lead: Lead = {
    nombre: campo('nombre'),
    negocio: campo('negocio'),
    telefono: campo('telefono'),
    email: campo('email'),
    localidad: campo('localidad'),
    mensaje: campo('mensaje'),
  }
  const clave = String(body.source ?? '').trim()
  const honeypot = String(body.website ?? '').trim()
  const recaptchaToken = String(body.recaptchaToken ?? '').trim()

  // Bot: honeypot relleno -> fingimos éxito sin enviar nada
  if (honeypot) return res.status(200).json({ ok: true })

  // Solo orígenes conocidos (también evita rutas raras en el nombre del registro)
  const fuente = Object.prototype.hasOwnProperty.call(FUENTES_LEAD, clave) ? FUENTES_LEAD[clave] : null
  if (!fuente) return res.status(400).json({ error: 'Formulario no válido. Recarga la página e inténtalo de nuevo.' })

  if (!lead.nombre || !lead.negocio || !lead.telefono || !lead.email || !lead.localidad) {
    return res.status(400).json({ error: `Rellena nombre, ${fuente.etiquetaNegocio.toLowerCase()}, teléfono, email y localidad.` })
  }
  if (!EMAIL_RE.test(lead.email)) {
    return res.status(400).json({ error: 'El email no tiene un formato válido.' })
  }
  if (!TELEFONO_RE.test(lead.telefono)) {
    return res.status(400).json({ error: 'El teléfono no tiene un formato válido.' })
  }
  if ((Object.keys(LIMITES_LEAD) as (keyof Lead)[]).some(k => lead[k].length > LIMITES_LEAD[k])) {
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
  const consentimiento = { fecha: new Date().toISOString(), ip, texto: CONSENTIMIENTO_LEAD }

  try {
    await fs.mkdir(DIR_LEADS, { recursive: true })
    await fs.appendFile(
      path.join(DIR_LEADS, `${clave}.jsonl`),
      JSON.stringify({ ...lead, source: clave, consentimiento, userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) }) + '\n',
    )
  } catch (err) {
    // El email a contacto@ lleva también fecha, IP y texto: no se pierde la prueba.
    console.error('[api/lead] no se ha podido guardar el lead:', err)
  }

  try {
    await sendLeadEmail({ ...lead, fuente: { ...fuente, clave }, consentimiento })
  } catch (err) {
    console.error('[api/lead] fallo al enviar el aviso:', err)
    return res.status(500).json({ error: 'No se ha podido enviar. Inténtalo más tarde o escríbenos por WhatsApp.' })
  }

  try {
    await sendLeadAutorespuesta(lead.email, lead.nombre, fuente)
  } catch (err) {
    // El lead ya ha llegado: un fallo de la respuesta automática no se le muestra al usuario.
    console.error('[api/lead] fallo en la respuesta automática:', err)
  }

  return res.status(200).json({ ok: true })
}
