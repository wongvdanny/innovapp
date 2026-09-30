import { adminApi } from '../../../../../lib/facturacion/api'
import { listarBackups, comprobarLimite, LIMITE_DESCARGAS_HORA } from '../../../../../lib/facturacion/copias'

// GET: copias disponibles (sin rutas del servidor) y descargas restantes en la última hora.
export default adminApi({
  GET: async (_req, _res, actor) => {
    const restantes = await comprobarLimite(actor.usuario).then(r => r.restantes).catch(() => 0)
    const vista = (p: any) => p && { nombre: p.nombre, bytes: p.bytes, sha256: p.sha256 }
    return {
      limite: LIMITE_DESCARGAS_HORA, restantes,
      copias: listarBackups().map(b => ({ ts: b.ts, fecha: b.fecha, completo: vista(b.completo), facturacion: vista(b.facturacion), archivos: vista(b.archivos) })),
    }
  },
})
