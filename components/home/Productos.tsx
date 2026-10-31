import DeviceFrame from '../DeviceFrame'
import Link from 'next/link'
import { SECCIONES_HOME } from './sections'

// #productos: nuestros productos, con capturas reales de cada panel (public/casos/).
// Los textos resumen lo que ya dicen /agentes-ia, /servix y /gymstack.
const PRODUCTOS = [
  {
    nombre: 'Agentes IA',
    texto: 'Agentes de IA por WhatsApp Business que atienden a tus clientes las 24 horas: responden dudas, gestionan reservas y citas, y te dejan todas las conversaciones en tu panel.',
    imagen: '/casos/agentes.png',
    ancho: 862,
    alto: 591,
    alt: 'Panel de Agentes Innovapp de un restaurante de demostración: resumen de conversaciones y reservas, con menú de reservas, menú del día, personal y conversaciones',
    href: '/agentes-ia',
  },
  {
    nombre: 'Servix',
    texto: 'Servix digitaliza tu restaurante: gestión de mesas, carta QR, pantalla de cocina, reservas y pagos con Redsys.',
    imagen: '/casos/servix.png',
    ancho: 851,
    alto: 644,
    alt: 'TPV de Servix: mesas libres y ocupadas por zonas (principal y terraza), con menú de productos, pedidos, informes, arqueo de caja y reservas',
    href: '/servix',
  },
  {
    nombre: 'GymStack',
    texto: 'GymStack digitaliza tu gimnasio: gestión de socios, reservas de clases, control de accesos y seguimiento de rutinas.',
    imagen: '/casos/gymstack.png',
    ancho: 997,
    alto: 616,
    alt: 'Panel de administración de GymStack: socios activos, clases del día y últimos socios, con menú de clases, cobros, acceso por QR y entrenadores',
    href: '/gymstack',
  },
]

export default function Productos() {
  if (!SECCIONES_HOME.productos) return null
  return (
    <section id="productos" style={{ padding: 'clamp(56px,10vw,90px) 16px', background: 'var(--gris-50)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div className="label">Productos</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: -1, color: '#1e1e1e', margin: 0 }}>Nuestros productos</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 20 }}>
          {PRODUCTOS.map(p => (
            <article key={p.href} style={{ display: 'flex', flexDirection: 'column', background: 'white', border: '1px solid var(--gris-200)', borderRadius: 'var(--radio-lg)', overflow: 'hidden', boxShadow: 'var(--sombra-sm)' }}>
              <div style={{ padding: '20px 20px 0', background: 'var(--gris-100)' }}>
                <DeviceFrame src={p.imagen} alt={p.alt} width={p.ancho} height={p.alto} />
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1e1e', margin: '0 0 10px' }}>{p.nombre}</h3>
                <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 0 18px', flex: 1 }}>{p.texto}</p>
                <Link href={p.href} style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-brand-orange-texto)' }}>Ver producto →</Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
