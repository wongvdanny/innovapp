import { GetServerSideProps } from 'next'
import { prisma } from '../../../../lib/prisma'
import { exigirAdmin, aJson } from '../../../../lib/facturacion/api'
import { validarEmisor } from '../../../../lib/facturacion/emision'
import { Layout } from '../../../../components/admin/facturacion/ui'
import FacturaEditor from '../../../../components/admin/facturacion/FacturaEditor'

export default function NuevaFactura({ ajustes, conceptos, emisorError, cliente }: any) {
  return (
    <Layout titulo="Nueva factura">
      <FacturaEditor factura={null} clienteInicial={cliente} ajustes={ajustes} conceptos={conceptos} emisorError={emisorError} />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const clienteId = typeof ctx.query.cliente === 'string' ? ctx.query.cliente : null
  const [ajustes, conceptos, cliente] = await Promise.all([
    prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.fac_conceptos.findMany({ where: { activo: true }, orderBy: [{ usos: 'desc' }, { descripcion: 'asc' }] }),
    clienteId ? prisma.fac_clientes.findUnique({ where: { id: clienteId } }) : null,
  ])
  let emisorError: string | null = null
  try { validarEmisor(ajustes) } catch (e: any) { emisorError = e.message }
  return { props: aJson({ ajustes, conceptos, emisorError, cliente }) }
}
