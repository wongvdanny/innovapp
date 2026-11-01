import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { Badge, Button, Column, DataTable, EmptyState, Field, KpiCard, KpiGrid, Modal, Notice, Section, Tono, euros, fecha, useFlash } from '../../components/admin/ui'
import { SelectorCliente } from '../../components/admin/facturacion/Clientes'
import { exigirAdmin } from '../../lib/facturacion/api'
import { hoyMadrid } from '../../lib/facturacion/fechas'

const ESTADOS: Record<string, [string, Tono]> = {
  propuesta: ['Propuesta', 'neutro'], aceptado: ['Aceptado', 'info'], en_curso: ['En curso', 'warn'],
  entregado: ['Entregado', 'ok'], cerrado: ['Cerrado', 'neutro'], cancelado: ['Cancelado', 'err'],
}
const ABIERTOS = ['propuesta', 'aceptado', 'en_curso', 'entregado']
const VACIO = { nombre: '', descripcion: '', presupuesto: '', estado: 'propuesta', fecha_inicio: '', fecha_entrega: '', fecha_fin: '', producto_slug: '', notas: '' }

function FormProyecto({ p, productos, onCerrar, onGuardado, onBorrar }: { p: any | null; productos: { slug: string; name: string }[]; onCerrar: () => void; onGuardado: () => void; onBorrar: () => void }) {
  const [f, setF] = useState<any>(() => p ? {
    ...VACIO, ...Object.fromEntries(Object.keys(VACIO).map(k => [k, p[k] === null || p[k] === undefined ? '' : String(p[k])])),
    fecha_inicio: p.fecha_inicio?.slice(0, 10) ?? '', fecha_entrega: p.fecha_entrega?.slice(0, 10) ?? '', fecha_fin: p.fecha_fin?.slice(0, 10) ?? '',
  } : VACIO)
  const [cliente, setCliente] = useState<any>(p?.fac_clientes ?? null)
  const [error, setError] = useState('')
  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }))
  const guardar = async () => {
    setError('')
    const res = await fetch(p ? `/api/admin/proyectos/${p.id}` : '/api/admin/proyectos', {
      method: p ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, cliente_id: cliente?.id ?? '' }),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok) onGuardado(); else setError(d.error || `Error ${res.status}`)
  }
  return (
    <Modal title={p ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={onCerrar} width={620}>
      <div className="adm-stack" style={{ gap: 14 }}>
        <Field label="Nombre *"><input className="adm-input" value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Tienda WooCommerce para…" /></Field>
        <Field label="Cliente"><SelectorCliente valor={cliente} onChange={setCliente} /></Field>
        <div className="adm-grid" style={{ ['--min' as any]: '170px', gap: 14 }}>
          <Field label="Estado">
            <select className="adm-input" value={f.estado} onChange={e => set('estado', e.target.value)}>
              {Object.entries(ESTADOS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field label="Presupuesto (€)" help="Base, sin IVA"><input className="adm-input" inputMode="decimal" value={f.presupuesto} onChange={e => set('presupuesto', e.target.value)} /></Field>
          <Field label="Línea de negocio">
            <select className="adm-input" value={f.producto_slug} onChange={e => set('producto_slug', e.target.value)}>
              <option value="">Agencia (a medida)</option>
              {productos.map(x => <option key={x.slug} value={x.slug}>{x.name}</option>)}
            </select>
          </Field>
          <Field label="Inicio"><input className="adm-input" type="date" value={f.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)} /></Field>
          <Field label="Entrega prevista"><input className="adm-input" type="date" value={f.fecha_entrega} onChange={e => set('fecha_entrega', e.target.value)} /></Field>
          <Field label="Fin real"><input className="adm-input" type="date" value={f.fecha_fin} onChange={e => set('fecha_fin', e.target.value)} /></Field>
        </div>
        <Field label="Descripción"><textarea className="adm-input" style={{ minHeight: 70 }} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} /></Field>
        <Field label="Notas"><textarea className="adm-input" style={{ minHeight: 50 }} value={f.notas} onChange={e => set('notas', e.target.value)} /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <div className="adm-fila" style={{ justifyContent: 'flex-end' }}>
          {p && <Button variant="peligro" onClick={onBorrar} style={{ marginRight: 'auto' }}>Borrar</Button>}
          <Button onClick={onCerrar}>Cancelar</Button>
          <Button variant="primario" onClick={guardar} disabled={!f.nombre.trim()}>Guardar proyecto</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function Proyectos({ hoy }: { hoy: string }) {
  const [lista, setLista] = useState<any[] | null>(null)
  const [productos, setProductos] = useState<{ slug: string; name: string }[]>([])
  const [filtro, setFiltro] = useState<'abiertos' | 'todos'>('abiertos')
  const [editando, setEditando] = useState<any | null | undefined>(undefined)
  const { show, Flash } = useFlash()
  const cargar = () => fetch('/api/admin/proyectos').then(r => (r.ok ? r.json() : [])).then(setLista)
  useEffect(() => { cargar(); fetch('/api/admin/productos').then(r => (r.ok ? r.json() : [])).then(setProductos) }, [])

  const visibles = useMemo(() => (lista ?? []).filter(p => filtro === 'todos' || ABIERTOS.includes(p.estado)), [lista, filtro])
  const abiertos = (lista ?? []).filter(p => ABIERTOS.includes(p.estado))
  const pendiente = abiertos.reduce((a, p) => a + Math.max(0, Number(p.presupuesto ?? 0) - p.facturado), 0)

  const borrar = async (p: any) => {
    if (!confirm(`¿Borrar el proyecto «${p.nombre}»? Sus facturas y gastos se conservan, solo pierden el enlace.`)) return
    const r = await fetch(`/api/admin/proyectos/${p.id}`, { method: 'DELETE' })
    if (r.ok) { show(true, 'Proyecto borrado'); setEditando(undefined); cargar() } else show(false, 'No se ha podido borrar')
  }

  const columnas: Column<any>[] = [
    { key: 'n', header: 'Proyecto', render: p => <><div className="adm-fuerte">{p.nombre}</div><div className="adm-muted adm-peq">{p.fac_clientes?.razon_social ?? 'Sin cliente'}</div></> },
    { key: 'e', header: 'Estado', render: p => { const [l, t] = ESTADOS[p.estado] ?? [p.estado, 'neutro']; return <Badge tone={t}>{l}</Badge> } },
    { key: 'pr', header: 'Presupuesto', num: true, render: p => (p.presupuesto === null ? <span className="adm-faint">—</span> : euros(Number(p.presupuesto))) },
    {
      key: 'fa', header: 'Facturado', num: true, render: p => <>{euros(p.facturado)}{p.presupuesto > 0 && <div className="adm-muted adm-peq">{Math.round((p.facturado / Number(p.presupuesto)) * 100)} % · {p.facturas} fact.</div>}</>,
    },
    { key: 'g', header: 'Gastos', num: true, render: p => euros(p.gastos) },
    { key: 'm', header: 'Margen', num: true, render: p => { const m = p.facturado - p.gastos; return <span className="adm-fuerte" style={{ color: m < 0 ? 'var(--adm-err)' : undefined }}>{euros(m)}</span> } },
    {
      key: 'f', header: 'Entrega', render: p => {
        const tarde = p.fecha_entrega && !p.fecha_fin && ABIERTOS.includes(p.estado) && p.fecha_entrega.slice(0, 10) < hoy
        return <span suppressHydrationWarning style={{ color: tarde ? 'var(--adm-err)' : undefined }}>{fecha(p.fecha_fin ?? p.fecha_entrega)}{tarde ? ' · con retraso' : ''}</span>
      },
    },
  ]

  return (
    <AdminLayout title="Proyectos a medida" actions={<Button variant="primario" onClick={() => setEditando(null)}>+ Nuevo proyecto</Button>}>
      <div className="adm-stack">
        <Flash />
        <KpiGrid>
          <KpiCard label="Proyectos abiertos" value={abiertos.length} color="var(--adm-accent)" />
          <KpiCard label="Presupuestado (abiertos)" value={euros(abiertos.reduce((a, p) => a + Number(p.presupuesto ?? 0), 0), 0)} />
          <KpiCard label="Pendiente de facturar" value={euros(pendiente, 0)} note="Presupuesto − facturado, en los abiertos" />
          <KpiCard label="Facturado total" value={euros((lista ?? []).reduce((a, p) => a + p.facturado, 0), 0)} />
        </KpiGrid>
        <Section padded={false} title="Proyectos" subtitle="Las facturas y los gastos se asignan a un proyecto en Contabilidad → Ingresos / Gastos."
          actions={<div className="adm-filtros">
            <button type="button" className={`adm-chip${filtro === 'abiertos' ? ' activo' : ''}`} onClick={() => setFiltro('abiertos')}>Abiertos</button>
            <button type="button" className={`adm-chip${filtro === 'todos' ? ' activo' : ''}`} onClick={() => setFiltro('todos')}>Todos</button>
          </div>}>
          {!lista ? <EmptyState title="Cargando…" /> : (
            <DataTable columns={columnas} rows={visibles} rowKey={p => p.id} onRowClick={p => setEditando(p)}
              empty={<EmptyState icon="🛠️" title={lista.length ? 'Ningún proyecto abierto' : 'Aún no hay proyectos'} text="Registra aquí los trabajos de agencia: cliente, presupuesto, estado y fechas." />} />
          )}
        </Section>
        <p className="adm-muted adm-peq" style={{ margin: 0 }}>Para facturar un proyecto, crea la factura en <Link href="/admin/facturacion/facturas/nueva" style={{ textDecoration: 'underline' }}>Facturación</Link> y asígnala al proyecto en Contabilidad → Ingresos.</p>
      </div>
      {editando !== undefined && (
        <FormProyecto p={editando} productos={productos} onCerrar={() => setEditando(undefined)} onBorrar={() => borrar(editando)}
          onGuardado={() => { setEditando(undefined); show(true, 'Proyecto guardado'); cargar() }} />
      )}
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  return { props: { hoy: hoyMadrid() } }
}
