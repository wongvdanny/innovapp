import fs from 'fs'
import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { rutaAbsoluta } from '../../../../../../lib/facturacion/storage'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'

// Sirve el adjunto de un gasto (fuera de /public) solo a administradores.
export default adminApi({
  GET: async (req, res) => {
    const g = await prisma.fac_gastos.findUnique({ where: { id: texto(req.query.id) }, select: { adjunto_path: true, adjunto_mime: true, proveedor: true, numero: true } })
    if (!g?.adjunto_path) throw new FacturacionError('NO_ENCONTRADA', 'El gasto no tiene adjunto')
    const abs = rutaAbsoluta(g.adjunto_path)
    if (!fs.existsSync(abs)) throw new FacturacionError('NO_ENCONTRADA', 'Archivo no encontrado en disco')
    const nombre = `${g.proveedor}-${g.numero || 'gasto'}`.replace(/[^\w.-]+/g, '_') + abs.slice(abs.lastIndexOf('.'))
    res.setHeader('Content-Type', g.adjunto_mime || 'application/octet-stream')
    res.setHeader('Content-Disposition', `inline; filename="${nombre}"`)
    res.setHeader('Cache-Control', 'private, no-store')
    fs.createReadStream(abs).pipe(res)
    await new Promise(r => res.on('finish', r))
  },
})
