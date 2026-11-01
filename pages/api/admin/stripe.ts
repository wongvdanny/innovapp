import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'

// Nunca se devuelven secretKey ni webhookSecret: solo si están configurados.
const sinSecretos = ({ secretKey, webhookSecret, ...resto }: { secretKey: string; webhookSecret: string; [k: string]: unknown }) =>
  ({ ...resto, hasSecretKey: !!secretKey, hasWebhookSecret: !!webhookSecret })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).end()

  if (req.method === 'POST') {
    const { publishableKey, secretKey, webhookSecret, environment, enabled } = req.body ?? {}
    const data: Record<string, unknown> = { publishableKey, environment, enabled: !!enabled }
    if (secretKey) data.secretKey = secretKey
    if (webhookSecret) data.webhookSecret = webhookSecret
    const existing = await prisma.stripeConfig.findFirst()

    const config = existing
      ? await prisma.stripeConfig.update({ where: { id: existing.id }, data })
      : await prisma.stripeConfig.create({ data })

    return res.json(sinSecretos(config))
  }

  const config = await prisma.stripeConfig.findFirst()
  if (!config) return res.json(null)
  return res.json(sinSecretos(config))
}
