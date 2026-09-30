import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import { prisma } from '../../../../lib/prisma'
import { verificarIntegridad } from '../../../../lib/facturacion/verifactu/integridad'
import { registrarEvento } from '../../../../lib/facturacion/eventos'

// GET: recalcula todas las huellas de fac_registros_verifactu y comprueba el
// encadenamiento y la coherencia con las facturas. Deja constancia en fac_eventos.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  const resultado = await verificarIntegridad(prisma)
  await registrarEvento(prisma, {
    usuario: session!.user?.email || 'admin',
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null,
  }, 'verifactu.integridad_verificada', 'verifactu', null, {
    ok: resultado.ok, registros: resultado.registros, errores: resultado.errores.length, ultimaHuella: resultado.ultimaHuella,
  })
  return res.json(resultado)
}
