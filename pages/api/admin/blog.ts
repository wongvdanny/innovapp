import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import fs from 'fs'
import path from 'path'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { listarBorradores, obtenerTodosLosPosts } from '../../../lib/blog'
import { descartarBorrador, estadoBlogManual, generarPostManual, publicarBorrador } from '../../../lib/blog-manual'

/**
 * Pestaña Blog de /admin.
 *   GET  → estado de la generación, borradores pendientes y últimos posts.
 *   POST {}                                → genera un borrador (en segundo plano; tarda unos minutos).
 *   POST { accion: 'publicar', slug }      → publica el borrador (git, sitemap, revalidación).
 *   POST { accion: 'descartar', slug }     → aparta el borrador sin publicarlo.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  if (req.method === 'POST') {
    const { accion, slug } = (req.body ?? {}) as { accion?: string; slug?: string }

    if (accion === 'publicar' || accion === 'descartar') {
      if (typeof slug !== 'string') return res.status(400).json({ error: 'Falta el slug' })
      try {
        if (accion === 'descartar') {
          descartarBorrador(slug)
          return res.json({ ok: true })
        }
        const { titulo, avisos } = await publicarBorrador(slug)
        // Sin esperar a la revalidación periódica: el listado y el post (nuevo o sustituido) al momento
        for (const ruta of ['/blog', `/blog/${slug}`]) {
          await res.revalidate(ruta).catch((error) => {
            console.error(`[api/admin/blog] no se pudo revalidar ${ruta}:`, error)
            avisos.push(`No se pudo refrescar ${ruta} al momento; se actualizará solo en unos minutos.`)
          })
        }
        return res.json({ ok: true, titulo, slug, avisos })
      } catch (error) {
        return res.status(400).json({ error: error instanceof Error ? error.message : String(error) })
      }
    }

    const lanzado = generarPostManual(session?.user?.email ?? 'admin')
    if (!lanzado) return res.status(409).json({ error: 'Ya hay una generación en curso.' })
    return res.status(202).json({ estado: estadoBlogManual() })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  }

  const rechazadosDir = path.join(process.cwd(), 'content/blog/.rejected')
  const rechazados = fs.existsSync(rechazadosDir) ? fs.readdirSync(rechazadosDir).filter((f) => f.endsWith('.json')).length : 0
  const posts = obtenerTodosLosPosts()
  return res.json({
    estado: estadoBlogManual(),
    borradores: listarBorradores().map(({ title, slug, date, updated, fusion, sustituye }) => ({ title, slug, date, updated: updated ?? null, fusion: fusion ?? null, sustituye })),
    posts: posts.slice(0, 8).map(({ title, slug, date }) => ({ title, slug, date })),
    totalPosts: posts.length,
    rechazados,
  })
}
