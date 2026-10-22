import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// Generación manual de un post del blog desde /admin (pestaña Blog). SOLO servidor: usa
// child_process y fs, no importar desde una página (solo desde pages/api/admin/blog.ts).
//
// Igual que scripts/daily-blog-pipeline.sh: ejecuta scripts/generate-blog-post.mjs
// (generación + verificación de hechos), que deja el post como BORRADOR en
// content/blog/.drafts/ y avisa por email. publicarBorrador() lo publica al aprobarlo:
// lo mueve a content/blog, lo confirma en git y lo añade al sitemap. No hace falta
// recompilar la web: /blog y /blog/[slug] leen content/blog en caliente (ISR).

const exec = promisify(execFile)
const ROOT = process.cwd()
const SITEMAP = path.join(ROOT, 'public/sitemap-0.xml')
const TIMEOUT_MS = 5 * 60 * 1000

export type EstadoBlogManual = {
  fase: 'inactivo' | 'generando' | 'borrador' | 'rechazado' | 'error'
  inicio: string | null
  fin: string | null
  por: string | null
  titulo: string | null
  slug: string | null
  /** Motivos del rechazo o del error. */
  detalle: string[]
}

// En globalThis: una sola generación a la vez en todo el proceso (la web corre en un único
// proceso de PM2), aunque el bundler instancie este módulo más de una vez.
const g = globalThis as unknown as { blogManual?: EstadoBlogManual }

export function estadoBlogManual(): EstadoBlogManual {
  return (g.blogManual ??= {
    fase: 'inactivo', inicio: null, fin: null, por: null, titulo: null, slug: null, detalle: [],
  })
}

export type ResultadoGenerador =
  | { fase: 'borrador'; titulo: string; slug: string }
  | { fase: 'rechazado'; titulo: string | null; detalle: string[] }
  | { fase: 'error'; detalle: string[] }

/** Interpreta la salida de scripts/generate-blog-post.mjs (sus mensajes ✓ / ✗ y su código de salida). */
export function interpretarSalida(codigo: number | null, salida: string): ResultadoGenerador {
  const lineas = salida.split('\n').map((l) => l.trimEnd()).filter(Boolean)
  const exito = salida.match(/✓ Borrador generado y verificado: "(.+)" \(content\/blog\/\.drafts\/(.+)\.mdx\)/)
  if (codigo === 0 && exito) return { fase: 'borrador', titulo: exito[1], slug: exito[2] }

  const rechazo = salida.match(/✗ Post RECHAZADO[^"]*"(.+)"/)
  if (rechazo) {
    const desde = lineas.findIndex((l) => l.startsWith('Violaciones encontradas'))
    const motivos = lineas.slice(desde + 1).filter((l) => l.startsWith('  - ')).map((l) => l.slice(4))
    return { fase: 'rechazado', titulo: rechazo[1], detalle: motivos.length ? motivos : ['El verificador de hechos ha rechazado el borrador.'] }
  }
  return { fase: 'error', detalle: lineas.slice(-4).length ? lineas.slice(-4) : [`El generador ha terminado con código ${codigo} sin dar detalles.`] }
}

/** Confirma el post en git (solo content/blog) y, si la rama es main, lo sube. */
async function confirmarEnGit(titulo: string): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10)
  await exec('git', ['add', '--', 'content/blog'], { cwd: ROOT })
  await exec('git', ['commit', '-m', `Blog post manual: ${hoy} — ${titulo}`, '--', 'content/blog'], { cwd: ROOT })
  const { stdout } = await exec('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: ROOT })
  if (stdout.trim() === 'main') await exec('git', ['push'], { cwd: ROOT, timeout: 60_000 })
}

/** Añade la URL del post a public/sitemap-0.xml (el despliegue siguiente lo regenera entero). */
function anadirAlSitemap(slug: string): void {
  const loc = `https://innovapp.es/blog/${slug}`
  const xml = fs.readFileSync(SITEMAP, 'utf8')
  if (xml.includes(`<loc>${loc}</loc>`)) return
  if (!xml.includes('</urlset>')) throw new Error('sitemap-0.xml no tiene el formato esperado')
  const entrada = `<url><loc>${loc}</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`
  fs.writeFileSync(SITEMAP, xml.replace('</urlset>', `${entrada}</urlset>`), 'utf8')
}

const BLOG_DIR = path.join(ROOT, 'content/blog')
const DRAFTS_DIR = path.join(BLOG_DIR, '.drafts')
const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Publica un borrador aprobado: content/blog/.drafts/{slug}.mdx → content/blog/{slug}.mdx
 * (si es una fusión, sustituye al post con ese slug), git (commit + push en main), sitemap
 * y aviso a Search Console. Devuelve los pasos posteriores que fallaron: el post queda
 * publicado igualmente. La API revalida /blog y /blog/{slug} después.
 */
export async function publicarBorrador(slug: string): Promise<{ titulo: string; avisos: string[] }> {
  if (!PATRON_SLUG.test(slug)) throw new Error('Slug no válido')
  const origen = path.join(DRAFTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(origen)) throw new Error('El borrador no existe')
  const titulo = String(matter(fs.readFileSync(origen, 'utf8')).data.title ?? slug)
  fs.renameSync(origen, path.join(BLOG_DIR, `${slug}.mdx`))

  const avisos: string[] = []
  const paso = async (nombre: string, fn: () => unknown | Promise<unknown>) => {
    try {
      await fn()
    } catch (error) {
      const mensaje = error instanceof Error ? error.message.split('\n')[0] : String(error)
      console.error(`[blog-manual] ${nombre}:`, error)
      avisos.push(`${nombre}: ${mensaje}`)
    }
  }
  await paso('No se pudo confirmar el post en git', () => confirmarEnGit(titulo))
  await paso('No se pudo añadir al sitemap', () => anadirAlSitemap(slug))
  await paso('No se pudo avisar a Google Search Console', () =>
    exec('node', ['scripts/submit-sitemap.mjs'], { cwd: ROOT, timeout: 60_000 }))
  return { titulo, avisos }
}

/** Descarta un borrador: lo aparta a .drafts/.descartados/ (no se borra). */
export function descartarBorrador(slug: string): void {
  if (!PATRON_SLUG.test(slug)) throw new Error('Slug no válido')
  const origen = path.join(DRAFTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(origen)) throw new Error('El borrador no existe')
  const destino = path.join(DRAFTS_DIR, '.descartados')
  fs.mkdirSync(destino, { recursive: true })
  fs.renameSync(origen, path.join(destino, `${new Date().toISOString().slice(0, 10)}-${slug}.mdx`))
}

/**
 * Lanza la generación en segundo plano y vuelve enseguida; el progreso se consulta con
 * estadoBlogManual(). Devuelve false si ya hay una en curso.
 */
export function generarPostManual(por: string): boolean {
  const actual = estadoBlogManual()
  if (actual.fase === 'generando') return false

  const estado: EstadoBlogManual = {
    fase: 'generando', inicio: new Date().toISOString(), fin: null, por, titulo: null, slug: null, detalle: [],
  }
  g.blogManual = estado

  let salida = ''
  const terminar = (cambios: Partial<EstadoBlogManual>) => Object.assign(estado, cambios, { fin: new Date().toISOString() })

  const hijo = spawn('node', ['scripts/generate-blog-post.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] })
  const limite = setTimeout(() => hijo.kill('SIGKILL'), TIMEOUT_MS)
  hijo.stdout.on('data', (d) => { salida += d })
  hijo.stderr.on('data', (d) => { salida += d })
  hijo.on('error', (error) => {
    clearTimeout(limite)
    terminar({ fase: 'error', detalle: [`No se pudo ejecutar el generador: ${error.message}`] })
  })
  hijo.on('close', (codigo) => {
    clearTimeout(limite)
    console.log(`[blog-manual] generador terminado (código ${codigo}) lanzado por ${por}:\n${salida}`)
    const resultado = interpretarSalida(codigo, salida)
    if (resultado.fase !== 'borrador') {
      terminar({ fase: resultado.fase, titulo: 'titulo' in resultado ? resultado.titulo : null, detalle: resultado.detalle })
      return
    }
    terminar({ fase: 'borrador', titulo: resultado.titulo, slug: resultado.slug })
  })
  return true
}
