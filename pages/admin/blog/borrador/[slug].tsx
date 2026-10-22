import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import { obtenerBorrador } from '../../../../lib/blog'

// Vista previa de un borrador del blog (content/blog/.drafts/), enlazada desde el email de
// aviso. Solo admin; /admin lleva X-Robots-Tag noindex (next.config.js).

type Props = {
  borrador: {
    title: string; slug: string; date: string; description: string; contentHtml: string
    palabras: number; sustituye: boolean; fusion: string[] | null; updated: string | null
  }
}

export default function BorradorPage({ borrador: b }: Props) {
  const [estado, setEstado] = useState<'pendiente' | 'enviando' | 'publicado' | 'descartado'>('pendiente')
  const [mensaje, setMensaje] = useState('')

  const actuar = async (accion: 'publicar' | 'descartar') => {
    const pregunta = accion === 'publicar'
      ? (b.sustituye ? `Se sustituirá el post publicado /blog/${b.slug} por este texto. ¿Publicar?` : '¿Publicar este post en el blog?')
      : '¿Descartar este borrador? No se publicará (queda apartado en .drafts/.descartados/).'
    if (!confirm(pregunta)) return
    setEstado('enviando'); setMensaje('')
    const r = await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, slug: b.slug }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setEstado('pendiente'); setMensaje(d.error || `Error ${r.status}`); return }
    setEstado(accion === 'publicar' ? 'publicado' : 'descartado')
    setMensaje((d.avisos ?? []).join(' · '))
  }

  const boton = (fondo: string) => ({ padding: '12px 22px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, color: 'white', background: fondo, cursor: 'pointer', fontFamily: 'inherit' })

  return (
    <>
      <Head><title>{`Borrador: ${b.title}`}</title><meta name="robots" content="noindex, nofollow" /></Head>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e1e1e', color: 'white', padding: '14px 24px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Link href="/admin" style={{ color: 'rgba(255,255,255,.6)', fontSize: 13 }}>← Admin</Link>
        <span style={{ fontSize: 13, color: '#f4a15c', fontWeight: 700 }}>
          BORRADOR · {b.palabras} palabras{b.sustituye ? ` · sustituye a /blog/${b.slug}` : ''}{b.fusion ? ` · fusiona ${b.fusion.length} posts` : ''}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {estado === 'publicado' ? (
            <a href={`/blog/${b.slug}`} style={{ color: '#86efac', fontWeight: 700, fontSize: 14 }}>✓ Publicado: ver el post →</a>
          ) : estado === 'descartado' ? (
            <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 14 }}>Descartado</span>
          ) : (
            <>
              <button onClick={() => actuar('descartar')} disabled={estado === 'enviando'} style={boton('#6b7280')}>Descartar</button>
              <button onClick={() => actuar('publicar')} disabled={estado === 'enviando'} style={boton('linear-gradient(135deg,#ee7528,#c85f1b)')}>
                {estado === 'enviando' ? 'Publicando…' : 'Aprobar y publicar'}
              </button>
            </>
          )}
        </div>
        {mensaje && <div style={{ width: '100%', fontSize: 13, color: '#fde68a' }}>{mensaje}</div>}
      </div>

      <main style={{ background: '#f8fafb', minHeight: '100vh', padding: '40px 24px 90px' }}>
        <article style={{ maxWidth: 720, margin: '0 auto', background: 'white', border: '1px solid #eef1f4', borderRadius: 20, padding: 'clamp(28px,5vw,56px)' }}>
          <div style={{ fontSize: 13, color: '#8a94a6', marginBottom: 10 }}>/blog/{b.slug} · {b.date}{b.updated ? ` · actualizado ${b.updated}` : ''}</div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', marginBottom: 12, lineHeight: 1.2 }}>{b.title}</h1>
          <p style={{ fontSize: 14, color: '#4a6572', background: '#fdf0e8', borderRadius: 10, padding: '10px 14px', marginBottom: 28 }}>
            <strong>Meta description:</strong> {b.description}
          </p>
          <div className="post-content" dangerouslySetInnerHTML={{ __html: b.contentHtml }} />
        </article>
      </main>
      <style>{`
        .post-content { font-size: 16px; line-height: 1.8; color: #33404f; }
        .post-content h2 { font-size: 22px; font-weight: 800; color: #1e1e1e; margin: 36px 0 14px; }
        .post-content h3 { font-size: 18px; font-weight: 700; color: #1e1e1e; margin: 28px 0 12px; }
        .post-content p { margin: 0 0 18px; }
        .post-content ul, .post-content ol { margin: 0 0 18px; padding-left: 22px; }
        .post-content li { margin-bottom: 8px; }
        .post-content a { color: #ee7528; font-weight: 600; text-decoration: underline; }
      `}</style>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  if (!isAdmin(session)) {
    return { redirect: { destination: `/login?callbackUrl=${encodeURIComponent(ctx.resolvedUrl)}`, permanent: false } }
  }
  const b = await obtenerBorrador(String(ctx.params?.slug ?? ''))
  if (!b) return { notFound: true }
  return {
    props: {
      borrador: {
        title: b.title, slug: b.slug, date: String(b.date), description: b.description, contentHtml: b.contentHtml,
        palabras: b.palabras, sustituye: b.sustituye, fusion: b.fusion ?? null, updated: b.updated ? String(b.updated) : null,
      },
    },
  }
}
