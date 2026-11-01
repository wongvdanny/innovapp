import { GetServerSideProps } from 'next'
import Link from 'next/link'
import AdminLayout from '../../../components/admin/AdminLayout'
import { EmptyState, euros } from '../../../components/admin/ui'
import { exigirAdmin, aJson } from '../../../lib/facturacion/api'
import { productosMenu, suscripcionesAdmin } from '../../../lib/admin/datos'
import { ProductoMenu, presentacion } from '../../../lib/admin/productos'
import { SuscripcionAdmin, resumenPorProducto } from '../../../lib/admin/metricas'

export default function Productos({ productos, subs }: { productos: ProductoMenu[]; subs: SuscripcionAdmin[] }) {
  const resumen = resumenPorProducto(subs)
  return (
    <AdminLayout title="Productos">
      {productos.length === 0 ? <EmptyState icon="📦" title="No hay productos" text="Se dan de alta en la tabla Product." /> : (
        <div className="adm-grid" style={{ ['--min' as any]: '260px' }}>
          {productos.map(p => {
            const r = resumen.find(x => x.slug === p.slug)
            const { color, emoji } = presentacion(p.slug)
            return (
              <Link key={p.slug} href={`/admin/productos/${p.slug}`} className="adm-kpi" style={{ display: 'block', opacity: p.active ? 1 : 0.6 }}>
                <span className="adm-kpi-acento" style={{ background: color }} />
                <div className="adm-fila" style={{ justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{emoji} {p.name}</div>
                  {!p.active && <span className="adm-badge neutro">Inactivo</span>}
                </div>
                <div className="adm-fila" style={{ gap: 20, marginTop: 14 }}>
                  <div><div className="adm-kpi-valor" style={{ fontSize: 22 }}>{r?.activas ?? 0}</div><div className="adm-muted adm-peq">activas</div></div>
                  <div><div className="adm-kpi-valor" style={{ fontSize: 22 }}>{euros(r?.mrr ?? 0, 0)}</div><div className="adm-muted adm-peq">MRR estimado</div></div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [productos, subs] = await Promise.all([productosMenu(), suscripcionesAdmin()])
  return { props: aJson({ productos, subs }) }
}
