import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export type PostFrontmatter = {
  title: string
  slug: string
  date: string
  description: string
  topic: string
}

export type PostSummary = PostFrontmatter

export type Post = PostFrontmatter & {
  contentHtml: string
}

function esArchivoDePost(nombre: string): boolean {
  return nombre.endsWith('.mdx') && !nombre.startsWith('.')
}

/** Lista todos los slugs disponibles (nombre de archivo sin extensión .mdx). */
export function obtenerSlugsDePosts(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return []
  return fs
    .readdirSync(BLOG_DIR)
    .filter(esArchivoDePost)
    .map((nombre) => nombre.replace(/\.mdx$/, ''))
}

/** Lee y ordena (fecha desc) el frontmatter de todos los posts, sin convertir el markdown a HTML -- para la página de listado. */
export function obtenerTodosLosPosts(): PostSummary[] {
  const slugs = obtenerSlugsDePosts()
  const posts = slugs.map((slug) => {
    const ruta = path.join(BLOG_DIR, `${slug}.mdx`)
    const { data } = matter(fs.readFileSync(ruta, 'utf8'))
    return data as PostFrontmatter
  })
  return posts.sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** Lee un post por slug y convierte su markdown a HTML -- para la página individual. */
export async function obtenerPostPorSlug(slug: string): Promise<Post | null> {
  const ruta = path.join(BLOG_DIR, `${slug}.mdx`)
  if (!fs.existsSync(ruta)) return null

  const { data, content } = matter(fs.readFileSync(ruta, 'utf8'))
  const procesado = await remark().use(remarkHtml).process(content)

  return {
    ...(data as PostFrontmatter),
    contentHtml: procesado.toString(),
  }
}

// --- Borradores (content/blog/.drafts/): se ven en /admin/blog/borrador/[slug] y se
// publican desde /admin. No aparecen en /blog ni en el sitemap. ---

const DRAFTS_DIR = path.join(BLOG_DIR, '.drafts')
const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type Borrador = PostFrontmatter & {
  /** Slugs de los posts absorbidos, si es una fusión (sustituye a un post publicado). */
  fusion?: string[]
  updated?: string
  /** Ya existe un post publicado con este slug: al aprobar, se sustituye. */
  sustituye: boolean
}

export function esSlugValido(slug: string): boolean {
  return PATRON_SLUG.test(slug)
}

export function listarBorradores(): Borrador[] {
  if (!fs.existsSync(DRAFTS_DIR)) return []
  return fs
    .readdirSync(DRAFTS_DIR)
    .filter(esArchivoDePost)
    .map((nombre) => {
      const slug = nombre.replace(/\.mdx$/, '')
      const { data } = matter(fs.readFileSync(path.join(DRAFTS_DIR, nombre), 'utf8'))
      return { ...(data as PostFrontmatter), slug, sustituye: fs.existsSync(path.join(BLOG_DIR, nombre)) } as Borrador
    })
    .sort((a, b) => ((a.updated ?? a.date) < (b.updated ?? b.date) ? 1 : -1))
}

export async function obtenerBorrador(slug: string): Promise<(Borrador & { contentHtml: string; palabras: number }) | null> {
  if (!esSlugValido(slug)) return null
  const ruta = path.join(DRAFTS_DIR, `${slug}.mdx`)
  if (!fs.existsSync(ruta)) return null
  const { data, content } = matter(fs.readFileSync(ruta, 'utf8'))
  const procesado = await remark().use(remarkHtml).process(content)
  return {
    ...(data as PostFrontmatter),
    slug,
    sustituye: fs.existsSync(path.join(BLOG_DIR, `${slug}.mdx`)),
    contentHtml: procesado.toString(),
    palabras: content.split(/\s+/).filter(Boolean).length,
  } as Borrador & { contentHtml: string; palabras: number }
}
