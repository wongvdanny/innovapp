import Seo from '../components/Seo'
import Link from 'next/link'
import Logo from '../components/Logo'
import { CONTACT_EMAIL } from '../lib/constants'

export default function Uso() {
  return (
    <>
      <Seo
        title="Términos de Uso — innovapp"
        description="Términos y condiciones de uso de los servicios de innovapp: Servix, GymStack y Agentes IA."
        canonical="/uso"
      />
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><Logo variant="light" height={26} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1e1e1e', marginBottom: 8 }}>Términos de Uso</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: septiembre 2026</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['1. Aceptación', 'innovapp es una plataforma que opera distintos servicios SaaS (en adelante, los "Servicios"), incluyendo entre otros Servix, GymStack y Agentes IA, así como cualquier otro producto que se incorpore en el futuro a la plataforma. Al registrarte y utilizar cualquiera de los Servicios, aceptas íntegramente estos Términos de Uso. Si no estás de acuerdo, no debes utilizar el Servicio correspondiente.'],
              ['2. Descripción de los Servicios', 'Cada Servicio ofrecido bajo la plataforma innovapp cuenta con su propia funcionalidad y condiciones específicas de uso, detalladas en la página de cada producto (por ejemplo, Servix para gestión de hostelería o GymStack para gestión de gimnasios y centros deportivos). Todos los Servicios se prestan en modalidad SaaS (Software as a Service) mediante suscripción mensual o anual.'],
              ['3. Registro y cuenta', 'Para usar cualquiera de los Servicios debes registrarte con datos verídicos. Eres responsable de mantener la confidencialidad de tus credenciales y del uso que se haga con tu cuenta.'],
              ['4. Pago y suscripción', 'El precio de la suscripción de cada Servicio se cobra por adelantado al inicio de cada periodo. El pago se procesa de forma segura a través de nuestros proveedores de pago. Puedes cancelar en cualquier momento; no se realizan reembolsos por el periodo en curso.'],
              ['5. Uso aceptable', 'Queda prohibido usar los Servicios para actividades ilegales, intentar acceder a datos de otros clientes, realizar ingeniería inversa del software o revender el acceso a terceros.'],
              ['6. Disponibilidad', 'Nos comprometemos a ofrecer una disponibilidad del 99% mensual para cada Servicio. Podemos interrumpir un Servicio temporalmente por mantenimiento, avisando con antelación siempre que sea posible.'],
              ['7. Tus datos', 'Los datos que introduces en cualquiera de los Servicios (por ejemplo, menús y comandas en Servix, o socios y reservas en GymStack) son tuyos. No los vendemos ni compartimos con terceros. Al cancelar una suscripción, tienes 30 días para exportar los datos de ese Servicio antes de su eliminación.'],
              ['8. Modificaciones', 'Nos reservamos el derecho de modificar estos términos notificándolo con al menos 30 días de antelación por email.'],
              ['9. Contacto', `Para cualquier consulta: ${CONTACT_EMAIL}`],
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
      </div>
    </>
  )
}
