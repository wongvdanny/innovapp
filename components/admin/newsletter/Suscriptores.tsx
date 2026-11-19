import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Column, DataTable, EmptyState, Field, Modal, Notice, Section, Tono, fecha, useFlash } from '../ui'
import { ESTADOS, MEDIOS, ORIGENES, SECTORES } from '../../../lib/newsletter/tipos'

const TONO: Record<string, Tono> = { pendiente: 'warn', confirmado: 'ok', baja: 'neutro', rebotado: 'err' }
const fechaHora = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—')

async function api(url: string, method = 'GET', body?: unknown) {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const d = await r.json().catch(() => ({}))
  return r.ok ? { ok: true as const, d } : { ok: false as const, error: d.error || `Error ${r.status}` }
}

function AltaManual({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: () => void }) {
  const [f, setF] = useState({ email: '', nombre: '', empresa: '', sector: 'otro', medio: '', nota: '' })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }))
  const guardar = async () => {
    setError('')
    const r = await api('/api/admin/newsletter/suscriptores', 'POST', f)
    if (r.ok) onHecho(); else setError(r.error)
  }
  return (
    <Modal title="Alta manual" onClose={onCerrar} width={560}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Notice tone="info">Solo para personas que te han dado su permiso. Queda registrado cómo lo dieron y quién hizo el alta; entra como «confirmado».</Notice>
        <div className="adm-grid" style={{ ['--min' as any]: '220px', gap: 14 }}>
          <Field label="Email *"><input className="adm-input" type="email" value={f.email} onChange={e => set('email', e.target.value)} /></Field>
          <Field label="Nombre"><input className="adm-input" value={f.nombre} onChange={e => set('nombre', e.target.value)} /></Field>
          <Field label="Empresa"><input className="adm-input" value={f.empresa} onChange={e => set('empresa', e.target.value)} /></Field>
          <Field label="Sector">
            <select className="adm-input" value={f.sector} onChange={e => set('sector', e.target.value)}>{Object.entries(SECTORES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
        </div>
        <Field label="¿Cómo dio su consentimiento? *">
          <select className="adm-input" value={f.medio} onChange={e => set('medio', e.target.value)}>
            <option value="">Elige…</option>
            {Object.entries(MEDIOS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label={`Nota${f.medio === 'otro' ? ' *' : ''}`} help="Cuándo y cómo (p. ej. «Reunión del 18/11 en su oficina; pidió recibir las novedades»)">
          <textarea className="adm-input" style={{ minHeight: 70 }} value={f.nota} onChange={e => set('nota', e.target.value)} />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variant="primario" onClick={guardar} disabled={!f.email || !f.medio}>Dar de alta</Button>
        </div>
      </div>
    </Modal>
  )
}

function Importar({ onCerrar, onHecho }: { onCerrar: () => void; onHecho: (msg: string) => void }) {
  const [csv, setCsv] = useState('')
  const [previa, setPrevia] = useState<any>(null)
  const [error, setError] = useState('')
  const leer = async (file?: File) => { if (file) { setCsv(await file.text()); setPrevia(null); setError('') } }
  const comprobar = async () => {
    setError('')
    const r = await api('/api/admin/newsletter/importar', 'POST', { csv })
    if (r.ok) setPrevia(r.d); else setError(r.error)
  }
  const importar = async () => {
    const r = await api('/api/admin/newsletter/importar', 'POST', { csv, confirmar: true })
    if (r.ok) onHecho(`${r.d.creados} importado(s)${r.d.omitidos.length ? `, ${r.d.omitidos.length} ya existían o se habían dado de baja` : ''}${r.d.rechazadas.length ? `, ${r.d.rechazadas.length} fila(s) rechazada(s)` : ''}.`)
    else setError(r.error)
  }
  return (
    <Modal title="Importar CSV" onClose={onCerrar} width={620}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Notice tone="info">
          Columnas: <strong>email</strong> y <strong>consentimiento</strong> (obligatorias), y opcionales nombre, empresa, sector y consentimiento_fecha (dd/mm/aaaa).
          En «consentimiento» va cómo y cuándo dio su permiso cada persona: <strong>las filas sin consentimiento se rechazan</strong>.
          Los emails que ya existen (o que se dieron de baja) no se tocan.
        </Notice>
        <input type="file" accept=".csv,text/csv" onChange={e => leer(e.target.files?.[0])} className="adm-input" />
        {csv && !previa && <Button variant="primario" onClick={comprobar}>Comprobar archivo</Button>}
        {previa && (
          <>
            <Notice tone={previa.validas ? 'ok' : 'aviso'}>{previa.validas} fila(s) válida(s) · {previa.rechazadas.length} rechazada(s)</Notice>
            {previa.rechazadas.length > 0 && (
              <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 13 }}>
                {previa.rechazadas.map((r: any) => <div key={r.linea} className="adm-muted">Línea {r.linea}: {r.motivo}</div>)}
              </div>
            )}
          </>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variant="primario" onClick={importar} disabled={!previa?.validas}>Importar {previa?.validas ?? ''}</Button>
        </div>
      </div>
    </Modal>
  )
}

function Ficha({ id, onCerrar, onCambio }: { id: string; onCerrar: () => void; onCambio: () => void }) {
  const [s, setS] = useState<any>(null)
  const cargar = () => api(`/api/admin/newsletter/suscriptores/${id}`).then(r => r.ok && setS(r.d))
  useEffect(() => { cargar() }, [id])
  const confirmacion = async () => {
    const r = await api(`/api/admin/newsletter/suscriptores/${id}`, 'POST', { accion: 'confirmacion' })
    if (r.ok) cargar(); else alert(r.error)
  }
  const baja = async () => {
    if (!confirm(`¿Dar de baja a ${s.email}? Solo podrá volver suscribiéndose desde la web.`)) return
    const r = await api(`/api/admin/newsletter/suscriptores/${id}`, 'POST', { accion: 'baja' })
    if (r.ok) { cargar(); onCambio() }
  }
  return (
    <Modal title={s?.email ?? 'Suscriptor'} onClose={onCerrar} width={640}>
      {!s ? <EmptyState title="Cargando…" /> : (
        <div className="adm-stack" style={{ gap: 16 }}>
          <div className="adm-fila"><Badge tone={TONO[s.estado]}>{ESTADOS[s.estado as keyof typeof ESTADOS]}</Badge><Badge>{ORIGENES[s.origen as keyof typeof ORIGENES]}</Badge><Badge>{SECTORES[s.sector as keyof typeof SECTORES]}</Badge></div>
          <Section title="Prueba del consentimiento">
            <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', margin: 0, fontSize: 13 }}>
              <dt className="adm-muted">Texto</dt><dd style={{ margin: 0 }}>{s.consentimiento_texto}</dd>
              <dt className="adm-muted">Fecha</dt><dd style={{ margin: 0 }}>{fechaHora(s.consentimiento_fecha)}</dd>
              <dt className="adm-muted">IP</dt><dd style={{ margin: 0 }}>{s.consentimiento_ip ?? '—'}</dd>
              {s.consentimiento_medio && <><dt className="adm-muted">Medio</dt><dd style={{ margin: 0 }}>{MEDIOS[s.consentimiento_medio as keyof typeof MEDIOS]}{s.consentimiento_nota ? ` · ${s.consentimiento_nota}` : ''}</dd></>}
              <dt className="adm-muted">Confirmado</dt><dd style={{ margin: 0 }}>{fechaHora(s.confirmado_at)}</dd>
              {s.baja_at && <><dt className="adm-muted">Baja</dt><dd style={{ margin: 0 }}>{fechaHora(s.baja_at)} ({s.baja_motivo})</dd></>}
            </dl>
          </Section>
          <Section title="Historial" padded={false}>
            <DataTable rows={s.historial} rowKey={(h: any) => String(h.id)} columns={[
              { key: 'f', header: 'Fecha', render: (h: any) => fechaHora(h.created_at) },
              { key: 'a', header: 'Acción', render: (h: any) => <strong>{h.accion}</strong> },
              { key: 'q', header: 'Quién', render: (h: any) => <span className="adm-muted">{h.usuario ?? (h.ip ? `IP ${h.ip}` : 'el suscriptor / Resend')}</span> },
            ]} />
          </Section>
          <div className="adm-fila">
            {s.estado === 'pendiente' && <Button onClick={confirmacion}>{s.confirmacion_enviada_at ? 'Reenviar' : 'Enviar'} correo de confirmación</Button>}
            {['confirmado', 'pendiente'].includes(s.estado) && <Button variant="peligro" onClick={baja}>Dar de baja</Button>}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default function Suscriptores() {
  const [filtros, setFiltros] = useState({ estado: '', sector: '', origen: '', q: '' })
  const [datos, setDatos] = useState<{ lista: any[]; totales: Record<string, number> } | null>(null)
  const [modal, setModal] = useState<'alta' | 'importar' | null>(null)
  const [ficha, setFicha] = useState<string | null>(null)
  const { show, Flash } = useFlash()
  const qs = useMemo(() => new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString(), [filtros])
  const cargar = () => api(`/api/admin/newsletter/suscriptores?${qs}`).then(r => r.ok && setDatos(r.d))
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t) }, [qs])
  const set = (k: string, v: string) => setFiltros(f => ({ ...f, [k]: v }))
  const [sinConfirmacion, setSinConfirmacion] = useState(0)
  useEffect(() => { api('/api/admin/newsletter/suscriptores/confirmaciones').then(r => r.ok && setSinConfirmacion(r.d.pendientes)) }, [datos])
  const enviarConfirmaciones = async () => {
    if (!confirm(`¿Enviar el correo de confirmación a ${sinConfirmacion} pendiente(s) que nunca lo recibieron? Si no confirman, no recibirán nada.`)) return
    const r = await api('/api/admin/newsletter/suscriptores/confirmaciones', 'POST')
    if (r.ok) show(!r.d.errores.length, `${r.d.enviadas} correo(s) de confirmación enviado(s)${r.d.errores.length ? `; fallaron ${r.d.errores.length}` : ''}`)
    else show(false, r.error)
    cargar()
  }

  const columnas: Column<any>[] = [
    { key: 'e', header: 'Suscriptor', render: s => <><div className="adm-fuerte">{s.email}</div><div className="adm-muted adm-peq">{[s.nombre, s.empresa].filter(Boolean).join(' · ') || '—'}</div></> },
    { key: 's', header: 'Sector', render: s => SECTORES[s.sector as keyof typeof SECTORES] },
    { key: 'st', header: 'Estado', render: s => <Badge tone={TONO[s.estado]}>{ESTADOS[s.estado as keyof typeof ESTADOS]}</Badge> },
    { key: 'o', header: 'Origen', render: s => <span className="adm-muted">{ORIGENES[s.origen as keyof typeof ORIGENES]}{s.consentimiento_medio ? ` · ${MEDIOS[s.consentimiento_medio as keyof typeof MEDIOS]}` : ''}</span> },
    { key: 'c', header: 'Consentimiento', render: s => <span className="adm-muted" suppressHydrationWarning>{fecha(s.consentimiento_fecha)}</span> },
  ]
  const t = datos?.totales ?? {}

  return (
    <div className="adm-stack">
      <Flash />
      {sinConfirmacion > 0 && (
        <Notice tone="aviso">
          {sinConfirmacion} suscriptor(es) pendiente(s) nunca han recibido el correo de confirmación (p. ej. los del formulario antiguo).{' '}
          <Button small onClick={enviarConfirmaciones}>Enviar confirmación</Button>
        </Notice>
      )}
      <div className="adm-fila">
        {Object.entries(ESTADOS).map(([k, l]) => <Badge key={k} tone={TONO[k]}>{l}: {t[k] ?? 0}</Badge>)}
      </div>
      <Section padded={false} title="Suscriptores" subtitle="Solo los «confirmados» reciben campañas."
        actions={<div className="adm-fila">
          <Button onClick={() => setModal('importar')}>Importar CSV</Button>
          <a className="adm-btn" href={`/api/admin/newsletter/exportar?${qs}`} download>Exportar CSV</a>
          <Button variant="primario" onClick={() => setModal('alta')}>+ Alta manual</Button>
        </div>}>
        <div className="adm-filtros" style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
          <input className="adm-input" style={{ width: 220 }} placeholder="Buscar email, nombre o empresa…" value={filtros.q} onChange={e => set('q', e.target.value)} aria-label="Buscar" />
          {([['estado', ESTADOS, 'Todos los estados'], ['sector', SECTORES, 'Todos los sectores'], ['origen', ORIGENES, 'Todos los orígenes']] as const).map(([k, opciones, todos]) => (
            <select key={k} className="adm-input" style={{ width: 'auto' }} value={(filtros as any)[k]} onChange={e => set(k, e.target.value)} aria-label={todos}>
              <option value="">{todos}</option>
              {Object.entries(opciones).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>
        {!datos ? <EmptyState title="Cargando…" /> : (
          <DataTable columns={columnas} rows={datos.lista} rowKey={s => s.id} onRowClick={s => setFicha(s.id)}
            empty={<EmptyState icon="📧" title="Ningún suscriptor con estos filtros" />} />
        )}
      </Section>
      {modal === 'alta' && <AltaManual onCerrar={() => setModal(null)} onHecho={() => { setModal(null); show(true, 'Suscriptor dado de alta'); cargar() }} />}
      {modal === 'importar' && <Importar onCerrar={() => setModal(null)} onHecho={m => { setModal(null); show(true, m); cargar() }} />}
      {ficha && <Ficha id={ficha} onCerrar={() => setFicha(null)} onCambio={cargar} />}
    </div>
  )
}
