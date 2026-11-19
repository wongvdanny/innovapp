import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'
import { normalizarCampana } from '../../../../../../lib/newsletter/campanas'

const editable = async (id: string) => {
  const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id } })
  if (!['borrador', 'programada'].includes(c.estado)) throw new FacturacionError('ESTADO_INVALIDO', 'Una campaña enviada no se puede modificar')
  return c
}

export default adminApi({
  GET: async req => prisma.newsletter_campanas.findUniqueOrThrow({ where: { id: texto(req.query.id) } }),
  PUT: async req => {
    const c = await editable(texto(req.query.id))
    return prisma.newsletter_campanas.update({ where: { id: c.id }, data: { ...normalizarCampana(req.body), updated_at: new Date() } })
  },
  DELETE: async req => {
    const c = await editable(texto(req.query.id))
    if (c.estado !== 'borrador') throw new FacturacionError('ESTADO_INVALIDO', 'Cancela la programación antes de borrarla')
    await prisma.newsletter_campanas.delete({ where: { id: c.id } })
    return { ok: true }
  },
})
