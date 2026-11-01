import { GetServerSideProps } from 'next'
import AdminLayout, { SectionTabs, useTab } from '../../components/admin/AdminLayout'
import Pagos, { RedsysPublico, StripePublico } from '../../components/admin/secciones/Pagos'
import Sitio from '../../components/admin/secciones/Sitio'
import { exigirAdmin } from '../../lib/facturacion/api'
import { prisma } from '../../lib/prisma'

const PESTANAS: [string, string][] = [['pagos', 'Pagos'], ['sitio', 'Sitio']]

export default function Ajustes({ redsys, stripe }: { redsys: RedsysPublico | null; stripe: StripePublico | null }) {
  const tab = useTab(PESTANAS.map(p => p[0]), 'pagos')
  return (
    <AdminLayout title="Ajustes">
      <SectionTabs tabs={PESTANAS} current={tab} />
      {tab === 'pagos' ? <Pagos redsys={redsys} stripe={stripe} /> : <Sitio />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [r, s] = await Promise.all([prisma.redsysConfig.findFirst(), prisma.stripeConfig.findFirst()])
  // Solo campos públicos y flags: nunca secretKey ni webhookSecret.
  const redsys: RedsysPublico | null = r && { merchantCode: r.merchantCode, terminal: r.terminal, currency: r.currency, environment: r.environment, enabled: r.enabled, hasSecretKey: !!r.secretKey }
  const stripe: StripePublico | null = s && { publishableKey: s.publishableKey, environment: s.environment, enabled: s.enabled, hasSecretKey: !!s.secretKey, hasWebhookSecret: !!s.webhookSecret }
  return { props: { redsys, stripe } }
}
