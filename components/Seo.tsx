import Head from 'next/head'

export const SITE_URL = 'https://innovapp.es'
export const SITE_NAME = 'innovapp'
export const DEFAULT_OG_IMAGE = '/brand/og-image.png'

type JsonLd = Record<string, unknown>

export interface SeoProps {
  /** Contenido de <title>. No se le añade sufijo automático: pásalo completo. */
  title: string
  description: string
  /** Ruta ('/servix') o URL absoluta. Se usa para canonical y og:url. */
  canonical: string
  /** Ruta o URL absoluta. Default: /brand/og-image.png (1200x630). */
  ogImage?: string
  /** og:type. Default 'website'. */
  ogType?: string
  /** Si true → robots noindex,nofollow (páginas privadas / de flujo). */
  noindex?: boolean
  /** Uno o varios objetos JSON-LD (schema.org) a inyectar en el head. */
  jsonLd?: JsonLd | JsonLd[]
}

const abs = (path: string) =>
  /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`

export default function Seo({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const url = abs(canonical)
  const image = abs(ogImage)
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={noindex ? 'noindex, nofollow' : 'index, follow'}
      />

      {/* Open Graph */}
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={description} />
      <meta key="og:type" property="og:type" content={ogType} />
      <meta key="og:url" property="og:url" content={url} />
      <meta key="og:image" property="og:image" content={image} />
      <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />
      <meta key="og:locale" property="og:locale" content="es_ES" />

      {/* Twitter */}
      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={description} />
      <meta key="twitter:image" name="twitter:image" content={image} />

      <link rel="icon" href="/favicon.ico" />

      {schemas.map((schema, i) => (
        <script
          key={`ld-${i}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  )
}
