import { GetServerSideProps } from 'next'
import AdminLayout from '../../components/admin/AdminLayout'
import { EmptyState, Section } from '../../components/admin/ui'
import { exigirAdmin } from '../../lib/facturacion/api'

export default function Contabilidad() {
  return (
    <AdminLayout title="Contabilidad">
      <Section>
        <EmptyState icon="💶" title="Próximamente"
          text="Ingresos, gastos, beneficio, MRR/ARR, churn, metas y resumen fiscal trimestral. Llega con la Fase 2." />
      </Section>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
