import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'
import { transferenciaActiva } from '../../lib/transferencia'

// Endpoint público (sin auth): el checkout necesita saber qué
// proveedores están activos para decidir si mostrar selector o no.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const [redsys, stripe, transferencia] = await Promise.all([
    prisma.redsysConfig.findFirst(),
    prisma.stripeConfig.findFirst(),
    prisma.transferConfig.findFirst(),
  ])
  return res.json({
    redsys: !!redsys?.enabled,
    stripe: !!(stripe?.enabled && stripe?.publishableKey && stripe?.secretKey),
    transferencia: transferenciaActiva(transferencia),
  })
}
