import { adminApi, texto } from '../../../../lib/facturacion/api'
import { facturarCuotaAgentes } from '../../../../lib/accounting/facturar-cuota'

// Botón «Facturar» de una cuota de Agentes IA cobrada sin factura → borrador en Facturación.
export default adminApi({
  POST: async (req, _res, actor) => facturarCuotaAgentes(texto(req.body?.cuotaId), actor),
})
