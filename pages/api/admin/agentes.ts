import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { negociosAgentes } from '../../../lib/admin/agentes'

// Negocios de Agentes IA (agentes_db, solo lectura) para el panel de uso del producto.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const { from, to } = req.query
  const desde = from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const hasta = to ? new Date(String(to)) : new Date()
  try {
    return res.json(await negociosAgentes(desde, hasta))
  } catch (e: any) {
    console.error('[api/admin/agentes]', e.message)
    return res.status(502).json({ error: 'No se ha podido leer la base de datos de Agentes IA' })
  }
}
