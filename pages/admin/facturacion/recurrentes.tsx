import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useEffect, useMemo, useState } from 'react'
import { exigirAdmin } from '../../../lib/facturacion/api'
import { calcularLinea, calcularTotales } from '../../../lib/facturacion/calculos'
import { Layout, Card, Btn, Campo, Modal, Interruptor, Estado, Euros, ErrorApi, api, estiloInput, fechaCorta, useMensaje, RespuestaApi, C } from '../../../components/admin/facturacion/ui'
import { SelectorCliente } from '../../../components/admin/facturacion/Clientes'

const lineaVacia = () => ({ descripcion: 'Iguala mensual de soporte y mantenimiento ({mes} {año})', cantidad: '1', precio_unitario: '', tipo_iva: '21' })
const n = (v: string) => { const s = String(v || '').replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(s) ? s : '0' }

function FormRecurrente({ r, onCerrar, onGuardado }: { r: any | null; onCerrar: () => void; onGuardado: () => void }) {
  const [cliente, setCliente] = useState<any>(r?.fac_clientes ?? null)
  const [f, setF] = useState<any>(() => r
    ? { descripcion: r.descripcion, dia_mes: String(r.dia_mes), proxima_fecha: r.proxima_fecha.slice(0, 10), emitir_auto: r.emitir_auto, enviar_email: r.enviar_email, activo: r.activo }
    : { descripcion: 'Iguala mensual', dia_mes: '1', proxima_fecha: '', emitir_auto: true, enviar_email: true, activo: true })
  const [lineas, setLineas] = useState<any[]>(r?.lineas ?? [lineaVacia()])
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))
  const setL = (i: number, k: string, v: string) => setLineas(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l))
  const tot = useMemo(() => calcularTotales(lineas.map(l => calcularLinea({ cantidad: n(l.cantidad), precio_unitario: n(l.precio_unitario), tipo_iva: n(l.tipo_iva) })), 0), [lineas])

  const guardar = async () => {
    setGuardando(true)
    const r2 = await api(r ? `/api/admin/facturacion/recurrentes/${r.id}` : '/api/admin/facturacion/recurrentes', r ? 'PUT' : 'POST', { ...f, cliente_id: cliente?.id, lineas })
    setGuardando(false)
    r2.ok ? onGuardado() : setRes(r2)
  }

  return (
    <Modal titulo={r ? 'Editar recurrente' : 'Nueva factura recurrente'} onCerrar={onCerrar} ancho={720}>
      <ErrorApi r={res} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Campo label="Cliente *"><SelectorCliente valor={cliente} onChange={setCliente} /></Campo>
        <div className="fac-g3">
          <Campo label="Nombre *"><input style={estiloInput} value={f.descripcion} onChange={e => set('descripcion', e.target.value)} /></Campo>
          <Campo label="Día del mes (1–28)"><input inputMode="numeric" style={estiloInput} value={f.dia_mes} onChange={e => set('dia_mes', e.target.value)} /></Campo>
          <Campo label="Próxima factura" ayuda="Vacío: la próxima fecha con ese día"><input type="date" style={estiloInput} value={f.proxima_fecha} onChange={e => set('proxima_fecha', e.target.value)} /></Campo>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Conceptos <span style={{ color: C.gris, fontWeight: 400 }}>· puedes usar {'{mes}'} y {'{año}'}</span></div>
          {lineas.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 100px 80px 28px', gap: 6, marginBottom: 6 }}>
              <input style={estiloInput} value={l.descripcion} onChange={e => setL(i, 'descripcion', e.target.value)} placeholder="Concepto" />
              <input style={{ ...estiloInput, textAlign: 'right' }} value={l.cantidad} onChange={e => setL(i, 'cantidad', e.target.value)} />
              <input style={{ ...estiloInput, textAlign: 'right' }} value={l.precio_unitario} onChange={e => setL(i, 'precio_unitario', e.target.value)} placeholder="Precio" />
              <select style={estiloInput} value={l.tipo_iva} onChange={e => setL(i, 'tipo_iva', e.target.value)}>{['21', '10', '4'].map(v => <option key={v} value={v}>{v} %</option>)}</select>
              <button onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))} disabled={lineas.length === 1} style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.gris, fontSize: 18 }}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Btn variante="fantasma" onClick={() => setLineas(ls => [...ls, { ...lineaVacia(), descripcion: '' }])}>+ Línea</Btn>
            <span style={{ fontSize: 13, color: C.grisTexto }}>Total mensual (antes de retención): <strong><Euros v={tot.importe_total} /></strong></span>
          </div>
        </div>
        <Interruptor valor={f.emitir_auto} onChange={v => set('emitir_auto', v)} label="Emitir automáticamente" ayuda="Si lo desactivas, se crea como borrador para revisarla antes de emitir." />
        <Interruptor valor={f.enviar_email} onChange={v => set('enviar_email', v)} label="Enviar por email al emitir" ayuda={cliente && !cliente.email ? '⚠️ El cliente no tiene email' : 'Al email del cliente, con el PDF adjunto.'} />
        {r && <Interruptor valor={f.activo} onChange={v => set('activo', v)} label="Activa" ayuda="Las recurrentes no se borran: se desactivan." />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
        <Btn onClick={onCerrar}>Cancelar</Btn>
        <Btn variante="primario" onClick={guardar} disabled={guardando || !cliente}>{guardando ? 'Guardando…' : 'Guardar'}</Btn>
      </div>
    </Modal>
  )
}

export default function Recurrentes() {
  const [lista, setLista] = useState<any[] | null>(null)
  const [editando, setEditando] = useState<any | null | undefined>(undefined)
  const { mostrar, Mensaje } = useMensaje()
  const cargar = async () => { const r = await api('/api/admin/facturacion/recurrentes'); if (r.ok) setLista(r.data) }
  useEffect(() => { cargar() }, [])

  return (
    <Layout titulo="Facturas recurrentes" acciones={<Btn variante="primario" onClick={() => setEditando(null)}>+ Nueva recurrente</Btn>}>
      <Mensaje />
      <div style={{ fontSize: 13, color: C.grisTexto, marginBottom: 14 }}>El cron de facturación las genera el día indicado de cada mes (con número y fecha de ese día), las emite y las envía por email si así lo configuras.</div>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="fac-tabla">
            <thead><tr><th>Cliente</th><th>Recurrente</th><th>Día</th><th>Próxima</th><th className="fac-num">Importe</th><th>Modo</th><th>Últimas</th></tr></thead>
            <tbody>{(lista || []).map(r => {
              const total = calcularTotales((r.lineas as any[]).map(l => calcularLinea({ cantidad: n(l.cantidad), precio_unitario: n(l.precio_unitario), tipo_iva: n(l.tipo_iva) })), 0).importe_total
              return (
                <tr key={r.id} className="fac-click" onClick={() => setEditando(r)} style={{ opacity: r.activo ? 1 : 0.5 }}>
                  <td style={{ fontWeight: 700 }}>{r.fac_clientes.razon_social}</td>
                  <td>{r.descripcion}{!r.activo && <span style={{ color: C.gris }}> · desactivada</span>}</td>
                  <td>{r.dia_mes}</td>
                  <td>{r.activo ? fechaCorta(r.proxima_fecha) : '—'}</td>
                  <td className="fac-num"><Euros v={total} /></td>
                  <td style={{ fontSize: 12 }}>{r.emitir_auto ? 'Emite' : 'Borrador'}{r.enviar_email ? ' + email' : ''}</td>
                  <td onClick={e => e.stopPropagation()}>{r.fac_facturas.map((f: any) => (
                    <Link key={f.id} href={`/admin/facturacion/facturas/${f.id}`} style={{ marginRight: 8, fontSize: 12, color: f.bloqueo_motivo ? C.rojo : C.naranjaOsc, fontWeight: 700 }} title={f.bloqueo_motivo || ''}>
                      {f.num_serie_factura || 'borrador'}
                    </Link>
                  ))}</td>
                </tr>
              )
            })}</tbody>
          </table>
          {lista?.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: C.gris }}>Sin facturas recurrentes. Úsalas para las igualas mensuales.</div>}
        </div>
      </Card>
      {editando !== undefined && <FormRecurrente r={editando} onCerrar={() => setEditando(undefined)} onGuardado={() => { setEditando(undefined); mostrar('ok', 'Recurrente guardada'); cargar() }} />}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
