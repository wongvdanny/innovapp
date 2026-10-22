import '../styles/checkout.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { useEffect } from 'react'
import { Gabarito } from 'next/font/google'
import '../styles/globals.css'
import WhatsAppBubble from '../components/WhatsAppBubble'
import CookieBanner from '../components/CookieBanner'
import { CONTACT_EMAIL, LEGAL_OWNER } from '../lib/constants'
import { trackContactClicks } from '../lib/track'

const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'innovapp',
  legalName: LEGAL_OWNER,
  url: 'https://innovapp.es',
  logo: 'https://innovapp.es/brand/logo.png',
  image: 'https://innovapp.es/brand/og-image.png',
  description:
    'Empresa española de desarrollo web e inteligencia artificial para e-commerce: IA para PrestaShop y WooCommerce, desarrollo, migración y mantenimiento de tiendas online, agentes de IA por WhatsApp, Servix (TPV para restaurantes) y GymStack (gestión de gimnasios).',
  email: CONTACT_EMAIL,
  telephone: '+34684902196',
  address: { '@type': 'PostalAddress', addressLocality: 'Oviedo', addressRegion: 'Asturias', addressCountry: 'ES' },
  areaServed: ['ES'],
  // sameAs: añadir aquí las URLs de los perfiles sociales cuando existan (hoy no hay ninguno enlazado en la web)
}

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-gabarito',
})

export default function App({ Component, pageProps }: AppProps) {
  // click_whatsapp / click_tel / click_email en cualquier enlace de la web
  useEffect(() => trackContactClicks(), [])

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta key="facebook-domain-verification" name="facebook-domain-verification" content="7lkq06z03iie8clk0xypzrmxpfudgx" />
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
