import { GetServerSideProps } from 'next'
import { useEffect, useMemo, useState } from 'react'
import { exigirAdmin } from '../../../lib/facturacion/api'
import { hoyMadrid } from '../../../lib/facturacion/fechas'
import { periodoActual } from '../../../lib/facturacion/dashboard'
import { D, r2 } from '../../../lib/facturacion/decimal'
import { validarNifEspanol } from '../../../lib/facturacion/validacion'
import { ETIQUETAS_CATEGORIA } from '../../../lib/facturacion/categorias'
import { Layout, Card, Btn, Campo, Modal, Euros, ErrorApi, Interruptor, api, estiloInput, fechaCorta, useMensaje, RespuestaApi, C } from '../../../components/admin/facturacion/ui'

const CATEGORIAS = ETIQUETAS_CATEGORIA
const VACIO = { proveedor: '', proveedor_nif: '', proveedor_pais: 'ES', numero: '', fecha: '', concepto: '', categoria: 'software', base_imponible: '', tipo_iva: '21', cuota_iva: '',
  tipo_retencion: '0', deducible_pct: '100', iva_deducible: true, notas: '' }

function trimestres(anio: number) {
  return [1, 2, 3, 4].map(t => {
    const m = (t - 1) * 3 + 1
    return { label: `${t}T ${anio}`, desde: `${anio}-${String(m).padStart(2, '0')}-01`, hasta: new Date(Date.UTC(anio, m + 2, 0)).toISOString().slice(0, 10) }
  })
}

function FormGasto({ gasto, hoy, onCerrar, onGuardado }: { gasto: any | null; hoy: string; onCerrar: () => void; onGuardado: () => void }) {
  const [f, setF] = useState<any>(() => gasto
    ? { ...VACIO, ...Object.fromEntries(Object.entries(gasto).map(([k, v]) => [k, v === null ? '' : typeof v === 'boolean' ? v : String(v)])), fecha: gasto.fecha.slice(0, 10), cuota_iva: String(gasto.cuota_iva) }
    : { ...VACIO, fecha: hoy })
  const [cuotaManual, setCuotaManual] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))
  const n = (v: string) => { const s = String(v || '').replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(s) ? s : '0' }

  const cuota = cuotaManual ? n(f.cuota_iva) : r2(D(n(f.base_imponible)).times(n(f.tipo_iva)).dividedBy(100)).toFixed(2)
  const ret = r2(D(n(f.base_imponible)).times(n(f.tipo_retencion)).dividedBy(100))
  const total = D(n(f.base_imponible)).plus(cuota).minus(ret)
  const nifError = f.proveedor_nif && f.proveedor_pais === 'ES' && !validarNifEspanol(f.proveedor_nif).valido ? validarNifEspanol(f.proveedor_nif).error : null

  const guardar = async () => {
    setGuardando(true)
    const fd = new FormData()
    Object.entries({ ...f, cuota_iva: cuotaManual ? f.cuota_iva : '' }).forEach(([k, v]) => fd.append(k, String(v)))
    if (archivo) fd.append('adjunto', archivo)
    const r = await api(gasto ? `/api/admin/facturacion/gastos/${gasto.id}` : '/api/admin/facturacion/gastos', gasto ? 'PUT' : 'POST', fd)
    setGuardando(false)
    if (r.ok) onGuardado(); else setRes(r)
  }

  return (
    <Modal titulo={gasto ? 'Editar gasto' : 'Nuevo gasto'} onCerrar={onCerrar} ancho={640}>
      <ErrorApi r={res} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ border: `2px dashed #f9dcc7`, background: '#fdf0e8', borderRadius: 14, padding: 18, textAlign: 'center', cursor: 'pointer', display: 'block' }}>
          <input type="file" accept="application/pdf,image/*" capture="environment" style={{ display: 'none' }} onChange={e => setArchivo(e.target.files?.[0] ?? null)} />
          <div style={{ fontSize: 14, fontWeight: 700, color: C.naranjaOsc }}>{archivo ? `📎 ${archivo.name}` : gasto?.adjunto_path ? '📎 Adjunto guardado · clic para sustituir' : '📷 Subir PDF o foto de la factura'}</div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 4 }}>PDF, JPG, PNG, WEBP o HEIC · máx. 10 MB</div>
        </label>
        <div className="fac-g3">
          <Campo label="Proveedor *"><input style={estiloInput} value={f.proveedor} onChange={e => set('proveedor', e.target.value)} autoFocus /></Campo>
          <Campo label="NIF del proveedor" error={nifError}><input style={{ ...estiloInput, textTransform: 'uppercase' }} value={f.proveedor_nif} onChange={e => set('proveedor_nif', e.target.value)} /></Campo>
          <Campo label="País (ISO)" ayuda="IE, US… si es extranjero"><input style={{ ...estiloInput, textTransform: 'uppercase' }} maxLength={2} value={f.proveedor_pais} onChange={e => set('proveedor_pais', e.target.value.toUpperCase())} /></Campo>
        </div>
        <div className="fac-g3">
          <Campo label="Nº de factura"><input style={estiloInput} value={f.numero} onChange={e => set('numero', e.target.value)} /></Campo>
          <Campo label="Fecha *"><input type="date" style={estiloInput} value={f.fecha} onChange={e => set('fecha', e.target.value)} /></Campo>
          <Campo label="Categoría"><select style={estiloInput} value={f.categoria} onChange={e => set('categoria', e.target.value)}>{Object.entries(CATEGORIAS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Campo>
        </div>
        <Campo label="Concepto"><input style={estiloInput} value={f.concepto} onChange={e => set('concepto', e.target.value)} /></Campo>
        <div className="fac-g3">
          <Campo label="Base imponible (€) *"><input inputMode="decimal" style={{ ...estiloInput, textAlign: 'right' }} value={f.base_imponible} onChange={e => set('base_imponible', e.target.value)} /></Campo>
          <Campo label="IVA %"><select style={estiloInput} value={f.tipo_iva} onChange={e => { set('tipo_iva', e.target.value); setCuotaManual(false) }}>{['21', '10', '4', '0'].map(v => <option key={v} value={v}>{v} %</option>)}</select></Campo>
          <Campo label="Cuota IVA (€)" ayuda={cuotaManual ? <a style={{ color: C.naranjaOsc, cursor: 'pointer' }} onClick={() => setCuotaManual(false)}>Recalcular</a> : 'Calculada · edítala si hay varios tipos'}>
            <input inputMode="decimal" style={{ ...estiloInput, textAlign: 'right' }} value={cuotaManual ? f.cuota_iva : cuota} onChange={e => { setCuotaManual(true); set('cuota_iva', e.target.value) }} />
          </Campo>
        </div>
        <div className="fac-g3">
          <Campo label="Retención soportada %" ayuda="Si el proveedor es profesional"><select style={estiloInput} value={f.tipo_retencion} onChange={e => set('tipo_retencion', e.target.value)}>{['0', '7', '15', '19'].map(v => <option key={v} value={v}>{v} %</option>)}</select></Campo>
          <Campo label="% deducible" ayuda="Afecta a IVA e IRPF"><input inputMode="decimal" style={{ ...estiloInput, textAlign: 'right' }} value={f.deducible_pct} onChange={e => set('deducible_pct', e.target.value)} /></Campo>
          <Campo label="Total factura"><div style={{ ...estiloInput, background: C.fondo, textAlign: 'right', fontWeight: 800 }}><Euros v={total} /></div></Campo>
        </div>
        <Interruptor valor={f.iva_deducible === true || f.iva_deducible === 'true'} onChange={v => set('iva_deducible', v)} label="IVA deducible" ayuda="Desactívalo si la factura no permite deducir el IVA (p. ej., simplificada sin tus datos)" />
        <Campo label="Notas"><textarea style={{ ...estiloInput, minHeight: 50 }} value={f.notas} onChange={e => set('notas', e.target.value)} /></Campo>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
        <Btn onClick={onCerrar}>Cancelar</Btn>
        <Btn variante="primario" onClick={guardar} disabled={guardando || !f.proveedor.trim() || !f.fecha || !!nifError}>{guardando ? 'Guardando…' : 'Guardar gasto'}</Btn>
      </div>
    </Modal>
  )
}

export default function Gastos({ hoy, anio, trimestre }: { hoy: string; anio: number; trimestre: number }) {
  const [periodo, setPeriodo] = useState({ ...trimestres(anio)[trimestre - 1] })
  const [q, setQ] = useState('')
  const [datos, setDatos] = useState<any>(null)
  const [editando, setEditando] = useState<any | null | undefined>(undefined)
  const { mostrar, Mensaje } = useMensaje()
  const opciones = useMemo(() => [...trimestres(anio), { label: `Año ${anio}`, desde: `${anio}-01-01`, hasta: `${anio}-12-31` }, ...trimestres(anio - 1), { label: 'Todo', desde: '', hasta: '' }], [anio])

  const cargar = async () => {
    const r = await api(`/api/admin/facturacion/gastos?desde=${periodo.desde}&hasta=${periodo.hasta}&q=${encodeURIComponent(q)}`)
    if (r.ok) setDatos(r.data)
  }
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t) }, [periodo, q]) // eslint-disable-line react-hooks/exhaustive-deps

  const eliminar = async (g: any) => {
    if (!confirm(`¿Eliminar el gasto de ${g.proveedor} (${fechaCorta(g.fecha)})?`)) return
    const r = await api(`/api/admin/facturacion/gastos/${g.id}`, 'DELETE')
    r.ok ? (mostrar('ok', 'Gasto eliminado'), cargar()) : mostrar('error', r.error!)
  }

  return (
    <Layout titulo="Gastos" acciones={<Btn variante="primario" onClick={() => setEditando(null)}>+ Nuevo gasto</Btn>}>
      <Mensaje />
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select style={{ ...estiloInput, width: 160 }} value={periodo.label} onChange={e => setPeriodo(opciones.find(o => o.label === e.target.value)!)}>
            {opciones.map(o => <option key={o.label}>{o.label}</option>)}
          </select>
          <input style={{ ...estiloInput, flex: '1 1 240px', width: 'auto' }} placeholder="Buscar proveedor, número o concepto…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </Card>
      {datos && (
        <div className="fac-g4" style={{ marginBottom: 16 }}>
          {[['Base', datos.sumas.base_imponible], ['IVA soportado', datos.sumas.cuota_iva], ['Retenciones', datos.sumas.cuota_retencion], ['Total', datos.sumas.total]].map(([l, v]) => (
            <div key={l} style={{ background: 'white', border: `1px solid ${C.borde}`, borderRadius: 14, padding: '14px 18px' }}>
              <div style={{ fontSize: 12, color: C.gris }}>{l}</div><div style={{ fontSize: 20, fontWeight: 800 }}><Euros v={v ?? 0} /></div>
            </div>
          ))}
        </div>
      )}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="fac-tabla">
            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Nº</th><th>Categoría</th><th className="fac-num">Base</th><th className="fac-num">IVA</th><th className="fac-num">Total</th><th>Adjunto</th><th></th></tr></thead>
            <tbody>{(datos?.gastos || []).map((g: any) => (
              <tr key={g.id} className="fac-click" onClick={() => setEditando(g)}>
                <td>{fechaCorta(g.fecha)}</td>
                <td style={{ fontWeight: 700 }}>{g.proveedor}{g.concepto && <div style={{ fontSize: 11, color: C.gris, fontWeight: 400 }}>{g.concepto}</div>}</td>
                <td>{g.numero || '—'}</td>
                <td>{CATEGORIAS[g.categoria] || g.categoria}{Number(g.deducible_pct) < 100 && <span style={{ color: C.gris }}> · {Number(g.deducible_pct)} %</span>}</td>
                <td className="fac-num"><Euros v={g.base_imponible} /></td>
                <td className="fac-num"><Euros v={g.cuota_iva} /></td>
                <td className="fac-num" style={{ fontWeight: 700 }}><Euros v={g.total} /></td>
                <td onClick={e => e.stopPropagation()}>{g.adjunto_path ? <a href={`/api/admin/facturacion/gastos/${g.id}/adjunto`} target="_blank" rel="noreferrer" style={{ color: C.naranjaOsc, fontWeight: 700 }}>📎 Ver</a> : <span style={{ color: C.ambar }}>Falta</span>}</td>
                <td onClick={e => e.stopPropagation()}><button onClick={() => eliminar(g)} title="Eliminar" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.gris, fontSize: 16 }}>🗑</button></td>
              </tr>
            ))}</tbody>
          </table>
          {datos?.gastos.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: C.gris }}>No hay gastos en este periodo</div>}
        </div>
      </Card>
      {editando !== undefined && <FormGasto gasto={editando} hoy={hoy} onCerrar={() => setEditando(undefined)} onGuardado={() => { setEditando(undefined); mostrar('ok', 'Gasto guardado'); cargar() }} />}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const p = periodoActual()
  return { props: { hoy: hoyMadrid(), anio: p.anio, trimestre: p.trimestre } }
}
