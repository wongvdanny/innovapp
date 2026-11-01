import { useState } from 'react'
import { Badge, Button, EmptyState, Field, Modal, Notice, Section } from '../ui'
import { INTERVALO_TEXTO } from '../../../lib/admin/productos'

interface Plan { id: string; name: string; description: string; price: number; interval: string; active: boolean; features: string[]; productId: string | null }

const VACIO = { name: '', description: '', price: 0, interval: 'monthly', features: '' }

/** Planes de un producto. Todo plan nuevo se crea con el productId del producto. */
export default function Planes({ planes, producto }: { planes: Plan[]; producto: { id: string; name: string } }) {
  const [lista, setLista] = useState(planes)
  const [editando, setEditando] = useState<Plan | null>(null)
  const [form, setForm] = useState(VACIO)
  const [modal, setModal] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const abrirNuevo = () => { setEditando(null); setForm(VACIO); setError(''); setModal(true) }
  const abrirEditar = (p: Plan) => {
    setEditando(p); setError('')
    setForm({ name: p.name, description: p.description, price: p.price, interval: p.interval, features: p.features.join('\n') })
    setModal(true)
  }

  const guardar = async () => {
    setGuardando(true); setError('')
    const cuerpo = { ...form, features: form.features.split('\n').map(f => f.trim()).filter(Boolean), productId: producto.id }
    const res = await fetch(editando ? `/api/admin/plans/${editando.id}` : '/api/admin/plans', {
      method: editando ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
    })
    const guardado = await res.json().catch(() => ({}))
    setGuardando(false)
    if (!res.ok) { setError(guardado.error || `Error ${res.status}`); return }
    setLista(l => (editando ? l.map(p => (p.id === guardado.id ? guardado : p)) : [...l, guardado]))
    setModal(false)
  }

  const alternarActivo = async (p: Plan) => {
    const res = await fetch(`/api/admin/plans/${p.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active: !p.active }) })
    if (res.ok) setLista(l => l.map(x => (x.id === p.id ? { ...x, active: !x.active } : x)))
  }

  const precio = (p: Plan) => (p.interval === 'free' ? 'Gratis' : `${p.price}€/${INTERVALO_TEXTO[p.interval] ?? p.interval}`)

  return (
    <Section title={`Planes de ${producto.name}`} subtitle={`${lista.length} planes`} actions={<Button variant="primario" onClick={abrirNuevo}>+ Nuevo plan</Button>}>
      {lista.length === 0 ? <EmptyState icon="📦" title="Este producto aún no tiene planes" /> : (
        <div className="adm-grid" style={{ ['--min' as any]: '260px' }}>
          {lista.map(p => (
            <div key={p.id} className="adm-kpi" style={{ opacity: p.active ? 1 : 0.6 }}>
              <div className="adm-fila" style={{ justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--adm-accent)' }}>{precio(p)}</div>
                </div>
                <Badge tone={p.active ? 'ok' : 'neutro'}>{p.active ? 'Activo' : 'Pausado'}</Badge>
              </div>
              {p.description && <p className="adm-muted" style={{ fontSize: 13, margin: '0 0 10px' }}>{p.description}</p>}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {p.features.map(f => <li key={f} style={{ fontSize: 12, display: 'flex', gap: 6 }}><span style={{ color: 'var(--adm-accent)', fontWeight: 700 }}>✓</span>{f}</li>)}
              </ul>
              <div className="adm-fila">
                <Button small onClick={() => abrirEditar(p)}>Editar</Button>
                <Button small variant={p.active ? 'peligro' : 'exito'} onClick={() => alternarActivo(p)}>{p.active ? 'Pausar' : 'Activar'}</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title={editando ? 'Editar plan' : `Nuevo plan de ${producto.name}`} onClose={() => setModal(false)} width={480}>
          <div className="adm-stack" style={{ gap: 14 }}>
            <Field label="Nombre"><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Mensual" /></Field>
            <Field label="Descripción"><input className="adm-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Sin permanencia" /></Field>
            <Field label="Precio (€, IVA incluido)"><input className="adm-input" type="number" min={0} step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} /></Field>
            <Field label="Intervalo">
              <select className="adm-input" value={form.interval} onChange={e => setForm(f => ({ ...f, interval: e.target.value }))}>
                <option value="monthly">Mensual</option>
                <option value="yearly">Anual</option>
                <option value="free">Gratis</option>
                {form.interval === 'month' && <option value="month">Mensual (month)</option>}
              </select>
            </Field>
            <Field label="Características (una por línea)">
              <textarea className="adm-input" style={{ minHeight: 100, resize: 'vertical' }} value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
              <Button onClick={() => setModal(false)}>Cancelar</Button>
              <Button variant="primario" onClick={guardar} disabled={guardando || !form.name}>{guardando ? 'Guardando…' : 'Guardar plan'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </Section>
  )
}
