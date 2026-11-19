import { adminApi } from '../../../../lib/facturacion/api'
import { FacturacionError } from '../../../../lib/facturacion/errores'
import { validarImportacion } from '../../../../lib/newsletter/csv'
import { importar } from '../../../../lib/newsletter/suscriptores'

export const config = { api: { bodyParser: { sizeLimit: '5mb' } } }

// Importación CSV en dos pasos: { csv } → vista previa (válidas y rechazadas); { csv, confirmar: true } → importa.
export default adminApi({
  POST: async (req, _res, actor) => {
    const r = validarImportacion(String(req.body?.csv ?? ''), new Date())
    if ('error' in r) throw new FacturacionError('DATOS_INVALIDOS', r.error)
    if (req.body?.confirmar !== true) return { validas: r.validas.length, rechazadas: r.rechazadas, muestra: r.validas.slice(0, 5) }
    return { ...(await importar(r.validas, actor.usuario)), rechazadas: r.rechazadas }
  },
})
