import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { formatearIban, ibanValido } from '../../../lib/transferencia'

// Datos para pagar por transferencia un alta concreta (el id de la suscripción hace de enlace privado,
// igual que en /api/subscriptions/summary). Los datos bancarios no son secretos.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const sub = await prisma.subscription.findUnique({
    where: { id: String(req.query.id) },
    include: { plan: { include: { Product: true } as any }, invoices: { where: { provider: 'transferencia' }, orderBy: { createdAt: 'desc' }, take: 1 } } as any,
  })
  const inv = (sub as any)?.invoices?.[0] as { amount: number; providerRef: string | null; status: string } | undefined
  if (!sub || sub.deletedAt || !inv) return res.status(404).json({ error: 'Pedido no encontrado' })

  const c = await prisma.transferConfig.findFirst()
  const plan = (sub as any).plan as { name: string; Product?: { name: string } | null }
  return res.json({
    status: sub.status,
    pagado: inv.status === 'paid',
    producto: `${plan.Product?.name || 'innovapp'} — ${plan.name}`,
    importe: inv.amount,
    referencia: inv.providerRef,
    // Aunque luego se desactive el método, los pedidos ya creados siguen viendo la cuenta
    datos: c && ibanValido(c.iban)
      ? { titular: c.titular, iban: formatearIban(c.iban), bic: c.bic, banco: c.banco, instrucciones: c.instrucciones, diasPlazo: c.diasPlazo }
      : null,
  })
}
