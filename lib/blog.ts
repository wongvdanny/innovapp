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
