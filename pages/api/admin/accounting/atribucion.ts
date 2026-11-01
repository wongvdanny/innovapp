import { prisma } from '../../../../lib/prisma'
import { adminApi, texto } from '../../../../lib/facturacion/api'
import { registrarEvento } from '../../../../lib/facturacion/eventos'
import { FacturacionError } from '../../../../lib/facturacion/errores'

// Línea de negocio y proyecto de una factura (también emitida: dato interno permitido por el trigger) o de un gasto.
export default adminApi({
  PUT: async (req, _res, actor) => {
    const { tipo } = req.body ?? {}
    const id = texto(req.body?.id)
    const data = { producto_slug: texto(req.body?.producto_slug) || null, proyecto_id: texto(req.body?.proyecto_id) || null }
    if (data.producto_slug && !(await prisma.product.findUnique({ where: { slug: data.producto_slug } })) && !['proyectos', 'otros'].includes(data.producto_slug))
      throw new FacturacionError('DATOS_INVALIDOS', 'Línea de negocio no válida')
    if (tipo === 'factura') await prisma.fac_facturas.update({ where: { id }, data })
    else if (tipo === 'gasto') await prisma.fac_gastos.update({ where: { id }, data: { ...data, updated_at: new Date() } })
    else throw new FacturacionError('DATOS_INVALIDOS', 'Tipo no válido')
    await registrarEvento(prisma, actor, `${tipo}.atribucion`, tipo, id, data)
    return { ok: true }
  },
})
