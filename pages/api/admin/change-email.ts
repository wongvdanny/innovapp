import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import bcrypt from 'bcryptjs'
import { authOptions, normalizarEmail } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'

// Cambio del email (usuario de acceso) de la cuenta admin actual. Pide la contraseña actual.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const nuevo = normalizarEmail(req.body?.email)
  const { password } = req.body ?? {}
  const user = await prisma.user.findUnique({ where: { email: normalizarEmail(session!.user?.email) } })
  if (!user) return res.status(404).json({ error: 'Cuenta no encontrada' })
  if (typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'La contraseña actual no es correcta' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo)) return res.status(400).json({ error: 'El email no es válido' })
  if (nuevo === user.email) return res.status(400).json({ error: 'Ese ya es tu email' })
  if (await prisma.user.findUnique({ where: { email: nuevo }, select: { id: true } })) return res.status(400).json({ error: 'Ese email ya lo usa otra cuenta' })
  await prisma.user.update({ where: { id: user.id }, data: { email: nuevo } })
  return res.json({ ok: true, email: nuevo })
}
