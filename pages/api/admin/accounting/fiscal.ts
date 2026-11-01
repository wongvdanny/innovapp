import { adminApi, texto } from '../../../../lib/facturacion/api'
import { hoyMadrid } from '../../../../lib/facturacion/fechas'
import { informeTrimestral } from '../../../../lib/facturacion/informes'

// Resumen fiscal trimestral orientativo (303 y 130): reutiliza los informes de facturación,
// que solo tienen en cuenta facturas emitidas y gastos registrados.
export default adminApi({
  GET: async req => {
    const hoy = hoyMadrid()
    const anio = parseInt(texto(req.query.anio), 10) || +hoy.slice(0, 4)
    const t = parseInt(texto(req.query.trimestre), 10)
    const trimestre = t >= 1 && t <= 4 ? t : Math.floor((+hoy.slice(5, 7) - 1) / 3) + 1
    return informeTrimestral(anio, trimestre)
  },
})
