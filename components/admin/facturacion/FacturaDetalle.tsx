import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { Card, Btn, Campo, Modal, Aviso, Estado, Euros, ErrorApi, estadoVisible, fechaCorta, api, estiloInput, RespuestaApi, C } from './ui'

const METODOS = [['transferencia', 'Transferencia'], ['tarjeta', 'Tarjeta'], ['stripe', 'Stripe'], ['redsys', 'Redsys'], ['efectivo', 'Efectivo'], ['domiciliacion', 'Domiciliación'], ['otro', 'Otro']]
const REGIMEN = (l: any) => l.operacion_exenta ? `Exenta ${l.operacion_exenta}` : l.calificacion?.startsWith('N') ? `No sujeta ${l.calificacion}` : `${Number(l.tipo_iva)} %`

export default function FacturaDetalle({ f, hoy }: { f: any; hoy: string }) {
  const router = useRouter()
  const [modal, setModal] = useState<null | 'pagar' | 'anular' | 'rectificar'>(null)
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [pago, setPago] = useState({ fecha: hoy, metodo: 'transferencia' })
  const [motivo, setMotivo] = useState('')
  const [rect, setRect] = useState({ tipo: 'I', codigo: 'R1' })

  const e = f.emisor_snapshot || {}
  const c = f.cliente_snapshot || {}
  const simplificada = f.tipo_factura === 'F2' || f.tipo_factura === 'R5'
  // Reglas: anular solo si emitida, no entregada y no cobrada (ni online). Si no, rectificar.
  const puedeAnular = f.estado === 'emitida' && !f.entregada_at && !f.fecha_pago && !f.pago_ref
  const puedeRectificar = ['emitida', 'pagada'].includes(f.estado)

  const accion = async (nombre: string, cuerpo?: any, destino?: (data: any) => string) => {
    setOcupado(true); setRes(null)
    const r = await api(`/api/admin/facturacion/facturas/${f.id}/${nombre}`, 'POST', cuerpo)
    setOcupado(false)
    if (!r.ok) { setRes(r); return }
    setModal(null)
    router.replace(destino ? destino(r.data) : router.asPath.split('?')[0])
  }

  return (
    <>
      {router.query.emitida && <Aviso tipo="ok">✅ Factura {f.num_serie_factura} emitida y registrada en la cadena VeriFactu.</Aviso>}
      <ErrorApi r={res} />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <Estado estado={estadoVisible(f, hoy)} />
        {f.entregada_at && <span style={{ fontSize: 12, color: C.gris }}>Entregada {fechaCorta(f.entregada_at)} ({f.entregada_via})</span>}
        {f.pago_ref && <span style={{ fontSize: 12, color: C.gris }}>Cobro online · {f.pago_ref}</span>}
        <span style={{ flex: 1 }} />
        {f.estado === 'emitida' && <Btn variante="exito" onClick={() => setModal('pagar')}>✓ Marcar como pagada</Btn>}
        {f.estado === 'pagada' && !f.pago_ref && <Btn onClick={() => confirm('¿Deshacer el pago? La factura volverá a pendiente de cobro.') && accion('desmarcar')} disabled={ocupado}>Deshacer pago</Btn>}
        {['emitida', 'pagada'].includes(f.estado) && !f.entregada_at && <Btn onClick={() => confirm('¿Marcar como entregada al cliente? Después ya no se podrá anular, solo rectificar.') && accion('entregar')} disabled={ocupado}>Marcar como entregada</Btn>}
        {puedeRectificar && <Btn onClick={() => { setMotivo(''); setModal('rectificar') }}>Rectificar</Btn>}
        {!f.tipo_factura.startsWith('R') && <Btn onClick={() => accion('duplicar', undefined, d => `/admin/facturacion/facturas/${d.id}`)} disabled={ocupado}>Duplicar</Btn>}
        {puedeAnular && <Btn variante="peligro" onClick={() => { setMotivo(''); setModal('anular') }}>Anular</Btn>}
      </div>

      {f.fac_facturas && <Aviso tipo="info">Rectificativa {f.tipo_factura} ({f.tipo_rectificacion === 'S' ? 'sustitución' : 'diferencias'}) de <Link href={`/admin/facturacion/facturas/${f.fac_facturas.id}`} style={{ color: C.azul, fontWeight: 700 }}>{f.fac_facturas.num_serie_factura}</Link> · {f.motivo_rectificacion}</Aviso>}
      {f.other_fac_facturas?.length > 0 && <Aviso tipo="aviso">Rectificada por: {f.other_fac_facturas.map((r: any, i: number) => <span key={r.id}>{i > 0 && ', '}<Link href={`/admin/facturacion/facturas/${r.id}`} style={{ color: C.ambar, fontWeight: 700 }}>{r.num_serie_factura || 'borrador'}</Link> ({r.estado})</span>)}</Aviso>}

      <div className="fac-g3" style={{ marginBottom: 16, alignItems: 'stretch' }}>
        <Card titulo="Emisor" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', fontSize: 13, color: C.grisTexto, lineHeight: 1.6 }}>
            <strong style={{ color: C.negro }}>{e.nombre}</strong>{e.nombre_comercial && ` (${e.nombre_comercial})`}<br />NIF {e.nif}<br />{e.direccion}<br />{e.cp} {e.municipio} {e.provincia && `(${e.provincia})`}
          </div>
        </Card>
        <Card titulo="Destinatario" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', fontSize: 13, color: C.grisTexto, lineHeight: 1.6 }}>
            {c.razon_social ? <strong style={{ color: C.negro }}>{c.razon_social}</strong> : <span style={{ color: C.gris }}>Sin identificar (simplificada)</span>}<br />
            {c.nif && <>{c.tipo_id === '02' ? 'NIF-IVA' : 'NIF'} {c.nif}<br /></>}
            {c.direccion && <>{c.direccion}<br />{c.cp} {c.municipio} {c.provincia && `(${c.provincia})`} {c.pais && c.pais !== 'ES' && c.pais}</>}
            {f.cliente_id && <div><Link href={`/admin/facturacion/facturas?cliente_id=${f.cliente_id}`} style={{ color: C.naranjaOsc, fontSize: 12, fontWeight: 700 }}>Facturas de este cliente →</Link></div>}
          </div>
        </Card>
        <Card titulo="Fechas" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', fontSize: 13, color: C.grisTexto, lineHeight: 1.9 }}>
            Expedición: <strong style={{ color: C.negro }}>{fechaCorta(f.fecha_expedicion)}</strong><br />
            {f.fecha_operacion && <>Operación: <strong style={{ color: C.negro }}>{fechaCorta(f.fecha_operacion)}</strong><br /></>}
            Vencimiento: {fechaCorta(f.fecha_vencimiento)}<br />
            {f.fecha_pago && <>Pagada: {fechaCorta(f.fecha_pago)} · {METODOS.find(m => m[0] === f.metodo_pago)?.[1]}<br /></>}
            Tipo: {f.tipo_factura} · {simplificada ? 'Simplificada' : f.tipo_factura.startsWith('R') ? 'Rectificativa' : 'Completa'}
          </div>
        </Card>
      </div>

      <Card titulo="Conceptos" style={{ marginBottom: 16 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="fac-tabla">
            <thead><tr><th>Descripción</th><th className="fac-num">Cant.</th><th className="fac-num">Precio</th><th className="fac-num">Dto.</th><th>IVA</th><th className="fac-num">Base</th><th className="fac-num">Cuota</th></tr></thead>
            <tbody>{f.fac_lineas.map((l: any) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: 'pre-wrap' }}>{l.descripcion}</td>
                <td className="fac-num">{Number(l.cantidad).toLocaleString('es-ES')}</td>
                <td className="fac-num"><Euros v={l.precio_unitario} /></td>
                <td className="fac-num">{Number(l.descuento_pct) ? `${Number(l.descuento_pct)} %` : '—'}</td>
                <td>{REGIMEN(l)}</td>
                <td className="fac-num"><Euros v={l.base} /></td>
                <td className="fac-num"><Euros v={l.cuota} /></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px 18px' }}>
          <div style={{ minWidth: 280 }}>
            {[['Base imponible', f.base_imponible], ['IVA', f.cuota_iva], ['Total factura', f.importe_total],
              ...(Number(f.cuota_retencion) ? [[`Retención IRPF (${Number(f.tipo_retencion)} %)`, -Number(f.cuota_retencion)]] : [])].map(([k, v]: any) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 14, color: C.grisTexto }}><span>{k}</span><Euros v={v} /></div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${C.negro}`, marginTop: 6, paddingTop: 8, fontSize: 18, fontWeight: 800 }}>
              <span>{Number(f.cuota_retencion) ? 'Líquido a cobrar' : 'Total'}</span><Euros v={f.liquido_a_cobrar} />
            </div>
          </div>
        </div>
        {f.notas && <div style={{ padding: '0 20px 18px', fontSize: 13, color: C.grisTexto, whiteSpace: 'pre-wrap' }}><strong>Notas:</strong> {f.notas}</div>}
      </Card>

      <div className="fac-g2" style={{ alignItems: 'start' }}>
        <Card titulo="Registro VeriFactu">
          <div style={{ padding: '10px 20px 16px', fontSize: 12, color: C.grisTexto }}>
            {f.fac_registros_verifactu.map((r: any) => (
              <div key={r.id} style={{ padding: '8px 0', borderBottom: `1px solid ${C.borde}` }}>
                <strong style={{ color: C.negro, textTransform: 'capitalize' }}>{r.tipo_registro}</strong> · #{r.id} · {r.fecha_hora_huso_gen_registro} · envío: {r.estado_envio}{r.csv_aeat && ` · CSV ${r.csv_aeat}`}
                <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', marginTop: 3 }}>Huella: {r.huella}</div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', color: C.gris }}>Anterior: {r.huella_anterior || '— (primer registro)'}</div>
              </div>
            ))}
            <div style={{ marginTop: 8, color: C.gris }}>Modo al emitir: {f.modo_verifactu ? 'VERI*FACTU' : 'sin envío (no VERI*FACTU)'}</div>
          </div>
        </Card>
        <Card titulo="Historial">
          <div style={{ padding: '10px 20px 16px', fontSize: 12, color: C.grisTexto }}>
            {f.eventos.map((ev: any) => (
              <div key={ev.id} style={{ padding: '6px 0', borderBottom: `1px solid ${C.borde}` }}>
                <span style={{ color: C.gris }}>{new Date(ev.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</span> · <strong style={{ color: C.negro }}>{ev.accion === 'factura.estado' ? `${ev.payload?.de} → ${ev.payload?.a}` : ev.accion.replace(/^\w+\./, '').replace(/_/g, ' ')}</strong> · {ev.usuario}
                {ev.payload?.motivo && <div>Motivo: {ev.payload.motivo}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {modal === 'pagar' && (
        <Modal titulo="Marcar como pagada" onCerrar={() => setModal(null)} ancho={420}>
          <ErrorApi r={res} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Fecha de cobro"><input type="date" style={estiloInput} value={pago.fecha} max={hoy} onChange={ev => setPago(p => ({ ...p, fecha: ev.target.value }))} /></Campo>
            <Campo label="Método"><select style={estiloInput} value={pago.metodo} onChange={ev => setPago(p => ({ ...p, metodo: ev.target.value }))}>{METODOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variante="exito" onClick={() => accion('pagar', pago)} disabled={ocupado}>Confirmar cobro de <Euros v={f.liquido_a_cobrar} /></Btn>
          </div>
        </Modal>
      )}

      {modal === 'anular' && (
        <Modal titulo={`Anular ${f.num_serie_factura}`} onCerrar={() => setModal(null)} ancho={480}>
          <ErrorApi r={res} />
          <p style={{ fontSize: 13, color: C.grisTexto, marginTop: 0 }}>
            Solo para facturas <strong>emitidas por error</strong> que no se han entregado ni cobrado. Se genera un registro VeriFactu de anulación y el número queda consumido.
            Si la factura era correcta pero hay que cambiar algo, usa <em>Rectificar</em>.
          </p>
          <Campo label="Motivo *"><textarea style={{ ...estiloInput, minHeight: 70 }} value={motivo} onChange={ev => setMotivo(ev.target.value)} placeholder="Emitida por duplicado, cliente equivocado…" /></Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variante="peligro" onClick={() => accion('anular', { motivo })} disabled={ocupado || !motivo.trim()}>Anular factura</Btn>
          </div>
        </Modal>
      )}

      {modal === 'rectificar' && (
        <Modal titulo={`Rectificar ${f.num_serie_factura}`} onCerrar={() => setModal(null)} ancho={520}>
          <ErrorApi r={res} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Campo label="Método">
              <select style={estiloInput} value={rect.tipo} onChange={ev => setRect(r => ({ ...r, tipo: ev.target.value }))}>
                <option value="I">Por diferencias: precarga las líneas en negativo (anulación total o parcial)</option>
                <option value="S">Por sustitución: precarga las líneas para corregirlas</option>
              </select>
            </Campo>
            {!simplificada && (
              <Campo label="Causa (tipo VeriFactu)">
                <select style={estiloInput} value={rect.codigo} onChange={ev => setRect(r => ({ ...r, codigo: ev.target.value }))}>
                  <option value="R1">R1 · Error fundado en derecho y art. 80 Uno, Dos y Seis LIVA</option>
                  <option value="R2">R2 · Concurso de acreedores (art. 80.Tres)</option>
                  <option value="R3">R3 · Créditos incobrables (art. 80.Cuatro)</option>
                  <option value="R4">R4 · Resto de causas</option>
                </select>
              </Campo>
            )}
            {simplificada && <div style={{ fontSize: 12, color: C.gris }}>Factura simplificada: se rectifica con tipo R5.</div>}
            <Campo label="Motivo *"><textarea style={{ ...estiloInput, minHeight: 70 }} value={motivo} onChange={ev => setMotivo(ev.target.value)} placeholder="Descuento no aplicado, error en el precio, devolución…" /></Campo>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn variante="primario" onClick={() => accion('rectificar', { tipo: rect.tipo, codigo: rect.codigo, motivo }, d => `/admin/facturacion/facturas/${d.id}`)} disabled={ocupado || !motivo.trim()}>Crear rectificativa</Btn>
          </div>
        </Modal>
      )}
    </>
  )
}
