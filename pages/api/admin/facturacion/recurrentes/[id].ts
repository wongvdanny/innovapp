import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { guardarRecurrente } from '../../../../../lib/facturacion/recurrentes'

// Las recurrentes nunca se borran (FK RESTRICT desde sus facturas): se desactivan.
export default adminApi({
  PUT: async (req, _res, actor) => guardarRecurrente(texto(req.query.id), req.body, actor),
})
