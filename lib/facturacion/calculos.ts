import type Decimal from 'decimal.js'
import { D, r2, suma, DecimalLike } from './decimal'

export interface LineaEntrada {
  cantidad: DecimalLike
  precio_unitario: DecimalLike
  descuento_pct?: DecimalLike
  tipo_iva: DecimalLike
}

export interface LineaCalculada {
  base: Decimal
  cuota: Decimal
}

/** Base y cuota de una línea, redondeadas a 2 decimales por línea. */
export function calcularLinea(l: LineaEntrada): LineaCalculada {
  const bruto = D(l.cantidad).times(D(l.precio_unitario))
  const base = r2(bruto.times(D(100).minus(D(l.descuento_pct))).dividedBy(100))
  const cuota = r2(base.times(D(l.tipo_iva)).dividedBy(100))
  return { base, cuota }
}

export interface Totales {
  base_imponible: Decimal
  cuota_iva: Decimal
  importe_total: Decimal      // base + IVA (ImporteTotal VeriFactu)
  tipo_retencion: Decimal
  cuota_retencion: Decimal
  liquido_a_cobrar: Decimal   // importe_total - retención
}

/**
 * Totales de factura a partir de líneas ya calculadas (base/cuota almacenadas).
 * La retención se aplica sobre la base imponible total.
 */
export function calcularTotales(lineas: { base: DecimalLike; cuota: DecimalLike }[], tipoRetencion: DecimalLike = 0): Totales {
  const base_imponible = r2(suma(lineas.map(l => l.base)))
  const cuota_iva = r2(suma(lineas.map(l => l.cuota)))
  const importe_total = base_imponible.plus(cuota_iva)
  const tipo_retencion = D(tipoRetencion)
  const cuota_retencion = r2(base_imponible.times(tipo_retencion).dividedBy(100))
  return {
    base_imponible, cuota_iva, importe_total,
    tipo_retencion, cuota_retencion,
    liquido_a_cobrar: importe_total.minus(cuota_retencion),
  }
}

/**
 * Desglose de un precio con IVA incluido (cobros online).
 * Regla: cuota = r2(total / (1 + t) · t) y base = total − cuota, para que base + cuota = total exacto.
 * Nota: la cuota puede diferir 0,01 de r2(base · t); es inevitable para ciertos totales
 * (p. ej. 29,99 € no es alcanzable con base de 2 decimales y cuota = r2(base · 21 %)).
 */
export function desglosarIvaIncluido(total: DecimalLike, tipoIva: DecimalLike): LineaCalculada {
  const t = D(tipoIva)
  const tot = r2(total)
  const cuota = r2(tot.times(t).dividedBy(D(100).plus(t)))
  return { base: tot.minus(cuota), cuota }
}
