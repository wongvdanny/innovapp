import { adminApi, texto } from '../../../../lib/facturacion/api'
import { hoyMadrid } from '../../../../lib/facturacion/fechas'
import { prisma } from '../../../../lib/prisma'
import { cargarDatosContables } from '../../../../lib/accounting/datos'
import { desglosePorLinea, enfoque, evolucion, kpisMes, mesAnterior, mesDe, progresoMeta, Meta } from '../../../../lib/accounting/calculos'

// Todo lo de la pestaña Resumen de Contabilidad para un mes (?mes=YYYY-MM; por defecto el actual).
export default adminApi({
  GET: async req => {
    const hoy = hoyMadrid()
    const mes = /^\d{4}-\d{2}$/.test(texto(req.query.mes)) ? texto(req.query.mes) : mesDe(hoy)
    const [d, metas] = await Promise.all([cargarDatosContables(), prisma.metas.findMany({ where: { activa: true }, orderBy: { hasta: 'asc' } })])
    const slugs = d.lineas.map(l => l.slug)
    const nombre = (s: string) => d.lineas.find(l => l.slug === s)?.nombre ?? s
    return {
      mes, hoy, lineas: d.lineas, avisos: d.avisos,
      kpis: kpisMes(d, mes, hoy),
      kpisAnterior: kpisMes(d, mesAnterior(mes), hoy),
      evolucion: evolucion(d, mes, hoy, 12, slugs.filter(s => d.contratos.some(c => c.linea === s))),
      desglose: desglosePorLinea(d, mes, hoy, slugs),
      enfoque: enfoque(d, mes, hoy, slugs, nombre),
      metas: metas.map(m => progresoMeta(d, {
        id: m.id, metrica: m.metrica as Meta['metrica'], periodo: m.periodo as Meta['periodo'], objetivo: Number(m.objetivo),
        desde: m.desde.toISOString().slice(0, 10), hasta: m.hasta.toISOString().slice(0, 10), producto_slug: m.producto_slug,
      }, hoy)),
      ingresos: d.ingresos.filter(i => mesDe(i.fecha) === mes).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      gastos: d.gastos.filter(g => mesDe(g.fecha) === mes).sort((a, b) => b.fecha.localeCompare(a.fecha)),
      sinFactura: d.ingresos.filter(i => i.origen === 'sin_factura').sort((a, b) => b.fecha.localeCompare(a.fecha)),
    }
  },
})
