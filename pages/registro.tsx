import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const PLANS = [
  { id: 'plan_free',    name: 'Gratis',  price: 0,   period: '', saving: '', badge: '✦ Empieza ya', desc: 'Hasta 5 mesas, 1 empleado, carta QR' },
  { id: 'plan_monthly', name: 'Mensual', price: 99,  period: '/mes', saving: '', badge: '' },
  { id: 'plan_yearly',  name: 'Anual',   price: 990, period: '/año', saving: '82.50€/mes', badge: '⭐ Ahorra 2 meses' },
]

export default function Registro() {
  const router = useRouter()
  const preselect = router.query.plan as string || 'plan_free'

  const [step, setStep]     = useState(1)
  const [plan, setPlan]     = useState(preselect)
  const [form, setForm]     = useState({ name: '', restaurantName: '', email: '', password: '', phone: '' })
  const [privacyChecked, setPrivacyChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const isFree = plan === 'plan_free'

  const goToCheckout = () => { setStep(2) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!privacyChecked) {
      setError('Debes aceptar la política de privacidad para continuar.')
      return
    }
    setLoading(true); setError('')
    try {
      if (isFree) {
        const res = await fetch('/api/subscriptions/free-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, planId: plan }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error')
        router.push(`/bienvenida?sub=${data.subscriptionId}`)
        return
      }

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, planId: plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      const frm = document.createElement('form')
      frm.method = 'POST'; frm.action = data.url
      Object.entries(data.body as Record<string,string>).forEach(([k,v]) => {
        const inp = document.createElement('input')
        inp.type='hidden'; inp.name=k; inp.value=v; frm.appendChild(inp)
      })
      document.body.appendChild(frm); frm.submit()
    } catch (e: any) {
      setError(e.message); setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #eef1f4', fontSize: 14, outline: 'none', fontFamily: 'Plus Jakarta Sans,sans-serif', transition: 'border-color .2s', boxSizing: 'border-box' as const }

  const selectedPlan = PLANS.find(p=>p.id===plan)

  return (
    <>
      <Head>
        <title>Registro — innovapp</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1a2533 0%,#1a3d4f 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 520, width: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.3)' }}>
          <Link href="/">
            <img src="/logo.webp" alt="innovapp" style={{ height: 28, marginBottom: 32, display: 'block' }} />
          </Link>

          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {[1,2].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? 'linear-gradient(90deg,#2ab3aa,#1a6478)' : '#eef1f4', transition: 'background .3s' }} />
            ))}
          </div>

          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: '#1a2533' }}>Elige tu plan</h2>
              <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>Empieza gratis o elige un plan Pro. Puedes cambiar cuando quieras.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
                {PLANS.map(p => (
                  <div key={p.id} onClick={() => setPlan(p.id)}
                    style={{ border: `2px solid ${plan === p.id ? '#2ab3aa' : '#eef1f4'}`, borderRadius: 16, padding: '20px 24px', cursor: 'pointer', background: plan === p.id ? '#f0f9f8' : 'white', transition: 'all .2s', position: 'relative' }}>
                    {p.badge && <div style={{ position: 'absolute', top: -10, right: 16, background: p.id === 'plan_free' ? '#2ab3aa' : '#f59e0b', color: 'white', borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 800 }}>{p.badge}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2533', marginBottom: 2 }}>{p.name}</div>
                        {p.desc && <div style={{ fontSize: 12, color: '#88a8b0' }}>{p.desc}</div>}
                        {p.saving && <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600 }}>💰 Equivale a {p.saving}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 32, fontWeight: 800, color: plan === p.id ? '#1a6478' : '#1a2533' }}>{p.price}€</span>
                        <span style={{ fontSize: 13, color: '#88a8b0' }}>{p.period}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => goToCheckout()} style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                Continuar →
              </button>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#88a8b0' }}>
                ¿Ya tienes cuenta? <Link href="/login" style={{ color: '#1a6478', fontWeight: 600 }}>Inicia sesión</Link>
              </p>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6, color: '#1a2533' }}>Crea tu cuenta</h2>
              <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>
                Plan <strong style={{ color: '#1a6478' }}>{selectedPlan?.name}</strong>
                {selectedPlan && selectedPlan.price > 0 ? ` · ${selectedPlan.price}€${selectedPlan.period}` : ' · gratis para siempre'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Tu nombre</label>
                  <input style={inputStyle} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Juan Pérez" required
                    onFocus={e=>(e.target.style.borderColor='#2ab3aa')} onBlur={e=>(e.target.style.borderColor='#eef1f4')} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Nombre del restaurante o negocio</label>
                  <input style={inputStyle} value={form.restaurantName} onChange={e=>setForm(f=>({...f,restaurantName:e.target.value}))} placeholder="Ej: Restaurante El Rincón" required
                    onFocus={e=>(e.target.style.borderColor='#2ab3aa')} onBlur={e=>(e.target.style.borderColor='#eef1f4')} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="tu@email.com" required
                    onFocus={e=>(e.target.style.borderColor='#2ab3aa')} onBlur={e=>(e.target.style.borderColor='#eef1f4')} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Teléfono (opcional)</label>
                  <input style={inputStyle} type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+34 600 000 000"
                    onFocus={e=>(e.target.style.borderColor='#2ab3aa')} onBlur={e=>(e.target.style.borderColor='#eef1f4')} />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Contraseña</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Mínimo 8 caracteres" required minLength={8}
                    onFocus={e=>(e.target.style.borderColor='#2ab3aa')} onBlur={e=>(e.target.style.borderColor='#eef1f4')} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={privacyChecked} onChange={e => setPrivacyChecked(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#2ab3aa', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#5a7a87', lineHeight: 1.5 }}>
                  He leído y acepto la{' '}
                  <a href="/privacidad" target="_blank" style={{ color: '#2ab3aa', fontWeight: 600, textDecoration: 'underline' }}>política de privacidad</a>
                  {' '}y el tratamiento de mis datos personales conforme al RGPD.
                </span>
              </label>

              {error && <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight:600, marginBottom: 16 }}>⚠️ {error}</div>}

              <button type="submit" disabled={loading} style={{ width: '100%', padding: 14, background: loading ? '#ccc' : 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? '⏳ Procesando...' : isFree ? '🚀 Crear cuenta gratis →' : '💳 Ir al pago →'}
              </button>
              <p style={{ fontSize: 12, color: '#88a8b0', textAlign: 'center', marginTop: 14 }}>
                {isFree ? 'Sin tarjeta · Acceso inmediato' : 'Pago seguro con Redsys · SSL cifrado'}
              </p>
              <button type="button" onClick={() => setStep(1)} style={{ width: '100%', marginTop: 8, padding: '10px', background: 'none', border: 'none', color: '#88a8b0', fontSize: 13, cursor: 'pointer' }}>← Volver</button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
