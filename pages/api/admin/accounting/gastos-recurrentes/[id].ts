import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { FacturacionError } from '../../../../../lib/facturacion/errores'
import { CATEGORIAS_GASTO } from '../../../../../lib/facturacion/gastos'
import { normalizarRecurrenteGasto } from '../../../../../lib/accounting/validacion'

export default adminApi({
  PUT: async (req, _res, actor) => {
    const id = texto(req.query.id)
    const actual = await prisma.fac_recurrentes.findUnique({ where: { id }, select: { tipo: true } })
    if (actual?.tipo !== 'gasto') throw new FacturacionError('NO_ENCONTRADA', 'Recurrente de gasto no encontrada')
    const r = await prisma.fac_recurrentes.update({ where: { id }, data: { ...(normalizarRecurrenteGasto(req.body, CATEGORIAS_GASTO) as any), updated_at: new Date() } })
    await registrarEvento(prisma, actor, 'recurrente.actualizada', 'recurrente', r.id, { tipo: 'gasto', proveedor: r.proveedor, activo: r.activo })
    return r
  },
})
