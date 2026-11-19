import { Prisma } from '@prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { altaManual } from '../../../../../lib/newsletter/suscriptores'
import { ESTADOS, ORIGENES, SECTORES } from '../../../../../lib/newsletter/tipos'

// Listado con filtros (estado, sector, origen, búsqueda) y alta manual.
export function filtroSuscriptores(q: Record<string, unknown>): Prisma.newsletter_suscriptoresWhereInput {
  const w: Prisma.newsletter_suscriptoresWhereInput = {}
  const estado = texto(q.estado), sector = texto(q.sector), origen = texto(q.origen), busca = texto(q.q)
  if (estado in ESTADOS) w.estado = estado
  if (sector in SECTORES) w.sector = sector
  if (origen in ORIGENES) w.origen = origen
  if (busca) w.OR = [{ email: { contains: busca, mode: 'insensitive' } }, { nombre: { contains: busca, mode: 'insensitive' } }, { empresa: { contains: busca, mode: 'insensitive' } }]
  return w
}

export default adminApi({
  GET: async req => {
    const where = filtroSuscriptores(req.query)
    const [lista, porEstado] = await Promise.all([
      prisma.newsletter_suscriptores.findMany({
        where, orderBy: { created_at: 'desc' }, take: 1000,
        select: { id: true, email: true, nombre: true, empresa: true, sector: true, estado: true, origen: true, consentimiento_fecha: true, consentimiento_medio: true, confirmado_at: true, baja_at: true, baja_motivo: true, created_at: true },
      }),
      prisma.newsletter_suscriptores.groupBy({ by: ['estado'], _count: true }),
    ])
    return { lista, totales: Object.fromEntries(porEstado.map(e => [e.estado, e._count])) }
  },
  POST: async (req, _res, actor) => altaManual(req.body, actor.usuario),
})
