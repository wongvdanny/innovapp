import { NextApiRequest, NextApiResponse } from 'next'
import { timingSafeEqual } from 'crypto'
import { prisma } from '../../../lib/prisma'
import { reintentarCobrosPendientes } from '../../../lib/facturacion/pagos'
import { procesarRecurrentes } from '../../../lib/facturacion/recurrentes'
import { enviarRecordatorios } from '../../../lib/facturacion/recordatorios'
import { registrarEvento } from '../../../lib/facturacion/eventos'
import { aJson } from '../../../lib/facturacion/api'

// Cron horario de facturación (crontab de root, Authorization: Bearer $CRON_SECRET):
//  1. reintenta cobros online confirmados sin factura
//  2. genera las facturas recurrentes del día
//  3. envía recordatorios de vencidas (solo de 9 a 20 h, hora de Madrid)
export const config = { api: { responseLimit: false } }

function autorizado(req: NextApiRequest) {
  const secreto = process.env.CRON_SECRET || ''
  const recibido = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (secreto.length < 32 || recibido.length !== secreto.length) return false
  return timingSafeEqual(Buffer.from(recibido), Buffer.from(secreto))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()
  if (!autorizado(req)) return res.status(401).json({ error: 'No autorizado' })

  const actor = { usuario: 'cron' }
  const hora = +new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hourCycle: 'h23' }).format(new Date())
  const resumen: Record<string, unknown> = { inicio: new Date().toISOString() }
  const tareas: [string, () => Promise<unknown[]>][] = [
    ['cobros', () => reintentarCobrosPendientes(actor)],
    ['recurrentes', () => procesarRecurrentes(actor)],
    ['recordatorios', async () => (hora >= 9 && hora < 20 ? enviarRecordatorios(actor) : [])],
  ]
  for (const [nombre, tarea] of tareas) {
    try { resumen[nombre] = await tarea() }
    catch (e: any) { resumen[nombre] = { error: e.message }; console.error(`Cron facturación (${nombre}):`, e) }
  }
  // Solo deja rastro en el log inalterable cuando ha habido actividad
  const actividad = ['cobros', 'recurrentes', 'recordatorios'].some(k => Array.isArray(resumen[k]) ? (resumen[k] as unknown[]).length : true)
  if (actividad) await registrarEvento(prisma, actor, 'cron.facturacion', 'cron', null, aJson(resumen) as any)
  return res.json(aJson(resumen))
}
