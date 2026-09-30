import { prisma } from '../../../../lib/prisma'
import { adminApi, texto } from '../../../../lib/facturacion/api'

// Facturas emitidas vinculadas a los cobros de una suscripción. Lo usa el botón "Borrar"
// del admin para avisar antes de borrar: la factura se conserva igualmente.
export default adminApi({
  GET: async req => {
    const invoices = await prisma.invoice.findMany({ where: { subscriptionId: texto(req.query.subscriptionId) }, select: { id: true } })
    if (!invoices.length) return []
    return prisma.fac_facturas.findMany({
      where: { invoice_id: { in: invoices.map(i => i.id) }, estado: { not: 'borrador' } },
      select: { id: true, num_serie_factura: true, estado: true, importe_total: true },
    })
  },
})
