import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { ibanValido, normalizarIban } from '../../../lib/transferencia'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).end()

  if (req.method === 'POST') {
    const b = req.body ?? {}
    const iban = normalizarIban(String(b.iban ?? ''))
    const titular = String(b.titular ?? '').trim()
    const enabled = !!b.enabled
    if (iban && !ibanValido(iban)) return res.status(400).json({ error: 'IBAN no válido' })
    if (enabled && (!iban || !titular)) return res.status(400).json({ error: 'Para activarla hacen falta titular e IBAN' })
    const diasPlazo = Math.min(60, Math.max(1, Math.round(Number(b.diasPlazo) || 5)))
    const data = {
      enabled, titular, iban, diasPlazo,
      bic: String(b.bic ?? '').trim().toUpperCase(),
      banco: String(b.banco ?? '').trim(),
      instrucciones: String(b.instrucciones ?? '').trim().slice(0, 1000),
    }
    const existing = await prisma.transferConfig.findFirst()
    const config = existing
      ? await prisma.transferConfig.update({ where: { id: existing.id }, data })
      : await prisma.transferConfig.create({ data })
    return res.json(config)
  }

  return res.json(await prisma.transferConfig.findFirst())
}
