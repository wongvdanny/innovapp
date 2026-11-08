import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { sendPasswordResetEmail } from './email'

// Contraseñas: mismo hash que el resto del proyecto (bcryptjs, coste 10).
export const MIN_PASSWORD = 8
// bcrypt solo usa los primeros 72 bytes: más largas darían una falsa sensación de seguridad
const MAX_BYTES = 72
const VALIDEZ_TOKEN_MS = 60 * 60 * 1000
const ESPERA_ENTRE_EMAILS_MS = 2 * 60 * 1000

/** Mensaje de error si la contraseña nueva no vale, o null. */
export function errorPassword(p: unknown): string | null {
  if (typeof p !== 'string' || p.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`
  if (Buffer.byteLength(p, 'utf8') > MAX_BYTES) return 'La contraseña es demasiado larga (máximo 72 caracteres)'
  return null
}

export const hashPassword = (p: string) => bcrypt.hash(p, 10)

/** Solo se guarda el sha256 del token; el token en claro va únicamente en el email. */
export const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex')

/**
 * Envía el enlace de recuperación si el email existe. Nunca lanza ni informa de si existe.
 * Como mucho un email cada 2 minutos por cuenta.
 */
export async function solicitarRecuperacion(email: string, baseUrl: string) {
  try {
    const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } }) : null
    if (!user) return
    const reciente = await prisma.passwordResetToken.findFirst({
      where: { userId: user.id, createdAt: { gt: new Date(Date.now() - ESPERA_ENTRE_EMAILS_MS) } },
      select: { id: true },
    })
    if (reciente) return
    const token = crypto.randomBytes(32).toString('hex')
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VALIDEZ_TOKEN_MS) },
    })
    await sendPasswordResetEmail(user.email, user.name, `${baseUrl}/restablecer?token=${token}`)
  } catch (e) {
    console.error('[password] No se ha podido enviar el email de recuperación:', e)
  }
}

/** Token vigente (sin usar y sin caducar) o null. */
export async function tokenVigente(token: unknown) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return null
  return prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(token), usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userId: true },
  })
}

/**
 * Restablece la contraseña con un token: nuevo hash, cierra todas las sesiones (passwordChangedAt)
 * y deja usados todos los tokens de la cuenta. Devuelve un mensaje de error o null.
 */
export async function restablecerConToken(token: unknown, nueva: unknown): Promise<string | null> {
  const err = errorPassword(nueva)
  if (err) return err
  const t = await tokenVigente(token)
  if (!t) return 'El enlace no es válido o ha caducado. Pide uno nuevo.'
  const hash = await hashPassword(nueva as string)
  const ahora = new Date()
  // updateMany con usedAt: null: si dos peticiones llegan a la vez, solo una gana
  const usado = await prisma.$transaction(async tx => {
    const r = await tx.passwordResetToken.updateMany({ where: { id: t.id, usedAt: null }, data: { usedAt: ahora } })
    if (r.count === 0) return false
    await tx.user.update({ where: { id: t.userId }, data: { password: hash, passwordChangedAt: ahora } })
    await tx.passwordResetToken.updateMany({ where: { userId: t.userId, usedAt: null }, data: { usedAt: ahora } })
    return true
  })
  return usado ? null : 'El enlace no es válido o ha caducado. Pide uno nuevo.'
}
