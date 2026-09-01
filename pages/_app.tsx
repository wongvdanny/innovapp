import '../styles/checkout.css'
import type { AppProps } from 'next/app'
import { Gabarito } from 'next/font/google'
import '../styles/globals.css'
import WhatsAppBubble from '../components/WhatsAppBubble'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-gabarito',
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        :root { --font-gabarito: ${gabarito.style.fontFamily}; }
        html, body { font-family: var(--font-gabarito), system-ui, sans-serif; }
      `}</style>
      <Component {...pageProps} />
      <WhatsAppBubble />
    </>
  )
}
