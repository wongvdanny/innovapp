import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { enviarPrueba } from '../../../../../../lib/newsletter/envio'

// Envío de prueba al email del admin que está en el panel.
export default adminApi({
  POST: async (req, _res, actor) => {
    const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id: texto(req.query.id) } })
    return { id: await enviarPrueba(c, actor.usuario), para: actor.usuario }
  },
})
