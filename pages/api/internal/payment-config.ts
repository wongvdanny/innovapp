import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

// Endpoint interno (server-to-server): a diferencia de /api/admin/stripe.ts y
// /api/admin/redsys.ts, aquí sí se devuelven las claves secretas sin redactar,
// porque quien consume esto (agentes.innovapp.es) las necesita para llamar a
// Stripe/Redsys. Nunca exponer esta ruta a un cliente de navegador.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = req.headers['x-internal-secret']
  if (secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const [stripeConfig, redsysConfig] = await Promise.all([
    prisma.stripeConfig.findFirst(),
    prisma.redsysConfig.findFirst(),
  ])

  return res.json({
    stripe: stripeConfig && {
      enabled: stripeConfig.enabled,
      environment: stripeConfig.environment,
      publishableKey: stripeConfig.publishableKey,
      secretKey: stripeConfig.secretKey,
      webhookSecret: stripeConfig.webhookSecret,
    },
    redsys: redsysConfig && {
      enabled: redsysConfig.enabled,
      environment: redsysConfig.environment,
      merchantCode: redsysConfig.merchantCode,
      secretKey: redsysConfig.secretKey,
      terminal: redsysConfig.terminal,
      currency: redsysConfig.currency,
    },
  })
}
