import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS, randomTransactionId } from 'redsys-easy'
import Stripe from 'stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, entityName, email, password, phone, planId, billing, provider: requestedProvider } = req.body
    if (!name || !entityName || !email || !password || !planId) return res.status(400).json({ error: 'Faltan datos obligatorios' })

    const plan = await prisma.plan.findUnique({ where: { id: planId }, include: { Product: true } as any })
    if (!plan) return res.status(400).json({ error: 'Plan no encontrado' })
    const product = (plan as any).Product as { slug: string; name: string } | null

    // Determinar proveedor de pago activo
    const [redsysConfig, stripeConfig] = await Promise.all([
      prisma.redsysConfig.findFirst(),
      prisma.stripeConfig.findFirst(),
    ])
    const redsysEnabled = !!redsysConfig?.enabled
    const stripeEnabled = !!(stripeConfig?.enabled && stripeConfig?.publishableKey && stripeConfig?.secretKey)

    let provider = requestedProvider as string | undefined
    if (!provider) {
      if (redsysEnabled && !stripeEnabled) provider = 'redsys'
      else if (stripeEnabled && !redsysEnabled) provider = 'stripe'
      else if (redsysEnabled && stripeEnabled) return res.status(400).json({ error: 'Debes especificar el método de pago.' })
      else return res.status(400).json({ error: 'No hay ningún método de pago activo. Contacta con soporte.' })
    }
    if (provider === 'redsys' && !redsysEnabled) return res.status(400).json({ error: 'Redsys no está disponible actualmente.' })
    if (provider === 'stripe' && !stripeEnabled) return res.status(400).json({ error: 'Stripe no está disponible actualmente.' })

    // Crear o recuperar usuario
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const hash = await bcrypt.hash(password, 10)
      user = await prisma.user.create({
        data: { name, email, password: hash, phone: phone || null }
      })
    }

    // Bloquear duplicados: mismo email + mismo producto con suscripción activa o pendiente
    const existingSub = await prisma.subscription.findFirst({
      where: {
        userId: user.id,
        productId: plan.productId,
        status: { in: ['active', 'pending'] },
      }
    })
    if (existingSub) {
      const msg = existingSub.status === 'active'
        ? `Ya tienes una suscripción activa a ${product?.name || 'este producto'} con este email. Si necesitas ayuda, contacta con soporte.`
        : `Ya tienes un pago pendiente de completar para ${product?.name || 'este producto'} con este email. Revisa tu correo o contacta con soporte si el pago falló.`
      return res.status(400).json({ error: msg })
    }

    // Cancelar suscripciones pendientes anteriores de OTROS productos
    // (evita que queden huérfanas si el usuario cambia de producto a medio proceso)
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: 'pending', productId: { not: plan.productId } },
      data: { status: 'cancelled' }
    })

    // Crear suscripción con datos de facturación
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        productId: plan.productId,
        status: 'pending',
        billingData: JSON.stringify({ ...(billing || {}), entityName }) as any,
      }
    })

    // Crear factura pendiente
    const invoice = await prisma.invoice.create({
      data: { userId: user.id, subscriptionId: sub.id, amount: plan.price, status: 'pending', provider }
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://innovapp.es'
    const productSlug = product?.slug || 'servix'
    const productLabel = product?.name || 'Servix'

    if (provider === 'stripe') {
      const stripe = new Stripe(stripeConfig!.secretKey)
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: { name: `${productLabel} — ${plan.name}` },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        }],
        success_url: `${baseUrl}/bienvenida?sub=${sub.id}`,
        cancel_url: `${baseUrl}/checkout?product=${productSlug}&plan=${planId}&error=pago`,
        metadata: { invoiceId: invoice.id },
      })

      await prisma.invoice.update({ where: { id: invoice.id }, data: { providerRef: session.id } })

      return res.json({ provider: 'stripe', url: session.url })
    }

    // Redsys (comportamiento original, sin cambios)
    const config = redsysConfig!
    const { createRedirectForm } = createRedsysAPI({
      secretKey: config.secretKey,
      urls: config.environment === 'production' ? PRODUCTION_URLS : SANDBOX_URLS,
    })

    const redsysOrderId = randomTransactionId()
    await prisma.invoice.update({ where: { id: invoice.id }, data: { redsysOrderId, providerRef: redsysOrderId } })

    const form = createRedirectForm({
      DS_MERCHANT_MERCHANTCODE:       config.merchantCode,
      DS_MERCHANT_TERMINAL:           String(config.terminal).padStart(3,'0'),
      DS_MERCHANT_TRANSACTIONTYPE:    '0',
      DS_MERCHANT_AMOUNT:             String(Math.round(plan.price * 100)),
      DS_MERCHANT_CURRENCY:           (config.currency || '978') as any,
      DS_MERCHANT_ORDER:              redsysOrderId,
      DS_MERCHANT_MERCHANTURL:        `${baseUrl}/api/redsys/notify`,
      DS_MERCHANT_URLOK:              `${baseUrl}/bienvenida?sub=${sub.id}`,
      DS_MERCHANT_URLKO:              `${baseUrl}/checkout?product=${productSlug}&plan=${planId}&error=pago`,
      DS_MERCHANT_MERCHANTNAME:       'innovapp',
      DS_MERCHANT_PRODUCTDESCRIPTION: `${productLabel} ${plan.name}`,
    })

    return res.json({ provider: 'redsys', url: form.url, body: form.body })
  } catch (e: any) {
    console.error('Checkout error:', e)
    return res.status(500).json({ error: e.message || 'Error interno' })
  }
}
