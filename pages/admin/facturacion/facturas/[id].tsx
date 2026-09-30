import { GetServerSideProps } from 'next'
import { prisma } from '../../../../lib/prisma'
import { exigirAdmin, aJson } from '../../../../lib/facturacion/api'
import { detalleFactura } from '../../../../lib/facturacion/consultas'
import { validarEmisor } from '../../../../lib/facturacion/emision'
import { hoyMadrid } from '../../../../lib/facturacion/fechas'
import { Layout } from '../../../../components/admin/facturacion/ui'
import FacturaEditor from '../../../../components/admin/facturacion/FacturaEditor'
import FacturaDetalle from '../../../../components/admin/facturacion/FacturaDetalle'

export default function Factura({ f, ajustes, conceptos, emisorError, hoy }: any) {
  const titulo = f.estado === 'borrador'
    ? (f.tipo_factura.startsWith('R') ? 'Borrador de rectificativa' : 'Borrador de factura')
    : `Factura ${f.num_serie_factura}`
  return (
    <Layout titulo={titulo}>
      {f.estado === 'borrador'
        ? <FacturaEditor key={f.id} factura={f} ajustes={ajustes} conceptos={conceptos} emisorError={emisorError} />
        : <FacturaDetalle f={f} hoy={hoy} />}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  let f
  try { f = await detalleFactura(String(ctx.params!.id)) } catch { return { notFound: true } }
  const [ajustes, conceptos] = await Promise.all([
    prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } }),
    f.estado === 'borrador' ? prisma.fac_conceptos.findMany({ where: { activo: true }, orderBy: [{ usos: 'desc' }, { descripcion: 'asc' }] }) : [],
  ])
  let emisorError: string | null = null
  try { validarEmisor(ajustes) } catch (e: any) { emisorError = e.message }
  return { props: aJson({ f, ajustes, conceptos, emisorError, hoy: hoyMadrid() }) }
}
