import { NextApiRequest, NextApiResponse } from 'next'
import { timingSafeEqual } from 'crypto'
import { procesarCampanas } from '../../../lib/newsletter/envio'

// Cron de la newsletter (crontab, cada 5 min, Authorization: Bearer $CRON_SECRET): arranca las
// campañas programadas y envía lotes; reanuda las pausadas por límite diario cuando toca.
function autorizado(req: NextApiRequest) {
  const secreto = process.env.CRON_SECRET || ''
  const recibido = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (secreto.length < 32 || recibido.length !== secreto.length) return false
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(secreto))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()
  if (!autorizado(req)) return res.status(401).json({ error: 'No autorizado' })
  try {
    return res.json({ ok: true, campanas: await procesarCampanas({ presupuestoMs: 240_000 }) })
  } catch (e: any) {
    console.error('[cron/newsletter]', e)
    return res.status(500).json({ error: e.message })
  }
}
