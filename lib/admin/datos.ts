import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'
import type { SuscripcionAdmin } from './metricas'

// Carga de datos de /admin (solo servidor). Selección explícita: nunca se serializa el usuario
// completo (password) ni las configuraciones de pago (secretos).

const SELECT_SUSCRIPCION = {
  id: true, status: true, startDate: true, endDate: true, createdAt: true,
  servixSlug: true, servixRestaurantId: true,
  user: { select: { name: true, email: true } },
  plan: { select: { id: true, name: true, price: true, interval: true, Product: { select: { slug: true, name: true } } } },
  provisioning: { select: { slug: true, externalId: true } },
} satisfies Prisma.SubscriptionSelect

export async function suscripcionesAdmin(where: Prisma.SubscriptionWhereInput = {}): Promise<SuscripcionAdmin[]> {
  const subs = await prisma.subscription.findMany({ where, select: SELECT_SUSCRIPCION, orderBy: { createdAt: 'desc' } })
  return JSON.parse(JSON.stringify(subs))
}

export function productosMenu() {
  return prisma.product.findMany({ select: { id: true, slug: true, name: true, active: true }, orderBy: { createdAt: 'asc' } })
}
