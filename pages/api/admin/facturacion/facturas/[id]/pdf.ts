import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { leerPdf, pdfVistaPrevia } from '../../../../../../lib/facturacion/documentos'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'

// GET: PDF de la factura (borrador → vista previa con marca de agua).
// Descargarlo desde el admin NO la marca como entregada: es una vista previa para ti.
export default adminApi({
  GET: async (req, res) => {
    const id = texto(req.query.id)
    const f = await prisma.fac_facturas.findUnique({ where: { id }, select: { estado: true } })
    if (!f) throw new FacturacionError('NO_ENCONTRADA', 'Factura no encontrada')
    const { nombre, datos } = f.estado === 'borrador'
      ? { nombre: 'borrador.pdf', datos: await pdfVistaPrevia(id) }
      : await leerPdf(id)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `${req.query.descargar ? 'attachment' : 'inline'}; filename="${nombre}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('Content-Length', String(datos.length))
    res.end(datos)
  },
})
