import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

// Generación manual de un post del blog desde /admin (pestaña Blog). SOLO servidor: usa
// child_process y fs, no importar desde una página (solo desde pages/api/admin/blog.ts).
//
// Hace lo mismo que scripts/daily-blog-pipeline.sh salvo el despliegue: ejecuta
// scripts/generate-blog-post.mjs (generación + verificación de hechos) y, si el post pasa,
// lo confirma en git y lo añade al sitemap. No hace falta recompilar la web: /blog y
// /blog/[slug] leen content/blog en caliente (ISR, ver esas páginas).

const exec = promisify(execFile)
const ROOT = process.cwd()
const SITEMAP = path.join(ROOT, 'public/sitemap-0.xml')
const TIMEOUT_MS = 5 * 60 * 1000

export type EstadoBlogManual = {
  fase: 'inactivo' | 'generando' | 'publicado' | 'rechazado' | 'error'
  inicio: string | null
  fin: string | null
  por: string | null
  titulo: string | null
  slug: string | null
  /** Motivos del rechazo o del error. */
  detalle: string[]
  /** Pasos posteriores a la generación que no salieron bien (git, sitemap): el post está publicado igualmente. */
  avisos: string[]
  /** /blog ya se ha regenerado con el post nuevo (lo hace la API en la primera consulta tras publicar). */
  revalidado: boolean
}

// En globalThis: una sola generación a la vez en todo el proceso (la web corre en un único
// proceso de PM2), aunque el bundler instancie este módulo más de una vez.
const g = globalThis as unknown as { blogManual?: EstadoBlogManual }

export function estadoBlogManual(): EstadoBlogManual {
  return (g.blogManual ??= {
    fase: 'inactivo', inicio: null, fin: null, por: null, titulo: null, slug: null, detalle: [], avisos: [], revalidado: false,
  })
}

export type ResultadoGenerador =
  | { fase: 'publicado'; titulo: string; slug: string }
  | { fase: 'rechazado'; titulo: string | null; detalle: string[] }
  | { fase: 'error'; detalle: string[] }

/** Interpreta la salida de scripts/generate-blog-post.mjs (sus mensajes ✓ / ✗ y su código de salida). */
export function interpretarSalida(codigo: number | null, salida: string): ResultadoGenerador {
  const lineas = salida.split('\n').map((l) => l.trimEnd()).filter(Boolean)
  const exito = salida.match(/✓ Post generado y verificado: "(.+)" \(content\/blog\/(.+)\.mdx\)/)
  if (codigo === 0 && exito) return { fase: 'publicado', titulo: exito[1], slug: exito[2] }

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

async function publicar(estado: EstadoBlogManual, titulo: string, slug: string): Promise<void> {
  const paso = async (nombre: string, fn: () => unknown | Promise<unknown>) => {
    try {
      await fn()
    } catch (error) {
      const mensaje = error instanceof Error ? error.message.split('\n')[0] : String(error)
      console.error(`[blog-manual] ${nombre}:`, error)
      estado.avisos.push(`${nombre}: ${mensaje}`)
    }
  }
  await paso('No se pudo confirmar el post en git', () => confirmarEnGit(titulo))
  await paso('No se pudo añadir al sitemap', () => anadirAlSitemap(slug))
  await paso('No se pudo avisar a Google Search Console', () =>
    exec('node', ['scripts/submit-sitemap.mjs'], { cwd: ROOT, timeout: 60_000 }))
}

/**
 * Lanza la generación en segundo plano y vuelve enseguida; el progreso se consulta con
 * estadoBlogManual(). Devuelve false si ya hay una en curso.
 */
export function generarPostManual(por: string): boolean {
  const actual = estadoBlogManual()
  if (actual.fase === 'generando') return false

  const estado: EstadoBlogManual = {
    fase: 'generando', inicio: new Date().toISOString(), fin: null, por, titulo: null, slug: null, detalle: [], avisos: [], revalidado: false,
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
    if (resultado.fase !== 'publicado') {
      terminar({ fase: resultado.fase, titulo: 'titulo' in resultado ? resultado.titulo : null, detalle: resultado.detalle })
      return
    }
    estado.titulo = resultado.titulo
    estado.slug = resultado.slug
    publicar(estado, resultado.titulo, resultado.slug).finally(() => terminar({ fase: 'publicado' }))
  })
  return true
}
