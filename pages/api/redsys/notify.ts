import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'
import { createRedsysAPI, SANDBOX_URLS, PRODUCTION_URLS } from 'redsys-easy'
import { Pool } from 'pg'
import { sendWelcomeEmail } from '../../../lib/email'

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) + '-' + Date.now().toString(36)
}

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
      include: { subscription: { include: { plan: true, user: true } } }
    })
    if (!invoice) return res.status(200).send('OK')

    const { subscription } = invoice
    const { user, plan } = subscription
    const billing = (subscription as any).billingData ? JSON.parse((subscription as any).billingData) : null

    const startDate = new Date()
    const endDate   = new Date()
    if ((plan as any).interval === 'monthly') endDate.setMonth(endDate.getMonth() + 1)
    else endDate.setFullYear(endDate.getFullYear() + 1)

    // Crear restaurante en Servix
    const pool = new Pool({ connectionString: process.env.SERVIX_DB_URL })
    let servixRestaurantId: string | null = null
    let slug = ''

    try {
      // Crear/recuperar usuario
      const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [user.email])
      let servixUserId: string
      if (userRes.rows.length === 0) {
        const newId = 'usr-' + Date.now()
        await pool.query(
          'INSERT INTO "User" (id, name, email, password) VALUES ($1,$2,$3,$4)',
          [newId, user.name, user.email, user.password]
        )
        servixUserId = newId
      } else {
        servixUserId = userRes.rows[0].id
      }

      // Nombre del restaurante — usar empresa del billing o nombre del usuario
      const restaurantName = billing?.restaurantName || billing?.company || `Restaurante de ${user.name}`

      slug = generateSlug(restaurantName)

      // Crear restaurante
      const restId = 'rest-' + Date.now() + '-' + Math.random().toString(36).slice(2,6)
      await pool.query(
        'INSERT INTO "Restaurant" (id, name, slug, "ownerId") VALUES ($1,$2,$3,$4)',
        [restId, restaurantName, slug, servixUserId]
      )
      servixRestaurantId = restId

      // Crear empleado admin con PIN 1234
      const empId = 'emp-' + Date.now()
      await pool.query(
        'INSERT INTO "Employee" (id, name, email, role, pin, "restaurantId") VALUES ($1,$2,$3,$4,$5,$6)',
        [empId, user.name, user.email, 'admin', '1234', restId]
      )

      console.log('Restaurante creado:', restId, slug)
    } catch (e: any) {
      console.error('Error Servix:', e.message)
    } finally {
      await pool.end()
    }

    // Activar suscripción
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active', startDate, endDate,
        ...(servixRestaurantId ? { servixRestaurantId, servixSlug: slug } as any : {}),
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
