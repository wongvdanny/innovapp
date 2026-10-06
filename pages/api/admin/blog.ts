import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import fs from 'fs'
import path from 'path'
import { authOptions } from '../../../lib/authOptions'
import { isAdmin } from '../../../lib/isAdmin'
import { obtenerTodosLosPosts } from '../../../lib/blog'
import { estadoBlogManual, generarPostManual } from '../../../lib/blog-manual'

/**
 * Pestaña Blog de /admin.
 *   GET  → estado de la generación manual y últimos posts.
 *   POST → lanza la generación de un post (en segundo plano; tarda alrededor de un minuto).
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  if (req.method === 'POST') {
    const lanzado = generarPostManual(session?.user?.email ?? 'admin')
    if (!lanzado) return res.status(409).json({ error: 'Ya hay una generación en curso.' })
    return res.status(202).json({ estado: estadoBlogManual() })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST')
    return res.status(405).end()
  }

  const estado = estadoBlogManual()
  // Recién publicado: se regenera /blog para que el post salga ya en el listado, sin
  // esperar a su revalidación periódica. La página del post se genera en su primera visita.
  if (estado.fase === 'publicado' && !estado.revalidado) {
    estado.revalidado = true
    await res.revalidate('/blog').catch((error) => {
      console.error('[api/admin/blog] no se pudo revalidar /blog:', error)
      estado.avisos.push('No se pudo refrescar el listado del blog al momento; se actualizará solo en unos minutos.')
    })
  }

  const rechazadosDir = path.join(process.cwd(), 'content/blog/.rejected')
  const rechazados = fs.existsSync(rechazadosDir) ? fs.readdirSync(rechazadosDir).filter((f) => f.endsWith('.json')).length : 0
  return res.json({
    estado,
    posts: obtenerTodosLosPosts().slice(0, 8).map(({ title, slug, date }) => ({ title, slug, date })),
    totalPosts: obtenerTodosLosPosts().length,
    rechazados,
  })
}
