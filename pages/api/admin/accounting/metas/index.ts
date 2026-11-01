import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { normalizarMeta } from '../../../../../lib/accounting/validacion'

export default adminApi({
  GET: async () => prisma.metas.findMany({ orderBy: [{ activa: 'desc' }, { hasta: 'asc' }] }),
  POST: async req => prisma.metas.create({ data: normalizarMeta(req.body) }),
})
