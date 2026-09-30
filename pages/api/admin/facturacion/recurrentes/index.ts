import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { guardarRecurrente } from '../../../../../lib/facturacion/recurrentes'

export default adminApi({
  GET: async () => prisma.fac_recurrentes.findMany({
    orderBy: [{ activo: 'desc' }, { proxima_fecha: 'asc' }],
    include: { fac_clientes: true, fac_facturas: { orderBy: { created_at: 'desc' }, take: 3, select: { id: true, num_serie_factura: true, estado: true, importe_total: true, fecha_expedicion: true, bloqueo_motivo: true } } },
  }),
  POST: async (req, _res, actor) => guardarRecurrente(null, req.body, actor),
})
