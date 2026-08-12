import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { Pool } from 'pg'

const newsPool = new Pool({ connectionString: process.env.NEWS_DATABASE_URL })

const CLAUDE_INPUT_PER_M = 1
const CLAUDE_OUTPUT_PER_M = 5
const TTS_NEURAL2_PER_M = 16

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  const { from, to } = req.query
  const dateFrom = from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dateTo   = to   ? new Date(String(to))   : new Date()

  const result = await newsPool.query(`
    SELECT
      COUNT(*)::int AS runs,

      COALESCE(SUM("newsdataCalls"), 0)::int AS newsdata_calls,
      COALESCE(SUM("claudeInputTokens"), 0)::int AS claude_input,
      COALESCE(SUM("claudeOutputTokens"), 0)::int AS claude_output,
      COALESCE(SUM("ttsCharacters"), 0)::int AS tts_chars
    FROM "ApiUsageLog"
    WHERE "createdAt" >= $1 AND "createdAt" <= $2
  `, [dateFrom, dateTo])

  const row = result.rows[0]
  const claudeCost = (row.claude_input / 1_000_000) * CLAUDE_INPUT_PER_M + (row.claude_output / 1_000_000) * CLAUDE_OUTPUT_PER_M
  const ttsCost = (row.tts_chars / 1_000_000) * TTS_NEURAL2_PER_M

  return res.json({
    runs: row.runs,
    newsdataCalls: row.newsdata_calls,
    claudeInputTokens: row.claude_input,
    claudeOutputTokens: row.claude_output,
    ttsCharacters: row.tts_chars,
    claudeCostUsd: Math.round(claudeCost * 10000) / 10000,
    ttsCostUsd: Math.round(ttsCost * 10000) / 10000,
    totalCostUsd: Math.round((claudeCost + ttsCost) * 10000) / 10000,
  })
}
