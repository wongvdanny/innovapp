import { useState } from 'react'
import { Button, EmptyState, Field, Modal, Notice, Section, useFlash } from '../ui'
import { BarraMeta, LineaInfo, MetaProgreso, NOMBRE_METRICA } from './Resumen'

const PERIODOS: [string, string][] = [['mes', 'Mes'], ['trimestre', 'Trimestre'], ['anio', 'Año']]

function FormMeta({ meta, lineas, hoy, onCerrar, onGuardado }: { meta: MetaProgreso | null; lineas: LineaInfo[]; hoy: string; onCerrar: () => void; onGuardado: () => void }) {
  const [f, setF] = useState(() => meta
    ? { metrica: meta.metrica, objetivo: String(meta.objetivo), periodo: meta.periodo, desde: meta.desde, producto_slug: meta.producto_slug ?? '' }
    : { metrica: 'mrr', objetivo: '', periodo: 'anio', desde: `${hoy.slice(0, 4)}-01-01`, producto_slug: '' })
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setF(x => ({ ...x, [k]: v }))
  const guardar = async () => {
    setError('')
    const res = await fetch(meta ? `/api/admin/accounting/metas/${meta.id}` : '/api/admin/accounting/metas', {
      method: meta ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) onGuardado(); else setError(d.error || `Error ${res.status}`)
  }
  return (
    <Modal title={meta ? 'Editar meta' : 'Nueva meta'} onClose={onCerrar} width={480}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Field label="Métrica">
          <select className="adm-input" value={f.metrica} onChange={e => set('metrica', e.target.value)}>
            {Object.entries(NOMBRE_METRICA).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Objetivo" help={['mrr', 'ingresos', 'beneficio'].includes(f.metrica) ? 'En euros (base, sin IVA; el MRR con el precio del plan)' : 'Número de clientes'}>
          <input className="adm-input" inputMode="decimal" value={f.objetivo} onChange={e => set('objetivo', e.target.value)} placeholder="1000" />
        </Field>
        <div className="adm-grid" style={{ ['--min' as any]: '180px', gap: 14 }}>
          <Field label="Periodo">
            <select className="adm-input" value={f.periodo} onChange={e => set('periodo', e.target.value)}>{PERIODOS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <Field label="Desde"><input className="adm-input" type="date" value={f.desde} onChange={e => set('desde', e.target.value)} /></Field>
        </div>
        <Field label="Línea de negocio">
          <select className="adm-input" value={f.producto_slug} onChange={e => set('producto_slug', e.target.value)}>
            <option value="">Todo el negocio</option>
            {lineas.map(l => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
          </select>
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variant="primario" onClick={guardar} disabled={!f.objetivo}>Guardar meta</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Metas({ metas, lineas, hoy, recargar }: { metas: MetaProgreso[]; lineas: LineaInfo[]; hoy: string; recargar: () => void }) {
  const [editando, setEditando] = useState<MetaProgreso | null | undefined>(undefined)
  const { show, Flash } = useFlash()
  const nombre = (s: string) => lineas.find(l => l.slug === s)?.nombre ?? s

  const borrar = async (m: MetaProgreso) => {
    if (!confirm(`¿Borrar la meta de ${NOMBRE_METRICA[m.metrica]}?`)) return
    const r = await fetch(`/api/admin/accounting/metas/${m.id}`, { method: 'DELETE' })
    if (r.ok) { show(true, 'Meta borrada'); recargar() } else show(false, 'No se ha podido borrar')
  }

  return (
    <>
      <Flash />
      <Section title="Metas activas" subtitle="La marca vertical es la proyección a fin de periodo al ritmo actual (lineal)."
        actions={<Button variant="primario" onClick={() => setEditando(null)}>+ Nueva meta</Button>}>
        {metas.length === 0 ? <EmptyState icon="🎯" title="Sin metas" text="Por ejemplo: MRR 1.000 € este año, o 20 clientes de Agentes IA." /> : (
          <div className="adm-stack" style={{ gap: 22 }}>
            {metas.map(m => (
              <div key={m.id}>
                <BarraMeta m={m} nombreLinea={nombre} />
                <div className="adm-fila" style={{ marginTop: 8, gap: 6 }}>
                  <Button small onClick={() => setEditando(m)}>Editar</Button>
                  <Button small variant="fantasma" onClick={() => borrar(m)}>Borrar</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      {editando !== undefined && (
        <FormMeta meta={editando} lineas={lineas} hoy={hoy} onCerrar={() => setEditando(undefined)}
          onGuardado={() => { setEditando(undefined); show(true, 'Meta guardada'); recargar() }} />
      )}
    </>
  )
}
