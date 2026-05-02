import Head from 'next/head'
import Link from 'next/link'

export default function Cookies() {
  return (
    <>
      <Head><title>Política de Cookies — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Política de Cookies</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: mayo 2025</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['¿Qué son las cookies?', 'Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Nos permiten recordar tus preferencias y mejorar tu experiencia.'],
              ['Cookies que utilizamos', 'Únicamente utilizamos cookies técnicas estrictamente necesarias: (a) Cookie de sesión de autenticación (next-auth.session-token): necesaria para mantener tu sesión iniciada, (b) Cookie CSRF para seguridad de formularios. No utilizamos cookies de publicidad ni de seguimiento de terceros.'],
              ['Cookies de terceros', 'Nuestro proveedor de pagos Redsys puede establecer cookies durante el proceso de pago para garantizar la seguridad de la transacción.'],
              ['Cómo desactivar las cookies', 'Puedes configurar tu navegador para rechazar todas las cookies o para que te avise cuando se envíe una cookie. Sin embargo, si desactivas las cookies técnicas, algunas partes del servicio pueden no funcionar correctamente.'],
              ['Contacto', 'Si tienes dudas sobre nuestra política de cookies, escríbenos a privacidad@innovapp.es.'],
            ].map(([title, text]) => (
              <div key={title as string} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a2533', marginBottom: 10 }}>{title}</h2>
                <p style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
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
