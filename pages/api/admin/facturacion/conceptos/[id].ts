import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { datosConcepto } from '../../../../../lib/facturacion/conceptos'

export default adminApi({
  PUT: async req => prisma.fac_conceptos.update({ where: { id: texto(req.query.id) }, data: datosConcepto(req.body) }),
  // Uso desde el editor: suma 1 al contador para ordenarlos por frecuencia.
  POST: async req => prisma.fac_conceptos.update({ where: { id: texto(req.query.id) }, data: { usos: { increment: 1 } } }),
  DELETE: async req => prisma.fac_conceptos.delete({ where: { id: texto(req.query.id) } }),
})
