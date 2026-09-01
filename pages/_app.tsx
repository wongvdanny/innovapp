import '../styles/checkout.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { Gabarito } from 'next/font/google'
import '../styles/globals.css'
import WhatsAppBubble from '../components/WhatsAppBubble'
import CookieBanner from '../components/CookieBanner'
import { CONTACT_EMAIL } from '../lib/constants'

const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'innovapp',
  url: 'https://innovapp.es',
  logo: 'https://innovapp.es/brand/logo.png',
  image: 'https://innovapp.es/brand/og-image.png',
  description:
    'Empresa española de desarrollo de aplicaciones web y software SaaS: agentes de IA por WhatsApp, Servix (TPV para restaurantes) y GymStack (gestión de gimnasios).',
  email: CONTACT_EMAIL,
  address: { '@type': 'PostalAddress', addressCountry: 'ES' },
}

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-gabarito',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
      </Head>
      <style jsx global>{`
        :root { --font-gabarito: ${gabarito.style.fontFamily}; }
        html, body { font-family: var(--font-gabarito), system-ui, sans-serif; }
      `}</style>
      <Component {...pageProps} />
      <WhatsAppBubble />
      <CookieBanner />
    </>
  )
}
