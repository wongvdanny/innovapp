import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { guardarBorrador, eliminarBorrador } from '../../../../../../lib/facturacion/borradores'
import { detalleFactura } from '../../../../../../lib/facturacion/consultas'

export default adminApi({
  GET: async req => detalleFactura(texto(req.query.id)),
  PUT: async (req, _res, actor) => guardarBorrador(texto(req.query.id), req.body, actor),
  DELETE: async (req, _res, actor) => eliminarBorrador(texto(req.query.id), actor),
})
