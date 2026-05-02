import Head from 'next/head'
import Link from 'next/link'

export default function Privacidad() {
  return (
    <>
      <Head><title>Política de Privacidad — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: mayo 2025</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['1. Responsable del tratamiento', 'innovapp, con domicilio en España, es el responsable del tratamiento de los datos personales recogidos a través de este sitio web y del servicio Servix.'],
              ['2. Datos que recogemos', 'Recogemos los datos que nos proporcionas al registrarte: nombre, email, teléfono, dirección de facturación y contraseña (almacenada de forma cifrada). También recogemos datos de uso del servicio con fines de mejora y estadísticas.'],
              ['3. Finalidad del tratamiento', 'Utilizamos tus datos para: (a) gestionar tu suscripción y acceso al servicio Servix, (b) enviarte comunicaciones relacionadas con tu cuenta, (c) cumplir con obligaciones legales y fiscales, (d) enviarte newsletter si lo has aceptado expresamente.'],
              ['4. Base legal', 'El tratamiento de tus datos se basa en la ejecución del contrato de suscripción y, en el caso de la newsletter, en tu consentimiento explícito.'],
              ['5. Conservación de datos', 'Conservamos tus datos mientras mantengas tu suscripción activa y durante los plazos legales exigidos (generalmente 5 años para datos fiscales).'],
              ['6. Tus derechos', 'Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad y oposición enviando un email a privacidad@innovapp.es. Tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos.'],
              ['7. Transferencias internacionales', 'Algunos de nuestros proveedores (como el servicio de email Resend) pueden procesar datos fuera del Espacio Económico Europeo, con las garantías adecuadas según el RGPD.'],
              ['8. Cookies', 'Utilizamos cookies técnicas necesarias para el funcionamiento del servicio. Consulta nuestra Política de Cookies para más información.'],
            ].map(([title, text]) => (
              <div key={title as string} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1a2533', marginBottom: 10 }}>{title}</h2>
                <p style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <LegalFooter />
      </div>
    </>
  )
}

function LegalFooter() {
  return (
    <footer style={{ borderTop: '1px solid #eef1f4', padding: '20px 40px', background: 'white', display: 'flex', justifyContent: 'center', gap: 24, marginTop: 40 }}>
      {[['Aviso Legal','/aviso-legal'],['Privacidad','/privacidad'],['Cookies','/cookies'],['Términos de Uso','/uso']].map(([label, href]) => (
        <Link key={href} href={href} style={{ fontSize: 12, color: '#88a8b0', textDecoration: 'none' }}>{label}</Link>
      ))}
    </footer>
  )
}
