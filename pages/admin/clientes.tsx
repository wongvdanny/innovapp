import { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import Suscripciones from '../../components/admin/secciones/Suscripciones'
import { exigirAdmin, aJson } from '../../lib/facturacion/api'
import { productosMenu, suscripcionesAdmin } from '../../lib/admin/datos'
import { ProductoMenu } from '../../lib/admin/productos'
import { SuscripcionAdmin } from '../../lib/admin/metricas'

export default function Clientes({ subs, productos }: { subs: SuscripcionAdmin[]; productos: ProductoMenu[] }) {
  return (
    <AdminLayout title="Clientes y suscripciones">
      <Suscripciones inicial={subs} productos={productos} titulo="Todas las suscripciones" />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [subs, productos] = await Promise.all([suscripcionesAdmin(), productosMenu()])
  return { props: aJson({ subs, productos }) }
}
