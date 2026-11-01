import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { prisma } from '../../../lib/prisma'
import { Pool } from 'pg'

const servixPool = new Pool({ connectionString: process.env.SERVIX_DB_URL })

// Nombre real de la columna de fecha de "Order" (updatedAt si existe; si no, createdAt). Se detecta una vez.
let fechaOrder: Promise<string> | null = null
function columnaFechaOrder() {
  fechaOrder ??= servixPool.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Order' AND column_name IN ('updatedAt', 'createdAt')
  `).then(r => {
    const cols = r.rows.map((x: any) => x.column_name)
    return cols.includes('updatedAt') ? '"updatedAt"' : cols.includes('createdAt') ? '"createdAt"' : 'CURRENT_TIMESTAMP'
  }).catch(e => { fechaOrder = null; throw e })
  return fechaOrder
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  const { from, to } = req.query
  const dateFrom = from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dateTo   = to   ? new Date(String(to))   : new Date()

  const subs = await prisma.subscription.findMany({
    where: { status: 'active', servixRestaurantId: { not: null } } as any,
    include: { user: true, plan: true },
  })

  if (subs.length === 0) return res.json([])

  const dateCol = await columnaFechaOrder()

  const results = await Promise.all(subs.map(async (sub: any) => {
    const restaurantId = sub.servixRestaurantId
    try {
      const restRes = await servixPool.query(
        `SELECT id, name, slug FROM "Restaurant" WHERE id = $1`,
        [restaurantId]
      )
      const restaurant = restRes.rows[0]
      if (!restaurant) return null

      const salesRes = await servixPool.query(`
        SELECT
          COUNT(DISTINCT o.id)::int AS total_orders,
          COALESCE(SUM(oi.price * oi.quantity), 0)::float AS total_sales
        FROM "Order" o
        JOIN "OrderItem" oi ON oi."orderId" = o.id
        JOIN "Table" t ON t.id = o."tableId"
        JOIN "Zone" z ON z.id = t."zoneId"
        WHERE z."restaurantId" = $1
          AND o.status = 'closed'
          AND o.${dateCol} >= $2
          AND o.${dateCol} <= $3
      `, [restaurantId, dateFrom, dateTo])

      const empRes = await servixPool.query(
        `SELECT COUNT(*)::int AS cnt FROM "Employee" WHERE "restaurantId" = $1`,
        [restaurantId]
      )
      const tableRes = await servixPool.query(`
        SELECT COUNT(t.id)::int AS cnt
        FROM "Table" t JOIN "Zone" z ON z.id = t."zoneId"
        WHERE z."restaurantId" = $1
      `, [restaurantId])

      return {
        id: restaurantId,
        name: restaurant.name,
        slug: restaurant.slug,
        owner: sub.user.name,
        email: sub.user.email,
        plan: sub.plan.name,
        planPrice: sub.plan.price,
        endDate: sub.endDate,
        totalSales: Math.round(salesRes.rows[0].total_sales * 100) / 100,
        totalOrders: salesRes.rows[0].total_orders,
        employees: empRes.rows[0].cnt,
        tables: tableRes.rows[0].cnt,
      }
    } catch (e: any) {
      console.error('Error restaurante', restaurantId, e.message)
      return null
    }
  }))

  return res.json(results.filter(Boolean))
}
