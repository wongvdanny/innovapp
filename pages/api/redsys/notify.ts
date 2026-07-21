import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from 'redsys-easy'
import { createServixTenant } from '../../../lib/provisioning/servix'
import { createGymstackTenant } from '../../../lib/provisioning/gymstack'
import { sendWelcomeEmail } from '../../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = req.body
    if (!Ds_MerchantParameters || !Ds_Signature) return res.status(400).send('KO')

    const config = await prisma.redsysConfig.findFirst()
    if (!config) return res.status(500).send('KO')

    const { processRedirectNotification } = createRedsysAPI({
      secretKey: config.secretKey,
      urls: config.environment === 'production' ? PRODUCTION_URLS : SANDBOX_URLS,
    })

    const result = processRedirectNotification({ Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature })
    const responseCode = parseInt(String(result.Ds_Response ?? '9999'))
    if (!(responseCode >= 0 && responseCode <= 99)) return res.status(200).send('OK')

    const redsysOrderId = result.Ds_Order as string
    const invoice = await prisma.invoice.findUnique({
      where: { redsysOrderId },
      include: { subscription: { include: { plan: { include: { Product: true } as any }, user: true } } }
    })
    if (!invoice) return res.status(200).send('OK')

    const { subscription } = invoice
    const { user, plan } = subscription
    const product = (plan as any).Product as { slug: string } | null
    const billing = (subscription as any).billingData ? JSON.parse((subscription as any).billingData) : null

    const startDate = new Date()
    const endDate   = new Date()
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

    // Activar suscripción
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
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'paid' } })

    // Enviar email completo
    try {
      await sendWelcomeEmail(user.email, user.name, (plan as any).name, (plan as any).price, (plan as any).interval, slug, billing)
    } catch (e: any) {
      console.error('Error email:', e.message)
    }

    return res.status(200).send('OK')
  } catch (e: any) {
    console.error('Notify error:', e.message)
    return res.status(200).send('OK')
  }
}
