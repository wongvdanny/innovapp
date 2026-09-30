import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { registrarEvento } from '../../../../../../lib/facturacion/eventos'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'

export default adminApi({
  GET: async () => prisma.fac_dudas_gestor.findMany({ orderBy: [{ estado: 'asc' }, { orden: 'asc' }] }),
  POST: async (req, _res, actor) => {
    const tema = texto(req.body?.tema), pregunta = texto(req.body?.pregunta)
    if (!tema || !pregunta) throw new FacturacionError('DATOS_INVALIDOS', 'Tema y pregunta son obligatorios')
    const max = await prisma.fac_dudas_gestor.aggregate({ _max: { orden: true } })
    const d = await prisma.fac_dudas_gestor.create({ data: { tema, pregunta, orden: (max._max.orden ?? 0) + 10 } })
    await registrarEvento(prisma, actor, 'gestor.duda_creada', 'gestor_duda', d.id, { tema })
    return d
  },
})
