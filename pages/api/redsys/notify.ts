import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from 'redsys-easy'
import { Pool } from 'pg'
import { sendWelcomeEmail } from '../../../lib/email'

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '-' + Date.now().toString(36)
}

function getServixPool() {
  return new Pool({ connectionString: process.env.SERVIX_DB_URL })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature } = req.body
    if (!Ds_MerchantParameters || !Ds_Signature) return res.status(400).send('KO')

    const config = await prisma.redsysConfig.findFirst()
    if (!config) return res.status(500).send('KO')

    const isProduction = config.environment === 'production'
    const { processRedirectNotification } = createRedsysAPI({
      secretKey: config.secretKey,
      urls: isProduction ? PRODUCTION_URLS : SANDBOX_URLS,
    })

    const result = processRedirectNotification({ Ds_SignatureVersion, Ds_MerchantParameters, Ds_Signature })
    const responseCode = parseInt(String(result.Ds_Response ?? '9999'))
    const isPaid = responseCode >= 0 && responseCode <= 99
    if (!isPaid) return res.status(200).send('OK')

    const redsysOrderId = result.Ds_Order as string
    const invoice = await prisma.invoice.findUnique({
      where: { redsysOrderId },
      include: { subscription: { include: { plan: true, user: true } } }
    })
    if (!invoice) return res.status(200).send('OK')

    const { subscription } = invoice
    const { user, plan } = subscription

    const startDate = new Date()
    const endDate   = new Date()
    if (plan.interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    // Crear/actualizar en Servix via SQL directo (evita conflicto de schemas)
    const pool = getServixPool()
    let servixRestaurantId: string | null = null
    let slug = generateSlug(user.name)

    try {
      // Buscar usuario en Servix
      const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [user.email])
      let servixUserId: string

      if (userRes.rows.length === 0) {
        // Crear usuario con misma contraseña
        const { v4: uuidv4 } = await import('uuid').catch(() => ({ v4: () => `usr-${Date.now()}` }))
        const newId = `usr-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
        await pool.query(
          'INSERT INTO "User" (id, name, email, password) VALUES ($1, $2, $3, $4)',
          [newId, user.name, user.email, user.password]
        )
        servixUserId = newId
      } else {
        servixUserId = userRes.rows[0].id
        // Actualizar contraseña para sincronizar
        await pool.query('UPDATE "User" SET password = $1 WHERE id = $2', [user.password, servixUserId])
      }

      // Buscar restaurante existente
      const restRes = await pool.query('SELECT id, slug FROM "Restaurant" WHERE "ownerId" = $1 LIMIT 1', [servixUserId])

      if (restRes.rows.length > 0) {
        // Reactivar restaurante existente
        await pool.query('UPDATE "Restaurant" SET active = true WHERE id = $1', [restRes.rows[0].id])
        servixRestaurantId = restRes.rows[0].id
        slug = restRes.rows[0].slug
      } else {
        // Crear nuevo restaurante
        const restId = `rest-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
        await pool.query(
          'INSERT INTO "Restaurant" (id, name, slug, "ownerId", active, "lastTicketNumber", "lastInvoiceNumber", "cardEnabled", "cashEnabled", "cashDrawerPort") VALUES ($1,$2,$3,$4,true,0,0,true,true,9100)',
          [restId, user.name, slug, servixUserId]
        )
        servixRestaurantId = restId

        // Crear empleado admin con PIN 1234
        const empId = `emp-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
        await pool.query(
          'INSERT INTO "Employee" (id, name, email, role, pin, active, "restaurantId") VALUES ($1,$2,$3,$4,$5,true,$6)',
          [empId, user.name, user.email, 'admin', '1234', restId]
        )
      }
    } catch (e) {
      console.error('Error Servix SQL:', e)
    } finally {
      await pool.end()
    }

    // Expirar suscripciones anteriores
    await prisma.subscription.updateMany({
      where: { userId: user.id, id: { not: subscription.id }, status: { in: ['active','cancelled'] } },
      data: { status: 'expired' }
    })

    // Activar suscripción actual
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'active', startDate, endDate, servixSlug: slug, servixRestaurantId }
    })

    // Marcar factura pagada
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'paid', paidAt: new Date() }
    })

    // Email bienvenida
    await sendWelcomeEmail(user.email, user.name, plan.name, slug).catch(console.error)

    return res.status(200).send('OK')
  } catch (e) {
    console.error('Notify error:', e)
    return res.status(200).send('OK')
  }
}

export const config = { api: { bodyParser: { type: 'application/x-www-form-urlencoded' } } }
