import type { Prisma } from '@prisma/client'
import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { guardarGasto } from '../../../../../lib/facturacion/gastos'
import { leerMultipart, guardarAdjunto } from '../../../../../lib/facturacion/subidas'
import { fechaDb } from '../../../../../lib/facturacion/fechas'

export const config = { api: { bodyParser: false } }

export default adminApi({
  GET: async req => {
    const where: Prisma.fac_gastosWhereInput = {}
    const desde = texto(req.query.desde), hasta = texto(req.query.hasta), q = texto(req.query.q)
    if (desde || hasta) where.fecha = { ...(desde ? { gte: fechaDb(desde) } : {}), ...(hasta ? { lte: fechaDb(hasta) } : {}) }
    if (texto(req.query.categoria)) where.categoria = texto(req.query.categoria)
    if (q) where.OR = [
      { proveedor: { contains: q, mode: 'insensitive' } },
      { numero: { contains: q, mode: 'insensitive' } },
      { concepto: { contains: q, mode: 'insensitive' } },
    ]
    const [gastos, sumas] = await Promise.all([
      prisma.fac_gastos.findMany({ where, orderBy: [{ fecha: 'desc' }, { created_at: 'desc' }], take: 500 }),
      prisma.fac_gastos.aggregate({ where, _sum: { base_imponible: true, cuota_iva: true, cuota_retencion: true, total: true } }),
    ])
    return { gastos, sumas: sumas._sum }
  },
  POST: async (req, _res, actor) => {
    const { campos, archivo } = await leerMultipart(req)
    const adjunto = archivo ? guardarAdjunto(archivo, 'gastos', +(campos.fecha || '').slice(0, 4) || undefined) : null
    return guardarGasto(null, campos, adjunto, actor)
  },
})
