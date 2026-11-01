import { useEffect, useState } from 'react'
import { Badge, Button, EmptyState, Field, Notice, Section } from '../ui'

interface Suscriptor { id: string; email: string; active: boolean }

export default function Newsletter() {
  const [subs, setSubs] = useState<Suscriptor[] | null>(null)
  const [error, setError] = useState('')
  const [asunto, setAsunto] = useState('')
  const [cuerpo, setCuerpo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/newsletter')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then(setSubs)
      .catch(e => setError(e.message))
  }, [])

  const activos = subs?.filter(s => s.active).length ?? 0

  const enviar = async () => {
    if (!asunto || !cuerpo || !confirm(`¿Enviar a ${activos} suscriptores?`)) return
    setEnviando(true)
    const res = await fetch('/api/admin/newsletter/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: asunto, body: cuerpo }) })
    const data = await res.json().catch(() => ({}))
    setEnviando(false)
    if (res.ok) { setResultado(`✅ Newsletter enviada a ${data.sent ?? '?'} suscriptores`); setAsunto(''); setCuerpo('') }
    else setResultado('⚠️ No se ha podido enviar')
    setTimeout(() => setResultado(null), 5000)
  }

  if (error) return <Notice tone="error">⚠️ {error}</Notice>
  if (!subs) return <EmptyState title="Cargando…" />

  return (
    <div className="adm-grid" style={{ ['--min' as any]: '340px', alignItems: 'start' }}>
      <Section title="Suscriptores" actions={<Badge tone="info">{activos} activos</Badge>}>
        {subs.length === 0 ? <EmptyState icon="📧" title="Sin suscriptores aún" /> : (
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {subs.map(s => (
              <div key={s.id} className="adm-lista-item">
                <span>{s.email}</span>
                <span className="adm-peq adm-fuerte" style={{ color: s.active ? 'var(--adm-ok)' : 'var(--adm-faint)' }}>{s.active ? '● Activo' : '○ Baja'}</span>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Enviar newsletter">
        <div className="adm-stack" style={{ gap: 14 }}>
          <Field label="Asunto"><input className="adm-input" value={asunto} onChange={e => setAsunto(e.target.value)} placeholder="Novedades de innovapp…" /></Field>
          <Field label="Mensaje (HTML permitido)">
            <textarea className="adm-input" style={{ minHeight: 160, resize: 'vertical' }} value={cuerpo} onChange={e => setCuerpo(e.target.value)} placeholder="<p>Hola,</p><p>Queremos contarte que…</p>" />
          </Field>
          {resultado && <Notice tone={resultado.startsWith('✅') ? 'ok' : 'error'}>{resultado}</Notice>}
          <Button variant="primario" onClick={enviar} disabled={enviando || !asunto || !cuerpo}>{enviando ? '⏳ Enviando…' : `📧 Enviar a ${activos} suscriptores`}</Button>
        </div>
      </Section>
    </div>
  )
}
