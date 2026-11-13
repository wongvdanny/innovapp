import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { sendPromoDentro } from '../../../lib/email'

// Doble opt-in: marca la inscripción como confirmada y lleva a /webgratis/gracias. Volver a abrir
// el enlace no reenvía el email «Ya estás dentro».
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end()
  }
  const token = String(req.query.token ?? '')
  const entrada = token ? await prisma.promoEntry.findUnique({ where: { confirmToken: token } }) : null
  if (!entrada) return res.redirect(302, '/webgratis?confirmacion=invalida')

  if (!entrada.confirmedAt) {
    const confirmada = await prisma.promoEntry.update({ where: { id: entrada.id }, data: { confirmedAt: new Date() } })
    try {
      await sendPromoDentro(confirmada)
    } catch (err) {
      // La confirmación ya está guardada: el email es solo un recordatorio
      console.error('[api/promo/confirm] fallo al enviar «Ya estás dentro»:', err)
    }
  }
  return res.redirect(302, '/webgratis/gracias')
}
