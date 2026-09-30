import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { buscarClientes, crearCliente } from '../../../../../lib/facturacion/clientes'

export default adminApi({
  GET: async req => buscarClientes(texto(req.query.q), req.query.inactivos === '1', Math.min(200, parseInt(texto(req.query.limite) || '20', 10) || 20)),
  POST: async (req, _res, actor) => crearCliente(req.body, actor),
})
