import { GetServerSideProps } from 'next'
import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Badge, Button, Column, DataTable, EmptyState, Field, KpiCard, KpiGrid, Modal, Notice, Section, Tono, fecha, useFlash } from '../../components/admin/ui'
import { exigirAdmin } from '../../lib/facturacion/api'
import { DIAS_ACEPTAR, DIAS_MATERIAL, MAX_SUPLENTES, MAX_WEBS, PROVINCIAS, SECTORES_PROMO } from '../../lib/promo/config'

type Entrada = {
  id: string; name: string; businessName: string; sector: string; city: string; province: string; email: string; phone: string
  instagram: string; currentWeb: string | null; contactChannel: string; description: string; marketingConsent: boolean
  confirmedAt: string | null; unsubscribedAt: string | null; followsInstagram: boolean | null; status: string; adminNotes: string | null; createdAt: string
  substituteOrder: number | null; notifiedAt: string | null; acceptedAt: string | null; materialDeliveredAt: string | null
}
type Kpis = {
  total: number; confirmadas: number; pctMarketing: number; porProvincia: [string, number][]; porSector: [string, number][]
  ganadores: number; suplentes: number; sectoresRepetidos: string[]
}

const ESTADOS: Record<string, [string, Tono]> = {
  pending: ['Pendiente', 'neutro'], shortlisted: ['Preseleccionado', 'info'], selected: ['Ganador', 'ok'], substitute: ['Suplente', 'warn'], rejected: ['Descartado', 'err'],
}

const DIA_MS = 24 * 60 * 60 * 1000
const masDias = (iso: string, dias: number) => new Date(new Date(iso).getTime() + dias * DIA_MS)
/** Plazos de las bases: 3 días desde el aviso para aceptar y 15 desde la aceptación para el material. */
function plazos(e: Entrada) {
  const limiteAceptar = e.notifiedAt && !e.acceptedAt ? masDias(e.notifiedAt, DIAS_ACEPTAR) : null
  const limiteMaterial = e.acceptedAt && !e.materialDeliveredAt ? masDias(e.acceptedAt, DIAS_MATERIAL) : null
  const ahora = Date.now()
  return { limiteAceptar, aceptarVencido: !!limiteAceptar && ahora > limiteAceptar.getTime(), limiteMaterial, materialVencido: !!limiteMaterial && ahora > limiteMaterial.getTime() }
}
const aInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')
const etiquetaEstado = (e: Entrada) => e.status === 'substitute' && e.substituteOrder ? `Suplente nº ${e.substituteOrder}` : ESTADOS[e.status]?.[0] ?? e.status

function Ficha({ e, onCerrar, onGuardado }: { e: Entrada; onCerrar: () => void; onGuardado: (msg: string) => void }) {
  const [sigue, setSigue] = useState<boolean | null>(e.followsInstagram)
  const [estado, setEstado] = useState(e.status)
  const [orden, setOrden] = useState(e.substituteOrder ? String(e.substituteOrder) : '')
  const [avisado, setAvisado] = useState(aInput(e.notifiedAt))
  const [aceptado, setAceptado] = useState(aInput(e.acceptedAt))
  const [entregado, setEntregado] = useState(!!e.materialDeliveredAt)
  const [notas, setNotas] = useState(e.adminNotes ?? '')
  const [error, setError] = useState('')
  const guardar = async () => {
    setError('')
    const res = await fetch('/api/admin/promo-webgratis', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: e.id, followsInstagram: sigue, status: estado, substituteOrder: estado === 'substitute' ? Number(orden) : null, notifiedAt: avisado, acceptedAt: aceptado, materialDelivered: entregado, adminNotes: notas }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) onGuardado('Guardado'); else setError(d.error || `Error ${res.status}`)
  }
  const promover = async () => {
    if (!window.confirm(`${e.businessName} pasará a «Descartado» y el primer suplente pasará a ganador. ¿Seguir?`)) return
    setError('')
    const res = await fetch('/api/admin/promo-webgratis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'promover', id: e.id }) })
    const d = await res.json().catch(() => ({}))
    if (res.ok) onGuardado(`${d.promovido.businessName} pasa a ganador. Recuerda enviarle el aviso.`); else setError(d.error || `Error ${res.status}`)
  }
  return (
    <Modal title={e.businessName} onClose={onCerrar} width={640}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <p className="adm-muted" style={{ margin: 0 }}>
          {e.name} · {e.sector} · {e.city} ({e.province}) · {e.email} · {e.phone}<br />
          Instagram: <a href={`https://instagram.com/${e.instagram}`} target="_blank" rel="noopener noreferrer">@{e.instagram}</a>
          {e.currentWeb && <> · Web/redes: {e.currentWeb}</>} · Le contactan por: {e.contactChannel}<br />
          Inscrita el {fecha(e.createdAt)} · {e.confirmedAt ? `confirmada el ${fecha(e.confirmedAt)}` : 'sin confirmar'}
          {' · '}{e.marketingConsent ? (e.unsubscribedAt ? `marketing: baja el ${fecha(e.unsubscribedAt)}` : 'acepta marketing') : 'sin marketing'}
        </p>
        <div>
          <div className="adm-fuerte" style={{ marginBottom: 4 }}>Su negocio</div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{e.description}</p>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="checkbox" checked={sigue === true} onChange={ev => setSigue(ev.target.checked)} /> Sigue a la cuenta en Instagram (comprobado a mano)
        </label>
        <div className="adm-grid" style={{ ['--min' as string]: '160px', gap: 12 }}>
          <Field label="Estado">
            <select className="adm-input" value={estado} onChange={ev => setEstado(ev.target.value)}>
              {Object.entries(ESTADOS).map(([v, [t]]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Field>
          {estado === 'substitute' && (
            <Field label={`Orden del suplente (1-${MAX_SUPLENTES})`}>
              <select className="adm-input" value={orden} onChange={ev => setOrden(ev.target.value)}>
                <option value="">Elige</option>
                {Array.from({ length: MAX_SUPLENTES }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
            </Field>
          )}
          <Field label="Fecha de aviso" help={`${DIAS_ACEPTAR} días para aceptar`}><input type="date" className="adm-input" value={avisado} onChange={ev => setAvisado(ev.target.value)} /></Field>
          <Field label="Fecha de aceptación" help={`${DIAS_MATERIAL} días para el material`}><input type="date" className="adm-input" value={aceptado} onChange={ev => setAceptado(ev.target.value)} /></Field>
          <label className="adm-check" style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={entregado} onChange={ev => setEntregado(ev.target.checked)} />
            Material entregado{e.materialDeliveredAt && entregado ? ` (el ${fecha(e.materialDeliveredAt)})` : ''}
          </label>
        </div>
        <Field label="Notas internas">
          <textarea className="adm-input" rows={4} value={notas} onChange={ev => setNotas(ev.target.value)} />
        </Field>
        {error && <p className="adm-err" style={{ margin: 0 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {e.status === 'selected' && <Button variant="peligro" onClick={promover} style={{ marginRight: 'auto' }}>Promover siguiente suplente</Button>}
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variant="primario" onClick={guardar}>Guardar</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function PromoWebgratis() {
  const [entradas, setEntradas] = useState<Entrada[] | null>(null)
  const [kpis, setKpis] = useState<Kpis | null>(null)
  const [f, setF] = useState({ q: '', confirmado: '', provincia: '', sector: '', estado: '' })
  const [abierta, setAbierta] = useState<Entrada | null>(null)
  const { show, Flash } = useFlash()
  const [enviando, setEnviando] = useState<string | null>(null)
  const enviarAviso = async (e: Entrada) => {
    const tipo = e.status === 'selected' ? '«Has sido seleccionado»' : `«Eres suplente nº ${e.substituteOrder}»`
    if (!window.confirm(`¿Enviar ${tipo} a ${e.email}?`)) return
    setEnviando(e.id)
    const res = await fetch('/api/admin/promo-webgratis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion: 'enviar', id: e.id }) })
    const d = await res.json().catch(() => ({}))
    setEnviando(null)
    show(res.ok, res.ok ? `Email ${tipo} enviado a ${e.email}` : d.error || `Error ${res.status}`)
    if (res.ok) cargar()
  }

  const cargar = useCallback(async () => {
    const res = await fetch('/api/admin/promo-webgratis')
    if (!res.ok) { show(false, `No se han podido cargar las inscripciones (${res.status})`); return }
    const d = await res.json()
    setEntradas(d.entradas); setKpis(d.kpis)
  }, [show])
  useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtradas = useMemo(() => (entradas ?? []).filter(e => {
    const q = f.q.trim().toLowerCase()
    if (q && ![e.name, e.businessName, e.email, e.instagram, e.city].some(v => v.toLowerCase().includes(q))) return false
    if (f.confirmado === 'si' && !e.confirmedAt) return false
    if (f.confirmado === 'no' && e.confirmedAt) return false
    if (f.provincia && e.province !== f.provincia) return false
    if (f.sector && e.sector !== f.sector) return false
    if (f.estado && e.status !== f.estado) return false
    return true
  }), [entradas, f])

  const columnas: Column<Entrada>[] = [
    { key: 'negocio', header: 'Negocio', render: e => <><div className="adm-fuerte">{e.businessName}</div><div className="adm-muted adm-peq">{e.name}</div></> },
    { key: 'sector', header: 'Sector', render: e => e.sector },
    { key: 'lugar', header: 'Localidad', render: e => <>{e.city}<div className="adm-muted adm-peq">{e.province}</div></> },
    { key: 'ig', header: 'Instagram', render: e => <>@{e.instagram} {e.followsInstagram === true ? <Badge tone="ok">sigue</Badge> : e.followsInstagram === false ? <Badge tone="err">no sigue</Badge> : null}</> },
    { key: 'conf', header: 'Confirmada', render: e => e.confirmedAt ? <Badge tone="ok">{fecha(e.confirmedAt)}</Badge> : <Badge tone="warn">No</Badge> },
    { key: 'mkt', header: 'Marketing', render: e => e.marketingConsent ? (e.unsubscribedAt ? <Badge>Baja</Badge> : <Badge tone="info">Sí</Badge>) : <span className="adm-muted">No</span> },
    { key: 'estado', header: 'Estado', render: e => <Badge tone={ESTADOS[e.status]?.[1] ?? 'neutro'}>{etiquetaEstado(e)}</Badge> },
    { key: 'aviso', header: 'Fecha de aviso', render: e => {
      const p = plazos(e)
      return e.notifiedAt ? <>{fecha(e.notifiedAt)}{p.limiteAceptar && <div>{p.aceptarVencido ? <Badge tone="err">Aceptación vencida</Badge> : <span className="adm-muted adm-peq">acepta hasta {fecha(p.limiteAceptar.toISOString())}</span>}</div>}</> : <span className="adm-muted">—</span>
    } },
    { key: 'acepta', header: 'Fecha de aceptación', render: e => {
      const p = plazos(e)
      return e.acceptedAt ? <>{fecha(e.acceptedAt)}<div>{e.materialDeliveredAt ? <Badge tone="ok">Material entregado</Badge> : p.materialVencido ? <Badge tone="err">Material vencido</Badge> : <span className="adm-muted adm-peq">material hasta {fecha(p.limiteMaterial!.toISOString())}</span>}</div></> : <span className="adm-muted">—</span>
    } },
    { key: 'enviar', header: 'Aviso', render: e => (e.status === 'selected' || e.status === 'substitute') ? (
      <span onClick={ev => ev.stopPropagation()}><Button small disabled={enviando === e.id} onClick={() => enviarAviso(e)}>{enviando === e.id ? 'Enviando…' : 'Enviar aviso'}</Button></span>
    ) : null },
    { key: 'fecha', header: 'Inscrita', render: e => fecha(e.createdAt) },
  ]

  const set = (k: keyof typeof f, v: string) => setF(x => ({ ...x, [k]: v }))
  const top = (l: [string, number][]) => l.slice(0, 3).map(([n, c]) => `${n} (${c})`).join(', ') || '—'

  return (
    <AdminLayout title="Promo webgratis">
      <Flash />
      {kpis && (
        <KpiGrid>
          <KpiCard label="Inscripciones" value={kpis.total} />
          <KpiCard label="Confirmadas" value={kpis.confirmadas} note={kpis.total ? `${Math.round((kpis.confirmadas / kpis.total) * 100)} % del total` : undefined} />
          <KpiCard label="Con consentimiento de marketing" value={`${kpis.pctMarketing} %`} />
          <KpiCard label="Provincias con más inscripciones" value={kpis.porProvincia.length} note={top(kpis.porProvincia)} />
          <KpiCard label="Sectores con más inscripciones" value={kpis.porSector.length} note={top(kpis.porSector)} />
        </KpiGrid>
      )}
      {kpis && (
        <Section>
          <p className="adm-fuerte" style={{ margin: 0, fontSize: 17 }}>Ganadores {kpis.ganadores}/{MAX_WEBS} · Suplentes {kpis.suplentes}/{MAX_SUPLENTES}</p>
          {kpis.sectoresRepetidos.length > 0 && (
            <Notice tone="aviso" style={{ marginTop: 10 }}>Hay más de un ganador del mismo sector: {kpis.sectoresRepetidos.join(', ')}. Las bases piden favorecer la variedad de sectores siempre que sea posible.</Notice>
          )}
        </Section>
      )}
      <Section title="Inscripciones" actions={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <a className="adm-btn peq" href="/api/admin/promo-webgratis?csv=todas">CSV completo</a>
        <a className="adm-btn peq" href="/api/admin/promo-webgratis?csv=marketing">CSV para email (marketing)</a>
      </div>}>
        <div className="adm-grid" style={{ ['--min' as string]: '170px', gap: 12, marginBottom: 16 }}>
          <Field label="Buscar"><input className="adm-input" value={f.q} onChange={e => set('q', e.target.value)} placeholder="Nombre, negocio, email, Instagram…" /></Field>
          <Field label="Confirmada">
            <select className="adm-input" value={f.confirmado} onChange={e => set('confirmado', e.target.value)}>
              <option value="">Todas</option><option value="si">Sí</option><option value="no">No</option>
            </select>
          </Field>
          <Field label="Provincia">
            <select className="adm-input" value={f.provincia} onChange={e => set('provincia', e.target.value)}>
              <option value="">Todas</option>{PROVINCIAS.map(p => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Sector">
            <select className="adm-input" value={f.sector} onChange={e => set('sector', e.target.value)}>
              <option value="">Todos</option>{SECTORES_PROMO.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Estado">
            <select className="adm-input" value={f.estado} onChange={e => set('estado', e.target.value)}>
              <option value="">Todos</option>{Object.entries(ESTADOS).map(([v, [t]]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </Field>
        </div>
        {entradas === null ? <p className="adm-muted">Cargando…</p> : (
          <DataTable<Entrada> columns={columnas} rows={filtradas} rowKey={e => e.id} onRowClick={e => setAbierta(e)}
            empty={<EmptyState title={entradas.length ? 'Ninguna inscripción con estos filtros' : 'Aún no hay inscripciones'} />} />
        )}
        <p className="adm-muted adm-peq" style={{ marginTop: 10 }}>{filtradas.length} de {entradas?.length ?? 0} · pulsa una fila para ver el negocio, marcar Instagram, el estado y las notas.</p>
      </Section>
      {abierta && <Ficha e={abierta} onCerrar={() => setAbierta(null)} onGuardado={msg => { setAbierta(null); show(true, msg); cargar() }} />}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
