import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { CATEGORIAS_GASTO } from '../../../../../lib/facturacion/gastos'
import { normalizarRecurrenteGasto } from '../../../../../lib/accounting/validacion'

// Recurrentes de gasto (fac_recurrentes con tipo 'gasto'): el cron de facturación genera sus gastos «previstos».
export default adminApi({
  GET: async () => prisma.fac_recurrentes.findMany({
    where: { tipo: 'gasto' }, orderBy: [{ activo: 'desc' }, { proxima_fecha: 'asc' }],
    include: { fac_gastos: { orderBy: { fecha: 'desc' }, take: 3, select: { id: true, fecha: true, total: true, estado: true } } },
  }),
  POST: async (req, _res, actor) => {
    const r = await prisma.fac_recurrentes.create({ data: normalizarRecurrenteGasto(req.body, CATEGORIAS_GASTO) as any })
    await registrarEvento(prisma, actor, 'recurrente.creada', 'recurrente', r.id, { tipo: 'gasto', proveedor: r.proveedor, periodicidad: r.periodicidad })
    return r
  },
})
