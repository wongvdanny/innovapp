import { useState, useEffect } from 'react'
import Link from 'next/link'

const COUNTRIES = [
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
]

const TOPICS = ['Tecnología', 'Deportes', 'Economía', 'Cultura', 'Salud', 'Ciencia']

interface PlanData {
  id: string
  name: string
  price: number
  interval: string
  description: string
  features: string[]
}

export default function RegistroNews() {
  const [plans, setPlans] = useState<PlanData[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<PlanData | null>(null)

  const [providers, setProviders] = useState<{ redsys: boolean; stripe: boolean }>({ redsys: false, stripe: false })
  const [payProvider, setPayProvider] = useState<'redsys' | 'stripe' | ''>('')

  const [form, setForm] = useState({ name: '', email: '', password: '', country: 'ES', province: '', city: '' })
  const [topics, setTopics] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/plans/news')
      .then(r => r.json())
      .then(data => {
        setPlans(data.plans || [])
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))

    fetch('/api/payment-providers')
      .then(r => r.json())
      .then(d => {
        setProviders(d)
        if (d.redsys && !d.stripe) setPayProvider('redsys')
        else if (d.stripe && !d.redsys) setPayProvider('stripe')
      })
      .catch(() => {})
  }, [])

  const toggleTopic = (t: string) => {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const validate = () => {
    if (!form.name.trim()) return 'Introduce tu nombre'
    if (!form.email.trim() || !form.email.includes('@')) return 'Email no válido'
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (selectedPlan && selectedPlan.price > 0 && providers.redsys && providers.stripe && !payProvider) return 'Selecciona un método de pago'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError('')

    const isFree = selectedPlan?.price === 0

    try {
      if (isFree) {
        const res = await fetch('/api/subscriptions/free-signup-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, country: form.country }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Error al registrarte'); setLoading(false); return }
        window.location.href = 'https://news.innovapp.es/login'
        return
      }

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          entityName: form.name,
          email: form.email,
          password: form.password,
          planId: selectedPlan!.id,
          provider: payProvider || undefined,
          billing: { name: form.name, country: form.country, province: form.province, city: form.city, topics },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al procesar el pago'); setLoading(false); return }

      if (data.provider === 'stripe') {
        window.location.href = data.url
        return
      }

      const frm = document.createElement('form')
      frm.method = 'POST'; frm.action = data.url
      Object.entries(data.body as Record<string, string>).forEach(([k, v]) => {
        const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; frm.appendChild(i)
      })
      document.body.appendChild(frm); frm.submit()
    } catch (e) {
      setError('Error de conexión. Inténtalo de nuevo.')
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    border: '1.5px solid #eef1f4', fontSize: 15, outline: 'none',
    fontFamily: 'system-ui', boxSizing: 'border-box', background: '#f8fafb',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#1a1a2e 0%,#3d2b6f 50%,#e6672a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 440, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3d2b6f,#e6672a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎙️</div>
          <span style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e' }}>news<span style={{ color: '#e6672a' }}>.</span></span>
        </div>

        {!selectedPlan ? (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>Elige tu plan</h2>
            <p style={{ fontSize: 14, color: '#8a8aa3', margin: '0 0 24px' }}>Tu resumen de noticias en audio</p>
            {plansLoading ? (
              <p style={{ color: '#8a8aa3', fontSize: 14 }}>Cargando planes...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {plans.map(p => (
                  <button key={p.id} onClick={() => setSelectedPlan(p)}
                    style={{ textAlign: 'left', padding: '18px 20px', borderRadius: 16, border: '2px solid #eef1f4', background: 'white', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontWeight: 800, color: '#1a1a2e' }}>{p.name}</span>
                      <span style={{ fontWeight: 800, color: '#e6672a' }}>{p.price === 0 ? 'Gratis' : `${p.price}€/mes`}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#8a8aa3', margin: 0 }}>{p.description}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', margin: '0 0 6px' }}>
              {selectedPlan.price === 0 ? 'Crea tu cuenta gratis' : `Suscripción — ${selectedPlan.price}€/mes`}
            </h2>
            <p style={{ fontSize: 14, color: '#8a8aa3', margin: '0 0 24px' }}>
              <button onClick={() => setSelectedPlan(null)} style={{ background: 'none', border: 'none', color: '#e6672a', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0 }}>← Cambiar plan</button>
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inputStyle} placeholder="Tu nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              <input style={inputStyle} type="email" placeholder="tu@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
              <input style={inputStyle} type="password" placeholder="Contraseña (mín. 8 caracteres)" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
              <select style={inputStyle} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>

              {selectedPlan.price > 0 && (
                <>
                  <input style={inputStyle} placeholder="Provincia (opcional)" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
                  <input style={inputStyle} placeholder="Ciudad (opcional)" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />

                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Temas de interés</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {TOPICS.map(t => (
                        <button key={t} type="button" onClick={() => toggleTopic(t)}
                          style={{
                            padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            border: topics.includes(t) ? 'none' : '1.5px solid #eef1f4',
                            background: topics.includes(t) ? 'linear-gradient(135deg,#3d2b6f,#e6672a)' : 'white',
                            color: topics.includes(t) ? 'white' : '#8a8aa3',
                          }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {providers.redsys && providers.stripe && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>Método de pago</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => setPayProvider('redsys')}
                          style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            border: `2px solid ${payProvider === 'redsys' ? '#3d2b6f' : '#eef1f4'}`,
                            background: payProvider === 'redsys' ? '#f3f0fa' : 'white',
                            color: payProvider === 'redsys' ? '#3d2b6f' : '#8a8aa3' }}>
                          Tarjeta (Redsys)
                        </button>
                        <button type="button" onClick={() => setPayProvider('stripe')}
                          style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            border: `2px solid ${payProvider === 'stripe' ? '#3d2b6f' : '#eef1f4'}`,
                            background: payProvider === 'stripe' ? '#f3f0fa' : 'white',
                            color: payProvider === 'stripe' ? '#3d2b6f' : '#8a8aa3' }}>
                          Stripe
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {error && (
                <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
                  ⚠️ {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ padding: '14px', borderRadius: 12, border: 'none', background: loading ? '#ccc' : 'linear-gradient(135deg,#3d2b6f,#e6672a)', color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                {loading ? '⏳ Procesando...' : selectedPlan.price === 0 ? 'Crear cuenta gratis →' : 'Ir al pago →'}
              </button>
            </form>
          </>
        )}

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Link href="/" style={{ fontSize: 13, color: '#8a8aa3', textDecoration: 'none' }}>← Volver al inicio</Link>
        </div>
      </div>
    </div>
  )
}
