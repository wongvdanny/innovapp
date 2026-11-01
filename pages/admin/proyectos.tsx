import { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import { EmptyState, Section } from '../../components/admin/ui'
import { exigirAdmin } from '../../lib/facturacion/api'

export default function Proyectos() {
  return (
    <AdminLayout title="Proyectos a medida">
      <Section>
        <EmptyState icon="🛠️" title="Próximamente"
          text="Trabajos de agencia (cliente, presupuesto, estado y fechas), enlazados con sus facturas. Llega con la Fase 2, junto con Contabilidad." />
      </Section>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
