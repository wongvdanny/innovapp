import Seo from '../components/Seo'
import Link from 'next/link'
import Logo from '../components/Logo'
import LegalIdentity from '../components/LegalIdentity'
import { CONTACT_EMAIL, LEGAL_OWNER, LEGAL_TRADE_NAME, LEGAL_NIF, LEGAL_ADDRESS, LEGAL_PHONE, LEGAL_ACTIVITY } from '../lib/constants'

export default function AvisoLegal() {
  return (
    <>
      <Seo
        title="Aviso Legal — innovapp"
        description="Aviso legal de innovapp: titularidad del sitio, condiciones de uso y propiedad intelectual."
        canonical="/aviso-legal"
      />
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Logo variant="light" height={26} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e1e1e', marginBottom: 8 }}>Aviso Legal</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: 5 de octubre de 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['Identificación del titular (LSSI-CE, art. 10)', `En cumplimiento del deber de información del artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el titular del sitio web innovapp.es es ${LEGAL_OWNER}, persona física (trabajador autónomo) que opera bajo el nombre comercial "${LEGAL_TRADE_NAME}", con NIF ${LEGAL_NIF} y domicilio en ${LEGAL_ADDRESS}. Teléfono: ${LEGAL_PHONE}. Email de contacto: ${CONTACT_EMAIL}. Actividad: ${LEGAL_ACTIVITY}.`],
              ['Objeto', `El presente Aviso Legal regula el uso del sitio web innovapp.es y de los distintos servicios SaaS operados bajo la plataforma ${LEGAL_TRADE_NAME} (en adelante, los "Servicios"), incluyendo entre otros Servix, GymStack y Agentes IA, así como cualquier otro producto que se incorpore en el futuro a la plataforma.`],
              ['Condiciones de uso', 'El acceso y uso de este sitio web y de los Servicios implica la aceptación de este Aviso Legal, de la Política de Privacidad, de la Política de Cookies y de los Términos de Uso aplicables a cada Servicio. El usuario se compromete a hacer un uso lícito y diligente del sitio web, sin incurrir en actividades ilícitas, lesivas de derechos de terceros o que puedan dañar, inutilizar o sobrecargar el sitio web o impedir su normal utilización.'],
              ['Propiedad intelectual e industrial', `Todos los contenidos de este sitio web (textos, imágenes, logotipos, diseños, código fuente) son propiedad de ${LEGAL_OWNER} o de sus licenciantes y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o comunicación pública total o parcial sin autorización expresa del titular.`],
              ['Enlaces', 'Este sitio web puede incluir enlaces a sitios de terceros (por ejemplo, a los paneles de acceso de Servix o GymStack, o a redes sociales). El titular no se responsabiliza del contenido, políticas de privacidad o prácticas de los sitios de terceros enlazados.'],
              ['Exclusión de responsabilidad', 'El titular no se responsabiliza de los daños o perjuicios que puedan derivarse del uso de los Servicios, de interrupciones técnicas, errores en los datos o accesos no autorizados por causas ajenas a su control, ni garantiza la disponibilidad y continuidad ininterrumpida del sitio web, sin perjuicio de los compromisos de disponibilidad recogidos en los Términos de Uso de cada Servicio.'],
              ['Legislación aplicable y jurisdicción', 'Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del acceso o uso de este sitio web, las partes se someten a los juzgados y tribunales de Oviedo (Asturias), salvo que la normativa de protección de consumidores y usuarios determine un fuero distinto de aplicación imperativa.'],
              ['Contacto', `Para cualquier consulta legal: ${CONTACT_EMAIL}`],
            ].map(([title, text]) => (
              <div key={title as string} style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#1e1e1e', marginBottom: 10 }}>{title}</h2>
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
        <LegalIdentity tono="claro" fondo="white" />
      </div>
    </>
  )
}
