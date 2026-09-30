import type { NextApiRequest, NextApiResponse, GetServerSidePropsContext } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../authOptions'
import { isAdmin } from '../isAdmin'
import { Actor } from './eventos'
import { esFacturacionError } from './errores'

// Protección y utilidades comunes de /admin/facturacion y /api/admin/facturacion.

/** JSON seguro: BigInt → string (ids de registros/eventos). Decimal y Date ya serializan. */
export function aJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)))
}

export function ipDe(req: NextApiRequest): string | null {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null
}

type Handler = (req: NextApiRequest, res: NextApiResponse, actor: Actor) => Promise<unknown>

/**
 * Envuelve un endpoint admin: sesión de administrador, método, actor para el log
 * y traducción de errores de negocio a 400 con { error, code, meta }.
 */
export function adminApi(handlers: Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE', Handler>>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getServerSession(req, res, authOptions)
    if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })
    const h = handlers[req.method as keyof typeof handlers]
    if (!h) return res.status(405).end()
    const actor: Actor = { usuario: session!.user?.email || 'admin', ip: ipDe(req) }
    try {
      const out = await h(req, res, actor)
      if (!res.headersSent) res.status(200).json(aJson(out ?? { ok: true }))
    } catch (e: any) {
      if (esFacturacionError(e)) return res.status(400).json({ error: e.message, code: e.code, meta: e.meta ?? null })
      if (e?.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
      console.error(`Facturación ${req.method} ${req.url}:`, e)
      return res.status(500).json({ error: 'Error interno' })
    }
  }
}

/** Para getServerSideProps: devuelve la redirección si no es admin. */
export async function exigirAdmin(ctx: GetServerSidePropsContext) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!isAdmin(session)) return { redirect: { destination: '/dashboard', permanent: false } as const }
  return null
}

export const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
export const textoONull = (v: unknown) => texto(v) || null
