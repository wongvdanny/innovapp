import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { documentoGestor } from '../../../../../lib/facturacion/gestor'
import { generarPdfGestor } from '../../../../../lib/facturacion/pdf/gestor'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { hoyMadrid } from '../../../../../lib/facturacion/fechas'

// GET: PDF del documento para la gestoría, generado con los datos del momento.
export default adminApi({
  GET: async (_req, res, actor) => {
    const pdf = await generarPdfGestor(await documentoGestor())
    await registrarEvento(prisma, actor, 'gestor.pdf', 'gestor', null, { bytes: pdf.length })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="innovapp-gestoria-${hoyMadrid()}.pdf"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.end(pdf)
  },
})
