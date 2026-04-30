import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState } from 'react'
import Link from 'next/link'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default function Admin({ stats, subscriptions, plans, redsysConfig }: any) {
  const [tab, setTab] = useState<'subs'|'plans'|'redsys'|'newsletter'>('subs')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [subList, setSubList] = useState(subscriptions)

  return (
    <>
      <Head><title>Admin — innovapp</title></Head>
      <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1a2533,#1a3d4f)', padding: '16px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo.webp" alt="innovapp" style={{ height: 26, filter: 'brightness(0) invert(1) opacity(.8)' }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,.15)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.6)', letterSpacing: 1, textTransform: 'uppercase' }}>Panel Admin</span>
          </div>
          <Link href="/dashboard" style={{ fontSize: 13, color: 'rgba(255,255,255,.5)', fontWeight: 500 }}>← Mi cuenta</Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '32px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
          {[
            ['💳', 'Suscripciones activas', stats.active, '#f0fdf4', '#166534'],
            ['⏳', 'Pendientes de pago',   stats.pending, '#fffbeb', '#92400e'],
            ['❌', 'Canceladas',            stats.cancelled, '#fff1f2', '#991b1b'],
            ['💰', 'MRR estimado',          `${stats.mrr}€`, '#eff6ff', '#1e40af'],
          ].map(([icon, label, value, bg, color]) => (
            <div key={String(label)} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #eef1f4', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1a2533', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#88a8b0', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ padding: '24px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 4, background: 'white', border: '1px solid #eef1f4', borderRadius: 14, padding: 4, width: 'fit-content' }}>
            {[['subs','👥 Suscriptores'],['plans','📦 Planes'],['redsys','💳 Redsys'],['newsletter','📧 Newsletter']].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key as any)}
                style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  background: tab === key ? 'linear-gradient(135deg,#2ab3aa,#1a6478)' : 'transparent',
                  color: tab === key ? 'white' : '#4a6572' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '24px 48px 48px', maxWidth: 1200, margin: '0 auto' }}>

          {/* SUSCRIPTORES */}
          {tab === 'subs' && (
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533' }}>Todos los suscriptores</h3>
                <span style={{ fontSize: 13, color: '#88a8b0' }}>{subscriptions.length} total</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafb' }}>
                      {['Cliente','Email','Plan','Estado','Inicio','Vence','Restaurante','Acciones'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#88a8b0', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subList.map((s: any) => {
                      const statusColor: Record<string,string> = { active:'#166534', pending:'#92400e', cancelled:'#991b1b', expired:'#991b1b' }
                      const statusBg: Record<string,string> = { active:'#f0fdf4', pending:'#fffbeb', cancelled:'#fff1f2', expired:'#fff1f2' }
                      const statusLabel: Record<string,string> = { active:'Activa', pending:'Pendiente', cancelled:'Cancelada', expired:'Expirada' }
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f0f4f6' }}>
                          <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1a2533' }}>{s.user.name}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#88a8b0' }}>{s.user.email}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600 }}>{s.plan.name} · {s.plan.price}€</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: statusBg[s.status], color: statusColor[s.status], borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                              {statusLabel[s.status] || s.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#88a8b0' }} suppressHydrationWarning>{s.startDate ? new Date(s.startDate).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }) : '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#88a8b0' }} suppressHydrationWarning>{s.endDate ? new Date(s.endDate).toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' }) : '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#1a6478', fontWeight: 600 }}>{s.servixSlug || '—'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            {s.servixRestaurantId && (s.status === 'cancelled' || s.status === 'expired') && (
                              <button
                                onClick={async () => {
                                  if (!confirm(`¿Eliminar restaurante de ${s.user.name}? Esta acción es irreversible.`)) return
                                  setDeletingId(s.id)
                                  const res = await fetch('/api/admin/delete-restaurant', {
                                    method: 'DELETE',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ subscriptionId: s.id })
                                  })
                                  if (res.ok) setSubList((l: any[]) => l.map((x: any) => x.id === s.id ? { ...x, servixRestaurantId: null, servixSlug: null, status: 'cancelled' } : x))
                                  setDeletingId(null)
                                }}
                                disabled={deletingId === s.id}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #fca5a5', background: '#fff1f2', color: '#991b1b', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                {deletingId === s.id ? '⏳' : '🗑️ Eliminar'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {subscriptions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48, color: '#88a8b0' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                    <p>Aún no hay suscriptores</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PLANES */}
          {tab === 'plans' && <PlansTab plans={plans} />}

          {/* REDSYS */}
          {tab === 'redsys' && <RedsysTab config={redsysConfig} />}

          {/* NEWSLETTER */}
          {tab === 'newsletter' && <NewsletterTab />}

        </div>
      </div>
    </>
  )
}

function PlansTab({ plans }: { plans: any[] }) {
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name:'', description:'', price:0, interval:'monthly', features:'' })
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState(false)
  const [list, setList] = useState(plans)

  const openCreate = () => { setEditing(null); setForm({ name:'', description:'', price:0, interval:'monthly', features:'' }); setModal(true) }
  const openEdit = (p: any) => { setEditing(p); setForm({ name:p.name, description:p.description, price:p.price, interval:p.interval, features:p.features.join('\n') }); setModal(true) }

  const save = async () => {
    setSaving(true)
    const body = { ...form, features: form.features.split('\n').filter(Boolean) }
    const url = editing ? `/api/admin/plans/${editing.id}` : '/api/admin/plans'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const saved = await res.json()
    if (editing) setList(l => l.map(p => p.id === saved.id ? saved : p))
    else setList(l => [saved, ...l])
    setSaving(false); setModal(false)
  }

  const toggleActive = async (p: any) => {
    await fetch(`/api/admin/plans/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, features: p.features, active: !p.active }) })
    setList(l => l.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #eef1f4', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box' as const }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533' }}>Gestión de planes</h3>
        <button onClick={openCreate} style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Nuevo plan</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
        {list.map(p => (
          <div key={p.id} style={{ background: 'white', borderRadius: 16, border: '1px solid #eef1f4', padding: 24, opacity: p.active ? 1 : 0.6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#1a2533' }}>{p.name}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1a6478' }}>{p.price}€<span style={{ fontSize: 13, fontWeight: 500, color: '#88a8b0' }}>/{p.interval === 'monthly' ? 'mes' : 'año'}</span></div>
              </div>
              <span style={{ background: p.active ? '#f0fdf4' : '#f8fafb', color: p.active ? '#166534' : '#88a8b0', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700 }}>{p.active ? 'Activo' : 'Pausado'}</span>
            </div>
            <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 14 }}>{p.description}</p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {p.features.map((f: string) => <li key={f} style={{ fontSize: 12, color: '#4a6572', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#2ab3aa', fontWeight: 700 }}>✓</span>{f}</li>)}
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(p)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #eef1f4', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1a2533' }}>✏️ Editar</button>
              <button onClick={() => toggleActive(p)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #eef1f4', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: p.active ? '#991b1b' : '#166534' }}>
                {p.active ? '⏸ Pausar' : '▶ Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 36, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, color: '#1a2533' }}>{editing ? 'Editar plan' : 'Nuevo plan'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['Nombre', 'name', 'text', 'Ej: Mensual'],['Descripción', 'description', 'text', 'Ej: Sin permanencia'],['Precio (€)', 'price', 'number', '99']].map(([label, key, type, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>{label}</label>
                  <input style={inp} type={type} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Intervalo</label>
                <select style={inp} value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Características (una por línea)</label>
                <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder="Mesas ilimitadas&#10;Carta QR&#10;Soporte email" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #eef1f4', background: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#4a6572' }}>Cancelar</button>
              <button onClick={save} disabled={saving} style={{ flex: 2, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function RedsysTab({ config }: { config: any }) {
  const [form, setForm] = useState({
    merchantCode: config?.merchantCode || '',
    secretKey:    config?.secretKey    || '',
    terminal:     config?.terminal     || '001',
    currency:     config?.currency     || '978',
    environment:  config?.environment  || 'test',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch('/api/admin/redsys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000)
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #eef1f4', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box' as const }

  return (
    <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: 36, maxWidth: 560 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533', marginBottom: 6 }}>Configuración Redsys</h3>
      <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 28 }}>Credenciales para procesar pagos de suscripciones.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Entorno</label>
          <select style={inp} value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))}>
            <option value="test">🧪 Test (sandbox)</option>
            <option value="production">🚀 Producción (real)</option>
          </select>
        </div>
        {[['Merchant Code (FUC)', 'merchantCode', '999008881'],['Secret Key', 'secretKey', 'sq7HjrUOBfKmC576ILgskD5srU870gJ7'],['Terminal', 'terminal', '001'],['Moneda (978 = EUR)', 'currency', '978']].map(([label, key, ph]) => (
          <div key={key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>{label}</label>
            <input style={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} type={key === 'secretKey' ? 'password' : 'text'} />
          </div>
        ))}
        {saved && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 600 }}>✅ Configuración guardada</div>}
        <button onClick={save} disabled={saving} style={{ padding: 14, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? '⏳ Guardando...' : '💾 Guardar configuración'}
        </button>
      </div>
      {form.environment === 'test' && (
        <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>⚠️ Modo TEST activo — Los pagos no son reales. Cambia a Producción cuando estés listo.</p>
        </div>
      )}
    </div>
  )
}

function NewsletterTab() {
  const [subs, setSubs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = async () => {
    const r = await fetch('/api/admin/newsletter')
    const d = await r.json()
    setSubs(d); setLoaded(true)
  }

  if (!loaded) { load(); return <div style={{ color: '#88a8b0', padding: 40 }}>Cargando...</div> }

  const sendNewsletter = async () => {
    if (!subject || !body || !confirm(`¿Enviar a ${subs.filter(s=>s.active).length} suscriptores?`)) return
    setSending(true)
    await fetch('/api/admin/newsletter/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, body }) })
    setSending(false); setSent(true); setSubject(''); setBody('')
    setTimeout(() => setSent(false), 4000)
  }

  const inp = { width:'100%', padding:'11px 14px', borderRadius:10, border:'1.5px solid #eef1f4', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box' as const }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533' }}>Suscriptores</h3>
          <span style={{ background: '#f0f9f8', color: '#1a6478', borderRadius: 20, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>{subs.filter(s=>s.active).length} activos</span>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {subs.map(s => (
            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafb', borderRadius: 10 }}>
              <span style={{ fontSize: 13, color: '#1a2533' }}>{s.email}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.active ? '#166534' : '#88a8b0' }}>{s.active ? '● Activo' : '○ Baja'}</span>
            </div>
          ))}
          {subs.length === 0 && <p style={{ color: '#88a8b0', fontSize: 14, textAlign: 'center', padding: 24 }}>Sin suscriptores aún</p>}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: 28 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533', marginBottom: 20 }}>Enviar newsletter</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Asunto</label>
            <input style={inp} value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Novedades de Servix..." />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>Mensaje (HTML permitido)</label>
            <textarea style={{ ...inp, minHeight: 160, resize: 'vertical' }} value={body} onChange={e=>setBody(e.target.value)} placeholder="<p>Hola,</p><p>Queremos contarte que...</p>" />
          </div>
          {sent && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 600 }}>✅ Newsletter enviada</div>}
          <button onClick={sendNewsletter} disabled={sending || !subject || !body}
            style={{ padding: 14, background: sending || !subject || !body ? '#ccc' : 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {sending ? '⏳ Enviando...' : `📧 Enviar a ${subs.filter(s=>s.active).length} suscriptores`}
          </button>
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx)
  if (!session?.user?.email || (session.user as any).role !== 'admin') {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  const [subscriptions, plans, redsysConfig, newsletter] = await Promise.all([
    prisma.subscription.findMany({ include: { user: true, plan: true }, orderBy: { createdAt: 'desc' } }),
    prisma.plan.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.redsysConfig.findFirst(),
    prisma.newsletterSubscriber.count({ where: { active: true } }),
  ])

  const active    = subscriptions.filter(s => s.status === 'active').length
  const pending   = subscriptions.filter(s => s.status === 'pending').length
  const cancelled = subscriptions.filter(s => s.status === 'cancelled').length
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((acc, s) => {
    const price = (s.plan as any).price
    const interval = (s.plan as any).interval
    return acc + (interval === 'yearly' ? price / 12 : price)
  }, 0)

  return {
    props: {
      stats: { active, pending, cancelled, mrr: Math.round(mrr) },
      subscriptions: JSON.parse(JSON.stringify(subscriptions)),
      plans: JSON.parse(JSON.stringify(plans)),
      redsysConfig: redsysConfig ? JSON.parse(JSON.stringify(redsysConfig)) : null,
    }
  }
}
