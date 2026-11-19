import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { enviarConfirmacionesPendientes } from '../../../../../lib/newsletter/suscriptores'

// Pendientes que nunca recibieron el correo de confirmación (p. ej. los migrados): GET cuenta, POST envía.
export default adminApi({
  GET: async () => ({ pendientes: await prisma.newsletter_suscriptores.count({ where: { estado: 'pendiente', confirmacion_enviada_at: null } }) }),
  POST: async (_req, _res, actor) => enviarConfirmacionesPendientes(actor.usuario),
})
