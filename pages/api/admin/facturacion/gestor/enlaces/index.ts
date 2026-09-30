import { prisma } from '../../../../../../lib/prisma'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { crearEnlace } from '../../../../../../lib/facturacion/gestor'

// GET: enlaces (nunca el token, solo sus 6 últimos caracteres) · POST { nota? }: crea uno y devuelve la URL una sola vez.
export default adminApi({
  GET: async () => prisma.fac_enlaces_gestor.findMany({
    orderBy: { created_at: 'desc' }, take: 50,
    select: { id: true, token_sufijo: true, nota: true, creado_por: true, created_at: true, expira_at: true, revocado_at: true, accesos: true, ultimo_acceso_at: true },
  }),
  POST: async (req, _res, actor) => {
    const { id, token, expira_at } = await crearEnlace(actor, texto(req.body?.nota))
    const base = process.env.NEXTAUTH_URL || 'https://innovapp.es'
    return { id, url: `${base.replace(/\/$/, '')}/gestor/${token}`, expira_at }
  },
})
