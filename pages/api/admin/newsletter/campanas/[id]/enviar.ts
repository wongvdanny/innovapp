import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'
import { lanzarCampana, procesarCampanas } from '../../../../../../lib/newsletter/envio'

// { accion: 'ahora' } · { accion: 'programar', fecha } · { accion: 'cancelar' }
export default adminApi({
  POST: async req => {
    const id = texto(req.query.id)
    const accion = req.body?.accion
    if (accion === 'cancelar') {
      const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id } })
      if (!['programada', 'enviando'].includes(c.estado)) throw new FacturacionError('ESTADO_INVALIDO', 'Solo se cancela una campaña programada o en envío')
      await prisma.$transaction([
        prisma.newsletter_campanas.update({ where: { id }, data: { estado: 'cancelada', terminada_at: new Date(), updated_at: new Date() } }),
        prisma.newsletter_envios.updateMany({ where: { campana_id: id, estado: 'pendiente' }, data: { estado: 'omitido', updated_at: new Date() } }),
      ])
      return { ok: true }
    }
    if (accion === 'programar') {
      const fecha = new Date(String(req.body?.fecha ?? ''))
      if (isNaN(fecha.getTime()) || fecha.getTime() < Date.now() + 5 * 60_000) throw new FacturacionError('DATOS_INVALIDOS', 'Elige una fecha futura (al menos dentro de 5 minutos)')
      return lanzarCampana(id, fecha)
    }
    if (accion !== 'ahora') throw new FacturacionError('DATOS_INVALIDOS', 'Acción no válida')
    const c = await lanzarCampana(id, null)
    // El envío sigue en segundo plano; el cron continúa si no termina aquí
    void procesarCampanas({ presupuestoMs: 240_000 }).catch(e => console.error('[newsletter] envío:', e))
    return c
  },
})
