import Link from 'next/link'

// Tres líneas de negocio. Recoge lo útil de los bloques que había antes en la home
// («Desarrollamos aplicaciones…», «Otras soluciones SaaS» y «¿Cuántas horas pierde…?»).
const SERVICIOS = [
  {
    icono: '🤖',
    titulo: 'Agentes IA',
    subtitulo: 'WhatsApp y voz',
    texto:
      'Atienden tu WhatsApp y las llamadas que no coges, las 24 horas: responden dudas con la información real de tu negocio, gestionan citas y reservas sin dobles reservas, y pasan a una persona lo que lo necesita.',
    enlaces: [
      ['/agentes-ia', 'Agentes IA para tu negocio'],
      ['/agentes-voz', 'Agentes de voz'],
      ['/agentes-ia-restaurantes', 'Asistente para restaurantes'],
    ],
  },
  {
    icono: '🛠️',
    titulo: 'Desarrollo a medida y e-commerce',
    subtitulo: 'PrestaShop y WooCommerce',
    texto:
      'Automatizamos lo repetitivo (presupuestos, seguimientos, pasar datos de un programa a otro) y desarrollamos tiendas, módulos y plugins a medida, migraciones y mantenimiento. Presupuesto detallado antes de empezar.',
    enlaces: [
      ['/desarrollo-prestashop-woocommerce', 'Desarrollo PrestaShop y WooCommerce'],
      ['/agentes-ia-prestashop', 'IA para PrestaShop'],
      ['/agentes-ia-woocommerce', 'IA para WooCommerce'],
    ],
  },
  {
    icono: '☁️',
    titulo: 'SaaS propios',
    subtitulo: 'Servix y GymStack',
    texto:
      'Productos propios en la nube, listos para usar desde el primer día: Servix, el TPV para restaurantes, y GymStack, la gestión para gimnasios.',
    enlaces: [
      ['/servix', 'Servix · TPV para restaurantes'],
      ['/gymstack', 'GymStack · Gestión para gimnasios'],
    ],
  },
]

export default function Servicios() {
  return (
    <section id="servicios" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'white' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="label">Servicios</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: 0 }}>Qué hacemos</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
          {SERVICIOS.map(s => (
            <div key={s.titulo} style={{ display: 'flex', flexDirection: 'column', background: '#f8fafb', border: '1px solid #eef1f4', borderRadius: 20, padding: 26 }}>
              <div aria-hidden style={{ fontSize: 30, marginBottom: 12 }}>{s.icono}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1e1e', margin: '0 0 4px' }}>{s.titulo}</h3>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#b2561a', marginBottom: 12 }}>{s.subtitulo}</div>
              <p style={{ fontSize: 15, color: '#4a6572', lineHeight: 1.7, margin: '0 0 18px', flex: 1 }}>{s.texto}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8 }}>
                {s.enlaces.map(([href, texto]) => (
                  <li key={href}>
                    <Link href={href} style={{ fontSize: 15, fontWeight: 700, color: '#b2561a' }}>{texto} →</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
