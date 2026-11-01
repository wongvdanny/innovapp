// Validación de lo que se escribe desde Contabilidad y Proyectos (funciones puras; nunca req.body tal cual).
import { FacturacionError } from '../facturacion/errores'

const err = (m: string) => new FacturacionError('DATOS_INVALIDOS', m)
const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
const txtONull = (v: unknown) => txt(v) || null
const fecha = (v: unknown, campo: string, obligatoria = false) => {
  const s = txt(v)
  if (!s) { if (obligatoria) throw err(`Falta ${campo}`); return null }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(Date.parse(s))) throw err(`${campo}: fecha no válida`)
  return s
}
const importe = (v: unknown, campo: string, obligatorio = false) => {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) { if (obligatorio) throw err(`Falta ${campo}`); return null }
  if (!/^\d+(\.\d{1,2})?$/.test(s)) throw err(`${campo}: importe no válido`)
  return s
}

export const METRICAS = ['mrr', 'ingresos', 'beneficio', 'clientes_activos', 'altas'] as const
export const PERIODOS = ['mes', 'trimestre', 'anio'] as const
export const ESTADOS_PROYECTO = ['propuesta', 'aceptado', 'en_curso', 'entregado', 'cerrado', 'cancelado'] as const

/** Fin del periodo que empieza en `desde` (mes, trimestre o año naturales a partir de esa fecha). */
export function finPeriodo(desde: string, periodo: (typeof PERIODOS)[number]) {
  const [y, m, d] = desde.split('-').map(Number)
  const meses = periodo === 'mes' ? 1 : periodo === 'trimestre' ? 3 : 12
  return new Date(Date.UTC(y, m - 1 + meses, d - 1)).toISOString().slice(0, 10)
}

export function normalizarMeta(b: any) {
  if (!METRICAS.includes(b?.metrica)) throw err('Métrica no válida')
  if (!PERIODOS.includes(b?.periodo)) throw err('Periodo no válido')
  const objetivo = importe(b.objetivo, 'Objetivo', true)!
  if (Number(objetivo) <= 0) throw err('El objetivo debe ser mayor que 0')
  const desde = fecha(b.desde, 'la fecha de inicio', true)!
  return {
    metrica: b.metrica as string, periodo: b.periodo as string, objetivo, desde: new Date(desde), hasta: new Date(finPeriodo(desde, b.periodo)),
    producto_slug: txtONull(b.producto_slug), notas: txtONull(b.notas), activa: b.activa !== false,
  }
}

export function normalizarProyecto(b: any) {
  const nombre = txt(b?.nombre)
  if (!nombre) throw err('El proyecto necesita un nombre')
  const estado = b.estado ?? 'propuesta'
  if (!ESTADOS_PROYECTO.includes(estado)) throw err('Estado no válido')
  const inicio = fecha(b.fecha_inicio, 'Inicio'), entrega = fecha(b.fecha_entrega, 'Entrega prevista'), fin = fecha(b.fecha_fin, 'Fin')
  if (inicio && entrega && entrega < inicio) throw err('La entrega prevista es anterior al inicio')
  const presupuesto = importe(b.presupuesto, 'Presupuesto')
  const d = (s: string | null) => (s ? new Date(s) : null)
  return {
    nombre, estado, descripcion: txtONull(b.descripcion), notas: txtONull(b.notas), cliente_id: txtONull(b.cliente_id),
    producto_slug: txtONull(b.producto_slug), presupuesto, fecha_inicio: d(inicio), fecha_entrega: d(entrega), fecha_fin: d(fin),
  }
}

/** Recurrente de gasto: se guarda en fac_recurrentes con tipo 'gasto' (nunca emite ni envía nada). */
export function normalizarRecurrenteGasto(b: any, categorias: readonly string[]) {
  const proveedor = txt(b?.proveedor)
  if (!proveedor) throw err('Falta el proveedor')
  const descripcion = txt(b.descripcion) || proveedor
  const periodicidad = b.periodicidad === 'anual' ? 'anual' : 'mensual'
  const dia = parseInt(String(b.dia_mes ?? '1'), 10)
  if (!(dia >= 1 && dia <= 28)) throw err('El día del mes debe estar entre 1 y 28')
  const proxima = fecha(b.proxima_fecha, 'la fecha del próximo gasto', true)!
  const base = importe(b.base, 'Base imponible', true)!
  const categoria = categorias.includes(b.categoria) ? b.categoria : 'otros'
  // La cuota de autónomos (Seguridad Social) no lleva IVA: en los libros va como F6 sin cuota
  const tipoIva = categoria === 'cuota_autonomo' ? '0' : String(b.tipo_iva ?? '21')
  if (!['21', '10', '4', '0'].includes(tipoIva)) throw err('Tipo de IVA no válido')
  const pais = (txt(b.proveedor_pais) || 'ES').toUpperCase()
  if (!/^[A-Z]{2}$/.test(pais)) throw err('País no válido (código de 2 letras)')
  return {
    tipo: 'gasto', periodicidad, descripcion, proveedor, proveedor_nif: txtONull(b.proveedor_nif), proveedor_pais: pais,
    categoria, producto_slug: txtONull(b.producto_slug),
    dia_mes: dia, proxima_fecha: new Date(proxima), activo: b.activo !== false, emitir_auto: false, enviar_email: false,
    lineas: [{ descripcion: txt(b.concepto) || `${descripcion} {mes} {año}`, cantidad: '1', precio_unitario: base, descuento_pct: '0', tipo_iva: tipoIva }],
  }
}
