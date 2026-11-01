import { useState } from 'react'
import { Button, Field, Notice, Section, Toggle } from '../ui'

// Las configuraciones llegan sin secretos: solo hasSecretKey / hasWebhookSecret.
export interface RedsysPublico { merchantCode: string; terminal: string; currency: string; environment: string; enabled: boolean; hasSecretKey: boolean }
export interface StripePublico { publishableKey: string; environment: string; enabled: boolean; hasSecretKey: boolean; hasWebhookSecret: boolean }

function Entorno({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Field label="Entorno">
      <select className="adm-input" value={valor} onChange={e => onChange(e.target.value)}>
        <option value="test">🧪 Test (sandbox)</option>
        <option value="production">🚀 Producción (real)</option>
      </select>
    </Field>
  )
}

function useGuardar(url: string) {
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok' | 'error'>('')
  const guardar = async (cuerpo: unknown) => {
    setEstado('guardando')
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
    setEstado(res.ok ? 'ok' : 'error')
    setTimeout(() => setEstado(''), 3000)
    return res.ok ? res.json() : null
  }
  return { estado, guardar }
}

function Resultado({ estado }: { estado: string }) {
  if (estado === 'ok') return <Notice tone="ok">✅ Guardado correctamente</Notice>
  if (estado === 'error') return <Notice tone="error">⚠️ No se ha podido guardar</Notice>
  return null
}

function Redsys({ config }: { config: RedsysPublico | null }) {
  const [form, setForm] = useState({
    merchantCode: config?.merchantCode || '', terminal: config?.terminal || '001', currency: config?.currency || '978',
    environment: config?.environment || 'test', enabled: config?.enabled ?? true, secretKey: '',
  })
  const [hasSecretKey, setHasSecretKey] = useState(!!config?.hasSecretKey)
  const { estado, guardar } = useGuardar('/api/admin/redsys')

  const enviar = async () => {
    const { secretKey, ...resto } = form
    const r = await guardar(secretKey.trim() ? form : resto)
    if (r) { setHasSecretKey(!!r.hasSecretKey); setForm(f => ({ ...f, secretKey: '' })) }
  }

  return (
    <Section title="Redsys" subtitle="Pago con tarjeta para las suscripciones."
      actions={<Toggle value={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} label={form.enabled ? 'Activo' : 'Inactivo'} />}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Entorno valor={form.environment} onChange={v => setForm(f => ({ ...f, environment: v }))} />
        {([['Merchant Code (FUC)', 'merchantCode', '999008881'], ['Terminal', 'terminal', '001'], ['Moneda (978 = EUR)', 'currency', '978']] as const).map(([label, clave, ph]) => (
          <Field key={clave} label={label}><input className="adm-input" value={form[clave]} onChange={e => setForm(f => ({ ...f, [clave]: e.target.value }))} placeholder={ph} /></Field>
        ))}
        <Field label={<>Secret Key {hasSecretKey && <span style={{ color: 'var(--adm-ok)' }}>· configurada ✓</span>}</>}>
          <input className="adm-input" type="password" autoComplete="new-password" value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
            placeholder={hasSecretKey ? 'Dejar en blanco para no cambiarla' : 'Clave SHA-256 del comercio'} />
        </Field>
        {form.environment === 'test' && <Notice tone="aviso">⚠️ Modo TEST: los pagos no son reales y no se facturan.</Notice>}
        <Resultado estado={estado} />
        <Button variant="primario" onClick={enviar} disabled={estado === 'guardando'}>{estado === 'guardando' ? 'Guardando…' : 'Guardar Redsys'}</Button>
      </div>
    </Section>
  )
}

function Stripe({ config }: { config: StripePublico | null }) {
  const [form, setForm] = useState({
    publishableKey: config?.publishableKey || '', environment: config?.environment || 'test', enabled: config?.enabled ?? false,
    secretKey: '', webhookSecret: '',
  })
  const [tiene, setTiene] = useState({ secretKey: !!config?.hasSecretKey, webhookSecret: !!config?.hasWebhookSecret })
  const { estado, guardar } = useGuardar('/api/admin/stripe')

  const enviar = async () => {
    const { secretKey, webhookSecret, ...resto } = form
    const cuerpo: Record<string, unknown> = { ...resto }
    if (secretKey.trim()) cuerpo.secretKey = secretKey
    if (webhookSecret.trim()) cuerpo.webhookSecret = webhookSecret
    const r = await guardar(cuerpo)
    if (r) { setTiene({ secretKey: !!r.hasSecretKey, webhookSecret: !!r.hasWebhookSecret }); setForm(f => ({ ...f, secretKey: '', webhookSecret: '' })) }
  }

  return (
    <Section title="Stripe" subtitle="Pagos de suscripciones vía Stripe."
      actions={<Toggle value={form.enabled} onChange={v => setForm(f => ({ ...f, enabled: v }))} label={form.enabled ? 'Activo' : 'Inactivo'} />}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Entorno valor={form.environment} onChange={v => setForm(f => ({ ...f, environment: v }))} />
        <Field label="Publishable Key"><input className="adm-input" value={form.publishableKey} onChange={e => setForm(f => ({ ...f, publishableKey: e.target.value }))} placeholder="pk_live_..." /></Field>
        <Field label={<>Secret Key {tiene.secretKey && <span style={{ color: 'var(--adm-ok)' }}>· configurada ✓</span>}</>}>
          <input className="adm-input" type="password" autoComplete="new-password" value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
            placeholder={tiene.secretKey ? 'Dejar en blanco para no cambiarla' : 'sk_live_...'} />
        </Field>
        <Field label={<>Webhook Signing Secret {tiene.webhookSecret && <span style={{ color: 'var(--adm-ok)' }}>· configurado ✓</span>}</>}>
          <input className="adm-input" type="password" autoComplete="new-password" value={form.webhookSecret} onChange={e => setForm(f => ({ ...f, webhookSecret: e.target.value }))}
            placeholder={tiene.webhookSecret ? 'Dejar en blanco para no cambiarlo' : 'whsec_...'} />
        </Field>
        {form.environment === 'test' && <Notice tone="aviso">⚠️ Modo TEST: los pagos no son reales.</Notice>}
        {form.enabled && (!form.publishableKey || !tiene.secretKey) && (
          <Notice tone="error">⚠️ Faltan credenciales: aunque esté activo, el checkout no ofrecerá Stripe hasta que haya Publishable Key y Secret Key.</Notice>
        )}
        <Resultado estado={estado} />
        <Button variant="primario" onClick={enviar} disabled={estado === 'guardando'}>{estado === 'guardando' ? 'Guardando…' : 'Guardar Stripe'}</Button>
      </div>
    </Section>
  )
}

export default function Pagos({ redsys, stripe }: { redsys: RedsysPublico | null; stripe: StripePublico | null }) {
  return (
    <div className="adm-grid" style={{ ['--min' as any]: '360px', alignItems: 'start' }}>
      <Redsys config={redsys} />
      <Stripe config={stripe} />
    </div>
  )
}
