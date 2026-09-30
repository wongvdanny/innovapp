import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { informeTrimestral, informeAnual } from '../../../../../lib/facturacion/informes'
import { FacturacionError } from '../../../../../lib/facturacion/errores'

// GET ?anio=2026&trimestre=4 → resumen 303 del trimestre, 130 acumulado y resumen anual (390).
export default adminApi({
  GET: async req => {
    const anio = parseInt(texto(req.query.anio), 10)
    const trimestre = parseInt(texto(req.query.trimestre), 10)
    if (!(anio >= 2000 && anio <= 2100) || !(trimestre >= 1 && trimestre <= 4)) throw new FacturacionError('DATOS_INVALIDOS', 'Año o trimestre no válido')
    const [trim, anual] = await Promise.all([informeTrimestral(anio, trimestre), informeAnual(anio)])
    return { trimestral: trim, anual }
  },
})
