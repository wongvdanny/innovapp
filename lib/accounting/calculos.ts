// Cálculos de Contabilidad (funciones puras: sin prisma ni fechas del sistema; `hoy` siempre se pasa).
// Importes en euros, base imponible (sin IVA). Fechas 'YYYY-MM-DD', meses 'YYYY-MM'.
//
// Fuentes (las prepara lib/accounting/datos.ts sin duplicar nada):
//   · Ingresos: facturas emitidas/pagadas (por devengo) + cobros online sin factura (Invoice
//     o cuota de Agentes sin factura emitida). Un cobro facturado solo cuenta por su factura.
//   · Gastos: fac_gastos registrados y previstos (los previstos se muestran aparte).
//   · Contratos: suscripciones reales (sin pruebas ni borradas) y ofertas de Agentes IA,
//     para MRR, clientes, altas y bajas.

export type Linea = string // slug de producto, 'proyectos' (agencia) u 'otros'

export interface Ingreso {
  fecha: string
  base: number
  iva: number
  linea: Linea
  origen: 'factura' | 'sin_factura'
  ref: string           // nº de factura o referencia del cobro
  cliente: string
  descripcion: string
  facturaId?: string | null
  invoiceId?: string | null
  cuotaId?: string | null
  proyectoId?: string | null
}

export interface Gasto {
  id: string
  fecha: string
  base: number
  coste: number          // base + IVA no deducible (lo que de verdad cuesta)
  ivaDeducible: number
  estado: 'previsto' | 'registrado'
  linea: Linea
  categoria: string
  proveedor: string
  recurrenteId: string | null
  proyectoId?: string | null
}

export interface Contrato {
  id: string
  linea: Linea
  cliente: string
  mensual: number        // cuota mensual equivalente, IVA incluido como el precio del plan
  inicio: string | null  // alta efectiva
  baja: string | null    // fecha de baja (cancelación/expiración)
}

export interface DatosContables { ingresos: Ingreso[]; gastos: Gasto[]; contratos: Contrato[] }

export interface Meta {
  id: string
  metrica: 'mrr' | 'ingresos' | 'beneficio' | 'clientes_activos' | 'altas'
  objetivo: number
  periodo: 'mes' | 'trimestre' | 'anio'
  desde: string
  hasta: string
  producto_slug: string | null
}

// ─────────────────────────────── Fechas ───────────────────────────────

export const mesDe = (fecha: string) => fecha.slice(0, 7)

export function mesAnterior(mes: string, n = 1) {
  const [y, m] = mes.split('-').map(Number)
  const t = y * 12 + (m - 1) - n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

/** Los `n` meses que terminan en `mes` (incluido), del más antiguo al más reciente. */
export const ultimosMeses = (mes: string, n: number) => Array.from({ length: n }, (_, i) => mesAnterior(mes, n - 1 - i))

export function finDeMes(mes: string) {
  const [y, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

const diasEntre = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
export const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const suma = (xs: number[]) => r2(xs.reduce((a, b) => a + b, 0))

/** Fecha de corte de un mes: su último día, o `hoy` si es el mes en curso. */
export const corte = (mes: string, hoy: string) => (mesDe(hoy) === mes ? hoy : finDeMes(mes))

// ─────────────────────────────── Contratos ───────────────────────────────

export const activoEn = (c: Contrato, fecha: string) => !!c.inicio && c.inicio <= fecha && (!c.baja || c.baja > fecha)

export function mrrEn(contratos: Contrato[], fecha: string, linea?: Linea) {
  return suma(contratos.filter(c => activoEn(c, fecha) && (!linea || c.linea === linea)).map(c => c.mensual))
}

/** Clientes de pago activos (cuota > 0). */
export function clientesEn(contratos: Contrato[], fecha: string, linea?: Linea) {
  return contratos.filter(c => c.mensual > 0 && activoEn(c, fecha) && (!linea || c.linea === linea)).length
}

const enMes = (fecha: string | null, mes: string) => !!fecha && mesDe(fecha) === mes

// ─────────────────────────────── KPIs del mes ───────────────────────────────

export function kpisMes(d: DatosContables, mes: string, hoy: string) {
  const ingresos = d.ingresos.filter(i => mesDe(i.fecha) === mes)
  const gastos = d.gastos.filter(g => mesDe(g.fecha) === mes)
  const fin = corte(mes, hoy)
  const inicio = finDeMes(mesAnterior(mes))
  const pago = d.contratos.filter(c => c.mensual > 0)
  const clientesInicio = clientesEn(pago, inicio)
  const bajas = pago.filter(c => enMes(c.baja, mes) && c.baja! <= fin).length
  const mrr = mrrEn(d.contratos, fin)
  const clientes = clientesEn(d.contratos, fin)
  const ingresosTotal = suma(ingresos.map(i => i.base))
  const gastosRegistrados = suma(gastos.filter(g => g.estado === 'registrado').map(g => g.coste))
  const gastosPrevistos = suma(gastos.filter(g => g.estado === 'previsto').map(g => g.coste))
  return {
    mes,
    ingresos: ingresosTotal,
    ingresosSinFactura: suma(ingresos.filter(i => i.origen === 'sin_factura').map(i => i.base)),
    gastosRegistrados,
    gastosPrevistos,
    gastos: r2(gastosRegistrados + gastosPrevistos),
    beneficio: r2(ingresosTotal - gastosRegistrados - gastosPrevistos),
    mrr,
    arr: r2(mrr * 12),
    clientes,
    altas: pago.filter(c => enMes(c.inicio, mes) && c.inicio! <= fin).length,
    bajas,
    churn: clientesInicio > 0 ? r2((bajas / clientesInicio) * 100) : null,   // % mensual
    arpu: clientes > 0 ? r2(mrr / clientes) : null,
  }
}
export type KpisMes = ReturnType<typeof kpisMes>

// ─────────────────────────────── Evolución ───────────────────────────────

export function evolucion(d: DatosContables, mes: string, hoy: string, n = 12, lineas: Linea[] = []) {
  return ultimosMeses(mes, n).map(m => {
    const k = kpisMes(d, m, hoy)
    const fin = corte(m, hoy)
    return {
      mes: m,
      ingresos: k.ingresos,
      gastosRegistrados: k.gastosRegistrados,
      gastosPrevistos: k.gastosPrevistos,
      beneficio: k.beneficio,
      mrr: k.mrr,
      mrrPorLinea: Object.fromEntries(lineas.map(l => [l, mrrEn(d.contratos, fin, l)])),
    }
  })
}

// ─────────────────────────────── Por línea de negocio ───────────────────────────────

export const crecimiento = (actual: number, anterior: number) => (anterior > 0 ? r2(((actual - anterior) / anterior) * 100) : null)

export function desglosePorLinea(d: DatosContables, mes: string, hoy: string, lineas: Linea[]) {
  const ant = mesAnterior(mes)
  const tres = ultimosMeses(mes, 3)
  const fin = corte(mes, hoy)
  const ing = (l: Linea, ms: string[]) => suma(d.ingresos.filter(i => i.linea === l && ms.includes(mesDe(i.fecha))).map(i => i.base))
  const gas = (l: Linea, ms: string[]) => suma(d.gastos.filter(g => g.linea === l && ms.includes(mesDe(g.fecha))).map(g => g.coste))
  return lineas.map(l => {
    const ingresos = ing(l, [mes])
    const gastos = gas(l, [mes])
    const margen = r2(ingresos - gastos)
    return {
      linea: l,
      ingresos,
      ingresosAnterior: ing(l, [ant]),
      crecimiento: crecimiento(ingresos, ing(l, [ant])),
      ingresos3m: ing(l, tres),
      gastos,
      margen,
      margenPct: ingresos > 0 ? r2((margen / ingresos) * 100) : null,
      clientes: clientesEn(d.contratos, fin, l),
      mrr: mrrEn(d.contratos, fin, l),
    }
  })
}
export type FilaLinea = ReturnType<typeof desglosePorLinea>[number]

// ─────────────────────────────── Metas ───────────────────────────────

const FLUJO = ['ingresos', 'beneficio', 'altas'] as const

/** Valor de una métrica: acumulado en [desde, hasta] para las de flujo, o el valor en `hasta` para las de stock. */
export function valorMetrica(d: DatosContables, metrica: Meta['metrica'], desde: string, hasta: string, linea?: Linea | null) {
  const l = linea ?? undefined
  const entre = (f: string) => f >= desde && f <= hasta
  switch (metrica) {
    case 'ingresos': return suma(d.ingresos.filter(i => entre(i.fecha) && (!l || i.linea === l)).map(i => i.base))
    case 'beneficio': return r2(
      suma(d.ingresos.filter(i => entre(i.fecha) && (!l || i.linea === l)).map(i => i.base)) -
      suma(d.gastos.filter(g => entre(g.fecha) && (!l || g.linea === l)).map(g => g.coste)))
    case 'altas': return d.contratos.filter(c => c.mensual > 0 && !!c.inicio && entre(c.inicio) && (!l || c.linea === l)).length
    case 'mrr': return mrrEn(d.contratos, hasta, l)
    case 'clientes_activos': return clientesEn(d.contratos, hasta, l)
  }
}

/**
 * Progreso de una meta y proyección a fin de periodo al ritmo actual (lineal):
 * flujo → acumulado / días transcurridos × días del periodo; stock → valor actual + variación diaria
 * desde el inicio del periodo × días que faltan.
 */
export function progresoMeta(d: DatosContables, meta: Meta, hoy: string) {
  const fin = hoy < meta.hasta ? hoy : meta.hasta
  const empezada = hoy >= meta.desde
  const actual = empezada ? valorMetrica(d, meta.metrica, meta.desde, fin, meta.producto_slug) : 0
  const total = diasEntre(meta.desde, meta.hasta) + 1
  const transcurridos = empezada ? Math.min(total, diasEntre(meta.desde, fin) + 1) : 0
  let proyeccion: number | null = null
  if (transcurridos > 0) {
    if ((FLUJO as readonly string[]).includes(meta.metrica)) proyeccion = r2((actual / transcurridos) * total)
    else {
      const inicial = valorMetrica(d, meta.metrica, meta.desde, meta.desde, meta.producto_slug)
      proyeccion = r2(actual + ((actual - inicial) / transcurridos) * (total - transcurridos))
    }
  }
  return {
    ...meta,
    actual,
    pct: r2(Math.min(999, (actual / meta.objetivo) * 100)),
    proyeccion,
    proyeccionPct: proyeccion === null ? null : r2((proyeccion / meta.objetivo) * 100),
    diasRestantes: Math.max(0, diasEntre(fin, meta.hasta)),
    terminada: hoy > meta.hasta,
  }
}

// ─────────────────────────────── Dónde enfocar ───────────────────────────────

export interface Alerta { tipo: 'estancada' | 'churn' | 'gasto_sube' | 'margen_negativo'; linea?: Linea; texto: string; gravedad: 'aviso' | 'alta' }

/**
 * Ranking de líneas (puntuación 0–100: 40 % ingresos de 3 meses, 35 % crecimiento, 25 % margen)
 * y alertas simples. Pensado como orientación, no como verdad absoluta.
 */
export function enfoque(d: DatosContables, mes: string, hoy: string, lineas: Linea[], nombre: (l: Linea) => string = l => l) {
  const filas = desglosePorLinea(d, mes, hoy, lineas).filter(f => f.ingresos3m > 0 || f.clientes > 0 || f.gastos > 0)
  const maxIng = Math.max(1, ...filas.map(f => f.ingresos3m))
  const ranking = filas.map(f => {
    const pIng = f.ingresos3m / maxIng
    const pCre = f.crecimiento === null ? (f.ingresos > 0 ? 1 : 0.5) : Math.max(0, Math.min(1, (f.crecimiento + 50) / 100))
    const pMar = f.margenPct === null ? 0.5 : Math.max(0, Math.min(1, (f.margenPct + 50) / 150))
    return { ...f, puntuacion: Math.round((pIng * 0.4 + pCre * 0.35 + pMar * 0.25) * 100) }
  }).sort((a, b) => b.puntuacion - a.puntuacion)

  const alertas: Alerta[] = []
  for (const f of filas) {
    const [m2, m1] = [mesAnterior(mes, 2), mesAnterior(mes)]
    const ing = (m: string) => suma(d.ingresos.filter(i => i.linea === f.linea && mesDe(i.fecha) === m).map(i => i.base))
    if (f.ingresos3m > 0 && f.ingresos <= ing(m1) && ing(m1) <= ing(m2))
      alertas.push({ tipo: 'estancada', linea: f.linea, gravedad: 'aviso', texto: `${nombre(f.linea)}: ingresos sin crecer en los últimos 3 meses.` })
    if (f.margen < 0)
      alertas.push({ tipo: 'margen_negativo', linea: f.linea, gravedad: 'alta', texto: `${nombre(f.linea)}: gastos (${f.gastos.toFixed(2)} €) por encima de los ingresos este mes.` })
  }
  const k = kpisMes(d, mes, hoy)
  if (k.churn !== null && k.churn > 5)
    alertas.push({ tipo: 'churn', gravedad: k.churn > 10 ? 'alta' : 'aviso', texto: `Churn del ${k.churn} % este mes (${k.bajas} baja(s)). Por encima del 5 % mensual conviene revisar por qué se van.` })

  // Gasto recurrente que sube: por proveedor, mes actual > 120 % de la media de los 3 anteriores (y +10 € o más)
  const proveedores = Array.from(new Set(d.gastos.filter(g => g.recurrenteId).map(g => g.proveedor)))
  for (const p of proveedores) {
    const del = (m: string) => suma(d.gastos.filter(g => g.proveedor === p && mesDe(g.fecha) === m).map(g => g.coste))
    const previos = [1, 2, 3].map(n => del(mesAnterior(mes, n)))
    const media = suma(previos) / 3
    const ahora = del(mes)
    if (media > 0 && ahora > media * 1.2 && ahora - media >= 10)
      alertas.push({ tipo: 'gasto_sube', gravedad: 'aviso', texto: `${p}: ${ahora.toFixed(2)} € este mes frente a ${media.toFixed(2)} € de media (+${Math.round((ahora / media - 1) * 100)} %).` })
  }
  return { ranking, alertas }
}

// ─────────────────────────────── CSV ───────────────────────────────

/** CSV con «;», decimales con coma y BOM UTF-8, como los libros de facturación. */
export function csv(cabecera: string[], filas: (string | number | null | undefined)[][]): string {
  const esc = (v: string | number | null | undefined) => {
    if (v === null || v === undefined) return ''
    const t = typeof v === 'number' ? v.toFixed(2).replace('.', ',') : String(v)
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
  }
  return String.fromCharCode(0xfeff) + [cabecera, ...filas].map(f => f.map(esc).join(';')).join('\r\n') + '\r\n'
}

const ddmmaaaa = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}`

export const csvIngresos = (xs: Ingreso[]) => csv(
  ['Fecha', 'Origen', 'Referencia', 'Cliente', 'Descripción', 'Línea', 'Base', 'IVA', 'Total'],
  xs.map(i => [ddmmaaaa(i.fecha), i.origen === 'factura' ? 'Factura' : 'Cobro sin factura', i.ref, i.cliente, i.descripcion, i.linea, i.base, i.iva, r2(i.base + i.iva)]),
)

export const csvGastos = (xs: Gasto[]) => csv(
  ['Fecha', 'Estado', 'Proveedor', 'Categoría', 'Línea', 'Base', 'Coste (base + IVA no deducible)', 'IVA deducible'],
  xs.map(g => [ddmmaaaa(g.fecha), g.estado === 'previsto' ? 'Previsto' : 'Registrado', g.proveedor, g.categoria, g.linea, g.base, g.coste, g.ivaDeducible]),
)
