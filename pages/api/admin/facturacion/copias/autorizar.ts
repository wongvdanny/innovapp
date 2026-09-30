import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { comprobarLimite, passwordCorrecta, crearBackupAhora, piezasDescarga, emitirToken, TipoCopia } from '../../../../../lib/facturacion/copias'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { prisma } from '../../../../../lib/prisma'
import { FacturacionError } from '../../../../../lib/facturacion/errores'

// POST { password, tipo, ts } o { password, tipo, crear: true }
// Pide de nuevo la contraseña, aplica el límite y devuelve un token de un solo uso (2 min)
// para /descargar. Con crear: true, antes ejecuta el backup.
export default adminApi({
  POST: async (req, _res, actor) => {
    const b = req.body || {}
    const tipo = (texto(b.tipo) || 'facturacion') as TipoCopia
    await comprobarLimite(actor.usuario)
    if (!(await passwordCorrecta(actor.usuario, typeof b.password === 'string' ? b.password : ''))) {
      await registrarEvento(prisma, actor, 'copia.password_incorrecta', 'copia', null, { tipo })
      throw new FacturacionError('DATOS_INVALIDOS', 'Contraseña incorrecta')
    }
    let ts = texto(b.ts)
    if (b.crear === true) {
      ts = await crearBackupAhora()
      await registrarEvento(prisma, actor, 'copia.creada', 'copia', ts, { ts })
    }
    piezasDescarga(ts, tipo) // valida marca, tipo y que existan los archivos antes de emitir el token
    return { token: emitirToken(actor.usuario, ts, tipo), ts }
  },
})
