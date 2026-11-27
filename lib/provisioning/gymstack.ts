import { Pool } from 'pg'
import { randomInt, randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'

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
 *
 * Facturas: la ley obliga a conservarlas (4 años, art. 66 LGT) y GymStack impide borrarlas
 * con un trigger. Si el gimnasio tiene facturas se lanza GymstackTenantHasInvoicesError y no
 * se borra nada; solo con { purgeInvoices: true } (pasado el plazo de conservación) se
 * desactiva el trigger dentro de esta transacción (SET LOCAL gymstack.purge_invoices).
 */
export class GymstackTenantHasInvoicesError extends Error {
  constructor(public count: number) {
    super(`El gimnasio tiene ${count} factura(s) emitida(s): hay que conservarlas. Desactívalo en lugar de borrarlo.`)
  }
}

export async function deleteGymstackTenant(gymId: string, opts: { purgeInvoices?: boolean } = {}): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Bloquea el gimnasio: nadie emite una factura entre la comprobación y el borrado
    await client.query('SELECT id FROM gyms WHERE id = $1 FOR UPDATE', [gymId])

    // to_regclass: instalaciones de GymStack anteriores a la migración de facturación
    const { rows: [inv] } = await client.query(`SELECT to_regclass('invoices') IS NOT NULL AS exists`)
    if (inv.exists) {
      const { rows: [{ n }] } = await client.query('SELECT COUNT(*)::int AS n FROM invoices WHERE "gymId" = $1', [gymId])
      if (n > 0 && !opts.purgeInvoices) throw new GymstackTenantHasInvoicesError(n)
      await client.query(`SET LOCAL gymstack.purge_invoices = 'on'`)
      await client.query(`DELETE FROM invoice_records WHERE "gymId" = $1`, [gymId])
      await client.query(`DELETE FROM invoice_lines WHERE "invoiceId" IN (SELECT id FROM invoices WHERE "gymId" = $1)`, [gymId])
      await client.query(`DELETE FROM invoices WHERE "gymId" = $1`, [gymId])
      await client.query(`DELETE FROM invoice_series WHERE "gymId" = $1`, [gymId])
      await client.query(`DELETE FROM gym_invoicing_settings WHERE "gymId" = $1`, [gymId])
    }

    await client.query(`DELETE FROM sale_items WHERE "saleId" IN (SELECT id FROM sales WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM bookings WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM attendances WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1)`, [gymId])
    await client.query(`DELETE FROM access_logs WHERE "memberId" IN (SELECT id FROM members WHERE "gymId" = $1) OR "gymId" = $1`, [gymId])
    // Bonos antes que los cobros (member_bonos.paymentId) y que los socios (titulares y usos)
    await client.query(`DELETE FROM bono_usages WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM member_bono_holders WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM member_bonos WHERE "gymId" = $1`, [gymId])
    await client.query(`DELETE FROM bono_types WHERE "gymId" = $1`, [gymId])
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

// --- Administradores de un gimnasio (panel /admin → GymStack → «Usuarios») ----------------
// Mismas reglas que Configuración > Usuarios del panel en GymStack: nunca se deja un gimnasio
// sin ADMIN activo (con la fila del gimnasio bloqueada, para que dos cambios a la vez no lo
// consigan). Requiere las columnas users.active y users.sessionVersion (migración
// 20261120120000_user_active de GymStack).

export interface GymstackAdmin {
  id: string
  name: string | null
  email: string
  active: boolean
  /** Contraseña anulada por deactivateGymstackTenant (cancelación de la suscripción). */
  suspended: boolean
  createdAt: string
}

export class GymstackUserError extends Error {
  constructor(message: string, public status = 400) { super(message) }
}

export async function listGymstackAdmins(gymId: string): Promise<GymstackAdmin[]> {
  const { rows } = await pool.query(
    `SELECT id, name, email, active, COALESCE(starts_with(password, 'SUSPENDED_'), false) AS suspended, "createdAt"
       FROM users WHERE "gymId" = $1 AND role = 'ADMIN'
      ORDER BY active DESC, "createdAt" ASC`,
    [gymId]
  )
  return rows
}

// Sin caracteres que se confunden al copiarlos a mano (0/O, 1/l/I)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
function generatePassword(length = 14) {
  const chars = Array.from({ length: length - 1 }, () => ALPHABET[randomInt(ALPHABET.length)])
  chars.splice(randomInt(chars.length + 1), 0, String(randomInt(2, 10)))
  return chars.join('')
}

async function withGymLock<T>(gymId: string, fn: (client: import('pg').PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const gym = await client.query('SELECT id FROM gyms WHERE id = $1 FOR UPDATE', [gymId])
    if (gym.rowCount === 0) throw new GymstackUserError('Gimnasio no encontrado', 404)
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

async function findAdmin(client: import('pg').PoolClient, gymId: string, userId: string) {
  const { rows } = await client.query(
    `SELECT u.id, u.name, u.email, u.active, g.name AS "gymName"
       FROM users u JOIN gyms g ON g.id = u."gymId"
      WHERE u.id = $1 AND u."gymId" = $2 AND u.role = 'ADMIN'`,
    [userId, gymId]
  )
  if (!rows[0]) throw new GymstackUserError('Administrador no encontrado', 404)
  return rows[0] as { id: string; name: string | null; email: string; active: boolean; gymName: string }
}

/** Activa o desactiva el acceso de un ADMIN. No deja el gimnasio sin ningún ADMIN activo. */
export async function setGymstackAdminActive(gymId: string, userId: string, active: boolean): Promise<void> {
  await withGymLock(gymId, async (client) => {
    const admin = await findAdmin(client, gymId, userId)
    if (admin.active === active) return
    if (!active) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS n FROM users WHERE "gymId" = $1 AND role = 'ADMIN' AND active AND id <> $2`,
        [gymId, userId]
      )
      if (rows[0].n === 0) throw new GymstackUserError('Es el último administrador activo del gimnasio', 409)
    }
    // Al desactivar, sessionVersion + 1 expulsa sus sesiones abiertas en GymStack (< 60 s)
    await client.query(
      `UPDATE users SET active = $1, "sessionVersion" = "sessionVersion" + CASE WHEN $1 THEN 0 ELSE 1 END, "updatedAt" = now() WHERE id = $2`,
      [active, userId]
    )
  })
}

/**
 * Contraseña nueva aleatoria para un ADMIN activo. Devuelve la contraseña en claro (para
 * enviarla por email) y los datos del destinatario.
 */
export async function resetGymstackAdminPassword(gymId: string, userId: string) {
  const password = generatePassword()
  const hash = await bcrypt.hash(password, 10)
  return withGymLock(gymId, async (client) => {
    const admin = await findAdmin(client, gymId, userId)
    if (!admin.active) throw new GymstackUserError('Activa antes su acceso')
    await client.query(
      `UPDATE users SET password = $1, "passwordTokenHash" = NULL, "passwordTokenExpiresAt" = NULL,
              "sessionVersion" = "sessionVersion" + 1, "updatedAt" = now() WHERE id = $2`,
      [hash, userId]
    )
    return { password, email: admin.email, name: admin.name, gymName: admin.gymName }
  })
}
