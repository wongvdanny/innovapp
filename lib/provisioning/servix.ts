import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.SERVIX_DB_URL })

function generateSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + Date.now().toString(36)
}

export interface ServixTenantInput {
  name: string
  email: string
  passwordHash: string
  /** Nombre real del restaurante. Si se omite, se usa 'Restaurante de {name}' como fallback. */
  restaurantName?: string
}

export interface ServixTenantResult {
  restaurantId: string
  slug: string
}

/**
 * Crea (o reutiliza) el usuario de Servix, el restaurante y el empleado admin.
 * Sustituye al antiguo uso directo de PrismaClient importado desde
 * /var/www/servix/node_modules — ahora aislado vía pg.Pool, sin acoplar
 * el código de Innovapp al cliente Prisma generado de otro proyecto.
 */
export async function createServixTenant(input: ServixTenantInput): Promise<ServixTenantResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Buscar o crear el usuario en la BD de Servix
    const userRes = await client.query('SELECT id FROM "User" WHERE email = $1', [input.email])
    let userId: string
    if (userRes.rows.length > 0) {
      userId = userRes.rows[0].id
    } else {
      userId = 'usr-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
      await client.query(
        'INSERT INTO "User" (id, name, email, password) VALUES ($1, $2, $3, $4)',
        [userId, input.name, input.email, input.passwordHash]
      )
    }

    // 2. Crear el restaurante (el resto de columnas tienen DEFAULT en la propia tabla)
    const restaurantId = 'rest-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)
    const finalRestaurantName = input.restaurantName?.trim() || ('Restaurante de ' + input.name)
    const slug = generateSlug(finalRestaurantName)
    await client.query(
      `INSERT INTO "Restaurant" (id, name, slug, "ownerId") VALUES ($1, $2, $3, $4)`,
      [restaurantId, finalRestaurantName, slug, userId]
    )

    // 3. Crear el empleado admin con PIN aleatorio
    const employeeId = 'emp-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
    const pin = String(Math.floor(1000 + Math.random() * 9000))
    await client.query(
      `INSERT INTO "Employee" (id, name, email, role, pin, "restaurantId") VALUES ($1, $2, $3, 'admin', $4, $5)`,
      [employeeId, input.name, input.email, pin, restaurantId]
    )

    await client.query('COMMIT')
    return { restaurantId, slug }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

/**
 * Borra en cascada todos los datos de un restaurante en Servix.
 * Orden derivado del schema.prisma real de Servix (/var/www/servix/apps/web/prisma/schema.prisma)
 * para respetar todas las FK con onDelete: Restrict (la mayoría de tablas del proyecto),
 * borrando siempre las tablas "hija" antes que la tabla de la que dependen.
 */
export async function deleteServixTenant(restaurantId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Payment/OrderItem dependen de Order (con onDelete: Cascade en BD, pero
    // se borran explícitamente para no depender del timing del cascade)
    await client.query(`
      DELETE FROM "Payment" WHERE "orderId" IN (
        SELECT o.id FROM "Order" o
        JOIN "Table" t ON t.id = o."tableId"
        WHERE t."restaurantId" = $1
      )
    `, [restaurantId])

    await client.query(`
      DELETE FROM "OrderItem" WHERE "orderId" IN (
        SELECT o.id FROM "Order" o
        JOIN "Table" t ON t.id = o."tableId"
        WHERE t."restaurantId" = $1
      )
    `, [restaurantId])

    // Invoice referencia Order (Restrict) -> debe borrarse ANTES que Order
    await client.query('DELETE FROM "Invoice" WHERE "restaurantId" = $1', [restaurantId])

    await client.query(`
      DELETE FROM "Order" WHERE "tableId" IN (
        SELECT id FROM "Table" WHERE "restaurantId" = $1
      )
    `, [restaurantId])

    // Reservation referencia Table (Restrict) -> debe borrarse ANTES que Table
    await client.query('DELETE FROM "Reservation" WHERE "restaurantId" = $1', [restaurantId])

    await client.query(`
      DELETE FROM "Table" WHERE "zoneId" IN (
        SELECT id FROM "Zone" WHERE "restaurantId" = $1
      ) OR "restaurantId" = $1
    `, [restaurantId])

    await client.query('DELETE FROM "Zone" WHERE "restaurantId" = $1', [restaurantId])

    // MenuItem/MenuSchedule dependen de Menu -> antes que Menu
    await client.query(`
      DELETE FROM "MenuItem" WHERE "menuId" IN (
        SELECT id FROM "Menu" WHERE "restaurantId" = $1
      )
    `, [restaurantId])
    await client.query(`
      DELETE FROM "MenuSchedule" WHERE "menuId" IN (
        SELECT id FROM "Menu" WHERE "restaurantId" = $1
      )
    `, [restaurantId])
    await client.query('DELETE FROM "Menu" WHERE "restaurantId" = $1', [restaurantId])

    // Product referencia Category (Restrict) -> antes que Category
    await client.query('DELETE FROM "Product" WHERE "restaurantId" = $1', [restaurantId])
    await client.query('DELETE FROM "Category" WHERE "restaurantId" = $1', [restaurantId])

    // CashSession referencia Employee (NoAction) -> antes que Employee
    await client.query('DELETE FROM "CashSession" WHERE "restaurantId" = $1', [restaurantId])

    // Employee: debe ir DESPUÉS de Order (que lo referencia) y de CashSession
    await client.query('DELETE FROM "Employee" WHERE "restaurantId" = $1', [restaurantId])

    await client.query('DELETE FROM "Schedule" WHERE "restaurantId" = $1', [restaurantId])
    await client.query('DELETE FROM "IvaType" WHERE "restaurantId" = $1', [restaurantId])

    await client.query('DELETE FROM "Restaurant" WHERE id = $1', [restaurantId])

    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
