import { prisma } from './prisma'
import { createServixTenant } from './provisioning/servix'
import { createGymstackTenant } from './provisioning/gymstack'
import { sendWelcomeEmail } from './email'

// Aprovisiona y activa una suscripción a partir de una factura ya cobrada.
// Compartido entre el webhook de Redsys y el de Stripe para no duplicar
// la lógica de creación de tenants / activación de suscripción / email.
export async function fulfillInvoice(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { subscription: { include: { plan: { include: { Product: true } as any }, user: true } } }
  })
  if (!invoice) return { ok: false, reason: 'invoice_not_found' }

  // Idempotencia: tanto Redsys como Stripe pueden reenviar notificaciones.
  if (invoice.status === 'paid') {
    console.log('Fulfillment: invoice ya pagada, ignorando:', invoice.id)
    return { ok: true, reason: 'already_paid' }
  }

  const { subscription } = invoice
  const { user, plan } = subscription
  const product = (plan as any).Product as { slug: string; name: string } | null
  const billing = (subscription as any).billingData ? JSON.parse((subscription as any).billingData) : null

  const startDate = new Date()
  const endDate = new Date()
  if ((plan as any).interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
  else endDate.setFullYear(endDate.getFullYear() + 1)

  let restaurantId: string | null = null
  let gymId: string | null = null
  let slug = ''

  if (!product || product.slug === 'servix') {
    try {
      const restaurantName = billing?.entityName || billing?.restaurantName || billing?.company || `Restaurante de ${user.name}`
      const created = await createServixTenant({
        name: user.name,
        restaurantName,
        email: user.email,
        passwordHash: user.password,
      })
      restaurantId = created.restaurantId
      slug = created.slug
      console.log('Restaurante creado:', restaurantId, slug)
    } catch (e: any) {
      console.error('Error Servix:', e.message)
    }
  } else if (product.slug === 'gymstack') {
    try {
      const gymName = billing?.entityName || billing?.gymName || billing?.company || `Gimnasio de ${user.name}`
      const created = await createGymstackTenant({
        name: user.name,
        gymName,
        email: user.email,
        passwordHash: user.password,
        innovappSubscriptionId: subscription.id,
      })
      gymId = created.gymId
      slug = created.slug
      console.log('Gimnasio creado:', gymId, slug)
    } catch (e: any) {
      console.error('Error GymStack:', e.message)
    }
  }

  const externalId = restaurantId || gymId

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: 'active', startDate, endDate,
      ...(restaurantId ? {
        servixRestaurantId: restaurantId,
        servixSlug: slug,
      } as any : {}),
      ...(externalId ? {
        provisioning: { create: { externalId, slug, status: 'active' } },
      } as any : {}),
    }
  })
  await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'paid', paidAt: new Date() } })

  try {
    await sendWelcomeEmail(user.email, user.name, (plan as any).name, (plan as any).price, (plan as any).interval, slug, billing, product?.slug || 'servix')
  } catch (e: any) {
    console.error('Error email:', e.message)
  }

  return { ok: true, reason: 'fulfilled' }
}
