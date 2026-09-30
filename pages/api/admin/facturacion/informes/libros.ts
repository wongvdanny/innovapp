import { adminApi, texto } from '../../../../../lib/facturacion/api'
import { librosXlsx, nombreFicheroLibros, filasExpedidas, filasRecibidas, csvExpedidas, csvRecibidas } from '../../../../../lib/facturacion/informes'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { prisma } from '../../../../../lib/prisma'
import { FacturacionError } from '../../../../../lib/facturacion/errores'

// GET ?anio=2026&formato=xlsx                      → libros unificados IVA/IRPF del ejercicio (formato AEAT «T»)
// GET ?anio=2026&trimestre=4&formato=csv-expedidas → CSV del libro de expedidas/ingresos del periodo
// GET ?anio=2026&trimestre=4&formato=csv-recibidas → CSV del libro de recibidas/gastos del periodo
export default adminApi({
  GET: async (req, res, actor) => {
    const anio = parseInt(texto(req.query.anio), 10)
    const trimestre = texto(req.query.trimestre) ? parseInt(texto(req.query.trimestre), 10) : null
    const formato = texto(req.query.formato) || 'xlsx'
    if (!(anio >= 2000 && anio <= 2100) || (trimestre !== null && !(trimestre >= 1 && trimestre <= 4))) throw new FacturacionError('DATOS_INVALIDOS', 'Año o trimestre no válido')

    let nombre: string, tipo: string, datos: Buffer
    if (formato === 'xlsx') {
      datos = await librosXlsx(anio)
      nombre = await nombreFicheroLibros(anio)
      tipo = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (formato === 'csv-expedidas' || formato === 'csv-recibidas') {
      const sufijo = `${anio}${trimestre ? `-${trimestre}T` : ''}`
      datos = Buffer.from(formato === 'csv-expedidas' ? csvExpedidas(await filasExpedidas(anio, trimestre)) : csvRecibidas(await filasRecibidas(anio, trimestre)), 'utf8')
      nombre = `${formato === 'csv-expedidas' ? 'expedidas-ingresos' : 'recibidas-gastos'}-${sufijo}.csv`
      tipo = 'text/csv; charset=utf-8'
    } else throw new FacturacionError('DATOS_INVALIDOS', 'Formato no válido')

    await registrarEvento(prisma, actor, 'informes.exportados', 'informes', null, { anio, trimestre, formato })
    res.setHeader('Content-Type', tipo)
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(nombre)}"; filename*=UTF-8''${encodeURIComponent(nombre)}`)
    res.setHeader('Cache-Control', 'private, no-store')
    res.end(datos)
  },
})
