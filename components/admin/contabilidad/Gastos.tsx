import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge, Button, Column, DataTable, EmptyState, Field, Modal, Notice, Section, Toggle, euros, fecha, useFlash } from '../ui'
import { ETIQUETAS_CATEGORIA } from '../../../lib/facturacion/categorias'
import type { Gasto } from '../../../lib/accounting/calculos'
import type { LineaInfo } from './Resumen'
import { Atribucion, ProyectoMin } from './Ingresos'

const VACIO = { proveedor: '', proveedor_nif: '', proveedor_pais: 'ES', descripcion: '', concepto: '', categoria: 'software', base: '', tipo_iva: '21',
  periodicidad: 'mensual', dia_mes: '1', proxima_fecha: '', producto_slug: '', activo: true }

function FormRecurrente({ r, lineas, onCerrar, onGuardado }: { r: any | null; lineas: LineaInfo[]; onCerrar: () => void; onGuardado: () => void }) {
  const [f, setF] = useState<any>(() => r ? {
    ...VACIO, ...r, proveedor_nif: r.proveedor_nif ?? '', producto_slug: r.producto_slug ?? '', dia_mes: String(r.dia_mes),
    proxima_fecha: r.proxima_fecha.slice(0, 10), base: r.lineas?.[0]?.precio_unitario ?? '', tipo_iva: r.lineas?.[0]?.tipo_iva ?? '21', concepto: r.lineas?.[0]?.descripcion ?? '',
  } : VACIO)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))

  const guardar = async () => {
    setGuardando(true); setError('')
    const res = await fetch(r ? `/api/admin/accounting/gastos-recurrentes/${r.id}` : '/api/admin/accounting/gastos-recurrentes', {
      method: r ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f),
    })
    const d = await res.json().catch(() => ({}))
    setGuardando(false)
    if (res.ok) onGuardado(); else setError(d.error || `Error ${res.status}`)
  }

  return (
    <Modal title={r ? 'Editar gasto recurrente' : 'Nuevo gasto recurrente'} onClose={onCerrar} width={620}>
      <div className="adm-grid" style={{ ['--min' as any]: '240px', gap: 14 }}>
        <Field label="Proveedor *"><input className="adm-input" value={f.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Contabo GmbH" /></Field>
        <Field label="Nombre"><input className="adm-input" value={f.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Servidor VPS" /></Field>
        <Field label="NIF / VAT del proveedor"><input className="adm-input" value={f.proveedor_nif} onChange={e => set('proveedor_nif', e.target.value)} /></Field>
        <Field label="País (2 letras)"><input className="adm-input" value={f.proveedor_pais} maxLength={2} onChange={e => set('proveedor_pais', e.target.value.toUpperCase())} /></Field>
        <Field label="Categoría">
          <select className="adm-input" value={f.categoria} onChange={e => set('categoria', e.target.value)}>
            {Object.entries(ETIQUETAS_CATEGORIA).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </Field>
        <Field label="Línea de negocio">
          <select className="adm-input" value={f.producto_slug} onChange={e => set('producto_slug', e.target.value)}>
            <option value="">General (sin línea)</option>
            {lineas.filter(l => l.slug !== 'otros').map(l => <option key={l.slug} value={l.slug}>{l.nombre}</option>)}
          </select>
        </Field>
        <Field label="Base imponible (€) *" help="Sin IVA"><input className="adm-input" inputMode="decimal" value={f.base} onChange={e => set('base', e.target.value)} /></Field>
        <Field label="IVA">
          <select className="adm-input" value={f.tipo_iva} onChange={e => set('tipo_iva', e.target.value)}>
            {['21', '10', '4', '0'].map(t => <option key={t} value={t}>{t} %</option>)}
          </select>
        </Field>
        <Field label="Periodicidad">
          <select className="adm-input" value={f.periodicidad} onChange={e => set('periodicidad', e.target.value)}>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </Field>
        <Field label="Día del mes (1–28)"><input className="adm-input" type="number" min={1} max={28} value={f.dia_mes} onChange={e => set('dia_mes', e.target.value)} /></Field>
        <Field label="Próximo gasto *"><input className="adm-input" type="date" value={f.proxima_fecha} onChange={e => set('proxima_fecha', e.target.value)} /></Field>
        <Field label="Concepto en el gasto" help="{mes} y {año} se sustituyen"><input className="adm-input" value={f.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Servidor {mes} {año}" /></Field>
      </div>
      <div style={{ marginTop: 14 }}><Toggle value={f.activo} onChange={v => set('activo', v)} label="Activo" help="Si lo desactivas deja de generar gastos previstos." /></div>
      {error && <Notice tone="error" style={{ marginTop: 14 }}>{error}</Notice>}
      <div className="adm-fila" style={{ justifyContent: 'flex-end', marginTop: 18 }}>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="primario" onClick={guardar} disabled={guardando || !f.proveedor || !f.base || !f.proxima_fecha}>{guardando ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </Modal>
  )
}

export default function Gastos({ mes, gastos, lineas, proyectos, recargar }: { mes: string; gastos: Gasto[]; lineas: LineaInfo[]; proyectos: ProyectoMin[]; recargar: () => void }) {
  const [recurrentes, setRecurrentes] = useState<any[] | null>(null)
  const [editando, setEditando] = useState<any | null | undefined>(undefined)
  const { show, Flash } = useFlash()
  const cargar = () => fetch('/api/admin/accounting/gastos-recurrentes').then(r => (r.ok ? r.json() : [])).then(setRecurrentes)
  useEffect(() => { cargar() }, [])

  const columnas: Column<Gasto>[] = [
    { key: 'f', header: 'Fecha', render: g => <span suppressHydrationWarning>{fecha(g.fecha)}</span> },
    { key: 'e', header: 'Estado', render: g => g.estado === 'previsto' ? <Badge tone="warn">◌ Previsto</Badge> : <Badge tone="ok">● Registrado</Badge> },
    { key: 'p', header: 'Proveedor', render: g => <><div className="adm-fuerte">{g.proveedor}</div><div className="adm-muted adm-peq">{ETIQUETAS_CATEGORIA[g.categoria] ?? g.categoria}</div></> },
    { key: 'l', header: 'Línea / proyecto', render: g => <Atribucion tipo="gasto" id={g.id} linea={g.linea} proyectoId={g.proyectoId} lineas={lineas} proyectos={proyectos} onCambio={recargar} /> },
    { key: 'c', header: 'Coste', num: true, render: g => <span className="adm-fuerte" style={{ opacity: g.estado === 'previsto' ? 0.75 : 1 }}>{euros(g.coste)}</span> },
  ]
  const previstos = gastos.filter(g => g.estado === 'previsto').length

  return (
    <div className="adm-stack">
      <Flash />
      {previstos > 0 && (
        <Notice tone="aviso">
          {previstos} gasto(s) <strong>previsto(s)</strong> este mes: cuentan aquí, pero no en los libros ni en el 303/130 hasta que adjuntes la factura real en{' '}
          <Link href="/admin/facturacion/gastos" style={{ textDecoration: 'underline', fontWeight: 700 }}>Facturación → Gastos</Link>.
        </Notice>
      )}
      <Section padded={false} title={`Gastos de ${mes}`} subtitle="Coste = base + IVA no deducible.">
        <DataTable columns={columnas} rows={gastos} rowKey={g => g.id} empty={<EmptyState icon="📥" title="Sin gastos este mes" />} />
      </Section>

      <Section padded={false} title="Gastos recurrentes" subtitle="El cron de facturación crea cada periodo un gasto «previsto» (nunca emite facturas)."
        actions={<Button variant="primario" onClick={() => setEditando(null)}>+ Nuevo recurrente</Button>}>
        {!recurrentes ? <EmptyState title="Cargando…" /> : (
          <DataTable rows={recurrentes} rowKey={r => r.id} onRowClick={r => setEditando(r)}
            empty={<EmptyState icon="🔁" title="Sin gastos recurrentes" text="Los gastos semilla (Contabo, dominios, Claude, Meta Ads, Google Ads) se cargan cuando confirmes los datos fiscales." />}
            columns={[
              { key: 'p', header: 'Proveedor', render: r => <><div className="adm-fuerte">{r.descripcion}</div><div className="adm-muted adm-peq">{r.proveedor} · {r.proveedor_pais}</div></> },
              { key: 'i', header: 'Base', num: true, render: r => euros(Number(r.lineas?.[0]?.precio_unitario ?? 0)) },
              { key: 'v', header: 'IVA', num: true, render: r => `${r.lineas?.[0]?.tipo_iva ?? '—'} %` },
              { key: 'per', header: 'Periodicidad', render: r => (r.periodicidad === 'anual' ? 'Anual' : `Mensual (día ${r.dia_mes})`) },
              { key: 'n', header: 'Próximo', render: r => <span suppressHydrationWarning>{fecha(r.proxima_fecha)}</span> },
              { key: 'a', header: 'Estado', render: r => <Badge tone={r.activo ? 'ok' : 'neutro'}>{r.activo ? 'Activo' : 'Pausado'}</Badge> },
            ]} />
        )}
      </Section>
      {editando !== undefined && (
        <FormRecurrente r={editando} lineas={lineas} onCerrar={() => setEditando(undefined)}
          onGuardado={() => { setEditando(undefined); show(true, 'Gasto recurrente guardado'); cargar() }} />
      )}
    </div>
  )
}
