import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Baja de las comunicaciones comerciales de la promo (enlace del pie de los emails). La
// inscripción sigue válida: solo deja de recibir novedades y ofertas.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }
  const token = String(req.query.token ?? '')
  const entrada = token ? await prisma.promoEntry.findUnique({ where: { confirmToken: token } }) : null
  if (entrada && !entrada.unsubscribedAt) {
    await prisma.promoEntry.update({ where: { id: entrada.id }, data: { unsubscribedAt: new Date() } })
  }
  const titulo = entrada ? 'Te has dado de baja' : 'Enlace no válido'
  const texto = entrada
    ? 'Ya no te enviaremos novedades ni ofertas de Innovapp. Tu inscripción en la promoción sigue siendo válida.'
    : 'Este enlace de baja no es válido. Si quieres darte de baja, escríbenos a contacto@innovapp.es.'
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('X-Robots-Tag', 'noindex')
  return res.status(entrada ? 200 : 404).send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${titulo} — Innovapp</title></head>
<body style="font-family:system-ui,sans-serif;background:#fafaf9;color:#1e1e1e;margin:0;padding:48px 16px">
<main style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #ebe8e5;border-radius:20px;padding:32px">
<h1 style="font-size:24px;margin:0 0 12px">${titulo}</h1><p style="font-size:16px;line-height:1.7;color:#57534e;margin:0 0 20px">${texto}</p>
<a href="/webgratis" style="color:#9a4a14;font-weight:700">Volver a la promoción</a></main></body></html>`)
}
