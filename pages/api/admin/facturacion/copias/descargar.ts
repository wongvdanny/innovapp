import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { consumirToken, comprobarLimite, piezasDescarga, escribirZip, nombreZip } from '../../../../../lib/facturacion/copias'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { prisma } from '../../../../../lib/prisma'

// GET ?t=<token>: sirve el ZIP en streaming. El token es de un solo uso, del mismo admin y
// caduca a los 2 minutos. La descarga queda registrada (quién, cuándo, IP, archivos y SHA256).
export default adminApi({
  GET: async (req, res, actor) => {
    const { ts, tipo } = consumirToken(texto(req.query.t), actor.usuario)
    await comprobarLimite(actor.usuario)
    const piezas = piezasDescarga(ts, tipo)
    const nombre = nombreZip(ts, tipo)
    await registrarEvento(prisma, actor, 'copia.descargada', 'copia', ts, {
      archivo: nombre, tipo, ts, ficheros: piezas.map(p => ({ nombre: p.nombre, bytes: p.bytes, sha256: p.sha256 })),
    })
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    await escribirZip(ts, tipo, res)
  },
})
