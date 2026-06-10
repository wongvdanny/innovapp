import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS, randomTransactionId } from 'redsys-easy'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { name, restaurantName, email, password, phone, planId, billing } = req.body
    if (!name || !restaurantName || !email || !password || !planId) return res.status(400).json({ error: 'Faltan datos obligatorios' })

    const plan = await prisma.plan.findUnique({ where: { id: planId } })
    if (!plan) return res.status(400).json({ error: 'Plan no encontrado' })

    // Crear o recuperar usuario
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      const hash = await bcrypt.hash(password, 10)
      user = await prisma.user.create({
        data: { name, email, password: hash, phone: phone || null }
      })
    }

    // Cancelar suscripciones pendientes anteriores
    await prisma.subscription.updateMany({
      where: { userId: user.id, status: 'pending' },
      data: { status: 'cancelled' }
    })

    // Crear suscripción con datos de facturación
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId,
        status: 'pending',
        billingData: JSON.stringify({ ...(billing || {}), restaurantName }) as any,
      }
    })

    // Crear factura pendiente
    const invoice = await prisma.invoice.create({
      data: { userId: user.id, subscriptionId: sub.id, amount: plan.price, status: 'pending' }
    })

    // Config Redsys
    const config = await prisma.redsysConfig.findFirst()
    if (!config) return res.status(400).json({ error: 'Redsys no configurado. Ve al panel admin.' })

    const { createRedirectForm } = createRedsysAPI({
      secretKey: config.secretKey,
      urls: config.environment === 'production' ? PRODUCTION_URLS : SANDBOX_URLS,
    })

    const redsysOrderId = randomTransactionId()
    await prisma.invoice.update({ where: { id: invoice.id }, data: { redsysOrderId } })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://innovapp.es'
    const form = createRedirectForm({
      DS_MERCHANT_MERCHANTCODE:       config.merchantCode,
      DS_MERCHANT_TERMINAL:           String(config.terminal).padStart(3,'0'),
      DS_MERCHANT_TRANSACTIONTYPE:    '0',
      DS_MERCHANT_AMOUNT:             String(Math.round(plan.price * 100)),
      DS_MERCHANT_CURRENCY:           (config.currency || '978') as any,
      DS_MERCHANT_ORDER:              redsysOrderId,
      DS_MERCHANT_MERCHANTURL:        `${baseUrl}/api/redsys/notify`,
      DS_MERCHANT_URLOK:              `${baseUrl}/bienvenida?sub=${sub.id}`,
      DS_MERCHANT_URLKO:              `${baseUrl}/checkout?plan=${planId}&error=pago`,
      DS_MERCHANT_MERCHANTNAME:       'innovapp',
      DS_MERCHANT_PRODUCTDESCRIPTION: `Servix ${plan.name}`,
    })

    return res.json({ url: form.url, body: form.body })
  } catch (e: any) {
    console.error('Checkout error:', e)
    return res.status(500).json({ error: e.message || 'Error interno' })
  }
}
