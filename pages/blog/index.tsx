import { GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '../../components/Seo'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { obtenerTodosLosPosts, PostSummary } from '../../lib/blog'

type Props = { posts: PostSummary[] }

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogIndexPage({ posts }: Props) {
  return (
    <>
      <Seo
        title="Blog — Consejos para digitalizar tu negocio | innovapp"
        description="Artículos sobre atención al cliente, automatización de citas y agentes de IA por WhatsApp, para dueños de peluquerías, clínicas, gimnasios, talleres y tiendas online."
        canonical="/blog"
      />

      <Nav />

      <main style={{ background: '#f8fafb', minHeight: '100vh', padding: '140px 24px 90px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'white', border: '1px solid #eef1f4', borderRadius: 100, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#ee7528', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              Blog
            </div>
            <h1 style={{ fontSize: 'clamp(28px,4.5vw,44px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', marginBottom: 16 }}>
              Consejos para digitalizar tu negocio
            </h1>
            <p style={{ fontSize: 16, color: '#5a6572', maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
              Ideas prácticas sobre atención al cliente, automatización de citas y ventas por WhatsApp, para dueños de negocio — no para desarrolladores.
            </p>
          </div>

          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#8a94a6', fontSize: 15 }}>
              Todavía no hay artículos publicados. Vuelve pronto.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  style={{ background: 'white', border: '1px solid #eef1f4', borderRadius: 18, padding: 26, textDecoration: 'none', display: 'block' }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#8a94a6', marginBottom: 10 }}>
                    {formatearFecha(post.date)}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#1e1e1e', marginBottom: 10, lineHeight: 1.35 }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: 14, color: '#5a6572', lineHeight: 1.65 }}>
                    {post.description}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ee7528', marginTop: 16 }}>
                    Leer más →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const posts = obtenerTodosLosPosts()
  return { props: { posts } }
}
