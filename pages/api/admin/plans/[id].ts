import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import { prisma } from '../../../../lib/prisma'
import { datosPlan } from '../../../../lib/admin/planes'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).end()
  const { id } = req.query
  if (req.method === 'PUT') {
    const r = datosPlan(req.body, false)
    if ('error' in r) return res.status(400).json({ error: r.error })
    const plan = await prisma.plan.update({ where: { id: String(id) }, data: r.data })
    return res.json(plan)
  }
  if (req.method === 'DELETE') {
    await prisma.plan.delete({ where: { id: String(id) } })
    return res.json({ ok: true })
  }
  res.status(405).end()
}
