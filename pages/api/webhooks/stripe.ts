import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { prisma } from '../../../lib/prisma'
import { fulfillInvoice } from '../../../lib/fulfillment'

// Stripe necesita el body sin parsear para verificar la firma.
export const config = { api: { bodyParser: false } }

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripeConfig = await prisma.stripeConfig.findFirst()
  if (!stripeConfig || !stripeConfig.enabled || !stripeConfig.secretKey || !stripeConfig.webhookSecret) {
    console.error('Stripe webhook recibido pero Stripe no está completamente configurado')
    return res.status(400).send('Stripe no configurado')
  }

  const sig = req.headers['stripe-signature']
  const rawBody = await readRawBody(req)
  const stripe = new Stripe(stripeConfig.secretKey)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig as string, stripeConfig.webhookSecret)
  } catch (err: any) {
    console.error('Stripe webhook: firma inválida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const invoiceId = session.metadata?.invoiceId
      if (invoiceId) {
        await fulfillInvoice(invoiceId)
      } else {
        console.error('Stripe webhook: sesión sin invoiceId en metadata:', session.id)
      }
    }
    return res.status(200).json({ received: true })
  } catch (e: any) {
    console.error('Stripe webhook error de aprovisionamiento:', e.message)
    // 200 igual que Redsys, para que Stripe no reintente infinitamente
    return res.status(200).json({ received: true })
  }
}
