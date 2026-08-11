import Head from 'next/head'
import { GetServerSideProps } from 'next'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import Link from 'next/link'
import { prisma } from '../lib/prisma'

interface PlanData {
  id: string
  name: string
  description: string
  price: number
  interval: string
  features: string[]
}

export default function GymstackPage({ plans }: { plans: PlanData[] }) {
  const freePlan    = plans.find(p => p.interval === 'free')
  const monthlyPlan = plans.find(p => p.interval === 'monthly')
  const yearlyPlan  = plans.find(p => p.interval === 'yearly')

  return (
    <>
      <Head>
        <title>GymStack — Software de Gestión para Gimnasios y Centros Deportivos | innovapp</title>
        <meta name="description" content="GymStack digitaliza tu gimnasio: gestión de socios, reservas de clases, control de accesos y seguimiento de rutinas. Empieza gratis, sin tarjeta." />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="GymStack — Software de Gestión para Gimnasios" />
        <meta property="og:description" content="Sistema completo de gestión para gimnasios y centros deportivos: socios, reservas de clases, accesos y rutinas, todo en un solo panel." />
        <meta property="og:url" content="https://innovapp.es/gymstack" />
        <meta property="og:image" content="https://innovapp.es/logo.webp" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="GymStack — Gestión para Gimnasios" />
        <meta name="twitter:description" content="Socios, reservas, accesos y rutinas, todo en un solo panel. Empieza gratis." />
        <link rel="canonical" href="https://innovapp.es/gymstack" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "GymStack",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "Software de gestión para gimnasios y centros deportivos: socios, reservas de clases, control de accesos y seguimiento de rutinas.",
              "url": "https://innovapp.es/gymstack",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "EUR",
                "lowPrice": "0",
                "highPrice": "490",
                "offerCount": "3",
              },
              "provider": {
                "@type": "Organization",
                "name": "innovapp",
                "url": "https://innovapp.es",
              },
            }),
          }}
        />
      </Head>

      <Nav />

      <section style={{ background: 'linear-gradient(160deg,#1a0d2d 0%,#3d1a4f 55%,#5c0f4a 100%)', padding: '140px 24px 90px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#a855f7,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>💪</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: 'white' }}>gym<span style={{ color: '#c084fc' }}>stack</span></div>
        </div>
        <h1 style={{ fontSize: 'clamp(28px,5vw,54px)', fontWeight: 800, color: 'white', letterSpacing: -1.5, maxWidth: 720, margin: '0 auto 20px', lineHeight: 1.15 }}>
          La plataforma que digitaliza tu gimnasio de principio a fin
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,.6)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.75 }}>
          Socios, reservas de clases, control de accesos y seguimiento de rutinas, todo en un solo panel. Empieza gratis, sin tarjeta.
        </p>
        <a href="#precios" style={{ padding: '15px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#c084fc,#a855f7)', color: 'white', fontWeight: 700, fontSize:15, textDecoration: 'none' }}>Ver planes →</a>
      </section>

      <section style={{ padding: '90px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20 }}>
          {[
            ['🧑‍🤝‍🧑','Gestión de socios','Altas, bajas, cuotas y estado de cada socio en un solo lugar.'],
            ['📅','Reservas de clases','Tus socios reservan sus clases desde el móvil, sin llamadas.'],
            ['🔑','Control de accesos','Registra entradas y salidas de forma automática y segura.'],
            ['📈','Rutinas y seguimiento','Planes de entrenamiento y evolución física de cada socio.'],
          ].map(([icon, title, desc]) => (
            <div key={String(title)} style={{ background: '#faf8fb', border: '1px solid #f1eef4', borderRadius: 18, padding: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#3d1a4f', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#7a5a87', lineHeight: 1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '90px 24px', background: '#faf8fb' }} id="precios">
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 800, letterSpacing: -1.5, marginBottom: 16, color: '#1a0d2d' }}>Elige tu plan</h2>
          <p style={{ fontSize: 16, color: '#7a5a87', maxWidth: 500, margin: '0 auto 50px' }}>Sin tarjeta de crédito. Sin permanencia.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20, maxWidth: 1000, margin: '0 auto' }}>
            {freePlan && (
              <div style={{ background: 'white', border: '2px solid #f1eef4', borderRadius: 24, padding: '32px 28px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a88ab0', textTransform: 'uppercase', marginBottom: 8 }}>{freePlan.name}</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#1a2533' }}>{freePlan.price}€</div>
                <div style={{ fontSize: 13, color: '#a88ab0', marginBottom: 20 }}>{freePlan.description}</div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
                  {freePlan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#3d1a4f', display: 'flex', gap: 8 }}><span style={{ color: '#a855f7', fontWeight: 700 }}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link href={`/registro?product=gymstack&plan=${freePlan.id}`} style={{ display: 'block', padding: '13px', background: 'linear-gradient(135deg,#a855f7,#7c3aed)', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Crear cuenta gratis →</Link>
              </div>
            )}
            {monthlyPlan && (
              <div style={{ background: 'white', border: '2px solid #f1eef4', borderRadius: 24, padding: '32px 28px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#a88ab0', textTransform: 'uppercase', marginBottom: 8 }}>{monthlyPlan.name}</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#1a2533' }}>{monthlyPlan.price}€<span style={{ fontSize: 15, color: '#a88ab0', fontWeight: 500 }}>/mes</span></div>
                <div style={{ fontSize: 13, color: '#a88ab0', marginBottom: 20 }}>{monthlyPlan.description}</div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
                  {monthlyPlan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: '#3d1a4f', display: 'flex', gap: 8 }}><span style={{ color: '#a855f7', fontWeight: 700 }}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link href={`/registro?product=gymstack&plan=${monthlyPlan.id}`} style={{ display: 'block', padding: '13px', background: '#1a2533', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Contratar mensual →</Link>
              </div>
            )}
            {yearlyPlan && (
              <div style={{ background: 'linear-gradient(145deg,#3d1a4f,#1a0d2d)', border: '2px solid rgba(168,85,247,.25)', borderRadius: 24, padding: '32px 28px', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'inline-block', background: '#f59e0b', color: 'white', borderRadius: 8, padding: '3px 12px', fontSize: 11, fontWeight: 800, marginBottom: 8, alignSelf: 'flex-start' }}>⭐ Más popular</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', marginBottom: 8 }}>{yearlyPlan.name}</div>
                <div style={{ fontSize: 44, fontWeight: 800, color: 'white' }}>{yearlyPlan.price}€<span style={{ fontSize: 15, color: 'rgba(255,255,255,.4)', fontWeight: 500}}>/año</span></div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 20 }}>{yearlyPlan.description}</div>
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
                  {yearlyPlan.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,.85)', display: 'flex', gap: 8 }}><span style={{ color: '#c084fc', fontWeight: 700 }}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link href={`/registro?product=gymstack&plan=${yearlyPlan.id}`} style={{ display: 'block', padding: '13px', background: 'linear-gradient(135deg,#c084fc,#a855f7)', color: 'white', borderRadius: 12, fontSize: 14, fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>Contratar anual →</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  const product = await prisma.product.findUnique({ where: { slug: 'gymstack' } })
  if (!product) return { notFound: true }

  const plans = await prisma.plan.findMany({
    where: { productId: product.id, active: true },
    orderBy: { price: 'asc' },
  })

  return { props: { plans: JSON.parse(JSON.stringify(plans)) } }
}
