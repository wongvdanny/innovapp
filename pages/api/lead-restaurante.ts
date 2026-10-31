import type { NextApiRequest, NextApiResponse } from 'next'
import lead from './lead'

// Alias de la ruta antigua del formulario de /agentes-ia-restaurantes (antes de /api/lead), para
// no perder envíos desde páginas cacheadas: esas versiones mandan «restaurante» en lugar de
// «negocio» y no mandan «source». Mismas validaciones, registro y emails que /api/lead.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST' && req.body && typeof req.body === 'object') {
    const body = req.body as Record<string, unknown>
    req.body = { ...body, source: 'restaurantes', negocio: body.negocio ?? body.restaurante }
  }
  return lead(req, res)
}
