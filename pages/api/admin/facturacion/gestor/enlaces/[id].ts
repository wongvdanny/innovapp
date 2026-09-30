import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { revocarEnlace } from '../../../../../../lib/facturacion/gestor'

// DELETE: revoca el enlace (queda en la lista como revocado y deja de funcionar al instante).
export default adminApi({
  DELETE: async (req, _res, actor) => revocarEnlace(texto(req.query.id), actor),
})
