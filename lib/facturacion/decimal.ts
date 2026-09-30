import Decimal from 'decimal.js'

// Toda la aritmética de importes pasa por aquí: nunca floats.
// Redondeo comercial (half-up) a 2 decimales, como exige la normativa de facturación.
const Dec = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP })

export type DecimalLike = Decimal | string | number | { toString(): string } | null | undefined

/** Convierte cualquier valor (incluido Prisma.Decimal) a Decimal. null/undefined/'' → 0. */
export function D(v: DecimalLike): Decimal {
  if (v === null || v === undefined || v === '') return new Dec(0)
  if (v instanceof Dec) return v as Decimal
  return new Dec(typeof v === 'number' ? v : v.toString().replace(',', '.'))
}

/** Redondea a 2 decimales (half-up). */
export function r2(v: DecimalLike): Decimal {
  return D(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}

/** Importe con 2 decimales y punto: '123.40'. Formato usado en huella, QR y BD. */
export function fmt2(v: DecimalLike): string {
  return r2(v).toFixed(2)
}

/** Importe para mostrar: '1.234,50 €'. */
export function eur(v: DecimalLike): string {
  const [ent, dec] = fmt2(v).split('.')
  const neg = ent.startsWith('-')
  const miles = (neg ? ent.slice(1) : ent).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${neg ? '-' : ''}${miles},${dec} €`
}

export function suma(vals: DecimalLike[]): Decimal {
  return vals.reduce<Decimal>((acc, v) => acc.plus(D(v)), D(0))
}

export { Dec as Decimal }
