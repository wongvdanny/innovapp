import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'
import { registrarDescarga } from '../../../../lib/newsletter/archivos'

// Botón «Descargar» de los correos: sirve el PDF de la campaña y registra la descarga.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end() }
  const a = await registrarDescarga(String(req.query.id ?? ''), req.query.e)
  if (!a) return res.status(404).send('Archivo no encontrado')
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Length', String(a.bytes))
  res.setHeader('Content-Disposition', `attachment; filename="${a.nombre.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(a.nombre)}`)
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  fs.createReadStream(a.abs).pipe(res)
}
