import { randomBytes } from 'crypto'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma'
import { sendPromoConfirmacion } from '../../../lib/email'
import { clientIp } from '../../../lib/formulario-publico'
import { PROMO_SLUG, TEXTO_ACEPTO_BASES, TEXTO_MARKETING, promoCerrada } from '../../../lib/promo/config'
import { TIEMPO_MINIMO_MS, validarInscripcion } from '../../../lib/promo/validacion'
import { CONTACT_EMAIL } from '../../../lib/constants'

// Inscripción en la promoción /webgratis. Guarda la entrada sin confirmar y envía el email de
// doble opt-in; solo cuenta tras confirmarlo (/api/promo/confirm).

// Límite propio de la promo: 5 inscripciones por IP y hora (en memoria, por proceso)
const HORA_MS = 60 * 60 * 1000
const MAX_POR_HORA = 5
const intentos = new Map<string, number[]>()
function limitada(ip: string): boolean {
  const ahora = Date.now()
  const recientes = (intentos.get(ip) ?? []).filter(t => ahora - t < HORA_MS)
  const excede = recientes.length >= MAX_POR_HORA
  if (!excede) recientes.push(ahora)
  intentos.set(ip, recientes)
  return excede
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Método no permitido' })
  }
  if (promoCerrada()) return res.status(410).json({ error: 'Las inscripciones están cerradas.' })

  const body = (req.body ?? {}) as Record<string, unknown>
  // Antispam: honeypot relleno o envío en menos de 3 s desde la carga → fingimos éxito sin guardar
  if (String(body.website ?? '').trim() || Number(body.elapsedMs ?? 0) < TIEMPO_MINIMO_MS) {
    return res.status(200).json({ ok: true })
  }

  const r = validarInscripcion(body)
  if ('error' in r) return res.status(400).json({ error: r.error })
  const v = r.valor

  const ip = clientIp(req)
  if (limitada(ip)) return res.status(429).json({ error: 'Has hecho demasiados intentos. Vuelve a probar dentro de una hora.' })

  const yaInscrito = { error: `Ya hay una inscripción con este email. Revisa tu correo (también la carpeta de spam) para confirmarla; si necesitas ayuda, escríbenos a ${CONTACT_EMAIL}.` }
  if (await prisma.promoEntry.findUnique({ where: { promo_email: { promo: PROMO_SLUG, email: v.email } } })) {
    return res.status(409).json(yaInscrito)
  }

  // Texto exacto de las casillas marcadas (prueba del consentimiento)
  const consentText = [TEXTO_ACEPTO_BASES, ...(v.marketingConsent ? [TEXTO_MARKETING] : [])].join('\n')

  let entrada
  try {
    entrada = await prisma.promoEntry.create({
      data: {
        promo: PROMO_SLUG,
        name: v.name,
        businessName: v.businessName,
        sector: v.sector,
        city: v.city,
        province: v.province,
        email: v.email,
        phone: v.phone,
        instagram: v.instagram,
        currentWeb: v.currentWeb || null,
        contactChannel: v.contactChannel,
        description: v.description,
        acceptedTerms: true,
        marketingConsent: v.marketingConsent,
        consentText,
        ip,
        userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) || null,
        confirmToken: randomBytes(32).toString('hex'),
      },
    })
  } catch (err) {
    // Dos envíos simultáneos con el mismo email
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') return res.status(409).json(yaInscrito)
    console.error('[api/promo/webgratis] no se ha podido guardar:', err)
    return res.status(500).json({ error: 'No se ha podido guardar tu inscripción. Inténtalo de nuevo en unos minutos.' })
  }

  try {
    await sendPromoConfirmacion(entrada)
  } catch (err) {
    // Sin email de confirmación la inscripción no se puede confirmar: se borra para que pueda reintentarse
    console.error('[api/promo/webgratis] fallo al enviar la confirmación:', err)
    await prisma.promoEntry.delete({ where: { id: entrada.id } }).catch(() => {})
    return res.status(502).json({ error: `No hemos podido enviarte el email de confirmación. Inténtalo de nuevo en unos minutos o escríbenos a ${CONTACT_EMAIL}.` })
  }

  return res.status(200).json({ ok: true })
}
