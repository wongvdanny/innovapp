import type { Prisma } from '@prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { guardarBorrador } from '../../../../../lib/facturacion/borradores'
import { hoyMadrid, fechaDb } from '../../../../../lib/facturacion/fechas'

const POR_PAGINA = 50

export default adminApi({
  // Listado con filtros: estado, cliente, serie, fechas y búsqueda libre.
  GET: async req => {
    const q = req.query
    const where: Prisma.fac_facturasWhereInput = {}
    const estado = texto(q.estado)
    if (estado === 'vencida') Object.assign(where, { estado: 'emitida', fecha_vencimiento: { lt: fechaDb(hoyMadrid()) } })
    else if (['borrador', 'emitida', 'pagada', 'anulada'].includes(estado)) where.estado = estado
    if (texto(q.cliente_id)) where.cliente_id = texto(q.cliente_id)
    if (['F', 'S', 'R'].includes(texto(q.serie))) where.serie_codigo = texto(q.serie)
    const desde = texto(q.desde), hasta = texto(q.hasta)
    if (desde || hasta) where.fecha_expedicion = { ...(desde ? { gte: fechaDb(desde) } : {}), ...(hasta ? { lte: fechaDb(hasta) } : {}) }
    const busca = texto(q.q)
    if (busca) where.OR = [
      { num_serie_factura: { contains: busca, mode: 'insensitive' } },
      { descripcion_operacion: { contains: busca, mode: 'insensitive' } },
      { fac_clientes: { razon_social: { contains: busca, mode: 'insensitive' } } },
      { fac_clientes: { nif: { contains: busca.toUpperCase() } } },
    ]
    const pagina = Math.max(1, parseInt(texto(q.pagina) || '1', 10) || 1)
    const [total, facturas, sumas] = await Promise.all([
      prisma.fac_facturas.count({ where }),
      prisma.fac_facturas.findMany({
        where,
        orderBy: [{ fecha_expedicion: { sort: 'desc', nulls: 'first' } }, { numero: 'desc' }, { created_at: 'desc' }],
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
        select: {
          id: true, estado: true, tipo_factura: true, num_serie_factura: true, fecha_expedicion: true, fecha_vencimiento: true,
          importe_total: true, liquido_a_cobrar: true, origen: true, bloqueo_motivo: true, entregada_at: true, pago_ref: true,
          cliente_snapshot: true, descripcion_operacion: true, created_at: true,
          fac_clientes: { select: { razon_social: true, nif: true } },
        },
      }),
      prisma.fac_facturas.aggregate({ where: { ...where, estado: where.estado ?? { in: ['emitida', 'pagada'] } }, _sum: { base_imponible: true, importe_total: true } }),
    ])
    return { total, pagina, porPagina: POR_PAGINA, facturas, sumas: sumas._sum }
  },

  POST: async (req, _res, actor) => guardarBorrador(null, req.body, actor),
})
