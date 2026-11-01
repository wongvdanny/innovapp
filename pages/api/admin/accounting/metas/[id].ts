import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { normalizarMeta } from '../../../../../lib/accounting/validacion'

export default adminApi({
  PUT: async req => prisma.metas.update({ where: { id: texto(req.query.id) }, data: normalizarMeta(req.body) }),
  DELETE: async req => { await prisma.metas.delete({ where: { id: texto(req.query.id) } }); return { ok: true } },
})
