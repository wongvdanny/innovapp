import Head from 'next/head'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { prisma } from '../../lib/prisma'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default function Admin({ stats, subscriptions, plans, redsysConfig }: any) {
  const [tab, setTab] = useState<'subs'|'restaurants'|'plans'|'redsys'|'newsletter'|'config'>('subs')
  const [subList, setSubList] = useState(subscriptions)
  const [actionId, setActionId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const showMsg = (ok: boolean, text: string) => {
    setMsg({ ok, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const cancelSub = async (s: any) => {
    if (!confirm(`¿Anular la suscripción de ${s.user.name}? Se marcará como cancelada.`)) return
    setActionId(s.id)
    const res = await fetch('/api/admin/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: s.id }),
    })
    if (res.ok) {
      setSubList((l: any[]) => l.map((x: any) => x.id === s.id ? { ...x, status: 'cancelled' } : x))
      showMsg(true, 'Suscripción anulada correctamente')
    } else {
      showMsg(false, 'Error al anular la suscripción')
    }
    setActionId(null)
  }

  const activateSub = async (s: any) => {
    if (!confirm(`¿Activar manualmente la suscripción de ${s.user.name}?`)) return
    setActionId(s.id)
    const res = await fetch('/api/admin/activate-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: s.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setSubList((l: any[]) => l.map((x: any) => x.id === s.id ? { ...x, status: 'active', servixSlug: data.slug ?? x.servixSlug } : x))
      showMsg(true, 'Suscripción activada y restaurante creado')
    } else {
      const err = await res.json().catch(() => ({}))
      showMsg(false, err.error || 'Error al activar')
    }
    setActionId(null)
  }

  const deleteRestaurant = async (s: any) => {
    if (!confirm(`¿Eliminar TODOS los datos del restaurante de ${s.user.name}? Esta acción es irreversible.`)) return
    setActionId(s.id)
    const res = await fetch('/api/admin/delete-restaurant', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: s.id }),
    })
    if (res.ok) {
      setSubList((l: any[]) => l.map((x: any) => x.id === s.id ? { ...x, servixRestaurantId: null, servixSlug: null } : x))
      showMsg(true, 'Restaurante eliminado correctamente')
    } else {
      showMsg(false, 'Error al eliminar el restaurante')
    }
    setActionId(null)
  }

  const deleteSub = async (s: any) => {
    if (!confirm(`¿Eliminar completamente el registro de ${s.user.name}? Se borrará la suscripción de la BD.`)) return
    setActionId(s.id)
    const res = await fetch('/api/admin/delete-subscription', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: s.id }),
    })
    if (res.ok) {
      setSubList((l: any[]) => l.filter((x: any) => x.id !== s.id))
      showMsg(true, 'Registro eliminado')
    } else {
      showMsg(false, 'Error al eliminar')
    }
    setActionId(null)
  }

  const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    active:    { label: 'Activa',    bg: '#f0fdf4', color: '#166534' },
    pending:   { label: 'Pendiente', bg: '#fffbeb', color: '#92400e' },
    cancelled: { label: 'Cancelada', bg: '#fff1f2', color: '#991b1b' },
    expired:   { label: 'Expirada',  bg: '#fff1f2', color: '#991b1b' },
  }

  const btnBase: React.CSSProperties = {
    padding: '5px 11px', borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid',
  }

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

        {/* Mensaje global */}
        {msg && (
          <div style={{ margin: '16px 48px 0', maxWidth: 1200, background: msg.ok ? '#f0fdf4' : '#fff1f2', border: `1px solid ${msg.ok ? '#86efac' : '#fca5a5'}`, borderRadius: 12, padding: '12px 18px', fontSize: 14, fontWeight: 600, color: msg.ok ? '#166534' : '#991b1b' }}>
            {msg.ok ? '✅' : '⚠️'} {msg.text}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, padding: '24px 48px 0', maxWidth: 1200, margin: '0 auto' }}>
          {[
            ['💳', 'Activas',          stats.active,    '#f0fdf4', '#166534'],
            ['⏳', 'Pendientes pago',  stats.pending,   '#fffbeb', '#92400e'],
            ['❌', 'Canceladas',       stats.cancelled, '#fff1f2', '#991b1b'],
            ['💰', 'MRR estimado',     `${stats.mrr}€`, '#eff6ff', '#1e40af'],
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
            {[['subs','👥 Suscriptores'],['restaurants','🏪 Restaurantes'],['plans','📦 Planes'],['redsys','💳 Redsys'],['newsletter','📧 Newsletter'],['config','⚙️ Configuración']].map(([key, label]) => (
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
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533', margin: 0 }}>Todos los suscriptores</h3>
                <span style={{ fontSize: 13, color: '#88a8b0' }}>{subList.length} registros</span>
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
                      const sm = STATUS_META[s.status] ?? { label: s.status, bg: '#f8fafb', color: '#88a8b0' }
                      const isLoading = actionId === s.id
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f0f4f6' }}>
                          <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#1a2533' }}>{s.user.name}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, color: '#88a8b0' }}>{s.user.email}</td>
                          <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1a2533' }}>{s.plan.name} · {s.plan.price}€</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ background: sm.bg, color: sm.color, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                              {sm.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#88a8b0' }} suppressHydrationWarning>
                            {s.startDate ? new Date(s.startDate).toLocaleDateString('es-ES') : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#88a8b0' }} suppressHydrationWarning>
                            {s.endDate ? new Date(s.endDate).toLocaleDateString('es-ES') : '—'}
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#1a6478', fontWeight: 600 }}>
                            {s.servixSlug
                              ? <a href={`https://servix.innovapp.es`} target="_blank" style={{ color: '#1a6478', textDecoration: 'none' }}>🌐 {s.servixSlug}</a>
                              : <span style={{ color: '#dde3e8' }}>—</span>
                            }
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {isLoading ? (
                                <span style={{ fontSize: 13, color: '#88a8b0' }}>⏳ Procesando…</span>
                              ) : (
                                <>
                                  {/* Pendiente → Anular o Activar manualmente */}
                                  {s.status === 'pending' && (
                                    <>
                                      <button onClick={() => activateSub(s)}
                                        style={{ ...btnBase, background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }}>
                                        ✅ Activar
                                      </button>
                                      <button onClick={() => cancelSub(s)}
                                        style={{ ...btnBase, background: '#fffbeb', color: '#92400e', borderColor: '#fcd34d' }}>
                                        🚫 Anular
                                      </button>
                                    </>
                                  )}

                                  {/* Activa → Cancelar */}
                                  {s.status === 'active' && (
                                    <button onClick={() => cancelSub(s)}
                                      style={{ ...btnBase, background: '#fff1f2', color: '#991b1b', borderColor: '#fca5a5' }}>
                                      ⏸ Cancelar
                                    </button>
                                  )}

                                  {/* Cancelada/Expirada → Reactivar */}
                                  {(s.status === 'cancelled' || s.status === 'expired') && (
                                    <button onClick={() => activateSub(s)}
                                      style={{ ...btnBase, background: '#f0fdf4', color: '#166534', borderColor: '#86efac' }}>
                                      ▶ Reactivar
                                    </button>
                                  )}

                                  {/* Si tiene restaurante en Servix → Eliminar restaurante */}
                                  {s.servixRestaurantId && (
                                    <button onClick={() => deleteRestaurant(s)}
                                      style={{ ...btnBase, background: '#fff1f2', color: '#991b1b', borderColor: '#fca5a5' }}>
                                      🗑️ Restaurante
                                    </button>
                                  )}

                                  {/* Siempre → Eliminar registro */}
                                  {(s.status === 'cancelled' || s.status === 'expired' || s.status === 'pending') && !s.servixRestaurantId && (
                                    <button onClick={() => deleteSub(s)}
                                      style={{ ...btnBase, background: '#f8fafb', color: '#88a8b0', borderColor: '#dde3e8' }}>
                                      🗑️ Borrar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {subList.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 48, color: '#88a8b0' }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>👥</div>
                    <p>Aún no hay suscriptores</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'restaurants' && <RestaurantsTab />}
          {tab === 'config'     && <ConfigTab />}
          {tab === 'plans'      && <PlansTab plans={plans} />}
          {tab === 'redsys'     && <RedsysTab config={redsysConfig} />}
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
  const openEdit   = (p: any) => { setEditing(p); setForm({ name:p.name, description:p.description, price:p.price, interval:p.interval, features:p.features.join('\n') }); setModal(true) }

  const save = async () => {
    setSaving(true)
    const body = { ...form, features: form.features.split('\n').filter(Boolean) }
    const url  = editing ? `/api/admin/plans/${editing.id}` : '/api/admin/plans'
    const res  = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const saved = await res.json()
    if (editing) setList(l => l.map(p => p.id === saved.id ? saved : p))
    else         setList(l => [saved, ...l])
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
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {p.features.map((f: string) => <li key={f} style={{ fontSize: 12, color: '#4a6572', display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ color: '#2ab3aa', fontWeight: 700 }}>✓</span>{f}</li>)}
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(p)}     style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eef1f4', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#1a2533' }}>✏️ Editar</button>
              <button onClick={() => toggleActive(p)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #eef1f4', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: p.active ? '#991b1b' : '#166534' }}>
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
              {[['Nombre','name','text','Ej: Mensual'],['Descripción','description','text','Sin permanencia'],['Precio (€)','price','number','99']].map(([label, key, type, ph]) => (
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
                <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} placeholder={'Mesas ilimitadas\nCarta QR\nSoporte email'} />
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
  const [form, setForm] = useState({ merchantCode: config?.merchantCode||'', secretKey: config?.secretKey||'', terminal: config?.terminal||'001', currency: config?.currency||'978', environment: config?.environment||'test' })
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
        {[['Merchant Code (FUC)','merchantCode','999008881'],['Secret Key','secretKey','sq7HjrUOBfKmC576ILgskD5srU870gJ7'],['Terminal','terminal','001'],['Moneda (978 = EUR)','currency','978']].map(([label,key,ph]) => (
          <div key={key}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#1a2533', display: 'block', marginBottom: 6 }}>{label}</label>
            <input style={inp} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={ph} type={key === 'secretKey' ? 'password' : 'text'} />
          </div>
        ))}
        {saved && <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#166534', fontWeight: 600 }}>✅ Guardado correctamente</div>}
        <button onClick={save} disabled={saving} style={{ padding: 14, background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {saving ? '⏳ Guardando...' : '💾 Guardar configuración'}
        </button>
      </div>
      {form.environment === 'test' && (
        <div style={{ marginTop: 20, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 16px' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#92400e', fontWeight: 600 }}>⚠️ Modo TEST activo — los pagos no son reales.</p>
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

  if (!loaded) {
    fetch('/api/admin/newsletter').then(r => r.json()).then(d => { setSubs(d); setLoaded(true) })
    return <div style={{ color: '#88a8b0', padding: 40 }}>Cargando...</div>
  }

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
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533' }}>Suscriptores newsletter</h3>
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
            style={{ padding: 14, background: sending||!subject||!body ? '#ccc' : 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {sending ? '⏳ Enviando...' : `📧 Enviar a ${subs.filter(s=>s.active).length} suscriptores`}
          </button>
        </div>
      </div>
    </div>
  )
}


function RestaurantsTab() {
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo,   setCustomTo]   = useState('')

  const load = async (from?: string, to?: string) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to)   params.set('to',   to)
    const r = await fetch('/api/admin/restaurants?' + params.toString())
    const d = await r.json()
    setData(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  const applyPeriod = (p: string) => {
    setPeriod(p)
    const now  = new Date()
    const from = new Date()
    if (p === '30d')  from.setDate(now.getDate() - 30)
    if (p === '6m')   from.setMonth(now.getMonth() - 6)
    if (p === '1y')   from.setFullYear(now.getFullYear() - 1)
    if (p !== 'custom') load(from.toISOString(), now.toISOString())
  }

  useEffect(() => { load() }, [])

  const totalSales  = data.reduce((a, r) => a + r.totalSales, 0)
  const totalOrders = data.reduce((a, r) => a + r.totalOrders, 0)

  const inp = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #eef1f4', fontSize: 13, outline: 'none', fontFamily: 'Plus Jakarta Sans,sans-serif' }
  const periodBtns = [['30d','30 días'],['6m','6 meses'],['1y','1 año'],['custom','Personalizado']]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Filtros periodo */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eef1f4', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2533' }}>Periodo:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {periodBtns.map(([key, label]) => (
            <button key={key} onClick={() => applyPeriod(key)}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: period === key ? 'linear-gradient(135deg,#2ab3aa,#1a6478)' : '#f0f2f5',
                color: period === key ? 'white' : '#4a6572' }}>
              {label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inp} />
            <span style={{ color: '#88a8b0', fontSize: 13 }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inp} />
            <button onClick={() => load(new Date(customFrom).toISOString(), new Date(customTo).toISOString())}
              disabled={!customFrom || !customTo}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#2ab3aa,#1a6478)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      {/* KPIs globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[
          ['🏪', 'Restaurantes activos', data.length],
          ['🧾', 'Comandas en periodo',  totalOrders],
          ['💶', 'Ventas en periodo',    totalSales.toFixed(2) + ' €'],
        ].map(([icon, label, value]) => (
          <div key={String(label)} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid #eef1f4', boxShadow: '0 2px 8px rgba(0,0,0,.04)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1a2533', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 13, color: '#88a8b0', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabla restaurantes */}
      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #eef1f4', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eef1f4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533', margin: 0 }}>Detalle por restaurante</h3>
          {loading && <span style={{ fontSize: 13, color: '#88a8b0' }}>⏳ Cargando...</span>}
        </div>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#88a8b0' }}>Cargando datos...</div>
        ) : data.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#88a8b0' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏪</div>
            <p>No hay restaurantes activos</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafb' }}>
                  {['Restaurante','Propietario','Plan','Vence','Mesas','Empleados','Comandas','Ventas'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#88a8b0', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.sort((a, b) => b.totalSales - a.totalSales).map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f0f4f6' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a2533' }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#88a8b0', marginTop: 2 }}>/{r.slug}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2533' }}>{r.owner}</div>
                      <div style={{ fontSize: 11, color: '#88a8b0' }}>{r.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: '#1a6478' }}>{r.plan}</td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#88a8b0' }} suppressHydrationWarning>
                      {r.endDate ? new Date(r.endDate).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#1a3d4f', textAlign: 'center' }}>{r.tables}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#1a3d4f', textAlign: 'center' }}>{r.employees}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#1a3d4f', textAlign: 'center' }}>{r.totalOrders}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: r.totalSales > 0 ? '#166534' : '#88a8b0' }}>
                        {r.totalSales.toFixed(2)} €
                      </div>
                      {r.totalOrders > 0 && (
                        <div style={{ fontSize: 11, color: '#88a8b0', marginTop: 2 }}>
                          {(r.totalSales / r.totalOrders).toFixed(2)} € / comanda
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


function ConfigTab() {
  const [logoPreview,    setLogoPreview]    = useState<string>('/logo.webp')
  const [faviconPreview, setFaviconPreview] = useState<string>('/favicon.ico')
  const [uploadingLogo,  setUploadingLogo]  = useState(false)
  const [uploadingFav,   setUploadingFav]   = useState(false)
  const [msg,            setMsg]            = useState<{ ok: boolean; text: string } | null>(null)

  const showMsg = (ok: boolean, text: string) => {
    setMsg({ ok, text }); setTimeout(() => setMsg(null), 4000)
  }

  const upload = async (file: File, type: 'logo' | 'favicon') => {
    if (type === 'logo')    setUploadingLogo(true)
    if (type === 'favicon') setUploadingFav(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('type', type)
    const res = await fetch('/api/admin/upload/logo', { method: 'POST', body: fd })
    const data = await res.json()
    if (res.ok) {
      if (type === 'logo')    setLogoPreview('/logo.webp?t=' + Date.now())
      if (type === 'favicon') setFaviconPreview('/favicon.ico?t=' + Date.now())
      showMsg(true, type === 'logo' ? 'Logo actualizado correctamente' : 'Favicon actualizado correctamente')
    } else {
      showMsg(false, data.error || 'Error al subir')
    }
    if (type === 'logo')    setUploadingLogo(false)
    if (type === 'favicon') setUploadingFav(false)
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { showMsg(false, 'El archivo no puede superar 2MB'); return }
    upload(file, type)
    e.target.value = ''
  }

  const card: React.CSSProperties = { background: 'white', borderRadius: 20, border: '1px solid #eef1f4', padding: 32 }
  const uploadArea: React.CSSProperties = { border: '2px dashed #d0eeec', borderRadius: 16, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: '#f0f9f8', transition: 'all .2s' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1a2533', margin: 0 }}>Configuración del sitio</h3>

      {msg && (
        <div style={{ background: msg.ok ? '#f0fdf4' : '#fff1f2', border: `1px solid ${msg.ok ? '#86efac' : '#fca5a5'}`, borderRadius: 12, padding: '12px 18px', fontSize: 14, fontWeight: 600, color: msg.ok ? '#166534' : '#991b1b' }}>
          {msg.ok ? '✅' : '⚠️'} {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Logo */}
        <div style={card}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1a2533', marginBottom: 6 }}>Logo del sitio</h4>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 20 }}>Aparece en la navegación y emails. Recomendado: .webp o .png con fondo transparente.</p>

          {/* Preview */}
          <div style={{ background: '#1a2533', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, minHeight: 80 }}>
            <img src={logoPreview} alt="Logo actual" style={{ maxHeight: 40, maxWidth: '100%', objectFit: 'contain' }} onError={() => setLogoPreview('/logo.webp')} />
          </div>

          <label style={uploadArea}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, 'logo')} />
            {uploadingLogo ? (
              <div style={{ color: '#2ab3aa', fontWeight: 600 }}>⏳ Subiendo...</div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a6478', marginBottom: 4 }}>Haz clic para subir nuevo logo</div>
                <div style={{ fontSize: 12, color: '#88a8b0' }}>PNG, WEBP, SVG · Máx 2MB</div>
              </>
            )}
          </label>
        </div>

        {/* Favicon */}
        <div style={card}>
          <h4 style={{ fontSize: 16, fontWeight: 700, color: '#1a2533', marginBottom: 6 }}>Favicon</h4>
          <p style={{ fontSize: 13, color: '#88a8b0', marginBottom: 20 }}>Icono que aparece en la pestaña del navegador. Recomendado: .ico o .png de 32×32px.</p>

          {/* Preview */}
          <div style={{ background: '#f8fafb', borderRadius: 12, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, minHeight: 80, border: '1px solid #eef1f4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={faviconPreview} alt="Favicon actual" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={() => setFaviconPreview('/favicon.ico')} />
              <span style={{ fontSize: 13, color: '#88a8b0' }}>innovapp.es</span>
            </div>
          </div>

          <label style={uploadArea}>
            <input type="file" accept="image/*,.ico" style={{ display: 'none' }} onChange={e => handleFile(e, 'favicon')} />
            {uploadingFav ? (
              <div style={{ color: '#2ab3aa', fontWeight: 600 }}>⏳ Subiendo...</div>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🌐</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a6478', marginBottom: 4 }}>Haz clic para subir nuevo favicon</div>
                <div style={{ fontSize: 12, color: '#88a8b0' }}>ICO, PNG · 32×32px · Máx 2MB</div>
              </>
            )}
          </label>
        </div>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '14px 18px' }}>
        <p style={{ margin: 0, fontSize: 13, color: '#92400e', fontWeight: 500 }}>
          ⚠️ Los cambios de logo y favicon pueden tardar unos segundos en reflejarse debido a la caché del navegador. Si no ves el cambio, recarga con <strong>Ctrl+F5</strong>.
        </p>
      </div>
    </div>
  )
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = await getSession(ctx)
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) {
    return { redirect: { destination: '/dashboard', permanent: false } }
  }

  const [subscriptions, plans, redsysConfig] = await Promise.all([
    prisma.subscription.findMany({ include: { user: true, plan: true }, orderBy: { createdAt: 'desc' } }),
    prisma.plan.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.redsysConfig.findFirst(),
  ])

  const active    = subscriptions.filter(s => s.status === 'active').length
  const pending   = subscriptions.filter(s => s.status === 'pending').length
  const cancelled = subscriptions.filter(s => s.status === 'cancelled' || s.status === 'expired').length
  const mrr = subscriptions.filter(s => s.status === 'active').reduce((acc, s) => {
    const price    = (s.plan as any).price
    const interval = (s.plan as any).interval
    return acc + (interval === 'yearly' ? price / 12 : price)
  }, 0)

  return {
    props: {
      stats: { active, pending, cancelled, mrr: Math.round(mrr) },
      subscriptions: JSON.parse(JSON.stringify(subscriptions)),
      plans:         JSON.parse(JSON.stringify(plans)),
      redsysConfig:  redsysConfig ? JSON.parse(JSON.stringify(redsysConfig)) : null,
    }
  }
}
