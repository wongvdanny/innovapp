import { Pool } from 'pg'
import { randomUUID } from 'crypto'

const pool = new Pool({ connectionString: process.env.NEWS_DATABASE_URL })

export interface NewsTenantInput {
  name: string
  email: string
  passwordHash: string
  country: string
  province?: string
  city?: string
  topics?: string[]
  plan?: 'FREE' | 'SUBSCRIBER'
}

export interface NewsTenantResult {
  userId: string
}

export async function createNewsTenant(input: NewsTenantInput): Promise<NewsTenantResult> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const province = input.province || null
    const city = input.city || null
    const topics = input.topics || []
    const plan = input.plan || 'FREE'

    const existing = await client.query('SELECT id FROM "User" WHERE email = $1', [input.email])
    let userId: string
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id
      await client.query(
        `UPDATE "User" SET country = $1, province = $2, city = $3, topics = $4, plan = $5, "updatedAt" = now() WHERE id = $6`,
        [input.country, province, city, topics, plan, userId]
      )
    } else {
      userId = randomUUID()
      await client.query(
        `INSERT INTO "User" (id, name, email, password, country, province, city, topics, plan, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())`,
        [userId, input.name, input.email, input.passwordHash, input.country, province, city, topics, plan]
      )
    }

    await client.query('COMMIT')
    return { userId }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
