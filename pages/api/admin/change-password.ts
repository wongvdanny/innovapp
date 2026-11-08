import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import bcrypt from 'bcryptjs'
import { authOptions, normalizarEmail } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { errorPassword, hashPassword } from '../../../lib/password'

// Cambio de contraseña de la cuenta admin actual. passwordChangedAt cierra las demás sesiones;
// el cliente vuelve a iniciar sesión con la nueva para conservar la suya.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const { actual, nueva } = req.body ?? {}
  const user = await prisma.user.findUnique({ where: { email: normalizarEmail(session!.user?.email) } })
  if (!user) return res.status(404).json({ error: 'Cuenta no encontrada' })
  if (typeof actual !== 'string' || !(await bcrypt.compare(actual, user.password))) return res.status(400).json({ error: 'La contraseña actual no es correcta' })
  const err = errorPassword(nueva)
  if (err) return res.status(400).json({ error: err })
  if (nueva === actual) return res.status(400).json({ error: 'La nueva contraseña debe ser distinta de la actual' })
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(nueva), passwordChangedAt: new Date() } })
  return res.json({ ok: true })
}
