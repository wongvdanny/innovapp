import Head from 'next/head'
import Link from 'next/link'

export default function Uso() {
  return (
    <>
      <Head><title>Términos de Uso — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <Link href="/" style={{ fontSize: 13, color: '#88a8b0' }}>← Volver</Link>
        </header>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Términos de Uso</h1>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 40 }}>Última actualización: mayo 2025</p>
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '40px 48px', lineHeight: 1.8, color: '#4a6572', fontSize: 15 }}>
            {[
              ['1. Aceptación', 'Al registrarte y utilizar el servicio Servix, aceptas íntegramente estos Términos de Uso. Si no estás de acuerdo, no debes utilizar el servicio.'],
              ['2. Descripción del servicio', 'Servix es un software de gestión para restaurantes que incluye gestión de mesas, comandas, carta QR, pantalla de cocina, informes y cobros. El servicio se presta en modalidad SaaS (Software as a Service) mediante suscripción mensual o anual.'],
              ['3. Registro y cuenta', 'Para usar Servix debes registrarte con datos verídicos. Eres responsable de mantener la confidencialidad de tus credenciales y del uso que se haga con tu cuenta.'],
              ['4. Pago y suscripción', 'El precio de la suscripción se cobra por adelantado al inicio de cada periodo. El pago se procesa de forma segura a través de Redsys. Puedes cancelar en cualquier momento; no se realizan reembolsos por el periodo en curso.'],
              ['5. Uso aceptable', 'Queda prohibido usar Servix para actividades ilegales, intentar acceder a datos de otros restaurantes, realizar ingeniería inversa del software o revender el acceso a terceros.'],
              ['6. Disponibilidad', 'Nos comprometemos a ofrecer una disponibilidad del servicio del 99% mensual. Podemos interrumpir el servicio temporalmente por mantenimiento, avisando con antelación siempre que sea posible.'],
              ['7. Datos del restaurante', 'Tus datos (menú, comandas, clientes) son tuyos. No los vendemos ni compartimos con terceros. Al cancelar la suscripción, tienes 30 días para exportarlos antes de su eliminación.'],
              ['8. Modificaciones', 'Nos reservamos el derecho de modificar estos términos notificándolo con al menos 30 días de antelación por email.'],
              ['9. Contacto', 'Para cualquier consulta: hola@innovapp.es'],
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
