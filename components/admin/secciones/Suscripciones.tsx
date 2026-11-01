import { useMemo, useState } from 'react'
import { Badge, Button, Column, DataTable, EmptyState, Section, fecha, useFlash } from '../ui'
import { ESTADOS_SUSCRIPCION, INTERVALO_TEXTO, ProductoMenu, presentacion } from '../../../lib/admin/productos'
import { SuscripcionAdmin, productoDe, slugTenant, tieneTenant } from '../../../lib/admin/metricas'

const ESTADOS_FILTRO: [string, string][] = [['todas', 'Todas'], ['active', 'Activas'], ['pending', 'Pendientes'], ['bajas', 'Canceladas / expiradas']]

/**
 * Tabla de suscripciones con sus acciones (activar, provisionar, cancelar, borrar datos del tenant, borrar registro).
 * Con `productos` muestra la columna y el filtro de producto (vista unificada de Clientes).
 */
export default function Suscripciones({ inicial, productos, titulo = 'Suscripciones' }: {
  inicial: SuscripcionAdmin[]; productos?: ProductoMenu[]; titulo?: string
}) {
  const [lista, setLista] = useState(inicial)
  const [accionId, setAccionId] = useState<string | null>(null)
  const [estado, setEstado] = useState('todas')
  const [producto, setProducto] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const { show, Flash } = useFlash()

  const nombreProducto = (slug: string | null) => productos?.find(p => p.slug === slug)?.name ?? slug

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return lista.filter(s =>
      (estado === 'todas' || (estado === 'bajas' ? s.status === 'cancelled' || s.status === 'expired' : s.status === estado)) &&
      (producto === 'todos' || (productoDe(s) ?? 'sin') === producto) &&
      (!q || s.user.name.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q)))
  }, [lista, estado, producto, busqueda])

  const llamar = async (s: SuscripcionAdmin, url: string, method: string) => {
    setAccionId(s.id)
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscriptionId: s.id }) })
    const data = await res.json().catch(() => ({}))
    setAccionId(null)
    return { ok: res.ok, data }
  }
  const actualizar = (id: string, cambios: Partial<SuscripcionAdmin>) => setLista(l => l.map(x => (x.id === id ? { ...x, ...cambios } : x)))

  const cancelar = async (s: SuscripcionAdmin) => {
    if (!confirm(`¿Anular la suscripción de ${s.user.name}? Se marcará como cancelada.`)) return
    const r = await llamar(s, '/api/admin/cancel-subscription', 'POST')
    if (r.ok) { actualizar(s.id, { status: 'cancelled' }); show(true, 'Suscripción anulada correctamente') }
    else show(false, 'Error al anular la suscripción')
  }

  const activar = async (s: SuscripcionAdmin) => {
    if (!confirm(`¿Activar manualmente la suscripción de ${s.user.name}?`)) return
    const r = await llamar(s, '/api/admin/activate-subscription', 'POST')
    if (r.ok) { actualizar(s.id, { status: 'active', servixSlug: r.data.slug ?? s.servixSlug }); show(true, 'Suscripción activada y tenant creado') }
    else show(false, r.data.error || 'Error al activar')
  }

  const borrarDatos = async (s: SuscripcionAdmin) => {
    if (!confirm(`¿Eliminar TODOS los datos del tenant de ${s.user.name}? Esta acción es irreversible.`)) return
    const r = await llamar(s, '/api/admin/delete-restaurant', 'DELETE')
    if (r.ok) { actualizar(s.id, { servixRestaurantId: null, servixSlug: null, provisioning: null }); show(true, 'Datos del tenant eliminados') }
    else show(false, 'Error al eliminar los datos del tenant')
  }

  const borrarRegistro = async (s: SuscripcionAdmin) => {
    // Aviso si hay facturas emitidas vinculadas a sus cobros (se conservan igualmente).
    const fr = await fetch(`/api/admin/facturacion/suscripcion-facturas?subscriptionId=${s.id}`).then(r => (r.ok ? r.json() : [])).catch(() => [])
    const avisoFacturas = fr.length
      ? `\n\n⚠️ Tiene ${fr.length} factura(s) emitida(s): ${fr.map((f: any) => f.num_serie_factura).join(', ')}. Las facturas se conservan en Facturación (no se pueden borrar), pero perderán el enlace con este cobro.`
      : ''
    if (!confirm(`¿Eliminar completamente el registro de ${s.user.name}? Se borrará la suscripción de la BD.${avisoFacturas}`)) return
    const r = await llamar(s, '/api/admin/delete-subscription', 'DELETE')
    if (r.ok) { setLista(l => l.filter(x => x.id !== s.id)); show(true, 'Registro eliminado') }
    else show(false, 'Error al eliminar')
  }

  const acciones = (s: SuscripcionAdmin) => {
    if (accionId === s.id) return <span className="adm-muted">⏳ Procesando…</span>
    const tenant = tieneTenant(s)
    const baja = s.status === 'cancelled' || s.status === 'expired'
    return (
      <div className="adm-fila" style={{ gap: 6 }}>
        {s.status === 'pending' && <>
          <Button small variant="exito" onClick={() => activar(s)}>Activar</Button>
          <Button small variant="aviso" onClick={() => cancelar(s)}>Anular</Button>
        </>}
        {s.status === 'active' && <>
          {!tenant && <Button small variant="aviso" onClick={() => activar(s)}>Provisionar</Button>}
          <Button small variant="peligro" onClick={() => cancelar(s)}>Cancelar</Button>
        </>}
        {baja && <Button small variant="exito" onClick={() => activar(s)}>Reactivar</Button>}
        {tenant && <Button small variant="peligro" onClick={() => borrarDatos(s)}>Eliminar datos</Button>}
        {(baja || s.status === 'pending') && !tenant && <Button small onClick={() => borrarRegistro(s)}>Borrar</Button>}
      </div>
    )
  }

  const columnas: Column<SuscripcionAdmin>[] = [
    { key: 'cliente', header: 'Cliente', render: s => <><div className="adm-fuerte">{s.user.name}</div><div className="adm-muted adm-peq">{s.user.email}</div></> },
    ...(productos ? [{
      key: 'producto', header: 'Producto', render: (s: SuscripcionAdmin) => {
        const slug = productoDe(s)
        return slug ? <Badge color={presentacion(slug).color}>{nombreProducto(slug)}</Badge> : <Badge tone="warn">Sin producto</Badge>
      },
    }] : []),
    { key: 'plan', header: 'Plan', render: s => <span className="adm-fuerte" style={{ whiteSpace: 'nowrap' }}>{s.plan.price > 0 ? `${s.plan.name} · ${s.plan.price}€/${INTERVALO_TEXTO[s.plan.interval] ?? s.plan.interval}` : `${s.plan.name} (sin coste)`}</span> },
    { key: 'estado', header: 'Estado', render: s => { const e = ESTADOS_SUSCRIPCION[s.status]; return <Badge tone={e?.tono ?? 'neutro'}>{e?.label ?? s.status}</Badge> } },
    { key: 'inicio', header: 'Inicio', render: s => <span className="adm-muted" suppressHydrationWarning>{fecha(s.startDate)}</span> },
    { key: 'vence', header: 'Vence', render: s => <span className="adm-muted" suppressHydrationWarning>{fecha(s.endDate)}</span> },
    {
      key: 'tenant', header: 'Tenant', render: s => {
        const slug = slugTenant(s)
        const url = presentacion(productoDe(s)).url
        if (!slug) return <span className="adm-faint">—</span>
        return url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--adm-accent)', fontWeight: 600 }}>{slug}</a> : <span>{slug}</span>
      },
    },
    { key: 'acciones', header: 'Acciones', render: acciones },
  ]

  return (
    <>
      <Flash />
      <Section padded={false} title={titulo} subtitle={`${filtradas.length} de ${lista.length} registros`}
        actions={<input className="adm-input" style={{ width: 240 }} placeholder="Buscar nombre o email…" value={busqueda} onChange={e => setBusqueda(e.target.value)} aria-label="Buscar suscripción" />}>
        <div className="adm-filtros" style={{ padding: '14px 20px', borderBottom: '1px solid var(--adm-border)' }}>
          {ESTADOS_FILTRO.map(([k, l]) => <button key={k} type="button" className={`adm-chip${estado === k ? ' activo' : ''}`} onClick={() => setEstado(k)}>{l}</button>)}
          {productos && (
            <select className="adm-input" style={{ width: 'auto', marginLeft: 'auto' }} value={producto} onChange={e => setProducto(e.target.value)} aria-label="Filtrar por producto">
              <option value="todos">Todos los productos</option>
              {productos.map(p => <option key={p.slug} value={p.slug}>{p.name}</option>)}
              <option value="sin">Sin producto</option>
            </select>
          )}
        </div>
        <DataTable columns={columnas} rows={filtradas} rowKey={s => s.id}
          empty={<EmptyState icon="👥" title={lista.length ? 'Ninguna suscripción con estos filtros' : 'Aún no hay suscriptores'} />} />
      </Section>
    </>
  )
}
