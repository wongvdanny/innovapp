import Seo from '../components/Seo'
import Link from 'next/link'
import Logo from '../components/Logo'
import LegalIdentity from '../components/LegalIdentity'
import { CONTACT_EMAIL, LEGAL_OWNER, LEGAL_TRADE_NAME, LEGAL_NIF, LEGAL_ADDRESS } from '../lib/constants'

export default function Privacidad() {
  return (
    <>
      <Seo
        title="Política de Privacidad — innovapp"
        description="Política de privacidad de innovapp: qué datos tratamos, con qué base legal y cuáles son tus derechos."
        canonical="/privacidad"
      />
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Logo variant="light" height={26} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e1e1e', marginBottom: 8 }}>Política de Privacidad</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: 26 de septiembre de 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['1. Responsable del tratamiento', `${LEGAL_OWNER}, operando bajo el nombre comercial "${LEGAL_TRADE_NAME}", con NIF ${LEGAL_NIF} y domicilio en ${LEGAL_ADDRESS}, es el responsable del tratamiento de los datos personales recogidos a través de este sitio web (innovapp.es) y de los distintos servicios SaaS operados bajo la plataforma ${LEGAL_TRADE_NAME} (en adelante, los "Servicios"), incluyendo entre otros Servix (gestión para hostelería), GymStack (gestión para gimnasios y centros deportivos) y Agentes IA, así como cualquier otro producto que se incorpore en el futuro a la plataforma. Contacto: ${CONTACT_EMAIL}.`],
              ['2. Datos que tratamos', 'Tratamos las siguientes categorías de datos: (a) datos identificativos y de contacto que nos facilitas en el formulario de /contacto, en el registro o en el checkout (nombre, email, teléfono); (b) datos de facturación (empresa, NIF/CIF, dirección, ciudad, código postal, país) necesarios para emitir la factura de tu suscripción; (c) datos de la cuenta y de uso de los Servicios contratados (credenciales de acceso -- la contraseña se almacena cifrada --, configuración, y datos propios de la funcionalidad de cada Servicio); (d) datos de navegación recogidos mediante cookies de analítica, únicamente si has dado tu consentimiento (ver Política de Cookies).'],
              ['3. Finalidades y base legal de cada tratamiento', 'Tratamos tus datos para: (a) responder a tus consultas a través del formulario de contacto -- base legal: consentimiento (al marcar la casilla de aceptación) e interés legítimo en atender la solicitud; (b) dar de alta y gestionar tu cuenta y tu acceso al Servicio o Servicios contratados -- base legal: ejecución del contrato de suscripción; (c) prestar los Servicios contratados y su funcionalidad -- base legal: ejecución del contrato; (d) procesar el pago de tu suscripción y emitir la facturación correspondiente -- base legal: ejecución del contrato y cumplimiento de obligaciones legales (fiscales); (e) enviarte comunicaciones necesarias sobre tu cuenta o el Servicio (avisos de facturación, incidencias, cambios en estos documentos) -- base legal: ejecución del contrato; (f) enviarte newsletter o comunicaciones comerciales, únicamente si lo has aceptado expresamente -- base legal: consentimiento; (g) analizar el uso del sitio web con fines estadísticos y de mejora -- base legal: consentimiento (cookies de analítica, ver Política de Cookies).'],
              ['4. Plazos de conservación', 'Los datos de las consultas del formulario de contacto se conservan mientras gestionamos la solicitud y, como máximo, durante 1 año desde el último contacto. Los datos de cuenta y de uso de los Servicios se conservan mientras mantengas activa tu suscripción. Los datos de facturación se conservan durante la relación contractual y, posteriormente, durante los plazos legales exigidos por la normativa fiscal y contable (entre 4 y 6 años, según el tipo de obligación). Transcurridos estos plazos, los datos se eliminan o se anonimizan, salvo que deban quedar bloqueados por una obligación legal de conservación.'],
              ['5. Destinatarios y encargados del tratamiento', 'Para poder prestar los Servicios compartimos los datos estrictamente necesarios con los siguientes proveedores, que actúan como encargados del tratamiento por nuestra cuenta: proveedor de hosting e infraestructura (Contabo), pasarelas de pago (Redsys y Stripe, para procesar el cobro de tu suscripción), proveedor de email transaccional (Resend, para el envío de correos de la cuenta), Google (Google Analytics y Google Tag Manager para analítica web sujeta a consentimiento, y reCAPTCHA para la protección antispam del formulario de contacto). No cedemos tus datos a terceros con fines distintos a la prestación del Servicio, salvo obligación legal.'],
              ['6. Transferencias internacionales', 'Algunos de los proveedores anteriores (Stripe, Resend y Google) pueden tratar datos fuera del Espacio Económico Europeo, en particular en Estados Unidos. En estos casos nos asegura­mos de que exista una garantía adecuada conforme al RGPD, como la adhesión del proveedor al EU-US Data Privacy Framework o la incorporación de cláusulas contractuales tipo aprobadas por la Comisión Europea.'],
              ['7. Datos de los clientes finales de los Servicios', `Cuando contratas Servix, GymStack u otro Servicio para tu propio negocio, tú introduces en la herramienta datos de tus propios clientes o usuarios finales (por ejemplo, comandas y clientes de tu restaurante, o socios y reservas de tu gimnasio). Respecto de esos datos, ${LEGAL_TRADE_NAME} actúa como encargado del tratamiento por cuenta de tu negocio, que es el responsable del tratamiento frente a sus propios clientes. Puedes solicitarnos el correspondiente contrato de encargado del tratamiento escribiendo a ${CONTACT_EMAIL}.`],
              ['8. Tus derechos', 'Tienes derecho a acceder a tus datos personales, rectificarlos si son inexactos, solicitar su supresión, oponerte a su tratamiento, solicitar la limitación del tratamiento, la portabilidad de tus datos y retirar el consentimiento prestado en cualquier momento (sin que ello afecte a la licitud del tratamiento previo). Puedes ejercer cualquiera de estos derechos escribiendo a ' + CONTACT_EMAIL + ', indicando el derecho que quieres ejercer y el Servicio al que se refiere tu solicitud. Responderemos en el plazo máximo de 1 mes.'],
              ['9. Cómo solicitar la eliminación de tus datos', `Para solicitar la eliminación de tus datos, envía un email a ${CONTACT_EMAIL} con el asunto "Supresión de datos", indicando el email de la cuenta a eliminar. Responderemos en un plazo máximo de 1 mes y eliminaremos tus datos, salvo aquellos que debamos conservar bloqueados por una obligación legal (por ejemplo, datos de facturación durante el plazo fiscal exigido), que no se usarán para ninguna otra finalidad durante ese periodo.`],
              ['10. Reclamación ante la autoridad de control', 'Si consideras que el tratamiento de tus datos no se ajusta a la normativa vigente, tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).'],
              ['11. Seguridad', 'Aplicamos medidas técnicas y organizativas adecuadas para proteger tus datos personales frente a accesos no autorizados, pérdida o alteración, incluyendo el cifrado de contraseñas y el acceso restringido a los sistemas que contienen datos personales.'],
              ['12. Menores de edad', 'Los Servicios no están dirigidos a menores de 14 años. No recogemos conscientemente datos de menores de esa edad; si detectamos que se han recogido datos de un menor sin el consentimiento de sus tutores legales, procederemos a eliminarlos.'],
              ['13. Cookies', 'Utilizamos cookies técnicas necesarias para el funcionamiento de los Servicios, así como cookies de analítica y publicidad (sujetas a tu consentimiento previo) para entender el uso del sitio web. Consulta nuestra Política de Cookies para más información y para gestionar tus preferencias.'],
              ['14. Cambios en esta política', 'Esta política puede actualizarse para reflejar cambios legales, técnicos o la incorporación de nuevos Servicios a la plataforma ' + LEGAL_TRADE_NAME + '. La fecha de "última actualización" indicada al inicio refleja la versión vigente.'],
            ].map(([title, text]) => (
              <div key={title as string} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', marginBottom: 10 }}>{title}</h2>
                <p style={{ margin: 0 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
        <LegalFooter />
        <LegalIdentity tono="claro" fondo="white" />
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
