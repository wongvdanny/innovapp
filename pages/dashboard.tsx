import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { getSession, signOut } from 'next-auth/react'
import { prisma } from '../lib/prisma'
import Link from 'next/link'

export default function Dashboard({ user, subscription, invoices }: any) {
  const statusColor: Record<string,string> = { active:'#166534', pending:'#92400e', cancelled:'#991b1b', expired:'#991b1b' }
  const statusBg: Record<string,string> = { active:'#f0fdf4', pending:'#fffbeb', cancelled:'#fff1f2', expired:'#fff1f2' }
  const statusLabel: Record<string,string> = { active:'✅ Activa', pending:'⏳ Pendiente de pago', cancelled:'❌ Cancelada', expired:'⚠️ Expirada' }

  return (
    <>
      <Head><title>Mi suscripción — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 28 }} /></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#88a8b0' }}>{user.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #eef1f4', background: 'white', fontSize: 13, fontWeight: 600, color: '#4a6572', cursor: 'pointer' }}>Cerrar sesión</button>
          </div>
        </div>

        <div style={{ maxWidth: 800, margin: '48px auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2533', marginBottom: 8 }}>Mi suscripción</h1>
          <p style={{ fontSize: 15, color: '#88a8b0', marginBottom: 40 }}>Gestiona tu plan de Servix</p>

          {subscription ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Estado */}
              <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #eef1f4' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#88a8b0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Plan actual</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#1a2533' }}>{subscription.plan.name}</div>
                    <div style={{ fontSize: 15, color: '#1a6478', fontWeight: 600 }}>{subscription.plan.price}€{subscription.plan.interval === 'monthly' ? '/mes' : '/año'}</div>
                  </div>
                  <div style={{ background: statusBg[subscription.status], color: statusColor[subscription.status], borderRadius: 20, padding: '6px 16px', fontSize: 13, fontWeight: 700 }}>
                    {statusLabel[subscription.status]}
                  </div>
                </div>
                {subscription.endDate && (
                  <div style={{ background: '#f8fafb', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: '#88a8b0' }}>Próxima renovación</span>
                    <span suppressHydrationWarning style={{ fontSize: 14, fontWeight: 700, color: '#1a2533' }}>{new Date(subscription.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })}</span>
                  </div>
                )}
                {subscription.servixSlug && subscription.status === 'active' && (
                  <div style={{ marginTop: 16, background: 'linear-gradient(135deg,#f0f9f8,rgba(42,179,170,.08))', borderRadius: 14, padding: '18px 20px', border: '1px solid rgba(42,179,170,.15)' }}>
                    <div style={{ fontSize: 13, color: '#88a8b0', marginBottom: 4 }}>Tu restaurante en Servix</div>
                    <a href="https://servix.innovapp.es/login" target="_blank" style={{ fontSize: 16, fontWeight: 700, color: '#1a6478', display: 'flex', alignItems: 'center', gap: 6 }}>
                      servix.innovapp.es → <span style={{ fontSize: 13, color: '#2ab3aa' }}>Acceder</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Facturas */}
              <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #eef1f4' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: '#1a2533' }}>Historial de pagos</h3>
                {invoices.length === 0 ? (
                  <p style={{ color: '#88a8b0', fontSize: 14 }}>No hay facturas aún</p>
                ) : invoices.map((inv: any) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f4f6' }}>
                    <div>
                      <div suppressHydrationWarning style={{ fontSize: 14, fontWeight: 600, color: '#1a2533' }}>{new Date(inv.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      <div style={{ fontSize: 12, color: '#88a8b0' }}>{inv.amount}€ · {inv.status === 'paid' ? '✅ Pagado' : '⏳ Pendiente'}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#1a6478' }}>{inv.amount}€</div>
                  </div>
                ))}
              </div>

              {/* Acciones */}
              {subscription.status === 'active' && (
                <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #eef1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2533' }}>Cancelar suscripción</div>
                    <div style={{ fontSize: 13, color: '#88a8b0' }}>Mantendrás el acceso hasta el final del período</div>
                  </div>
                  <button onClick={async () => { if(confirm('¿Cancelar suscripción?')) { await fetch('/api/subscriptions/cancel', { method: 'POST' }); window.location.reload() } }}
                    style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid #fca5a5', background: '#fff1f2', color: '#991b1b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 20, padding: 48, textAlign: 'center', border: '1px solid #eef1f4' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📦</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Sin suscripción activa</h3>
              <p style={{ color: '#88a8b0', marginBottom: 24 }}>Elige un plan para empezar a usar Servix</p>
              <Link href="/registro" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', borderRadius: 12, padding: '13px 28px', fontSize: 15, fontWeight: 700 }}>Ver planes →</Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx)
  if (!session?.user?.email) return { redirect: { destination: '/login', permanent: false } }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } }
    }
  })

  return {
    props: {
      user: { email: user?.email, name: user?.name },
      subscription: user?.subscriptions?.[0] ? JSON.parse(JSON.stringify(user.subscriptions[0])) : null,
      invoices: JSON.parse(JSON.stringify(user?.invoices || [])),
    }
  }
}
