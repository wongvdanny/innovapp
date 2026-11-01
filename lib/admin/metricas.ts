// Cálculos de /admin sobre suscripciones (funciones puras: sin prisma, usables en el render).

export interface SuscripcionAdmin {
  id: string
  status: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  isTest: boolean
  servixSlug: string | null
  servixRestaurantId: string | null
  user: { name: string; email: string }
  plan: { id: string; name: string; price: number; interval: string; Product: { slug: string; name: string } | null }
  provisioning: { slug: string | null; externalId: string | null } | null
}

export const productoDe = (s: SuscripcionAdmin) => s.plan.Product?.slug ?? null

/** Cuota mensual equivalente del plan (anual / 12; gratis = 0). */
export function cuotaMensual(plan: { price: number; interval: string }) {
  if (plan.interval === 'yearly') return plan.price / 12
  if (plan.interval === 'free') return 0
  return plan.price
}

export const tieneTenant = (s: SuscripcionAdmin) => !!(s.provisioning?.externalId || s.servixRestaurantId)
export const slugTenant = (s: SuscripcionAdmin) => s.provisioning?.slug || s.servixSlug

/** KPIs de suscripciones. Las de prueba (isTest) no cuentan: solo se informa cuántas hay. */
export function resumen(todas: SuscripcionAdmin[]) {
  const subs = todas.filter(s => !s.isTest)
  const activas = subs.filter(s => s.status === 'active')
  return {
    activas: activas.length,
    pendientes: subs.filter(s => s.status === 'pending').length,
    canceladas: subs.filter(s => s.status === 'cancelled' || s.status === 'expired').length,
    mrr: activas.reduce((a, s) => a + cuotaMensual(s.plan), 0),
    pagando: activas.filter(s => cuotaMensual(s.plan) > 0).length,
    pruebas: todas.length - subs.length,
  }
}

/** Resumen por producto (slug; null = sin producto). */
export function resumenPorProducto(subs: SuscripcionAdmin[]) {
  const grupos = new Map<string | null, SuscripcionAdmin[]>()
  for (const s of subs) {
    const k = productoDe(s)
    grupos.set(k, [...(grupos.get(k) ?? []), s])
  }
  return Array.from(grupos, ([slug, lista]) => ({ slug, ...resumen(lista) }))
}
