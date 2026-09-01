import '../styles/checkout.css'
import type { AppProps } from 'next/app'
import '../styles/globals.css'
import WhatsAppBubble from '../components/WhatsAppBubble'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <WhatsAppBubble />
    </>
  )
}
