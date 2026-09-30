import ExcelJS from 'exceljs'
import { prisma } from '../prisma'
import { D, r2, suma } from './decimal'
import { ddmmaaaa, isoFecha } from './fechas'

// Libros registro unificados de IVA e IRPF (formato electrónico común de la AEAT, fichero
// «T»: pestañas EXPEDIDAS_INGRESOS y RECIBIDAS_GASTOS) y resúmenes de los modelos 303, 130
// y 390. Los resúmenes se calculan a partir de las MISMAS filas del libro, para que nunca
// discrepen de lo que se exporta.
// Fuentes: AEAT, LSI.xlsx (diseños de registro) y «Formato electrónico común de los Libros
// Registro del IVA y del IRPF»; Epigrafes_x_EEDD.xlsx (IAE 763 → actividad A05).

export const ACTIVIDAD = { codigo: 'A', tipo: '05' } // A: actividad IAE · 05: resto de actividades profesionales

/** Categoría de gasto → Concepto de Gasto (IRPF). Revisable con tu gestor. */
export const CONCEPTO_GASTO: Record<string, string> = {
  software: 'G22', hosting: 'G22', publicidad: 'G22', formacion: 'G22', desplazamientos: 'G22',
  hardware: 'G03',            // pequeño material; los equipos amortizables deberían ir al libro de bienes de inversión
  telefonia: 'G17', suministros: 'GY4', asesoria: 'G19', cuota_autonomo: 'G45',
  material_oficina: 'G03', comisiones_bancarias: 'G24', otros: 'G37',
}

const PAISES_UE = ['AT','BE','BG','CY','CZ','DE','DK','EE','GR','EL','FI','FR','HR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK']

export const trimestreDe = (iso: string) => Math.floor((+iso.slice(5, 7) - 1) / 3) + 1
export function limitesPeriodo(anio: number, trimestre?: number | null) {
  if (!trimestre) return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` }
  const m = (trimestre - 1) * 3 + 1
  return { desde: `${anio}-${String(m).padStart(2, '0')}-01`, hasta: new Date(Date.UTC(anio, m + 2, 0)).toISOString().slice(0, 10) }
}
const fechaTxt = (v: Date | string | null | undefined) => (v ? ddmmaaaa(v).replace(/-/g, '/') : '')
const num = (v: any) => Number(r2(v).toFixed(2))

// ─────────────────────────────── Facturas expedidas / ingresos ───────────────────────────────

export interface FilaExpedida {
  ejercicio: number; periodo: string; codigo: string; tipoActividad: string; epigrafe: string
  tipoFactura: string; conceptoIngreso: string; ingresoComputable: number
  fechaExpedicion: string; fechaOperacion: string; serie: string; numero: string
  tipoId: string; pais: string; nif: string; nombre: string
  claveOperacion: string; calificacion: string; exenta: string
  total: number; base: number; tipoIva: number; cuota: number
  tipoRetencion: number | null; retencion: number | null; referencia: string
  // auxiliares para resúmenes (no se exportan)
  _ue: boolean
}

function identificacionDestinatario(c: any) {
  const nif = (c?.nif || '').toUpperCase()
  const pais = c?.pais || 'ES'
  if (!nif) return { tipoId: '', pais: '', nif: '' }
  if (pais === 'ES') return { tipoId: '', pais: '', nif }
  return { tipoId: c.tipo_id === '02' || PAISES_UE.includes(pais) ? '02' : (c.tipo_id || '04'), pais, nif: nif.replace(new RegExp(`^${pais === 'GR' ? 'EL' : pais}`), '') }
}

function agrupar(lineas: { base: any; cuota: any; tipo_iva: any; calificacion: string; operacion_exenta: string | null }[]) {
  const g = new Map<string, { base: any[]; cuota: any[]; tipo: any; calificacion: string; exenta: string }>()
  for (const l of lineas) {
    const k = `${l.operacion_exenta || l.calificacion}|${Number(l.tipo_iva)}`
    const x = g.get(k) ?? { base: [], cuota: [], tipo: l.tipo_iva, calificacion: l.operacion_exenta ? '' : l.calificacion, exenta: l.operacion_exenta || '' }
    x.base.push(l.base); x.cuota.push(l.cuota); g.set(k, x)
  }
  return Array.from(g.values())
}

export async function filasExpedidas(anio: number, trimestre?: number | null): Promise<FilaExpedida[]> {
  const { desde, hasta } = limitesPeriodo(anio, trimestre)
  const facturas = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM fac_facturas
    WHERE estado IN ('emitida', 'pagada') AND coalesce(fecha_operacion, fecha_expedicion) BETWEEN ${desde}::date AND ${hasta}::date
    ORDER BY fecha_expedicion, serie_codigo, numero`
  const lista = await prisma.fac_facturas.findMany({
    where: { id: { in: facturas.map(f => f.id) } },
    include: { fac_lineas: true, fac_facturas: { include: { fac_lineas: true } } },
  })
  const porId = new Map(lista.map(f => [f.id, f]))
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const epigrafe = ajustes.iae.replace(/\D/g, '').slice(0, 4)
  const filas: FilaExpedida[] = []

  for (const { id } of facturas) {
    const f = porId.get(id)!
    const fechaPeriodo = isoFecha(f.fecha_operacion ?? f.fecha_expedicion!)
    const c = f.cliente_snapshot as any
    const ident = identificacionDestinatario(c)
    const comunes = {
      ejercicio: +fechaPeriodo.slice(0, 4), periodo: `${trimestreDe(fechaPeriodo)}T`,
      codigo: ACTIVIDAD.codigo, tipoActividad: ACTIVIDAD.tipo, epigrafe, conceptoIngreso: 'I01',
      nombre: (c?.razon_social || '').slice(0, 40), claveOperacion: '01', ...ident,
      _ue: ident.tipoId === '02',
    }
    const lineasDe = (factura: any, signo: 1 | -1, tipoFactura: string, numSerie: string, fechaExp: any, fechaOp: any, tipoRet: any, retTotal: any) => {
      const grupos = agrupar(factura.fac_lineas)
      const [serie, numero] = numSerie.includes('-') ? [numSerie.slice(0, numSerie.lastIndexOf('-')), numSerie.slice(numSerie.lastIndexOf('-') + 1)] : ['', numSerie]
      // Retención repartida por grupo; el último absorbe el redondeo para cuadrar con el total
      let retPendiente = D(retTotal).times(signo)
      grupos.forEach((g, i) => {
        const base = suma(g.base).times(signo)
        const cuota = suma(g.cuota).times(signo)
        const ret = i === grupos.length - 1 ? retPendiente : r2(base.times(D(tipoRet)).dividedBy(100))
        retPendiente = retPendiente.minus(ret)
        const sujeta = g.calificacion === 'S1'
        filas.push({
          ...comunes, tipoFactura, ingresoComputable: num(base),
          fechaExpedicion: fechaTxt(fechaExp), fechaOperacion: fechaOp ? fechaTxt(fechaOp) : '',
          serie, numero, calificacion: g.calificacion, exenta: g.exenta,
          total: num(sujeta ? base.plus(cuota) : base), base: num(base), tipoIva: Number(g.tipo), cuota: num(cuota),
          tipoRetencion: D(tipoRet).isZero() ? null : Number(tipoRet), retencion: D(tipoRet).isZero() ? null : num(ret),
          referencia: numSerie,
        })
      })
    }
    // Rectificativa por sustitución: la factura rectificada en negativo + la rectificativa (nota AEAT)
    if (f.tipo_rectificacion === 'S' && f.fac_facturas) {
      const o = f.fac_facturas
      lineasDe(o, -1, o.tipo_factura, o.num_serie_factura!, o.fecha_expedicion, o.fecha_operacion, o.tipo_retencion, o.cuota_retencion)
    }
    lineasDe(f, 1, f.tipo_factura, f.num_serie_factura!, f.fecha_expedicion, f.fecha_operacion, f.tipo_retencion, f.cuota_retencion)
  }
  return filas
}

// ─────────────────────────────── Facturas recibidas / gastos ───────────────────────────────

export interface FilaRecibida {
  ejercicio: number; periodo: string; codigo: string; tipoActividad: string; epigrafe: string
  tipoFactura: string; conceptoGasto: string; gastoDeducible: number
  fechaExpedicion: string; numeroFactura: string; fechaRecepcion: string; numeroRecepcion: string
  tipoId: string; pais: string; nif: string; nombre: string
  claveOperacion: string; bienInversion: string; isp: string; deduciblePosterior: string
  total: number; base: number; tipoIva: number; cuota: number; cuotaDeducible: number
  tipoRetencion: number | null; retencion: number | null; referencia: string
}

export async function filasRecibidas(anio: number, trimestre?: number | null): Promise<FilaRecibida[]> {
  const ajustes = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const epigrafe = ajustes.iae.replace(/\D/g, '').slice(0, 4)
  // El número de recepción es correlativo en el ejercicio: se calcula sobre todo el año
  const delAnio = await prisma.fac_gastos.findMany({
    where: { fecha: { gte: new Date(`${anio}-01-01T00:00:00Z`), lte: new Date(`${anio}-12-31T00:00:00Z`) } },
    orderBy: [{ fecha: 'asc' }, { created_at: 'asc' }],
  })
  const { desde, hasta } = limitesPeriodo(anio, trimestre)
  return delAnio.map((g, i) => ({ g, n: i + 1 })).filter(({ g }) => {
    const f = isoFecha(g.fecha)
    return f >= desde && f <= hasta
  }).map(({ g, n }) => {
    const f = isoFecha(g.fecha)
    const sinFactura = g.categoria === 'cuota_autonomo'
    const pais = g.proveedor_pais || 'ES'
    const ext = pais !== 'ES'
    const pct = D(g.deducible_pct).dividedBy(100)
    const base = D(g.base_imponible)
    const cuota = sinFactura ? D(0) : D(g.cuota_iva)
    const cuotaDed = g.iva_deducible ? r2(cuota.times(pct)) : D(0)
    // En IRPF, el IVA soportado no deducible es mayor gasto
    const gasto = r2(base.times(pct).plus(g.iva_deducible ? 0 : cuota.times(pct)))
    return {
      ejercicio: +f.slice(0, 4), periodo: `${trimestreDe(f)}T`,
      codigo: ACTIVIDAD.codigo, tipoActividad: ACTIVIDAD.tipo, epigrafe,
      tipoFactura: sinFactura ? 'F6' : g.proveedor_nif ? 'F1' : 'F2',
      conceptoGasto: CONCEPTO_GASTO[g.categoria] ?? 'G37', gastoDeducible: num(gasto),
      fechaExpedicion: fechaTxt(g.fecha), numeroFactura: (g.numero || '').slice(0, 40),
      fechaRecepcion: fechaTxt(g.fecha_registro < g.fecha ? g.fecha : g.fecha_registro), numeroRecepcion: String(n),
      tipoId: ext && g.proveedor_nif ? (PAISES_UE.includes(pais) ? '02' : '04') : '', pais: ext ? pais : '', nif: (g.proveedor_nif || '').toUpperCase(),
      nombre: g.proveedor.slice(0, 40), claveOperacion: '01', bienInversion: 'N', isp: 'N', deduciblePosterior: 'N',
      total: num(base.plus(cuota)), base: num(base), tipoIva: sinFactura ? 0 : Number(g.tipo_iva), cuota: num(cuota), cuotaDeducible: num(cuotaDed),
      tipoRetencion: D(g.tipo_retencion).isZero() ? null : Number(g.tipo_retencion), retencion: D(g.cuota_retencion).isZero() ? null : num(g.cuota_retencion),
      referencia: g.id,
    }
  })
}

// ─────────────────────────────── Resúmenes 303 / 130 / 390 ───────────────────────────────

const s = (xs: number[]) => num(suma(xs))

export function resumen303(exp: FilaExpedida[], rec: FilaRecibida[]) {
  const porTipo = (t: number) => {
    const f = exp.filter(x => x.calificacion === 'S1' && x.tipoIva === t)
    return { base: s(f.map(x => x.base)), cuota: s(f.map(x => x.cuota)) }
  }
  const t4 = porTipo(4), t10 = porTipo(10), t21 = porTipo(21)
  const devengado = s([t4.cuota, t10.cuota, t21.cuota])
  const deducibles = rec.filter(r => r.cuotaDeducible !== 0)
  const deducible = s(deducibles.map(r => r.cuotaDeducible))
  const noSujetasUE = exp.filter(x => x.calificacion === 'N2' && x._ue)
  const noSujetasResto = exp.filter(x => x.calificacion === 'N2' && !x._ue)
  const exentas = exp.filter(x => x.exenta)
  return {
    casillas: [
      { c: '01', d: 'Base imponible al 4 %', v: t4.base }, { c: '03', d: 'Cuota al 4 %', v: t4.cuota },
      { c: '04', d: 'Base imponible al 10 %', v: t10.base }, { c: '06', d: 'Cuota al 10 %', v: t10.cuota },
      { c: '07', d: 'Base imponible al 21 %', v: t21.base }, { c: '09', d: 'Cuota al 21 %', v: t21.cuota },
      { c: '27', d: 'Total cuota devengada', v: devengado },
      { c: '28', d: 'Base IVA deducible (operaciones interiores corrientes)', v: s(deducibles.map(r => num(D(r.base).times(r.cuota ? D(r.cuotaDeducible).dividedBy(r.cuota) : 0)))) },
      { c: '29', d: 'Cuota IVA deducible (operaciones interiores corrientes)', v: deducible },
      { c: '45', d: 'Total a deducir', v: deducible },
      { c: '46', d: 'Resultado régimen general (27 − 45)', v: num(D(devengado).minus(deducible)) },
    ],
    informativas: [
      { c: '59*', d: 'Servicios a empresarios de la UE no sujetos por localización (también modelo 349)', v: s(noSujetasUE.map(x => x.base)) },
      { c: '120*', d: 'Operaciones no sujetas por reglas de localización (fuera de la UE)', v: s(noSujetasResto.map(x => x.base)) },
      { c: '—', d: 'Operaciones exentas', v: s(exentas.map(x => x.base)) },
    ],
    resultado: num(D(devengado).minus(deducible)),
  }
}

export function resumen130(anio: number, trimestre: number, expAcum: FilaExpedida[], recAcum: FilaRecibida[], pagosPrevios: number) {
  const ingresos = s(expAcum.map(x => x.ingresoComputable))
  const gastos = s(recAcum.map(r => r.gastoDeducible))
  const rendimiento = num(D(ingresos).minus(gastos))
  const veinte = D(rendimiento).greaterThan(0) ? num(D(rendimiento).times('0.20')) : 0
  const retenciones = s(expAcum.map(x => x.retencion ?? 0))
  const resultado = num(D(veinte).minus(pagosPrevios).minus(retenciones))
  const conRetencion = s(expAcum.filter(x => x.retencion).map(x => x.ingresoComputable))
  return {
    periodo: `${trimestre}T ${anio} (acumulado desde el 1 de enero)`,
    casillas: [
      { c: '01', d: 'Ingresos computables', v: ingresos },
      { c: '02', d: 'Gastos fiscalmente deducibles', v: gastos },
      { c: '03', d: 'Rendimiento neto (01 − 02)', v: rendimiento },
      { c: '04', d: '20 % del rendimiento neto (si es positivo)', v: veinte },
      { c: '05', d: 'Pagos fraccionados de trimestres anteriores (estimado)', v: pagosPrevios },
      { c: '06', d: 'Retenciones e ingresos a cuenta', v: retenciones },
      { c: '07', d: 'Resultado (04 − 05 − 06)', v: resultado },
    ],
    resultado,
    porcentajeConRetencion: D(ingresos).greaterThan(0) ? Number(D(conRetencion).dividedBy(ingresos).times(100).toFixed(1)) : 0,
  }
}

/** Resumen completo de un periodo: 303 del trimestre y 130 acumulado. */
export async function informeTrimestral(anio: number, trimestre: number) {
  const [expA, recA] = await Promise.all([filasExpedidas(anio, null), filasRecibidas(anio, null)])
  const delTrimestre = (x: { periodo: string }) => x.periodo === `${trimestre}T`
  const exp = expA.filter(delTrimestre), rec = recA.filter(delTrimestre)
  // 130: acumulado desde el 1 de enero; pagos previos = resultados positivos de los trimestres anteriores
  let pagosPrevios = 0
  let r130: ReturnType<typeof resumen130> | null = null
  for (let t = 1; t <= trimestre; t++) {
    const hastaT = (x: { periodo: string }) => +x.periodo[0] <= t
    r130 = resumen130(anio, t, expA.filter(hastaT), recA.filter(hastaT), pagosPrevios)
    if (t < trimestre) pagosPrevios = num(D(pagosPrevios).plus(Math.max(0, r130.resultado)))
  }
  return { anio, trimestre, r303: resumen303(exp, rec), r130: r130!, expedidas: exp.length, recibidas: rec.length }
}

/** Resumen anual (base del modelo 390): 303 de cada trimestre y del año. */
export async function informeAnual(anio: number) {
  const [exp, rec] = await Promise.all([filasExpedidas(anio, null), filasRecibidas(anio, null)])
  const trimestres = [1, 2, 3, 4].map(t => ({ trimestre: t, ...resumen303(exp.filter(x => x.periodo === `${t}T`), rec.filter(r => r.periodo === `${t}T`)) }))
  return {
    anio,
    anual: resumen303(exp, rec),
    trimestres: trimestres.map(t => ({ trimestre: t.trimestre, resultado: t.resultado, devengado: t.casillas.find(c => c.c === '27')!.v, deducible: t.casillas.find(c => c.c === '45')!.v })),
    volumenOperaciones: s(exp.map(x => x.base)),
  }
}

// ─────────────────────────────── Exportación XLSX / CSV ───────────────────────────────

const COLS_EXP: [string, string, keyof FilaExpedida | null][] = [
  ['Autoliquidación', 'Ejercicio', 'ejercicio'], ['', 'Periodo', 'periodo'],
  ['Actividad', 'Código', 'codigo'], ['', 'Tipo', 'tipoActividad'], ['', 'Grupo o Epígrafe del IAE', 'epigrafe'],
  ['Tipo de Factura', '', 'tipoFactura'], ['Concepto de Ingreso', '', 'conceptoIngreso'], ['Ingreso Computable', '', 'ingresoComputable'],
  ['Fecha Expedición', '', 'fechaExpedicion'], ['Fecha Operación', '', 'fechaOperacion'],
  ['Identificación de la Factura', 'Serie', 'serie'], ['', 'Número', 'numero'], ['', 'Número-Final', null],
  ['NIF Destinatario', 'Tipo', 'tipoId'], ['', 'Código País', 'pais'], ['', 'Identificación', 'nif'],
  ['Nombre Destinatario', '', 'nombre'], ['Clave de Operación', '', 'claveOperacion'], ['Calificación de la Operación', '', 'calificacion'],
  ['Operación Exenta', '', 'exenta'], ['Total Factura', '', 'total'], ['Base Imponible', '', 'base'], ['Tipo de IVA', '', 'tipoIva'],
  ['Cuota IVA Repercutida', '', 'cuota'], ['Tipo de Recargo Eq.', '', null], ['Cuota Recargo Eq.', '', null],
  ['Cobro (Operación Criterio de Caja de IVA y/o artículo 7.2.1º de Reglamento del IRPF)', 'Fecha', null], ['', 'Importe', null], ['', 'Medio Utilizado', null], ['', 'Identificación Medio Utilizado', null],
  ['Tipo Retención del IRPF', '', 'tipoRetencion'], ['Importe Retenido del IRPF', '', 'retencion'], ['Registro Acuerdo Facturación', '', null],
  ['Inmueble', 'Situación', null], ['', 'Referencia Catastral', null], ['Referencia Externa', '', 'referencia'],
]
const COLS_REC: [string, string, keyof FilaRecibida | null][] = [
  ['Autoliquidación', 'Ejercicio', 'ejercicio'], ['', 'Periodo', 'periodo'],
  ['Actividad', 'Código', 'codigo'], ['', 'Tipo', 'tipoActividad'], ['', 'Grupo o Epígrafe del IAE', 'epigrafe'],
  ['Tipo de Factura', '', 'tipoFactura'], ['Concepto de Gasto', '', 'conceptoGasto'], ['Gasto Deducible', '', 'gastoDeducible'],
  ['Fecha Expedición', '', 'fechaExpedicion'], ['Fecha Operación', '', null],
  ['Identificación Factura del Expedidor', '(Serie-Número)', 'numeroFactura'], ['', 'Número-Final', null],
  ['Fecha Recepción', '', 'fechaRecepcion'], ['Número Recepción', '', 'numeroRecepcion'], ['Número Recepción Final', '', null],
  ['NIF Expedidor', 'Tipo', 'tipoId'], ['', 'Código País', 'pais'], ['', 'Identificación', 'nif'],
  ['Nombre Expedidor', '', 'nombre'], ['Clave de Operación', '', 'claveOperacion'], ['Bien de Inversión', '', 'bienInversion'],
  ['Inversión del Sujeto Pasivo', '', 'isp'], ['Deducible en Periodo Posterior', '', 'deduciblePosterior'],
  ['Periodo Deducción', 'Ejercicio', null], ['', 'Periodo', null],
  ['Total Factura', '', 'total'], ['Base Imponible', '', 'base'], ['Tipo de IVA', '', 'tipoIva'], ['Cuota IVA Soportado', '', 'cuota'], ['Cuota Deducible', '', 'cuotaDeducible'],
  ['Tipo de Recargo Eq.', '', null], ['Cuota Recargo Eq.', '', null],
  ['Pago (Operación Criterio de Caja de IVA y/o artículo 7.2.1º de Reglamento del IRPF)', 'Fecha', null], ['', 'Importe', null], ['', 'Medio Utilizado', null], ['', 'Identificación Medio Utilizado', null],
  ['Tipo Retención del IRPF', '', 'tipoRetencion'], ['Importe Retenido del IRPF', '', 'retencion'], ['Registro Acuerdo Facturación', '', null],
  ['Inmueble', 'Situación', null], ['', 'Referencia Catastral', null], ['Referencia Externa', '', 'referencia'],
]

function hoja<T>(wb: ExcelJS.Workbook, nombre: string, titulo: string, tipoLibro: string, anio: number, nif: string, razon: string, cols: [string, string, keyof T | null][], filas: T[]) {
  const ws = wb.addWorksheet(nombre)
  ws.getCell('I1').value = titulo
  ws.getCell('I2').value = `Ejercicio: ${anio}`
  ws.getCell('I3').value = `NIF: ${nif}`
  ws.getCell('I4').value = `@ (Tipo de Libro Registro): ${tipoLibro}`
  ws.getCell('I5').value = `NOMBRE O RAZÓN SOCIAL: ${razon}`
  // Cabecera en dos filas (7 y 8) como el diseño normalizado; los grupos se combinan
  cols.forEach(([g, sub], i) => {
    const c7 = ws.getRow(7).getCell(i + 1), c8 = ws.getRow(8).getCell(i + 1)
    c7.value = g || null; c8.value = sub || g
    for (const c of [c7, c8]) { c.font = { bold: true }; c.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' } }
  })
  for (let i = 0; i < cols.length; i++) {
    if (!cols[i][1]) { ws.mergeCells(7, i + 1, 8, i + 1); continue }
    if (cols[i][0]) { let j = i; while (j + 1 < cols.length && cols[j + 1][0] === '' && cols[j + 1][1]) j++; if (j > i) ws.mergeCells(7, i + 1, 7, j + 1) }
  }
  filas.forEach((f, r) => {
    const row = ws.getRow(9 + r)
    cols.forEach(([, , k], i) => {
      if (!k) return
      const v = (f as any)[k]
      if (v === null || v === undefined || v === '') return
      const cell = row.getCell(i + 1)
      cell.value = v
      if (typeof v === 'number' && !['ejercicio'].includes(k as string)) cell.numFmt = '0.00'
    })
  })
  ws.columns.forEach(c => { c.width = 14 })
  ws.views = [{ state: 'frozen', ySplit: 8 }]
}

/** Nombre normalizado: Ejercicio + NIF + T (libros unificados IVA/IRPF) + Nombre. */
export async function nombreFicheroLibros(anio: number) {
  const a = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  return `${anio}${a.nif}T${a.emisor_nombre}.xlsx`.replace(/[\\/:*?"<>|]/g, '')
}

export async function librosXlsx(anio: number): Promise<Buffer> {
  const a = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } })
  const [exp, rec] = await Promise.all([filasExpedidas(anio, null), filasRecibidas(anio, null)])
  const wb = new ExcelJS.Workbook()
  wb.creator = 'innovapp facturación'
  hoja(wb, 'EXPEDIDAS_INGRESOS', 'LIBRO REGISTRO FACTURAS EXPEDIDAS Y LIBRO REGISTRO DE VENTAS E INGRESOS', 'U (Unificado de Facturas Emitidas y Ventas e Ingresos)', anio, a.nif, a.emisor_nombre, COLS_EXP, exp)
  hoja(wb, 'RECIBIDAS_GASTOS', 'LIBRO REGISTRO FACTURAS RECIBIDAS Y LIBRO REGISTRO DE COMPRAS Y GASTOS', 'V (Unificado de Facturas Recibidas y Compras y Gastos)', anio, a.nif, a.emisor_nombre, COLS_REC, rec)
  return Buffer.from(await wb.xlsx.writeBuffer())
}

/** CSV con «;», decimales con coma, fechas dd/mm/aaaa y BOM UTF-8 (se abre bien en Excel). */
export function csv<T>(cols: [string, string, keyof T | null][], filas: T[]): string {
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const t = typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v)
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  // Las subcolumnas heredan el nombre de su grupo: «Autoliquidación - Periodo»
  let grupo = ''
  const cab = cols.map(([g, sub]) => {
    if (g) grupo = g
    return esc(sub ? `${g || grupo} - ${sub}` : g)
  }).join(';')
  const cuerpo = filas.map(f => cols.map(([, , k]) => (k ? esc(k === 'ejercicio' ? String((f as any)[k]) : (f as any)[k]) : '')).join(';'))
  return '﻿' + [cab, ...cuerpo].join('\r\n') + '\r\n'
}

export const csvExpedidas = (f: FilaExpedida[]) => csv(COLS_EXP, f)
export const csvRecibidas = (f: FilaRecibida[]) => csv(COLS_REC, f)
