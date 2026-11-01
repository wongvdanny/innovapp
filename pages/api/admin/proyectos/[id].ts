import { prisma } from '../../../../lib/prisma'
import { adminApi, texto } from '../../../../lib/facturacion/api'
import { normalizarProyecto } from '../../../../lib/accounting/validacion'

export default adminApi({
  PUT: async req => prisma.proyectos.update({ where: { id: texto(req.query.id) }, data: { ...normalizarProyecto(req.body), updated_at: new Date() } }),
  // Las facturas y gastos del proyecto se conservan: solo pierden el enlace (ON DELETE SET NULL).
  DELETE: async req => { await prisma.proyectos.delete({ where: { id: texto(req.query.id) } }); return { ok: true } },
})
