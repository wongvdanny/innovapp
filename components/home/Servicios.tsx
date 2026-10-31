import Link from 'next/link'
import { Bot, Cloud, Code } from 'lucide-react'
import Icono from '../Icono'
import { TARJETAS_SECTOR } from '../../data/sectores'

// Tres líneas de negocio. Recoge lo útil de los bloques que había antes en la home
// («Desarrollamos aplicaciones…», «Otras soluciones SaaS» y «¿Cuántas horas pierde…?»).
const SERVICIOS = [
  {
    icono: Bot,
    titulo: 'Agentes IA',
    subtitulo: 'WhatsApp y voz',
    texto:
      'Para cualquier negocio que atienda por WhatsApp, tenga o no web: contestan tu WhatsApp y las llamadas que no coges a cualquier hora, dan citas y reservas en tu agenda sin dobles reservas, y pasan a una persona lo que lo necesita.',
    enlaces: [
      ['/agentes-ia', 'Agentes IA para tu negocio'],
      ['/agentes-voz', 'Agentes de voz'],
    ],
    porSector: true,
  },
  {
    icono: Code,
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
    icono: Cloud,
    titulo: 'SaaS propios',
    subtitulo: 'Servix y GymStack',
    texto: 'TPV para restaurantes y gestión para gimnasios, listos para usar.',
    enlaces: [['#productos', 'Ver nuestros productos']],
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
            <div key={s.titulo} style={{ display: 'flex', flexDirection: 'column', background: 'var(--gris-50)', border: '1px solid var(--gris-200)', borderRadius: 20, padding: 26 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radio-md)', background: 'var(--color-brand-orange-tint)', color: 'var(--color-brand-orange-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}><Icono icono={s.icono} /></div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1e1e1e', margin: '0 0 4px' }}>{s.titulo}</h3>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#b2561a', marginBottom: 12 }}>{s.subtitulo}</div>
              <p style={{ fontSize: 15, color: 'var(--gris-600)', lineHeight: 1.7, margin: '0 0 18px', flex: 1 }}>{s.texto}</p>
              {'porSector' in s && s.porSector && (
                <p style={{ fontSize: 14, color: 'var(--gris-600)', lineHeight: 1.9, margin: '0 0 14px' }}>
                  <strong style={{ color: '#1e1e1e' }}>Por sector: </strong>
                  {TARJETAS_SECTOR.map((t, i) => (
                    <span key={t.clave}>
                      {i > 0 && ' · '}
                      {t.enlaces.length === 1
                        ? <Link href={t.enlaces[0][0]} style={{ color: '#b2561a', fontWeight: 600, textDecoration: 'underline' }}>{t.nombreCorto}</Link>
                        : <>{t.nombreCorto} ({t.enlaces.map(([href, texto], j) => (
                            <span key={href}>{j > 0 && ' / '}<Link href={href} style={{ color: '#b2561a', fontWeight: 600, textDecoration: 'underline' }}>{texto}</Link></span>
                          ))})</>}
                    </span>
                  ))}
                </p>
              )}
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
