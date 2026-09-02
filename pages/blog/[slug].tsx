import { GetStaticPaths, GetStaticProps } from 'next'
import Link from 'next/link'
import Seo from '../../components/Seo'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import { obtenerPostPorSlug, obtenerSlugsDePosts, Post } from '../../lib/blog'

type Props = { post: Post }

function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPostPage({ post }: Props) {
  return (
    <>
      <Seo
        title={`${post.title} | Blog innovapp`}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: { '@type': 'Organization', name: 'innovapp' },
        }}
      />

      <Nav />

      <main style={{ background: '#f8fafb', minHeight: '100vh', padding: '140px 24px 90px' }}>
        <article style={{ maxWidth: 720, margin: '0 auto', background: 'white', border: '1px solid #eef1f4', borderRadius: 20, padding: 'clamp(28px,5vw,56px)' }}>
          <Link href="/blog" style={{ fontSize: 13, fontWeight: 600, color: '#ee7528', textDecoration: 'none' }}>
            ← Volver al blog
          </Link>
          <div style={{ fontSize: 13, color: '#8a94a6', margin: '20px 0 10px' }}>
            {formatearFecha(post.date)}
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', marginBottom: 28, lineHeight: 1.2 }}>
            {post.title}
          </h1>
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        </article>
      </main>

      <Footer />

      <style>{`
        .post-content { font-size: 16px; line-height: 1.8; color: #33404f; }
        .post-content h2 { font-size: 22px; font-weight: 800; color: #1e1e1e; letter-spacing: -0.5px; margin: 36px 0 14px; }
        .post-content h3 { font-size: 18px; font-weight: 700; color: #1e1e1e; margin: 28px 0 12px; }
        .post-content p { margin: 0 0 18px; }
        .post-content ul, .post-content ol { margin: 0 0 18px; padding-left: 22px; }
        .post-content li { margin-bottom: 8px; }
        .post-content a { color: #ee7528; }
        .post-content strong { color: #1e1e1e; }
      `}</style>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = obtenerSlugsDePosts()
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string
  const post = await obtenerPostPorSlug(slug)
  if (!post) return { notFound: true }
  return { props: { post } }
}
