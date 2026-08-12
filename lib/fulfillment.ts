import { prisma } from './prisma'
import { createServixTenant } from './provisioning/servix'
import { createGymstackTenant } from './provisioning/gymstack'
import { createNewsTenant } from './provisioning/news'
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
  let newsUserId: string | null = null
  let slug = ''
  let emailName = user.name

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
  } else if (product.slug === 'news') {
    try {
      emailName = billing?.name || user.name
      const created = await createNewsTenant({
        name: emailName,
        email: user.email,
        passwordHash: user.password,
        country: billing?.country || 'ES',
        province: billing?.province,
        city: billing?.city,
        topics: billing?.topics || [],
        plan: 'SUBSCRIBER',
      })
      newsUserId = created.userId
      slug = 'news'
      console.log('Usuario News aprovisionado (suscripción):', newsUserId)
      fetch('https://news.innovapp.es/api/internal/generate-for-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': process.env.NEWS_INTERNAL_API_SECRET || '' },
        body: JSON.stringify({ userId: newsUserId }),
      }).catch((e) => console.error('Error disparando generación de digest News:', e.message))
    } catch (e: any) {
      console.error('Error News:', e.message)
    }
  }

  const externalId = restaurantId || gymId || newsUserId

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
    await sendWelcomeEmail(user.email, emailName, (plan as any).name, (plan as any).price, (plan as any).interval, slug, billing, product?.slug || 'servix')
  } catch (e: any) {
    console.error('Error email:', e.message)
  }

  return { ok: true, reason: 'fulfilled' }
}
