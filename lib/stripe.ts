import Stripe from 'stripe'
import { prisma } from './prisma'

export async function getStripeConfig() {
  return prisma.stripeConfig.findFirst()
}

export async function getStripeClient() {
  const config = await getStripeConfig()
  if (!config || !config.enabled || !config.secretKey) return null
  return new Stripe(config.secretKey)
}
