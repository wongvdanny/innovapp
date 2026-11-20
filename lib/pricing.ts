// Precios de los planes (Plan.price) para todos los productos.
//   · Plan.price es la BASE IMPONIBLE, sin IVA.
//   · Se cobra el total con IVA (base + cuota): es lo que va a Redsys/Stripe/transferencia y a Invoice.amount.
//   · Todo se calcula en céntimos enteros (sin errores de coma flotante) y la cuota se redondea a 2
//     decimales, mitad hacia arriba: el mismo resultado que desglosarIvaIncluido() de la facturación,
//     así la factura legal del cobro sale con la misma base y cuota que se mostraron.
//   · El tipo debe coincidir con «IVA por defecto» de Facturación › Ajustes (fac_ajustes.iva_defecto).

export const VAT_RATE = Number(process.env.NEXT_PUBLIC_VAT_RATE ?? 21)

const cents = (euros: number) => Math.round(euros * 100)

/** Cuota de IVA en céntimos sobre una base en céntimos (redondeo mitad hacia arriba). */
const vatCents = (baseCents: number) => Math.floor((baseCents * VAT_RATE + 50) / 100)

/** Total con IVA en céntimos: el importe exacto que se envía a la pasarela (Redsys/Stripe). */
export function totalCents(base: number): number {
  const b = cents(base)
  return b + vatCents(b)
}

/** Cuota de IVA en euros de una base sin IVA. */
export function vatAmount(base: number): number {
  return vatCents(cents(base)) / 100
}

/** Total con IVA en euros de una base sin IVA. */
export function priceWithVat(base: number): number {
  return totalCents(base) / 100
}

/** Desglose de un importe cobrado con IVA incluido (p. ej. Invoice.amount). Igual que la facturación. */
export function splitVatIncluded(total: number): { base: number; vat: number; total: number } {
  const t = cents(total)
  const v = Math.floor((2 * t * VAT_RATE + 100 + VAT_RATE) / (2 * (100 + VAT_RATE)))
  return { base: (t - v) / 100, vat: v / 100, total: t / 100 }
}

const FORMATO = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const FORMATO_ENTERO = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** «35,09 €». Con `compact`, los importes redondos sin decimales: «29 €». */
export function formatEUR(v: number, opts: { compact?: boolean } = {}): string {
  const r = Math.round(v * 100) / 100
  return (opts.compact && Number.isInteger(r) ? FORMATO_ENTERO : FORMATO).format(r)
}

/** Plan sin coste: «Gratis», sin líneas de IVA. */
export const isFree = (base: number, period?: string | null) => !(base > 0) || period === 'free'

/** «/mes», «/año» o '' según Plan.interval (monthly, month, yearly, year, free). */
export function periodSuffix(period?: string | null): string {
  if (period === 'monthly' || period === 'month') return '/mes'
  if (period === 'yearly' || period === 'year') return '/año'
  return ''
}

/** Texto plano para emails y botones: «29 € + IVA /mes (35,09 € IVA incluido)» o «Gratis». */
export function priceText(base: number, period?: string | null): string {
  if (isFree(base, period)) return 'Gratis'
  const suf = periodSuffix(period)
  return `${formatEUR(base, { compact: true })} + IVA${suf ? ` ${suf}` : ''} (${formatEUR(priceWithVat(base))} IVA incluido)`
}
