import Link from 'next/link'
import SeccionPendiente from './SeccionPendiente'

// TODO: resumen de precios de la home. Mientras tanto, enlaces a las secciones de precios
// que ya existen (los importes oficiales están en content/verified-facts.md).
const ENLACES = [
  ['/agentes-ia-prestashop#precios', 'IA para PrestaShop'],
  ['/agentes-ia-woocommerce#precios', 'IA para WooCommerce'],
  ['/agentes-voz#planes', 'Agentes de voz'],
  ['/servix#precios', 'Servix'],
  ['/gymstack#precios', 'GymStack'],
]

export default function Precios() {
  return (
    <SeccionPendiente id="precios" titulo="Precios">
      <p style={{ margin: '0 0 14px' }}>Consulta los precios de cada servicio:</p>
      <p style={{ margin: 0, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 18px' }}>
        {ENLACES.map(([href, texto]) => (
          <Link key={href} href={href} style={{ fontWeight: 700, color: '#b2561a' }}>{texto} →</Link>
        ))}
      </p>
    </SeccionPendiente>
  )
}
