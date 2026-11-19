import { useEffect, useState } from 'react'
import { Badge, Button, Column, DataTable, EmptyState, Field, Modal, Notice, Section, Tono, useFlash } from '../ui'
import { ESTADOS_CAMPANA, SECTORES } from '../../../lib/newsletter/tipos'

const TONO: Record<string, Tono> = { borrador: 'neutro', programada: 'info', enviando: 'warn', enviada: 'ok', cancelada: 'neutro' }
const fechaHora = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—')
const AYUDA = 'Markdown sencillo: # Título, **negrita**, *cursiva*, [texto](https://…), listas con - y líneas en blanco entre párrafos. Variables: {{nombre}} y {{empresa}}; con texto alternativo si falta el dato: {{empresa|la tuya}}. La firma con el enlace de baja se añade sola.'

async function api(url: string, method = 'GET', body?: unknown) {
  const r = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined })
  const d = await r.json().catch(() => ({}))
  return r.ok ? { ok: true as const, d } : { ok: false as const, error: d.error || `Error ${r.status}` }
}

function Editor({ campana, onCerrar, onCambio }: { campana: any | null; onCerrar: () => void; onCambio: (msg?: string) => void }) {
  const [c, setC] = useState<any>(campana ?? { asunto: '', cuerpo_md: 'Hola {{nombre}},\n\n', sectores: [], estado: 'borrador' })
  const [previa, setPrevia] = useState<any>(null)
  const [verTexto, setVerTexto] = useState(false)
  const [cuando, setCuando] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null)
  const [trabajando, setTrabajando] = useState(false)
  const editable = ['borrador', 'programada'].includes(c.estado)
  const [archivo, setArchivo] = useState<any>(campana?.newsletter_archivos ?? null)
  const subirArchivo = async (file?: File) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setMsg({ ok: false, texto: 'El archivo supera el máximo de 5 MB' }); return }
    const g = c.id ? c : await guardar(); if (!g) return
    const fd = new FormData(); fd.append('archivo', file)
    setTrabajando(true)
    const r = await fetch(`/api/admin/newsletter/campanas/${g.id}/archivo`, { method: 'POST', body: fd })
    const d = await r.json().catch(() => ({}))
    setTrabajando(false)
    if (r.ok) { setArchivo(d); setMsg({ ok: true, texto: 'PDF guardado' }); refrescarPrevia(g) } else setMsg({ ok: false, texto: d.error || 'No se ha podido subir' })
  }
  const quitarArchivo = async () => {
    const r = await api(`/api/admin/newsletter/campanas/${c.id}/archivo`, 'DELETE')
    if (r.ok) { setArchivo(null); refrescarPrevia(c) } else setMsg({ ok: false, texto: r.error })
  }
  const refrescarPrevia = (x: any) => api('/api/admin/newsletter/campanas/vista-previa', 'POST', x).then(r => r.ok && setPrevia(r.d))

  useEffect(() => {
    const t = setTimeout(() => { if (c.asunto.trim()) refrescarPrevia(c) }, 400)
    return () => clearTimeout(t)
  }, [c.asunto, c.cuerpo_md, JSON.stringify(c.sectores)])

  const paso = async (fn: () => Promise<{ ok: boolean; d?: any; error?: string }>, exito: string) => {
    setTrabajando(true); setMsg(null)
    const r = await fn()
    setTrabajando(false)
    if (!r.ok) { setMsg({ ok: false, texto: r.error! }); return null }
    setMsg({ ok: true, texto: exito }); return r.d
  }
  const guardar = async () => {
    const d = await paso(() => api(c.id ? `/api/admin/newsletter/campanas/${c.id}` : '/api/admin/newsletter/campanas', c.id ? 'PUT' : 'POST', c), 'Guardada')
    if (d) { setC(d); onCambio() }
    return d
  }
  const prueba = async () => {
    const g = await guardar(); if (!g) return
    const d = await paso(() => api(`/api/admin/newsletter/campanas/${g.id}/prueba`, 'POST'), 'Prueba enviada')
    if (d) setMsg({ ok: true, texto: `Prueba enviada a ${d.para}` })
  }
  const enviar = async (accion: 'ahora' | 'programar' | 'cancelar') => {
    if (accion === 'ahora' && !confirm(`¿Enviar «${c.asunto}» ahora a ${previa?.destinatarios ?? '?'} suscriptor(es) confirmado(s)?`)) return
    if (accion === 'cancelar' && !confirm('¿Cancelar la campaña? Los que aún no la han recibido ya no la recibirán.')) return
    const g = accion === 'cancelar' ? c : await guardar(); if (!g) return
    const d = await paso(() => api(`/api/admin/newsletter/campanas/${g.id}/enviar`, 'POST', { accion, fecha: cuando ? new Date(cuando).toISOString() : undefined }),
      accion === 'ahora' ? 'Enviando…' : accion === 'programar' ? 'Programada' : 'Cancelada')
    if (d) onCambio(accion === 'ahora' ? 'Campaña en envío' : accion === 'programar' ? 'Campaña programada' : 'Campaña cancelada')
  }

  return (
    <Modal title={c.id ? (editable ? 'Editar campaña' : 'Campaña') : 'Nueva campaña'} onClose={onCerrar} width={1100}>
      <div className="adm-grid" style={{ ['--min' as any]: '420px', alignItems: 'start' }}>
        <div className="adm-stack" style={{ gap: 14 }}>
          <Field label="Asunto *"><input className="adm-input" value={c.asunto} disabled={!editable} onChange={e => setC({ ...c, asunto: e.target.value })} /></Field>
          <Field label="Sectores" help="Sin marcar ninguno, va a todos los confirmados">
            <div className="adm-fila">
              {Object.entries(SECTORES).map(([k, l]) => (
                <label key={k} className="adm-fila" style={{ gap: 6, fontSize: 13 }}>
                  <input type="checkbox" disabled={!editable} checked={c.sectores.includes(k)}
                    onChange={e => setC({ ...c, sectores: e.target.checked ? [...c.sectores, k] : c.sectores.filter((x: string) => x !== k) })} />{l}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Contenido" help={AYUDA}>
            <textarea className="adm-input" style={{ minHeight: 320, fontFamily: 'ui-monospace, monospace', fontSize: 13 }} value={c.cuerpo_md} disabled={!editable}
              onChange={e => setC({ ...c, cuerpo_md: e.target.value })} />
          </Field>
          <Field label="PDF opcional (máx. 5 MB)" help="En el correo aparece un botón «Descargar» (no va adjunto). Se registra cada descarga.">
            {archivo ? (
              <div className="adm-fila">
                <span>📄 <strong>{archivo.nombre}</strong> <span className="adm-muted">({archivo.bytes >= 1048576 ? `${(archivo.bytes / 1048576).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB` : `${Math.max(1, Math.round(archivo.bytes / 1024))} KB`}{archivo._count ? ` · ${archivo._count.newsletter_descargas} descarga(s)` : ''})</span></span>
                {editable && <Button small variant="fantasma" onClick={quitarArchivo}>Quitar</Button>}
              </div>
            ) : editable ? (
              <input type="file" accept="application/pdf,.pdf" className="adm-input" disabled={trabajando || !c.asunto.trim()} onChange={e => { subirArchivo(e.target.files?.[0]); e.target.value = '' }} aria-label="Subir PDF" />
            ) : <span className="adm-muted">Sin PDF</span>}
            {editable && archivo && (
              <input type="file" accept="application/pdf,.pdf" className="adm-input" style={{ marginTop: 8 }} disabled={trabajando} onChange={e => { subirArchivo(e.target.files?.[0]); e.target.value = '' }} aria-label="Sustituir PDF" />
            )}
          </Field>
          {previa && <p className="adm-muted adm-peq" style={{ margin: 0 }}>Destinatarios ahora: <strong>{previa.destinatarios}</strong> suscriptor(es) confirmado(s).</p>}
          {msg && <Notice tone={msg.ok ? 'ok' : 'error'}>{msg.texto}</Notice>}
          {editable ? (
            <div className="adm-stack" style={{ gap: 10 }}>
              <div className="adm-fila">
                <Button onClick={guardar} disabled={trabajando || !c.asunto.trim()}>Guardar borrador</Button>
                <Button onClick={prueba} disabled={trabajando || !c.asunto.trim()}>Enviarme una prueba</Button>
                <Button variant="primario" onClick={() => enviar('ahora')} disabled={trabajando || !c.asunto.trim() || !previa?.destinatarios}>Enviar ahora</Button>
              </div>
              <div className="adm-fila">
                <input type="datetime-local" className="adm-input" style={{ width: 'auto' }} value={cuando} onChange={e => setCuando(e.target.value)} aria-label="Fecha de envío" />
                <Button onClick={() => enviar('programar')} disabled={trabajando || !cuando}>Programar</Button>
                {c.estado === 'programada' && <Button variant="peligro" onClick={() => enviar('cancelar')}>Cancelar programación</Button>}
              </div>
              {c.estado === 'programada' && <Notice tone="info">Programada para el {fechaHora(c.programada_para)}.</Notice>}
            </div>
          ) : c.estado === 'enviando' && <Button variant="peligro" onClick={() => enviar('cancelar')}>Cancelar envío</Button>}
        </div>
        <div className="adm-stack" style={{ gap: 10 }}>
          <div className="adm-fila" style={{ justifyContent: 'space-between' }}>
            <strong>Vista previa</strong>
            <Button small variant="fantasma" onClick={() => setVerTexto(v => !v)}>{verTexto ? 'Ver HTML' : 'Ver texto plano'}</Button>
          </div>
          {!previa ? <EmptyState title="Escribe un asunto para ver la vista previa" /> : verTexto
            ? <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, background: 'var(--adm-surface-2)', padding: 16, borderRadius: 10, margin: 0, maxHeight: 560, overflow: 'auto' }}>{previa.text}</pre>
            : <iframe title="Vista previa del correo" sandbox="" srcDoc={previa.html} style={{ width: '100%', height: 560, border: '1px solid var(--adm-border)', borderRadius: 10, background: '#fff' }} />}
          <p className="adm-muted adm-peq" style={{ margin: 0 }}>Ejemplo con «Laura» de «Inmobiliaria Ejemplo». Asunto: {previa?.asunto}</p>
        </div>
      </div>
    </Modal>
  )
}

export default function Campanas() {
  const [lista, setLista] = useState<any[] | null>(null)
  const [abierta, setAbierta] = useState<any | null | undefined>(undefined)
  const { show, Flash } = useFlash()
  const cargar = () => api('/api/admin/newsletter/campanas').then(r => r.ok && setLista(r.d))
  useEffect(() => { cargar() }, [])
  // Mientras haya alguna enviándose, se refresca sola
  useEffect(() => {
    if (!lista?.some(c => c.estado === 'enviando')) return
    const t = setInterval(cargar, 5000)
    return () => clearInterval(t)
  }, [lista])

  const n = (c: any, k: string) => c.envios?.[k] ?? 0
  const columnas: Column<any>[] = [
    { key: 'a', header: 'Campaña', render: c => <><div className="adm-fuerte">{c.asunto}</div><div className="adm-muted adm-peq">{c.sectores.length ? c.sectores.map((s: string) => SECTORES[s as keyof typeof SECTORES]).join(', ') : 'Todos los sectores'}</div></> },
    { key: 'e', header: 'Estado', render: c => <><Badge tone={TONO[c.estado]}>{ESTADOS_CAMPANA[c.estado as keyof typeof ESTADOS_CAMPANA]}</Badge>{c.pausada_hasta && <div className="adm-peq" style={{ color: 'var(--adm-warn)' }}>{c.ultimo_error}</div>}</> },
    { key: 'f', header: 'Fecha', render: c => <span className="adm-muted" suppressHydrationWarning>{fechaHora(c.terminada_at ?? c.iniciada_at ?? c.programada_para ?? c.created_at)}</span> },
    { key: 'env', header: 'Enviados', num: true, render: c => n(c, 'enviado') + n(c, 'entregado') + n(c, 'rebotado') + n(c, 'queja') },
    { key: 'ent', header: 'Entregados', num: true, render: c => n(c, 'entregado') },
    { key: 'reb', header: 'Rebotes', num: true, render: c => n(c, 'rebotado') || <span className="adm-faint">0</span> },
    { key: 'q', header: 'Quejas', num: true, render: c => n(c, 'queja') || <span className="adm-faint">0</span> },
    { key: 'p', header: 'Pendientes', num: true, render: c => n(c, 'pendiente') || <span className="adm-faint">0</span> },
    { key: 'd', header: 'Descargas', num: true, render: c => c.newsletter_archivos ? c.newsletter_archivos._count.newsletter_descargas : <span className="adm-faint">—</span> },
  ]
  return (
    <div className="adm-stack">
      <Flash />
      <Section padded={false} title="Campañas" subtitle="Solo a suscriptores confirmados, en lotes de 100 (como mucho uno por segundo). Sin seguimiento de aperturas."
        actions={<Button variant="primario" onClick={() => setAbierta(null)}>+ Nueva campaña</Button>}>
        {!lista ? <EmptyState title="Cargando…" /> : (
          <DataTable columns={columnas} rows={lista} rowKey={c => c.id} onRowClick={c => setAbierta(c)} empty={<EmptyState icon="✉️" title="Aún no hay campañas" />} />
        )}
      </Section>
      {abierta !== undefined && <Editor campana={abierta} onCerrar={() => { setAbierta(undefined); cargar() }} onCambio={m => { cargar(); if (m) { setAbierta(undefined); show(true, m) } }} />}
    </div>
  )
}
