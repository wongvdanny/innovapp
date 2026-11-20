import { formatEUR, priceWithVat } from '../pricing'

// Precios oficiales de Agentes IA: bases SIN IVA y sin permanencia. Agentes no usa la tabla Plan
// (cobra desde su propio panel), así que esta es la única fuente para las páginas públicas,
// la FAQ, las meta descriptions y los datos estructurados.

export interface PlanAgentes {
  nombre: string
  para: string
  /** Cuota mensual «desde», sin IVA. */
  mes: number
  /** Alta «desde», sin IVA. */
  alta: number
  conversaciones: number
  destacado?: boolean
  incluye: string[]
}

/** E-commerce (WooCommerce y PrestaShop). */
export const PLANES_ECOMMERCE: PlanAgentes[] = [
  { nombre: 'Starter', para: 'Consultas de catálogo', mes: 109, alta: 339, conversaciones: 500, incluye: ['Consultas de catálogo: stock, precio y variantes'] },
  { nombre: 'Growth', para: 'Venta guiada hasta el pago', mes: 149, alta: 499, conversaciones: 800, destacado: true, incluye: ['Venta guiada hasta el pago: carrito y enlace de pago', 'Revisión mensual'] },
]

/** Suplementos de voz (cuota mensual sin IVA, sobre el plan). */
export const SUPLEMENTOS_VOZ = [
  { nombre: 'Voz Básico', corto: 'Básico', minutos: 120, mes: 49 },
  { nombre: 'Voz Plus', corto: 'Plus', minutos: 220, mes: 79, destacado: true },
  { nombre: 'Voz Pro', corto: 'Pro', minutos: 350, mes: 119 },
]

export const MINUTO_VOZ_ADICIONAL = 0.3
export const ALTA_VOZ = 119

/** «109 € + IVA/mes (131,89 € IVA incluido)». Sin sufijo: «339 € + IVA (410,19 € IVA incluido)». */
export const conIva = (base: number, sufijo = '') =>
  `${formatEUR(base, { compact: true })} + IVA${sufijo} (${formatEUR(priceWithVat(base))} IVA incluido)`

/** Forma corta para textos breves (meta description): «109 € + IVA/mes». */
export const sinIva = (base: number, sufijo = '') => `${formatEUR(base, { compact: true })} + IVA${sufijo}`

/** Línea de los suplementos de voz, minuto adicional y alta de voz. */
export const lineaVoz = () =>
  `${SUPLEMENTOS_VOZ.map(s => `${s.corto} ${s.minutos} min +${conIva(s.mes, '/mes')}`).join(' · ')}. ` +
  `Minuto adicional ${conIva(MINUTO_VOZ_ADICIONAL)}. Alta de voz +${conIva(ALTA_VOZ)}.`

/** Respuesta de la FAQ «¿Cuánto cuesta?» de las páginas de e-commerce. */
export const faqPreciosEcommerce = () => {
  const [a, b] = PLANES_ECOMMERCE
  return `Hay dos planes: ${a.nombre}, desde ${conIva(a.mes, '/mes')} con alta desde ${conIva(a.alta)} y hasta ${a.conversaciones} conversaciones al mes (consultas de catálogo), ` +
    `y ${b.nombre}, desde ${conIva(b.mes, '/mes')} con alta desde ${conIva(b.alta)} y hasta ${b.conversaciones} conversaciones al mes (venta guiada hasta el pago y revisión mensual). Sin permanencia.`
}

/** Datos estructurados (schema.org) con el total con IVA, como GymStack y Servix. */
export function ofertasEcommerce() {
  const totales = PLANES_ECOMMERCE.map(p => priceWithVat(p.mes))
  return {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: Math.min(...totales).toFixed(2),
    highPrice: Math.max(...totales).toFixed(2),
    offerCount: String(PLANES_ECOMMERCE.length),
    offers: PLANES_ECOMMERCE.map(p => ({
      '@type': 'Offer',
      name: p.nombre,
      priceCurrency: 'EUR',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: priceWithVat(p.mes).toFixed(2), priceCurrency: 'EUR', unitText: 'MONTH', valueAddedTaxIncluded: true },
      description: `Desde ${conIva(p.mes, '/mes')}, alta desde ${conIva(p.alta)}. Hasta ${p.conversaciones} conversaciones/mes. ${p.incluye.join('. ')}.`,
    })),
  }
}
