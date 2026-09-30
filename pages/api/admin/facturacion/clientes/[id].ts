import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { actualizarCliente } from '../../../../../lib/facturacion/clientes'

// Los clientes no se borran (tienen facturas con FK RESTRICT): se desactivan con activo = false.
export default adminApi({
  PUT: async (req, _res, actor) => actualizarCliente(texto(req.query.id), req.body, actor),
})
