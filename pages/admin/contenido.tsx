import { GetServerSideProps } from 'next'
import AdminLayout, { SectionTabs, useTab } from '../../components/admin/AdminLayout'
import Blog from '../../components/admin/secciones/Blog'
import Newsletter from '../../components/admin/secciones/Newsletter'
import { exigirAdmin } from '../../lib/facturacion/api'

const PESTANAS: [string, string][] = [['blog', 'Blog'], ['newsletter', 'Newsletter']]

export default function Contenido() {
  const tab = useTab(PESTANAS.map(p => p[0]), 'blog')
  return (
    <AdminLayout title="Contenido">
      <SectionTabs tabs={PESTANAS} current={tab} />
      {tab === 'blog' ? <Blog /> : <Newsletter />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
