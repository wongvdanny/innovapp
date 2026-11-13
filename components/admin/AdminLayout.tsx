import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useEffect, useState } from 'react'
import {
  LayoutDashboard, Package, Users, Wrench, Calculator, Receipt, Megaphone, Settings, Gift,
  ArrowLeft, Menu, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'
import Logo from '../Logo'
import { ProductoMenu, presentacion } from '../../lib/admin/productos'

const NAV = [
  { href: '/admin', label: 'Dashboard', Icono: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', Icono: Package },
  { href: '/admin/clientes', label: 'Clientes y suscripciones', Icono: Users },
  { href: '/admin/proyectos', label: 'Proyectos a medida', Icono: Wrench },
  { href: '/admin/contabilidad', label: 'Contabilidad', Icono: Calculator },
  { href: '/admin/facturacion', label: 'Facturación', Icono: Receipt },
  { href: '/admin/contenido', label: 'Contenido', Icono: Megaphone },
  { href: '/admin/promo-webgratis', label: 'Promo webgratis', Icono: Gift },
  { href: '/admin/ajustes', label: 'Ajustes', Icono: Settings },
]

// Lista de productos para el menú: una sola petición por carga de página.
let productosCache: Promise<ProductoMenu[]> | null = null
function cargarProductos() {
  productosCache ??= fetch('/api/admin/productos')
    .then(r => (r.ok ? r.json() : []))
    .catch(() => { productosCache = null; return [] })
  return productosCache
}

const CLAVE_COLAPSADA = 'adm-sidebar-colapsada'

export default function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const router = useRouter()
  const [productos, setProductos] = useState<ProductoMenu[]>([])
  const [colapsada, setColapsada] = useState(false)
  const [drawer, setDrawer] = useState(false)

  useEffect(() => { cargarProductos().then(setProductos) }, [])
  useEffect(() => {
    try { setColapsada(localStorage.getItem(CLAVE_COLAPSADA) === '1') } catch {}
  }, [])
  useEffect(() => { setDrawer(false) }, [router.asPath])

  const alternarColapsada = () => {
    const nueva = !colapsada
    setColapsada(nueva)
    try { localStorage.setItem(CLAVE_COLAPSADA, nueva ? '1' : '0') } catch {}
  }

  const ruta = router.asPath.split('?')[0]
  const activo = (href: string) => (href === '/admin' ? ruta === '/admin' : ruta === href || ruta.startsWith(href + '/'))

  return (
    <div className="adm">
      <Head><title>{`${title} — Admin innovapp`}</title></Head>
      <div className={`adm-shell${colapsada ? ' colapsada' : ''}${drawer ? ' drawer' : ''}`}>
        <div className="adm-velo" onClick={() => setDrawer(false)} />
        <aside className="adm-sidebar" aria-label="Navegación del panel">
          <div className="adm-marca">
            <span className="adm-marca-logo"><Logo variant="dark" height={22} /></span>
          </div>
          <nav className="adm-nav">
            {NAV.map(({ href, label, Icono }) => (
              <div key={href}>
                <Link href={href} className={`adm-nav-item${activo(href) ? ' activo' : ''}`} title={label}>
                  <span className="adm-nav-icono"><Icono size={18} /></span>
                  <span className="adm-nav-texto">{label}</span>
                </Link>
                {href === '/admin/productos' && productos.length > 0 && (
                  <div className="adm-subnav">
                    {productos.map(p => (
                      <Link key={p.slug} href={`/admin/productos/${p.slug}`} className={activo(`/admin/productos/${p.slug}`) ? 'activo' : ''}>
                        <span className="adm-punto" style={{ background: presentacion(p.slug).color, opacity: p.active ? 1 : 0.4 }} />
                        {p.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="adm-pie">
            <Link href="/dashboard" className="adm-nav-item" title="Mi cuenta">
              <span className="adm-nav-icono"><ArrowLeft size={18} /></span>
              <span className="adm-nav-texto">Mi cuenta</span>
            </Link>
          </div>
        </aside>

        <div className="adm-main">
          <header className="adm-header">
            <button type="button" className="adm-icon-btn adm-solo-movil" onClick={() => setDrawer(true)} aria-label="Abrir menú">
              <Menu size={18} />
            </button>
            <button type="button" className="adm-icon-btn adm-solo-escritorio" onClick={alternarColapsada}
              aria-label={colapsada ? 'Expandir menú' : 'Contraer menú'} title={colapsada ? 'Expandir menú' : 'Contraer menú'}>
              {colapsada ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <h1>{title}</h1>
            {actions && <div className="adm-header-acciones">{actions}</div>}
          </header>
          <main className="adm-content">{children}</main>
        </div>
      </div>
    </div>
  )
}

/** Pestañas de sección enlazables (?tab=…): el refresh conserva la pestaña. */
export function SectionTabs({ tabs, current, param = 'tab' }: { tabs: [string, string][]; current: string; param?: string }) {
  const router = useRouter()
  return (
    <div className="adm-tabs" role="tablist">
      {tabs.map(([clave, label]) => {
        const query = { ...router.query, [param]: clave }
        return (
          <Link key={clave} role="tab" aria-selected={current === clave} replace scroll={false}
            href={{ pathname: router.pathname, query }} className={`adm-tab${current === clave ? ' activo' : ''}`}>
            {label}
          </Link>
        )
      })}
    </div>
  )
}

/** Pestaña activa leída de la URL (con valor por defecto si no es válida). */
export function useTab(validas: string[], porDefecto: string, param = 'tab') {
  const { query } = useRouter()
  const t = typeof query[param] === 'string' ? (query[param] as string) : ''
  return validas.includes(t) ? t : porDefecto
}
