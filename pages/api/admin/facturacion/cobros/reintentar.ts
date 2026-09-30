import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { facturarCobro } from '../../../../../lib/facturacion/pagos'
import { FacturacionError } from '../../../../../lib/facturacion/errores'

// POST { invoiceId }: reintenta la facturación automática de un cobro ("Cobros sin factura").
export default adminApi({
  POST: async (req, _res, actor) => {
    const invoiceId = texto(req.body?.invoiceId)
    if (!invoiceId) throw new FacturacionError('DATOS_INVALIDOS', 'Falta invoiceId')
    return facturarCobro(invoiceId, actor)
  },
})
