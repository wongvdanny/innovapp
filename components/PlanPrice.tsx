import { CSSProperties } from 'react'
import { formatEUR, isFree, periodSuffix, priceWithVat } from '../lib/pricing'

// Precio de un plan: base sin IVA (Plan.price) y, debajo y más pequeño, el total con IVA.
//   29 € + IVA /mes
//   35,09 € IVA incluido
// Los planes gratis muestran «Gratis», sin líneas de IVA.
// Con `consumer` (B2C, p. ej. News) se invierte el orden: el total con IVA grande y la base debajo.
//   1,98 € IVA incluido /mes
//   1,64 € + IVA

const TAMANOS = {
  lg: { precio: 44, resto: 15, total: 14 },
  md: { precio: 26, resto: 13, total: 12 },
  sm: { precio: 15, resto: 12, total: 11 },
} as const

interface Props {
  base: number
  period?: string | null
  size?: keyof typeof TAMANOS
  /** Color del precio (por defecto, el heredado). */
  color?: string
  /** Color de «+ IVA /mes» y de la línea del total. */
  muted?: string
  style?: CSSProperties
  /** B2C: el total con IVA es el precio principal. */
  consumer?: boolean
}

export default function PlanPrice({ base, period, size = 'lg', color, muted = '#7a7a7a', style, consumer }: Props) {
  const t = TAMANOS[size]
  if (isFree(base, period)) {
    return <div style={{ fontSize: t.precio, fontWeight: 800, color, lineHeight: 1.15, ...style }}>Gratis</div>
  }
  const suf = periodSuffix(period)
  if (consumer) {
    return (
      <div style={{ lineHeight: 1.15, ...style }}>
        <div style={{ fontSize: t.precio, fontWeight: 800, color, whiteSpace: 'nowrap' }}>
          {formatEUR(priceWithVat(base))}
          <span style={{ fontSize: t.resto, fontWeight: 500, color: muted }}> IVA incluido{suf ? ` ${suf}` : ''}</span>
        </div>
        <div style={{ fontSize: t.total, fontWeight: 500, color: muted, marginTop: 4 }}>
          {formatEUR(base)} + IVA
        </div>
      </div>
    )
  }
  return (
    <div style={{ lineHeight: 1.15, ...style }}>
      <div style={{ fontSize: t.precio, fontWeight: 800, color, whiteSpace: 'nowrap' }}>
        {formatEUR(base, { compact: true })}
        <span style={{ fontSize: t.resto, fontWeight: 500, color: muted }}> + IVA{suf ? ` ${suf}` : ''}</span>
      </div>
      <div style={{ fontSize: t.total, fontWeight: 500, color: muted, marginTop: 4 }}>
        {formatEUR(priceWithVat(base))} IVA incluido
      </div>
    </div>
  )
}
