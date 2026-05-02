import Head from 'next/head'
import Link from 'next/link'

export default function AvisoLegal() {
  return (
    <>
      <Head><title>Aviso Legal — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: mayo 2025</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['Titular del sitio web', 'innovapp es el titular y responsable de este sitio web, con domicilio en España. Email de contacto: hola@innovapp.es'],
              ['Objeto', 'El presente Aviso Legal regula el uso del sitio web innovapp.es y del servicio Servix, de titularidad de innovapp.'],
              ['Propiedad intelectual', 'Todos los contenidos de este sitio web (textos, imágenes, logotipos, código fuente) son propiedad de innovapp o de sus licenciantes y están protegidos por la legislación española e internacional sobre propiedad intelectual. Queda prohibida su reproducción total o parcial sin autorización expresa.'],
              ['Limitación de responsabilidad', 'innovapp no se responsabiliza de los daños o perjuicios que puedan derivarse del uso del servicio, interrupciones técnicas, errores en los datos o accesos no autorizados por causas ajenas a su control.'],
              ['Ley aplicable', 'Este aviso legal se rige por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales del domicilio del usuario, salvo que la ley determine otro fuero.'],
              ['Contacto', 'Para cualquier consulta legal: legal@innovapp.es'],
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
