import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { exigirAdmin } from '../../../../lib/facturacion/api'
import { hoyMadrid } from '../../../../lib/facturacion/fechas'
import { Layout, Card, Btn, Estado, Euros, estadoVisible, fechaCorta, estiloInput, api, C } from '../../../../components/admin/facturacion/ui'

const FILTROS_VACIOS = { q: '', estado: '', serie: '', desde: '', hasta: '', cliente_id: '' }

export default function Facturas({ hoy }: { hoy: string }) {
  const router = useRouter()
  const [f, setF] = useState(FILTROS_VACIOS)
  const [pagina, setPagina] = useState(1)
  const [datos, setDatos] = useState<any>(null)
  const [cargando, setCargando] = useState(true)

  // Filtros sincronizados con la URL (enlaces compartibles, "atrás" conserva el filtro)
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query as Record<string, string>
    setF({ ...FILTROS_VACIOS, ...Object.fromEntries(Object.keys(FILTROS_VACIOS).filter(k => q[k]).map(k => [k, q[k]])) })
    setPagina(parseInt(q.pagina || '1', 10) || 1)
  }, [router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!router.isReady) return
    const t = setTimeout(async () => {
      setCargando(true)
      const params = new URLSearchParams(Object.entries({ ...f, pagina: String(pagina) }).filter(([k, v]) => v && !(k === 'pagina' && v === '1')))
      router.replace({ query: Object.fromEntries(params) }, undefined, { shallow: true })
      const r = await api(`/api/admin/facturacion/facturas?${params}`)
      if (r.ok) setDatos(r.data)
      setCargando(false)
    }, 250)
    return () => clearTimeout(t)
  }, [f, pagina, router.isReady]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k: keyof typeof f, v: string) => { setF(x => ({ ...x, [k]: v })); setPagina(1) }
  const paginas = datos ? Math.max(1, Math.ceil(datos.total / datos.porPagina)) : 1
  const hayFiltros = Object.values(f).some(Boolean)

  return (
    <Layout titulo="Facturas" acciones={<Link href="/admin/facturacion/facturas/nueva"><Btn variante="primario">+ Nueva factura</Btn></Link>}>
      <Card style={{ padding: 16, marginBottom: 16, overflow: 'visible' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input style={{ ...estiloInput, flex: '1 1 240px', width: 'auto' }} placeholder="Buscar por número, cliente, NIF o concepto…" value={f.q} onChange={e => set('q', e.target.value)} />
          <select style={{ ...estiloInput, width: 150 }} value={f.estado} onChange={e => set('estado', e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borradores</option>
            <option value="emitida">Pendientes de cobro</option>
            <option value="vencida">Vencidas</option>
            <option value="pagada">Pagadas</option>
            <option value="anulada">Anuladas</option>
          </select>
          <select style={{ ...estiloInput, width: 150 }} value={f.serie} onChange={e => set('serie', e.target.value)}>
            <option value="">Todas las series</option>
            <option value="F">F · Ordinarias</option>
            <option value="S">S · Simplificadas</option>
            <option value="R">R · Rectificativas</option>
          </select>
          <input type="date" style={{ ...estiloInput, width: 150 }} value={f.desde} onChange={e => set('desde', e.target.value)} aria-label="Desde" />
          <span style={{ color: C.gris }}>→</span>
          <input type="date" style={{ ...estiloInput, width: 150 }} value={f.hasta} onChange={e => set('hasta', e.target.value)} aria-label="Hasta" />
          {hayFiltros && <Btn variante="fantasma" onClick={() => { setF(FILTROS_VACIOS); setPagina(1) }}>Limpiar</Btn>}
        </div>
        {f.cliente_id && <div style={{ fontSize: 12, color: C.gris, marginTop: 8 }}>Filtrando por un cliente · <a style={{ color: C.naranjaOsc, cursor: 'pointer' }} onClick={() => set('cliente_id', '')}>quitar</a></div>}
      </Card>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="fac-tabla">
            <thead><tr><th>Número</th><th>Fecha</th><th>Cliente</th><th>Concepto</th><th>Estado</th><th>Vence</th><th className="fac-num">Total</th></tr></thead>
            <tbody>
              {(datos?.facturas || []).map((x: any) => (
                <tr key={x.id} className="fac-click" onClick={() => router.push(`/admin/facturacion/facturas/${x.id}`)}>
                  <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {x.num_serie_factura || <span style={{ color: C.gris, fontWeight: 500 }}>Borrador</span>}
                    {x.origen !== 'manual' && <span style={{ fontSize: 10, color: C.gris, marginLeft: 6, textTransform: 'uppercase' }}>{x.origen}</span>}
                  </td>
                  <td>{fechaCorta(x.fecha_expedicion)}</td>
                  <td>
                    {x.fac_clientes?.razon_social || x.cliente_snapshot?.razon_social || <span style={{ color: C.gris }}>Sin destinatario</span>}
                    {x.fac_clientes?.nif && <div style={{ fontSize: 11, color: C.gris }}>{x.fac_clientes.nif}</div>}
                  </td>
                  <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.grisTexto }}>
                    {x.bloqueo_motivo ? <span style={{ color: C.ambar }}>⚠️ {x.bloqueo_motivo}</span> : x.descripcion_operacion}
                  </td>
                  <td><Estado estado={estadoVisible(x, hoy)} /></td>
                  <td>{x.estado === 'emitida' ? fechaCorta(x.fecha_vencimiento) : '—'}</td>
                  <td className="fac-num" style={{ fontWeight: 700 }}><Euros v={x.importe_total} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!cargando && datos?.facturas.length === 0 && (
            <div style={{ padding: 48, textAlign: 'center', color: C.gris }}>{hayFiltros ? 'Ninguna factura coincide con los filtros' : 'Aún no hay facturas'}</div>
          )}
          {cargando && !datos && <div style={{ padding: 48, textAlign: 'center', color: C.gris }}>Cargando…</div>}
        </div>
        {datos && datos.total > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: `1px solid ${C.borde}`, fontSize: 13, color: C.grisTexto, flexWrap: 'wrap', gap: 8 }}>
            <span>{datos.total} factura(s) · Base <Euros v={datos.sumas.base_imponible ?? 0} /> · Total <Euros v={datos.sumas.importe_total ?? 0} /> <span style={{ color: C.gris }}>(emitidas y pagadas)</span></span>
            {paginas > 1 && (
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Btn disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>←</Btn>
                {pagina} / {paginas}
                <Btn disabled={pagina >= paginas} onClick={() => setPagina(p => p + 1)}>→</Btn>
              </span>
            )}
          </div>
        )}
      </Card>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  return { props: { hoy: hoyMadrid() } }
}
