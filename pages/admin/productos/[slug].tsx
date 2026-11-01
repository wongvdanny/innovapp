import { GetServerSideProps } from 'next'
import AdminLayout, { SectionTabs, useTab } from '../../../components/admin/AdminLayout'
import { KpiCard, KpiGrid, euros } from '../../../components/admin/ui'
import MetricasProducto from '../../../components/admin/secciones/MetricasProducto'
import Suscripciones from '../../../components/admin/secciones/Suscripciones'
import Planes from '../../../components/admin/secciones/Planes'
import { METRICAS } from '../../../components/admin/productos/registro'
import { exigirAdmin, aJson } from '../../../lib/facturacion/api'
import { prisma } from '../../../lib/prisma'
import { suscripcionesAdmin } from '../../../lib/admin/datos'
import { presentacion } from '../../../lib/admin/productos'
import { SuscripcionAdmin, resumen } from '../../../lib/admin/metricas'

interface Props {
  producto: { id: string; slug: string; name: string; active: boolean }
  subs: SuscripcionAdmin[]
  planes: any[]
}

export default function Producto({ producto, subs, planes }: Props) {
  const metricas = METRICAS[producto.slug]
  const pestanas: [string, string][] = [
    ['resumen', 'Resumen'],
    ...(metricas ? [['uso', 'Uso'] as [string, string]] : []),
    ['suscripciones', `Suscripciones (${subs.length})`],
    ['planes', `Planes (${planes.length})`],
  ]
  // Productos que no venden por suscripción de innovapp (p. ej. Agentes IA): se abre en «Uso».
  const tab = useTab(pestanas.map(p => p[0]), metricas && subs.length === 0 ? 'uso' : 'resumen')
  const r = resumen(subs)
  const { color } = presentacion(producto.slug)

  return (
    <AdminLayout title={producto.name}>
      <SectionTabs tabs={pestanas} current={tab} />
      {tab === 'resumen' && (
        <KpiGrid>
          <KpiCard label="MRR estimado" value={euros(r.mrr, 0)} note={`ARR ${euros(r.mrr * 12, 0)}`} color={color} />
          <KpiCard label="Activas" value={r.activas} note={`${r.pagando} de pago`} color={color} />
          <KpiCard label="Pendientes de pago" value={r.pendientes} color={color} />
          <KpiCard label="Canceladas / expiradas" value={r.canceladas} color={color} />
        </KpiGrid>
      )}
      {tab === 'uso' && metricas && <MetricasProducto config={metricas} color={color} />}
      {tab === 'suscripciones' && <Suscripciones inicial={subs} titulo={`Suscripciones de ${producto.name}`} />}
      {tab === 'planes' && <Planes planes={planes} producto={producto} />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const producto = await prisma.product.findUnique({ where: { slug: String(ctx.params?.slug) }, select: { id: true, slug: true, name: true, active: true } })
  if (!producto) return { notFound: true }
  const [subs, planes] = await Promise.all([
    suscripcionesAdmin({ plan: { productId: producto.id } }),
    prisma.plan.findMany({ where: { productId: producto.id }, orderBy: { createdAt: 'asc' } }),
  ])
  return { props: aJson({ producto, subs, planes }) }
}
