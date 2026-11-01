import { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import Dashboard, { DatosDashboard } from '../../components/admin/secciones/Dashboard'
import { exigirAdmin, aJson } from '../../lib/facturacion/api'
import { productosMenu, suscripcionesAdmin } from '../../lib/admin/datos'
import { cobrosSinFactura, resumenDashboard } from '../../lib/facturacion/dashboard'

export default function AdminDashboard(props: DatosDashboard) {
  return (
    <AdminLayout title="Dashboard">
      <Dashboard {...props} />
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [subs, productos, fac, cobros] = await Promise.all([suscripcionesAdmin(), productosMenu(), resumenDashboard(), cobrosSinFactura()])
  return {
    props: aJson({
      subs,
      productos,
      facturacion: { pendienteCobro: fac.pendienteCobro, vencido: fac.vencido, borradores: fac.borradores, cobrosSinFactura: cobros.length },
    }),
  }
}
