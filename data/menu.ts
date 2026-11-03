// Secciones del header con submenú (components/Nav.tsx). El hub de cada sección
// (p. ej. /desarrollo) pinta sus tarjetas con estos mismos ítems: para añadir un servicio
// basta con una línea en «items».

export type ItemMenu = { href: string; texto: string; descripcion: string }

export type MenuSeccion = {
  clave: string
  etiqueta: string
  /** Página hub de la sección: primer enlace del submenú («Ver todo»). */
  href: string
  /** Color del texto del disparador (y al abrirse). */
  color: string
  colorActivo: string
  items: ItemMenu[]
}

export const MENUS: MenuSeccion[] = [
  {
    clave: 'agentes',
    etiqueta: 'Agentes IA',
    href: '/agentes-ia',
    color: 'var(--agentes-oro-texto)',
    colorActivo: '#1e1e1e',
    items: [
      { href: '/agentes-ia-prestashop', texto: 'Agentes para PrestaShop', descripcion: 'Atención y ventas por WhatsApp con el catálogo de tu tienda PrestaShop.' },
      { href: '/agentes-ia-woocommerce', texto: 'Agentes para WooCommerce', descripcion: 'Atención y ventas por WhatsApp con el catálogo de tu tienda WooCommerce.' },
      { href: '/agentes-voz', texto: 'Agentes de voz', descripcion: 'Las llamadas que no coges, atendidas por un agente de voz.' },
    ],
  },
  {
    clave: 'desarrollo',
    etiqueta: 'Desarrollo',
    href: '/desarrollo',
    color: 'var(--gris-600)',
    colorActivo: '#1e1e1e',
    items: [
      { href: '/desarrollo/web', texto: 'Desarrollo web', descripcion: 'Webs corporativas, landing pages, tiendas online y aplicaciones a medida, con desarrollo acelerado con IA.' },
      { href: '/desarrollo-prestashop-woocommerce', texto: 'PrestaShop y WooCommerce', descripcion: 'Tiendas, módulos y plugins a medida, migraciones, actualización y mantenimiento.' },
    ],
  },
]
