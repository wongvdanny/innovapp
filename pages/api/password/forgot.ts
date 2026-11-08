import { NextApiRequest, NextApiResponse } from 'next'
import { normalizarEmail } from '../../../lib/authOptions'
import { solicitarRecuperacion } from '../../../lib/password'

const MENSAJE = 'Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña. Revisa también la carpeta de spam.'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const email = normalizarEmail(req.body?.email)
  // Sin await: si respondiéramos tras llamar a Resend, el tiempo de respuesta delataría qué emails existen
  void solicitarRecuperacion(email, process.env.NEXTAUTH_URL || 'https://innovapp.es')
  // Siempre la misma respuesta, exista o no el email
  return res.json({ ok: true, mensaje: MENSAJE })
}
