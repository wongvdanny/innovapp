import { Pool } from 'pg'
import { randomUUID } from 'crypto'

const pool = new Pool({ connectionString: process.env.GYMSTACK_DB_URL })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

interface CreateGymstackTenantInput {
  name: string
  gymName: string
  email: string
  passwordHash: string
  innovappSubscriptionId: string
}

interface CreateGymstackTenantResult {
  gymId: string
  slug: string
  userId: string
}

export async function createGymstackTenant(input: CreateGymstackTenantInput): Promise<CreateGymstackTenantResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const baseSlug = slugify(input.gymName) || 'gimnasio'
    let slug = baseSlug
    let attempt = 0
    while (true) {
      const { rows } = await client.query('SELECT id FROM gyms WHERE slug = $1', [slug])
      if (rows.length === 0) break
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const [firstName, ...rest] = input.name.trim().split(' ')
    const lastName = rest.join(' ') || null

    const gymId = randomUUID()
    await client.query(`
      INSERT INTO gyms (id, name, slug, "innovappSubscriptionId", "adminEmail", "adminFirstName", "adminLastName", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
    `, [gymId, input.gymName, slug, input.innovappSubscriptionId, input.email, firstName, lastName])

    const userId = randomUUID()
    await client.query(`
      INSERT INTO users (id, name, email, password, role, "gymId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'ADMIN', $5, now(), now())
    `, [userId, input.name, input.email, input.passwordHash, gymId])

    await client.query('COMMIT')
    return { gymId, slug, userId }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

/**
 * Desactiva un gimnasio sin borrar datos (para cancelaciones desde el propio
 * cliente). Suspende también la contraseña del admin, igual que se hace con
 * Servix, para bloquear el acceso sin destruir nada.
 */
export async function deactivateGymstackTenant(gymId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('UPDATE gyms SET active = false, "updatedAt" = now() WHERE id = $1', [gymId])
    await client.query(
      `UPDATE users SET password = 'SUSPENDED_' || extract(epoch from now()), "updatedAt" = now() WHERE "gymId" = $1 AND role = 'ADMIN'`,
      [gymId]
    )
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

/**
 * Borra en cascada todos los datos de un gimnasio en GymStack.
 * Orden calculado a partir de las FKs del schema (las que no tienen
 * onDelete: Cascade explícito hay que borrarlas a mano antes del padre).
 */
export async function deleteGymstackTenant(gymId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(`DELETE FROM sale_items WHERE "saleId" IN (SELECT id FROM sales WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM bookings WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM attendances WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM access_logs WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1) OR "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM payments WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1) OR "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM routine_exercises WHERE "routineId" IN (SELECT id FROM workout_routines WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1))`, [gymId])
    await client.query(`DELETE FROM workout_routines WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM body_measurements WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM communication_logs WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM communication_settings WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM sales WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM products WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM class_slots WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM gym_classes WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM cash_register_closings WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM cash_register_openings WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM membership_plans WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM members WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM users WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM gyms WHERE id = $1`, [gymId])
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
