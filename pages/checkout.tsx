import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

const PLANS: Record<string, { name: string; price: number; interval: string; features: string[] }> = {
  plan_monthly: { name: 'Plan Mensual', price: 99,  interval: 'mes',  features: ['Mesas y zonas ilimitadas','Carta QR','Pantalla de cocina','Pagos con Redsys','Informes y estadísticas','Soporte por email'] },
  plan_yearly:  { name: 'Plan Anual',   price: 990, interval: 'año',  features: ['Todo lo del plan mensual','2 meses gratis','Soporte prioritario','Onboarding personalizado'] },
}

const STEPS = ['Datos','Facturación','Confirmar']

export default function Checkout() {
  const router = useRouter()
  const planId = (router.query.plan as string) || 'plan_monthly'
  const plan   = PLANS[planId] ?? PLANS.plan_monthly

  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const [form, setForm] = useState({
    name: '', restaurantName: '', email: '', password: '', phone: '',
    company: '', nif: '',
    address: '', city: '', zip: '', country: 'España',
    acceptPrivacy: false, acceptTerms: false,
  })

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid #eef1f4', fontSize: 14, outline: 'none',
    fontFamily: 'Plus Jakarta Sans,sans-serif', boxSizing: 'border-box',
    background: '#fafbfc', transition: 'border-color .2s',
  }
  const label: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }
  const row: React.CSSProperties   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }

  const validateStep0 = () => {
    if (!form.name.trim())  return 'Introduce tu nombre completo'
    if (!form.restaurantName.trim()) return 'Introduce el nombre del restaurante'
    if (!form.email.trim() || !form.email.includes('@')) return 'Email no válido'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return ''
  }
  const validateStep1 = () => {
    if (!form.address.trim()) return 'Introduce tu dirección'
    if (!form.city.trim())    return 'Introduce tu ciudad'
    if (!form.zip.trim())     return 'Introduce el código postal'
    return ''
  }
  const validateStep2 = () => {
    if (!form.acceptPrivacy) return 'Debes aceptar la política de privacidad'
    if (!form.acceptTerms)   return 'Debes aceptar los términos de uso'
    return ''
  }

  const next = () => {
    setError('')
    let err = ''
    if (step === 0) err = validateStep0()
    if (step === 1) err = validateStep1()
    if (err) { setError(err); return }
    setStep(s => s + 1)
  }

  const submit = async () => {
    const err = validateStep2()
    if (err) { setError(err); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, restaurantName: form.restaurantName, email: form.email, password: form.password, phone: form.phone,
          planId,
          billing: { company: form.company, nif: form.nif, address: form.address, city: form.city, zip: form.zip, country: form.country },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al procesar')
      const frm = document.createElement('form')
      frm.method = 'POST'; frm.action = data.url
      Object.entries(data.body as Record<string,string>).forEach(([k,v]) => {
        const inp = document.createElement('input'); inp.type='hidden'; inp.name=k; inp.value=v; frm.appendChild(inp)
      })
      document.body.appendChild(frm); frm.submit()
    } catch (e: any) { setError(e.message); setLoading(false) }
  }

  return (
    <>
      <Head>
        <title>Checkout — Servix</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif', display: 'flex', flexDirection: 'column' }}>

        {/* Nav */}
        <header style={{ background: 'white', borderBottom: '1px solid #eef1f4', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/"><img src="/logo.webp" alt="innovapp" style={{ height: 26 }} /></Link>
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
                  background: i < step ? '#2ab3aa' : i === step ? 'linear-gradient(135deg,#1a6478,#2ab3aa)' : '#eef1f4',
                  color: i <= step ? 'white' : '#88a8b0' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: i === step ? '#1a2533' : '#88a8b0' }}>{s}</span>
                {i < STEPS.length - 1 && <div style={{ width: 32, height: 2, background: i < step ? '#2ab3aa' : '#eef1f4', borderRadius: 2, marginLeft: 6 }} />}
              </div>
            ))}
          </div>
          <Link href="/registro" style={{ fontSize: 13, color: '#88a8b0' }}>← Cambiar plan</Link>
        </header>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, padding: '40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>

          {/* Formulario */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: '36px 40px' }}>

            {/* STEP 0 — Datos personales */}
            {step === 0 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2533', marginBottom: 6 }}>Tus datos de acceso</h2>
                <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>Con estos datos accederás a Servix y a tu cuenta.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={label}>Nombre completo *</label>
                    <input style={inp} placeholder="María García López" value={form.name} onChange={e => set('name', e.target.value)} />
                  </div>
                  <div>
                    <label style={label}>Nombre del restaurante *</label>
                    <input style={inp} placeholder="Bar El Rincón, Restaurante Casa María..." value={form.restaurantName} onChange={e => set('restaurantName', e.target.value)} />
                    <p style={{ fontSize: 12, color: '#88a8b0', marginTop: 6 }}>Este será el nombre que verán tus clientes y empleados.</p>
                  </div>
                  <div>
                    <label style={label}>Email *</label>
                    <input style={inp} type="email" placeholder="maria@restaurante.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  </div>
                  <div>
                    <label style={label}>Contraseña *</label>
                    <input style={inp} type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} />
                    <p style={{ fontSize: 12, color: '#88a8b0', marginTop: 6 }}>Esta será también la contraseña de tu cuenta en Servix.</p>
                  </div>
                  <div>
                    <label style={label}>Teléfono (opcional)</label>
                    <input style={inp} placeholder="+34 600 000 000" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                </div>
              </>
            )}

            {/* STEP 1 — Facturación */}
            {step === 1 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2533', marginBottom: 6 }}>Dirección de facturación</h2>
                <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>Estos datos aparecerán en tus facturas. Si eres empresa, rellena también los campos de empresa.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={row}>
                    <div>
                      <label style={label}>Empresa (opcional)</label>
                      <input style={inp} placeholder="Mi Restaurante S.L." value={form.company} onChange={e => set('company', e.target.value)} />
                    </div>
                    <div>
                      <label style={label}>NIF / CIF (opcional)</label>
                      <input style={inp} placeholder="B12345678" value={form.nif} onChange={e => set('nif', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={label}>Dirección *</label>
                    <input style={inp} placeholder="Calle Mayor 1, 2º A" value={form.address} onChange={e => set('address', e.target.value)} />
                  </div>
                  <div style={row}>
                    <div>
                      <label style={label}>Ciudad *</label>
                      <input style={inp} placeholder="Madrid" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div>
                      <label style={label}>Código postal *</label>
                      <input style={inp} placeholder="28001" value={form.zip} onChange={e => set('zip', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label style={label}>País</label>
                    <select style={inp} value={form.country} onChange={e => set('country', e.target.value)}>
                      {['España','México','Argentina','Colombia','Chile','Perú','Uruguay'].map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* STEP 2 — Confirmar */}
            {step === 2 && (
              <>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a2533', marginBottom: 6 }}>Revisa y confirma</h2>
                <p style={{ fontSize: 14, color: '#88a8b0', marginBottom: 28 }}>Comprueba que todo es correcto antes de pagar.</p>

                {/* Resumen datos */}
                <div style={{ background: '#f8fafb', borderRadius: 14, padding: 20, marginBottom: 20, border: '1px solid #eef1f4' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#88a8b0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Tus datos</div>
                  {[['Nombre', form.name],['Restaurante', form.restaurantName],['Email', form.email],['Teléfono', form.phone || '—'],['Dirección', `${form.address}, ${form.zip} ${form.city}, ${form.country}`],
                    ...(form.company ? [['Empresa', form.company]] : []),
                    ...(form.nif ? [['NIF/CIF', form.nif]] : []),
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eef1f4', fontSize: 13 }}>
                      <span style={{ color: '#88a8b0' }}>{k}</span>
                      <span style={{ fontWeight: 600, color: '#1a2533' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* Políticas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 8 }}>
                  {[
                    { key: 'acceptPrivacy', text: <>He leído y acepto la <Link href="/privacidad" target="_blank" style={{ color: '#2ab3aa' }}>Política de Privacidad</Link> *</> },
                    { key: 'acceptTerms',   text: <>He leído y acepto los <Link href="/uso" target="_blank" style={{ color: '#2ab3aa' }}>Términos de Uso</Link> y las <Link href="/aviso-legal" target="_blank" style={{ color: '#2ab3aa' }}>Condiciones de Servicio</Link> *</> },
                  ].map(({ key, text }) => (
                    <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                      <div onClick={() => set(key, !(form as any)[key])}
                        style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${(form as any)[key] ? '#2ab3aa' : '#dde3e8'}`,
                          background: (form as any)[key] ? '#2ab3aa' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all .15s' }}>
                        {(form as any)[key] && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 13, color: '#4a6572', lineHeight: 1.5 }}>{text}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div style={{ background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#991b1b', fontWeight: 600, marginTop: 20 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
              {step > 0 && (
                <button onClick={() => { setStep(s => s - 1); setError('') }}
                  style={{ padding: '13px 20px', borderRadius: 12, border: '1.5px solid #eef1f4', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#4a6572' }}>
                  ← Atrás
                </button>
              )}
              {step < 2 ? (
                <button onClick={next}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1a6478,#2ab3aa)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Continuar →
                </button>
              ) : (
                <button onClick={submit} disabled={loading}
                  style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#ccc' : 'linear-gradient(135deg,#1a6478,#2ab3aa)', color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? '⏳ Redirigiendo al pago...' : '💳 Pagar ' + plan.price + '€ — ' + plan.name}
                </button>
              )}
            </div>
          </div>

          {/* Sidebar resumen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#88a8b0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Resumen del pedido</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1a2533', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#1a6478', marginBottom: 4 }}>
                {plan.price}€ <span style={{ fontSize: 14, fontWeight: 500, color: '#88a8b0' }}>/ {plan.interval}</span>
              </div>
              {planId === 'plan_yearly' && (
                <div style={{ fontSize: 12, color: '#d97706', fontWeight: 600, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 10px', marginBottom: 16, display: 'inline-block' }}>
                  ⭐ Ahorras 198€ vs mensual
                </div>
              )}
              <div style={{ borderTop: '1px solid #eef1f4', paddingTop: 16, marginTop: 16 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 13, color: '#4a6572' }}>
                    <span style={{ color: '#2ab3aa', fontWeight: 700, flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #eef1f4', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#1a2533' }}>
                <span>Total</span><span>{plan.price}€</span>
              </div>
              <div style={{ fontSize: 11, color: '#88a8b0', marginTop: 6, textAlign: 'right' }}>IVA incluido</div>
            </div>

            {/* Seguridad */}
            <div style={{ background: '#f0f9f8', borderRadius: 16, border: '1px solid #d0eeec', padding: 20 }}>
              {[['🔒','Pago seguro con Redsys'],['↩','Cancela cuando quieras'],['📧','Soporte por email incluido'],['⚡','Acceso inmediato tras el pago']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13, color: '#1a6478', fontWeight: 500 }}>
                  <span>{icon}</span><span>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#88a8b0', textAlign: 'center', lineHeight: 1.6 }}>
              Al finalizar recibirás un email con todos los datos de acceso a tu restaurante.
            </div>
          </div>
        </div>

        {/* Footer legal */}
        <footer style={{ borderTop: '1px solid #eef1f4', padding: '20px 40px', background: 'white', display: 'flex', justifyContent: 'center', gap: 24 }}>
          {[['Aviso Legal','/aviso-legal'],['Privacidad','/privacidad'],['Cookies','/cookies'],['Términos de Uso','/uso']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontSize: 12, color: '#88a8b0', textDecoration: 'none' }}>{label}</Link>
          ))}
        </footer>
      </div>
    </>
  )
}
