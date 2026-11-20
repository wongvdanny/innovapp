import Seo from '../components/Seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

interface Pedido {
  status: string
  pagado: boolean
  producto: string
  importe: number
  referencia: string | null
  datos: { titular: string; iban: string; bic: string; banco: string; instrucciones: string; diasPlazo: number } | null
}

// Instrucciones tras elegir "Transferencia" en el checkout. La suscripción queda pendiente
// hasta que el admin confirma el ingreso.
export default function Transferencia() {
  const router = useRouter()
  const subId = router.query.sub as string | undefined
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [error, setError] = useState('')
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    if (!router.isReady) return
    if (!subId) { setError('Pedido no encontrado'); return }
    fetch(`/api/subscriptions/transferencia?id=${encodeURIComponent(subId)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Pedido no encontrado'); setPedido(d) })
      .catch(e => setError(e.message))
  }, [router.isReady, subId])

  const copiar = (k: string, v: string) => {
    navigator.clipboard?.writeText(v.replace(/\s+/g, k === 'IBAN' ? '' : ' ')).then(() => { setCopiado(k); setTimeout(() => setCopiado(''), 1500) }).catch(() => {})
  }

  const activo = pedido?.status === 'active' || pedido?.pagado
  const filas: [string, string][] = pedido?.datos ? ([
    ['Importe', pedido.importe.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })],
    ['Titular', pedido.datos.titular], ['IBAN', pedido.datos.iban], ['BIC', pedido.datos.bic], ['Banco', pedido.datos.banco],
    ['Concepto', pedido.referencia || ''],
  ] as [string, string][]).filter(([, v]) => v) : []

  return (
    <>
      <Seo title="Pago por transferencia — innovapp" description="Datos para completar tu pago por transferencia bancaria." canonical="/transferencia" noindex />
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#fdf0e8,#f4f4f4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-gabarito), system-ui, sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 520, width: '100%', boxShadow: '0 20px 60px rgba(238,117,40,0.15)' }}>
          {error ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#991b1b', fontWeight: 600, marginBottom: 16 }}>⚠️ {error}</p>
              <Link href="/" style={{ color: '#ee7528' }}>← Volver al inicio</Link>
            </div>
          ) : !pedido ? (
            <p style={{ textAlign: 'center', color: '#6b6b6b' }}>Cargando los datos de tu pedido…</p>
          ) : activo ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 12 }}>🎉</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e1e1e', marginBottom: 12 }}>¡Pago recibido!</h1>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.7, marginBottom: 24 }}>Tu suscripción a {pedido.producto} ya está activa. Te hemos enviado un email con los accesos.</p>
              <Link href="/dashboard" style={{ color: '#ee7528', fontWeight: 700 }}>Ver mi suscripción →</Link>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 56, textAlign: 'center', marginBottom: 8 }}>🏦</div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e1e1e', marginBottom: 10, textAlign: 'center' }}>Completa tu pago por transferencia</h1>
              <p style={{ fontSize: 15, color: '#6b6b6b', lineHeight: 1.7, marginBottom: 24, textAlign: 'center' }}>
                Alta en <b style={{ color: '#1e1e1e' }}>{pedido.producto}</b>.{pedido.datos ? ` Haz la transferencia en un plazo de ${pedido.datos.diasPlazo} días.` : ''} Te hemos enviado estos datos por email.
              </p>
              {pedido.datos ? (
                <div style={{ background: '#fdf0e8', borderRadius: 16, padding: '8px 20px', marginBottom: 20, border: '1px solid rgba(238,117,40,0.2)' }}>
                  {filas.map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(238,117,40,0.15)', fontSize: 14 }}>
                      <span style={{ color: '#6b6b6b', flexShrink: 0 }}>{k}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#1e1e1e', textAlign: 'right', wordBreak: 'break-word' }}>
                        {v}
                        {(k === 'IBAN' || k === 'Concepto') && (
                          <button type="button" onClick={() => copiar(k, v)} style={{ border: 'none', background: 'white', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer', color: '#c85f1b', fontWeight: 700 }}>
                            {copiado === k ? '✓' : 'Copiar'}
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#991b1b', fontSize: 14, marginBottom: 20 }}>No hemos podido cargar los datos bancarios. Escríbenos y te los enviamos.</p>
              )}
              <p style={{ fontSize: 14, color: '#1e1e1e', lineHeight: 1.6, marginBottom: 12 }}>
                <b>Indica el concepto {pedido.referencia}</b> para que podamos identificar tu pago. Activaremos tu cuenta en cuanto lo recibamos y te avisaremos por email.
              </p>
              {pedido.datos?.instrucciones && <p style={{ fontSize: 14, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 12 }}>{pedido.datos.instrucciones}</p>}
              <Link href="/contacto" style={{ display: 'block', textAlign: 'center', color: '#6b6b6b', fontSize: 13, marginTop: 16 }}>¿Dudas? Contacta con nosotros</Link>
            </>
          )}
        </div>
      </div>
    </>
  )
}
