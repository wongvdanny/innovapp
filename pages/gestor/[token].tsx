import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { documentoGestor, accederConToken } from '../../lib/facturacion/gestor'
import type { DocumentoGestor } from '../../lib/facturacion/gestor-tipos'
import { aJson } from '../../lib/facturacion/api'
import GestorDocumento from '../../components/facturacion/GestorDocumento'

// Enlace de solo lectura para la gestoría: sin login, token aleatorio con caducidad y revocable.
// No indexable (cabecera + meta), fuera del sitemap y de robots; cada acceso queda en fac_eventos.

export default function PaginaGestor({ doc, expira }: { doc: DocumentoGestor; expira: string }) {
  return (
    <>
      <Head>
        <title>{doc.titulo}</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#F8FAFB' }}>
        <div style={{ background: '#1E1E1E', padding: '14px 16px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ color: '#EE7528', fontWeight: 800, fontSize: 18, fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>innovapp</span>
            <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 12, fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
              Enlace privado de solo lectura · caduca el {new Date(expira).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}
            </span>
          </div>
        </div>
        <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 16px 64px' }}>
          <div style={{ background: 'white', border: '1px solid #EEF1F4', borderRadius: 16, padding: 'clamp(20px, 4vw, 40px)' }}>
            <GestorDocumento doc={doc} />
          </div>
        </main>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ params, req, res }) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('Referrer-Policy', 'no-referrer')
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || null
  const enlace = await accederConToken(String(params?.token ?? ''), ip, (req.headers['user-agent'] as string) || null)
  if (!enlace) return { notFound: true }
  return { props: aJson({ doc: await documentoGestor(), expira: enlace.expira_at }) }
}
