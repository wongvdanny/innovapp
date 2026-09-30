import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { guardarGasto, eliminarGasto } from '../../../../../../lib/facturacion/gastos'
import { leerMultipart, guardarAdjunto } from '../../../../../../lib/facturacion/subidas'

export const config = { api: { bodyParser: false } }

export default adminApi({
  PUT: async (req, _res, actor) => {
    const { campos, archivo } = await leerMultipart(req)
    const adjunto = archivo ? guardarAdjunto(archivo, 'gastos', +(campos.fecha || '').slice(0, 4) || undefined) : null
    return guardarGasto(texto(req.query.id), campos, adjunto, actor)
  },
  DELETE: async (req, _res, actor) => eliminarGasto(texto(req.query.id), actor),
})
