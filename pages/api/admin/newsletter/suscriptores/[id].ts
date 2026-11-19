import { prisma } from '../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { bajaAdmin, editar, enviarConfirmacionPendiente } from '../../../../../lib/newsletter/suscriptores'

// Ficha (con historial y prueba del consentimiento), edición de datos y baja desde el admin.
export default adminApi({
  GET: async req => {
    const id = texto(req.query.id)
    const [s, historial, envios] = await Promise.all([
      prisma.newsletter_suscriptores.findUniqueOrThrow({ where: { id }, select: {
        id: true, email: true, nombre: true, empresa: true, sector: true, estado: true, origen: true,
        consentimiento_texto: true, consentimiento_fecha: true, consentimiento_ip: true, consentimiento_medio: true, consentimiento_nota: true,
        confirmacion_enviada_at: true, confirmado_at: true, baja_at: true, baja_motivo: true, rebotado_at: true, created_at: true,
      } }),
      prisma.newsletter_historial.findMany({ where: { suscriptor_id: id }, orderBy: { created_at: 'desc' }, take: 50 }),
      prisma.newsletter_envios.findMany({ where: { suscriptor_id: id }, orderBy: { created_at: 'desc' }, take: 20, select: { campana_id: true, estado: true, enviado_at: true } }),
    ])
    return { ...s, historial, envios }
  },
  PUT: async (req, _res, actor) => editar(texto(req.query.id), req.body, actor.usuario),
  POST: async (req, _res, actor) => {
    if (req.body?.accion === 'confirmacion') { await enviarConfirmacionPendiente(texto(req.query.id), actor.usuario); return { ok: true } }
    if (req.body?.accion !== 'baja') return { ok: false }
    return { resultado: await bajaAdmin(texto(req.query.id), actor.usuario) }
  },
})
