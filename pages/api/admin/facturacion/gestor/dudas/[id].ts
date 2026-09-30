import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto, textoONull } from '../../../../../../lib/facturacion/api'
import { registrarEvento } from '../../../../../../lib/facturacion/eventos'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'

// PUT { tema?, pregunta?, respuesta?, estado? }: edita o resuelve una duda (queda en el log).
export default adminApi({
  PUT: async (req, _res, actor) => {
    const b = req.body || {}
    const data: Record<string, unknown> = { updated_at: new Date() }
    if ('tema' in b) data.tema = texto(b.tema)
    if ('pregunta' in b) data.pregunta = texto(b.pregunta)
    if ('respuesta' in b) data.respuesta = textoONull(b.respuesta)
    if ('estado' in b) {
      if (!['abierta', 'resuelta'].includes(b.estado)) throw new FacturacionError('DATOS_INVALIDOS', 'Estado no válido')
      data.estado = b.estado
    }
    if (data.tema === '' || data.pregunta === '') throw new FacturacionError('DATOS_INVALIDOS', 'Tema y pregunta no pueden quedar vacíos')
    const d = await prisma.fac_dudas_gestor.update({ where: { id: texto(req.query.id) }, data })
    await registrarEvento(prisma, actor, 'gestor.duda_actualizada', 'gestor_duda', d.id, { tema: d.tema, estado: d.estado, respuesta: d.respuesta })
    return d
  },
})
