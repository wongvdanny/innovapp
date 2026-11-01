import { prisma } from '../../../../lib/prisma'
import { adminApi } from '../../../../lib/facturacion/api'
import { normalizarProyecto } from '../../../../lib/accounting/validacion'

// Proyectos a medida con lo facturado (facturas emitidas/pagadas, base) y los gastos imputados.
export default adminApi({
  GET: async () => {
    const [proyectos, facturado, gastos] = await Promise.all([
      prisma.proyectos.findMany({ orderBy: [{ created_at: 'desc' }], include: { fac_clientes: { select: { id: true, razon_social: true } } } }),
      prisma.fac_facturas.groupBy({ by: ['proyecto_id'], where: { proyecto_id: { not: null }, estado: { in: ['emitida', 'pagada'] } }, _sum: { base_imponible: true }, _count: true }),
      prisma.fac_gastos.groupBy({ by: ['proyecto_id'], where: { proyecto_id: { not: null } }, _sum: { base_imponible: true } }),
    ])
    return proyectos.map(p => ({
      ...p,
      facturado: Number(facturado.find(f => f.proyecto_id === p.id)?._sum.base_imponible ?? 0),
      facturas: facturado.find(f => f.proyecto_id === p.id)?._count ?? 0,
      gastos: Number(gastos.find(g => g.proyecto_id === p.id)?._sum.base_imponible ?? 0),
    }))
  },
  POST: async req => prisma.proyectos.create({ data: normalizarProyecto(req.body) }),
})
