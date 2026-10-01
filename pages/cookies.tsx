import Seo from '../components/Seo'
import Link from 'next/link'
import Logo from '../components/Logo'
import { CONTACT_EMAIL } from '../lib/constants'
import { COOKIE_SETTINGS_EVENT } from '../components/CookieBanner'

export default function Cookies() {
  return (
    <>
      <Seo
        title="Política de Cookies — innovapp"
        description="Política de cookies de innovapp: qué cookies utilizamos, con qué finalidad y cómo gestionarlas."
        canonical="/cookies"
      />
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Logo variant="light" height={26} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e1e1e', marginBottom: 8 }}>Política de Cookies</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: 26 de septiembre de 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['¿Qué son las cookies?', 'Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Nos permiten recordar tus preferencias, mantener tu sesión y, si nos das permiso, entender cómo se usa el sitio.'],
              ['Cookies técnicas (siempre activas)', 'Son necesarias para el funcionamiento del sitio y no requieren consentimiento: (a) cookie de sesión de autenticación (next-auth.session-token), necesaria para mantener tu sesión iniciada; (b) cookie CSRF, para la seguridad de los formularios; (c) cookie de preferencias de cookies (innovapp_cookie_consent en tu navegador), donde guardamos tu decisión sobre las cookies opcionales; (d) cookies de Google reCAPTCHA en el formulario de contacto, necesarias para distinguir a personas de bots y evitar spam.'],
              ['Cookies analíticas y de publicidad (requieren tu consentimiento)', 'Si aceptas la categoría "Analíticas" en el panel de cookies, se activan las cookies de Google Analytics (cargadas a través de Google Tag Manager) para medir visitas y uso del sitio. Si aceptas la categoría "Publicidad", se activan las señales de Google Ads (ad_storage, ad_user_data, ad_personalization) para medir y personalizar campañas, incluidas conversiones. Usamos Google Consent Mode v2: hasta que no aceptas expresamente, estas señales están en "denegado" y no se cargan cookies de analítica ni de publicidad.'],
              ['Cookies de terceros durante el pago', 'Nuestras pasarelas de pago, Redsys y Stripe, pueden establecer sus propias cookies durante el proceso de pago para garantizar la seguridad de la transacción y prevenir el fraude. Estas cookies son necesarias para completar el pago y no dependen del panel de preferencias de este sitio.'],
              ['Cómo gestionar tus preferencias', 'Puedes cambiar tu decisión sobre las cookies analíticas y de publicidad en cualquier momento pulsando "Gestionar cookies" en el pie de cualquier página. También puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envíe una; si desactivas las cookies técnicas, algunas partes del sitio pueden no funcionar correctamente.'],
              ['Contacto', `Si tienes dudas sobre esta política de cookies, escríbenos a ${CONTACT_EMAIL}.`],
            ].map(([title, text]) => (
              <div key={title as string} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', marginBottom: 10 }}>{title}</h2>
                <p style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT))}
            style={{
              marginTop: 24, padding: '12px 22px', borderRadius: 10, border: '1.5px solid #ee7528',
              background: 'white', color: '#ee7528', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Gestionar preferencias de cookies
          </button>
        </div>
        <footer style={{ borderTop: '1px solid #eef1f4', padding: '20px 40px', background: 'white', display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40 }}>
          {[['Aviso Legal','/aviso-legal'],['Privacidad','/privacidad'],['Cookies','/cookies'],['Términos de Uso','/uso']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 12, color: '#88a8b0', textDecoration: 'none' }}>{label}</Link>
          ))}
        </footer>
      </div>
    </>
  )
}
