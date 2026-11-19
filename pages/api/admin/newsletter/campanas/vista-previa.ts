import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { componerCorreo } from '../../../../../lib/newsletter/contenido'
import { archivoDeCampana, firmaHtml, urlBaja } from '../../../../../lib/newsletter/envio'
import { normalizarCampana } from '../../../../../lib/newsletter/campanas'

// Vista previa (también de borradores sin guardar) y número de destinatarios del segmento.
export default adminApi({
  POST: async req => {
    const c = normalizarCampana(req.body)
    const archivo = await archivoDeCampana(typeof req.body?.id === 'string' ? req.body.id : undefined)
    const m = componerCorreo({ asunto: c.asunto, cuerpoMd: c.cuerpo_md }, { nombre: 'Laura', empresa: 'Inmobiliaria Ejemplo', urlBaja: urlBaja('ejemplo') }, firmaHtml(), archivo?.(null))
    const destinatarios = await prisma.newsletter_suscriptores.count({ where: { estado: 'confirmado', ...(c.sectores.length ? { sector: { in: c.sectores } } : {}) } })
    return { ...m, destinatarios, archivo: archivo ? archivo(null) : null }
  },
})
