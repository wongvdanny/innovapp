import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { datosConcepto } from '../../../../../lib/facturacion/conceptos'

export default adminApi({
  // Plantillas de conceptos frecuentes, las más usadas primero.
  GET: async () => prisma.fac_conceptos.findMany({ where: { activo: true }, orderBy: [{ usos: 'desc' }, { descripcion: 'asc' }] }),
  POST: async req => prisma.fac_conceptos.create({ data: datosConcepto(req.body) }),
})
