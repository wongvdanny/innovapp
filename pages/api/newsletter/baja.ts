import { NextApiRequest, NextApiResponse } from 'next'
import { clientIp } from '../../../lib/formulario-publico'
import { darDeBaja } from '../../../lib/newsletter/suscriptores'

// Baja inmediata. Dos usos:
//  · RFC 8058 (List-Unsubscribe-Post): el gestor de correo hace POST ?t=… con «List-Unsubscribe=One-Click».
//  · La página /newsletter/baja hace POST con { t } al cargarse (los escáneres de enlaces no lo ejecutan).
// Solo POST: un GET (prefetch, escáner) nunca da de baja a nadie.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).end() }
  const oneClick = typeof req.body === 'object' && req.body?.['List-Unsubscribe'] === 'One-Click'
    || (typeof req.body === 'string' && req.body.includes('List-Unsubscribe=One-Click'))
  const token = (typeof req.query.t === 'string' ? req.query.t : '') || (typeof req.body?.t === 'string' ? req.body.t : '')
  const r = await darDeBaja(token, oneClick ? 'one_click' : 'enlace', clientIp(req))
  if (r === 'no_valido') return res.status(404).json({ error: 'Enlace de baja no válido' })
  return res.status(200).json({ ok: true, resultado: r })
}
