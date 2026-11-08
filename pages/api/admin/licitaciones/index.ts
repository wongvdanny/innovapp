import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import { FEED, parsearPagina, urlPermitida } from '../../../../lib/licitaciones'

// Una página del feed de PLACSP, resumida. /licitaciones la llama página a página siguiendo `siguiente`.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
  const url = typeof req.query.url === 'string' && req.query.url ? req.query.url : FEED
  if (!urlPermitida(url)) return res.status(400).json({ error: 'URL de feed no permitida' })
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (buscador-licitaciones innovapp)' },
      signal: AbortSignal.timeout(90_000),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return res.json(parsearPagina(await r.text()))
  } catch (e: any) {
    console.error('[api/admin/licitaciones]', url, e.message)
    return res.status(502).json({ error: 'No se pudo leer el feed de PLACSP' })
  }
}
