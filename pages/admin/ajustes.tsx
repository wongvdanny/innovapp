import { GetServerSideProps } from 'next'
import AdminLayout, { SectionTabs, useTab } from '../../components/admin/AdminLayout'
import Pagos, { RedsysPublico, StripePublico, TransferenciaConfig } from '../../components/admin/secciones/Pagos'
import Sitio from '../../components/admin/secciones/Sitio'
import Cuenta, { CuentaAdmin } from '../../components/admin/secciones/Cuenta'
import { exigirAdmin } from '../../lib/facturacion/api'
import { getServerSession } from 'next-auth/next'
import { authOptions, normalizarEmail } from '../../lib/authOptions'
import { prisma } from '../../lib/prisma'

const PESTANAS: [string, string][] = [['pagos', 'Pagos'], ['sitio', 'Sitio'], ['cuenta', 'Cuenta']]

export default function Ajustes({ redsys, stripe, transferencia, cuenta }: { redsys: RedsysPublico | null; stripe: StripePublico | null; transferencia: TransferenciaConfig | null; cuenta: CuentaAdmin }) {
  const tab = useTab(PESTANAS.map(p => p[0]), 'pagos')
  return (
    <AdminLayout title="Ajustes">
      <SectionTabs tabs={PESTANAS} current={tab} />
      {tab === 'pagos' ? <Pagos redsys={redsys} stripe={stripe} transferencia={transferencia} /> : tab === 'cuenta' ? <Cuenta cuenta={cuenta} /> : <Sitio />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const session = await getServerSession(ctx.req, ctx.res, authOptions)
  const [r, s, t, u] = await Promise.all([
    prisma.redsysConfig.findFirst(), prisma.stripeConfig.findFirst(), prisma.transferConfig.findFirst(),
    // Solo datos visibles de la cuenta: nunca la contraseña ni su hash
    prisma.user.findUnique({ where: { email: normalizarEmail(session?.user?.email) }, select: { name: true, email: true, createdAt: true, passwordChangedAt: true } }),
  ])
  if (!u) return { redirect: { destination: '/login', permanent: false } }
  const cuenta: CuentaAdmin = { name: u.name, email: u.email, createdAt: u.createdAt.toISOString(), passwordChangedAt: u.passwordChangedAt?.toISOString() ?? null }
  // Solo campos públicos y flags: nunca secretKey ni webhookSecret.
  const redsys: RedsysPublico | null = r && { merchantCode: r.merchantCode, terminal: r.terminal, currency: r.currency, environment: r.environment, enabled: r.enabled, hasSecretKey: !!r.secretKey }
  const stripe: StripePublico | null = s && { publishableKey: s.publishableKey, environment: s.environment, enabled: s.enabled, hasSecretKey: !!s.secretKey, hasWebhookSecret: !!s.webhookSecret }
  const transferencia: TransferenciaConfig | null = t && { enabled: t.enabled, titular: t.titular, iban: t.iban, bic: t.bic, banco: t.banco, instrucciones: t.instrucciones, diasPlazo: t.diasPlazo }
  return { props: { redsys, stripe, transferencia, cuenta } }
}
