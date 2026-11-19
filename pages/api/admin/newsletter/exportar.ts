import { prisma } from '../../../../lib/prisma'
import { adminApi } from '../../../../lib/facturacion/api'
import { csv } from '../../../../lib/newsletter/csv'
import { filtroSuscriptores } from './suscriptores'

const f = (d: Date | null) => (d ? d.toISOString().slice(0, 19).replace('T', ' ') : '')

// CSV con los mismos filtros del listado, incluida la prueba del consentimiento.
export default adminApi({
  GET: async (req, res) => {
    const lista = await prisma.newsletter_suscriptores.findMany({ where: filtroSuscriptores(req.query), orderBy: { created_at: 'asc' } })
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="suscriptores_${new Date().toISOString().slice(0, 10)}.csv"`)
    res.status(200).send(csv(
      ['email', 'nombre', 'empresa', 'sector', 'estado', 'origen', 'consentimiento', 'consentimiento_fecha', 'consentimiento_ip', 'consentimiento_medio', 'consentimiento_nota', 'confirmado', 'baja', 'motivo_baja'],
      lista.map(s => [s.email, s.nombre, s.empresa, s.sector, s.estado, s.origen, s.consentimiento_texto, f(s.consentimiento_fecha), s.consentimiento_ip, s.consentimiento_medio, s.consentimiento_nota, f(s.confirmado_at), f(s.baja_at), s.baja_motivo]),
    ))
  },
})
