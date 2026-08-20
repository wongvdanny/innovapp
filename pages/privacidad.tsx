import Head from 'next/head'
import Link from 'next/link'

export default function Privacidad() {
  return (
    <>
      <Head><title>Política de Privacidad — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Manrope,sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: agosto 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['1. Responsable del tratamiento', 'Innovapp, con domicilio en España, es el responsable del tratamiento de los datos personales recogidos a través de este sitio web (innovapp.es) y de los distintos servicios SaaS operados bajo la plataforma Innovapp (en adelante, los "Servicios"), incluyendo entre otros Servix (gestión para hostelería) y GymStack (gestión para gimnasios y centros deportivos), así como cualquier otro producto que se incorpore en el futuro a la plataforma.'],
              ['2. Datos que recogemos', 'Recogemos los datos que nos proporcionas al registrarte en cualquiera de nuestros Servicios: nombre, email, teléfono, dirección de facturación y contraseña (almacenada de forma cifrada). Según el Servicio contratado, podemos recoger datos adicionales propios de su funcionalidad (por ejemplo, datos de empleados o de miembros gestionados dentro de la herramienta). También recogemos datos de uso con fines de mejora, estadísticas y seguridad.'],
              ['3. Finalidad del tratamiento', 'Utilizamos tus datos para: (a) gestionar tu cuenta, suscripción y acceso al Servicio o Servicios contratados dentro de la plataforma Innovapp, (b) procesar los pagos de tu suscripción a través de nuestros proveedores de pago, (c) enviarte comunicaciones relacionadas con tu cuenta y con el correcto funcionamiento del Servicio, (d) cumplir con obligaciones legales y fiscales, (e) enviarte newsletter o comunicaciones comerciales sobre nuestros Servicios, únicamente si lo has aceptado expresamente, (f) analizar el uso de nuestro sitio web y Servicios con fines estadísticos y de mejora continua.'],
              ['4. Base legal', 'El tratamiento de tus datos se basa en la ejecución del contrato de suscripción del Servicio correspondiente y, en el caso de la newsletter o comunicaciones comerciales, en tu consentimiento explícito. El uso de cookies de analítica no esenciales también se basa en tu consentimiento.'],
              ['5. Conservación de datos', 'Conservamos tus datos mientras mantengas activa tu suscripción a cualquiera de nuestros Servicios y durante los plazos legales exigidos posteriormente (generalmente 5 años para datos fiscales y contables).'],
              ['6. Tus derechos', 'Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad, limitación y oposición enviando un email a privacidad@innovapp.es, indicando el Servicio o Servicios a los que se refiere tu solicitud. Tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).'],
              ['7. Destinatarios y transferencias internacionales', 'Para poder prestar nuestros Servicios trabajamos con proveedores tecnológicos, entre ellos: proveedores de pago (Redsys, Stripe), proveedores de email transaccional (Resend), herramientas de analítica y medición (Google Analytics, Google Tag Manager) y otros proveedores de infraestructura necesarios. Algunos de estos proveedores pueden procesar datos fuera del Espacio Económico Europeo (por ejemplo, en Estados Unidos), en cuyo caso nos aseguramos de que existan garantías adecuadas conforme al RGPD, como cláusulas contractuales tipo o la adhesión a marcos de transferencia reconocidos.'],
              ['8. Cookies', 'Utilizamos cookies técnicas necesarias para el funcionamiento de los Servicios, así como cookies de analítica (sujetas a tu consentimiento) para entender el uso del sitio web. Consulta nuestra Política de Cookies para más información y para gestionar tus preferencias.'],
                ['9. Cambios en esta política', 'Esta política puede actualizarse para reflejar cambios legales, técnicos o la incorporación de nuevos Servicios a la plataforma Innovapp. La fecha de "última actualización" indicada al inicio refleja la versión vigente.'],
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
