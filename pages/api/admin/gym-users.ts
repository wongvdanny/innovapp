import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import {
  GymstackUserError, listGymstackAdmins, resetGymstackAdminPassword, setGymstackAdminActive,
} from '../../../lib/provisioning/gymstack'
import { sendGymstackPasswordReset } from '../../../lib/email'

// Administradores de un gimnasio de GymStack (panel /admin → GymStack → «Usuarios»).
//   GET  ?gymId=…                                   lista de ADMIN
//   POST { gymId, userId, action: 'reset' | 'activate' | 'deactivate' }
// El reset envía la contraseña nueva por email; si el email falla, se devuelve una vez para
// pasarla en mano.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  try {
    if (req.method === 'GET') {
      const gymId = typeof req.query.gymId === 'string' ? req.query.gymId : ''
      if (!gymId) return res.status(400).json({ error: 'Falta gymId' })
      return res.json({ admins: await listGymstackAdmins(gymId) })
    }

    if (req.method === 'POST') {
      const { gymId, userId, action } = req.body ?? {}
      if (typeof gymId !== 'string' || typeof userId !== 'string' || !gymId || !userId) {
        return res.status(400).json({ error: 'Faltan gymId o userId' })
      }

      if (action === 'activate' || action === 'deactivate') {
        await setGymstackAdminActive(gymId, userId, action === 'activate')
        return res.json({ ok: true })
      }

      if (action === 'reset') {
        const r = await resetGymstackAdminPassword(gymId, userId)
        try {
          await sendGymstackPasswordReset(r.email, r.name, r.gymName, r.password)
          return res.json({ ok: true, emailed: true, email: r.email })
        } catch (e: any) {
          console.error('[gym-users] email de reset fallido:', e.message)
          return res.json({ ok: true, emailed: false, email: r.email, password: r.password, emailError: e.message })
        }
      }

      return res.status(400).json({ error: 'Acción no válida' })
    }

    return res.status(405).end()
  } catch (e: any) {
    if (e instanceof GymstackUserError) return res.status(e.status).json({ error: e.message })
    console.error('[gym-users]', e)
    return res.status(500).json({ error: 'Error interno' })
  }
}
