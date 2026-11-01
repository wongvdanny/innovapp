import { adminApi, texto } from '../../../../lib/facturacion/api'
import { cargarDatosContables } from '../../../../lib/accounting/datos'
import { csvGastos, csvIngresos } from '../../../../lib/accounting/calculos'

// CSV de ingresos o gastos por rango de fechas: ?tipo=ingresos|gastos&desde=YYYY-MM-DD&hasta=YYYY-MM-DD
export default adminApi({
  GET: async (req, res) => {
    const tipo = texto(req.query.tipo) === 'gastos' ? 'gastos' : 'ingresos'
    const desde = texto(req.query.desde) || '0000-01-01'
    const hasta = texto(req.query.hasta) || '9999-12-31'
    if (![desde, hasta].every(f => /^\d{4}-\d{2}-\d{2}$/.test(f))) return res.status(400).json({ error: 'Fechas no válidas' })
    const d = await cargarDatosContables()
    const entre = (f: string) => f >= desde && f <= hasta
    const cuerpo = tipo === 'gastos'
      ? csvGastos(d.gastos.filter(g => entre(g.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha)))
      : csvIngresos(d.ingresos.filter(i => entre(i.fecha)).sort((a, b) => a.fecha.localeCompare(b.fecha)))
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${tipo}_${desde}_${hasta}.csv"`.replace(/0000-01-01|9999-12-31/g, 'todo'))
    res.status(200).send(cuerpo)
  },
})
