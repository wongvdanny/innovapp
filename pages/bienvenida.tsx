import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const CONFIG_BY_PRODUCT: Record<string, { message: string; panelUrl: string; panelLabel: string; loginUrl: string; entity: string }> = {
  servix: {
    message: 'Tu suscripción a Servix está activa. Hemos creado tu restaurante y te hemos enviado un email con los accesos.',
    panelUrl: 'servix.innovapp.es',
    panelLabel: 'Tu panel de gestión',
    loginUrl: 'https://servix.innovapp.es/login',
    entity: 'restaurante',
  },
  gymstack: {
    message: 'Tu suscripción a GymStack está activa. Hemos creado tu gimnasio y te hemos enviado un email con los accesos.',
    panelUrl: 'gymstack.innovapp.es',
    panelLabel: 'Tu panel de gestión',
    loginUrl: 'https://gymstack.innovapp.es/login',
    entity: 'gimnasio',
  },
}
const DEFAULT_CONFIG = {
  message: 'Tu suscripción está activa. Te hemos enviado un email con los accesos.',
  panelUrl: 'innovapp.es',
  panelLabel: 'Tu panel de gestión',
  loginUrl: 'https://innovapp.es/dashboard',
  entity: 'negocio',
}

export default function Bienvenida() {
  const router = useRouter()
  const subId = router.query.sub as string | undefined
  const [loading, setLoading] = useState(true)
  const [productSlug, setProductSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!router.isReady || !subId) { setLoading(false); return }
    fetch(`/api/subscriptions/summary?id=${subId}`)
      .then(r => r.json())
      .then(data => setProductSlug(data?.product?.slug || null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router.isReady, subId])

  const cfg = (productSlug && CONFIG_BY_PRODUCT[productSlug]) || DEFAULT_CONFIG

  return (
    <>
      <Head><title>¡Bienvenido! — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0f9f8,#e8f7f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '56px 48px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(42,179,170,0.15)' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1a2533', marginBottom: 12 }}>¡Pago completado!</h1>
          <p style={{ fontSize: 16, color: '#88a8b0', lineHeight: 1.7, marginBottom: 32 }}>
            {loading ? 'Cargando los datos de tu suscripción...' : cfg.message}
          </p>
          {!loading && (
            <>
              <div style={{ background: '#f0f9f8', borderRadius: 16, padding: '20px 24px', marginBottom: 28, border: '1px solid rgba(42,179,170,0.2)' }}>
                <div style={{ fontSize: 13, color: '#88a8b0', marginBottom: 6 }}>{cfg.panelLabel}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a6478' }}>{cfg.panelUrl}</div>
              </div>
              <a href={cfg.loginUrl} style={{ display: 'block', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, marginBottom: 12, textDecoration: 'none' }}>
                Acceder a mi {cfg.entity} →
              </a>
            </>
          )}
          <Link href="/dashboard" style={{ display: 'block', color: '#88a8b0', fontSize: 13 }}>Ver mi suscripción</Link>
        </div>
      </div>
    </>
  )
}
