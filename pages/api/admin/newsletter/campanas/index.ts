import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { normalizarCampana } from '../../../../../lib/newsletter/campanas'

// Campañas con su historial de envíos (recuento por estado).
export default adminApi({
  GET: async () => {
    const [campanas, cuentas] = await Promise.all([
      prisma.newsletter_campanas.findMany({
        orderBy: { created_at: 'desc' },
        include: { newsletter_archivos: { select: { id: true, nombre: true, bytes: true, _count: { select: { newsletter_descargas: true } } } } },
      }),
      prisma.newsletter_envios.groupBy({ by: ['campana_id', 'estado'], _count: true }),
    ])
    return campanas.map(c => ({
      ...c,
      envios: Object.fromEntries(cuentas.filter(x => x.campana_id === c.id).map(x => [x.estado, x._count])),
    }))
  },
  POST: async (req, _res, actor) => prisma.newsletter_campanas.create({ data: { ...normalizarCampana(req.body), created_by: actor.usuario } }),
})
