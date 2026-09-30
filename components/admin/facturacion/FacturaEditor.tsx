import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { calcularLinea, calcularTotales } from '../../../lib/facturacion/calculos'
import { D, fmt2 } from '../../../lib/facturacion/decimal'
import { SelectorCliente } from './Clientes'
import { Card, Btn, Campo, Aviso, Euros, ErrorApi, api, estiloInput, RespuestaApi, C, fechaCorta } from './ui'

// Crear / editar / emitir un borrador en una sola pantalla.

// Opción de IVA de la línea → tipo, calificación y exención VeriFactu
const REGIMENES: Record<string, { label: string; tipo: string; calificacion: string; exenta: string | null }> = {
  '21': { label: '21 %', tipo: '21', calificacion: 'S1', exenta: null },
  '10': { label: '10 %', tipo: '10', calificacion: 'S1', exenta: null },
  '4':  { label: '4 %',  tipo: '4',  calificacion: 'S1', exenta: null },
  E1:   { label: 'Exenta (art. 20)', tipo: '0', calificacion: 'S1', exenta: 'E1' },
  N2:   { label: 'No sujeta (localización)', tipo: '0', calificacion: 'N2', exenta: null },
}
const regimenDe = (l: any) => l.operacion_exenta ? l.operacion_exenta : l.calificacion?.startsWith('N') ? 'N2' : String(Number(l.tipo_iva))

interface Linea { descripcion: string; cantidad: string; precio_unitario: string; descuento_pct: string; regimen: string }
const lineaVacia = (iva: string): Linea => ({ descripcion: '', cantidad: '1', precio_unitario: '', descuento_pct: '0', regimen: iva })
const num = (s: string) => { const v = String(s ?? '').replace(',', '.').trim(); return /^-?\d+(\.\d+)?$/.test(v) ? v : '0' }

export default function FacturaEditor({ factura, clienteInicial, ajustes, conceptos: conceptosIniciales, emisorError }: {
  factura: any | null; clienteInicial?: any | null; ajustes: any; conceptos: any[]; emisorError: string | null
}) {
  const router = useRouter()
  const ivaDef = String(Number(ajustes.iva_defecto))
  const esRect = factura?.tipo_factura?.startsWith('R')

  const [cliente, setCliente] = useState<any>(factura?.fac_clientes ?? clienteInicial ?? null)
  const [tipo, setTipo] = useState<'F1' | 'F2'>(factura?.tipo_factura === 'F2' ? 'F2' : 'F1')
  const [dest, setDest] = useState({ razon_social: factura?.cliente_snapshot?.razon_social ?? '', nif: factura?.cliente_snapshot?.nif ?? '' })
  const [lineas, setLineas] = useState<Linea[]>(() => factura?.fac_lineas?.length
    ? factura.fac_lineas.map((l: any) => ({ descripcion: l.descripcion, cantidad: String(Number(l.cantidad)), precio_unitario: String(Number(l.precio_unitario)), descuento_pct: String(Number(l.descuento_pct)), regimen: regimenDe(l) }))
    : [lineaVacia(ivaDef)])
  const [retencion, setRetencion] = useState<string>(factura ? String(Number(factura.tipo_retencion)) : clienteInicial?.aplica_retencion ? String(Number(ajustes.retencion_defecto)) : '0')
  const [retManual, setRetManual] = useState(!!factura)
  const [fechaOperacion, setFechaOperacion] = useState(factura?.fecha_operacion?.slice(0, 10) ?? '')
  const [vencimiento, setVencimiento] = useState(factura?.fecha_vencimiento?.slice(0, 10) ?? '')
  const [descripcion, setDescripcion] = useState(factura?.descripcion_operacion ?? '')
  const [notas, setNotas] = useState(factura?.notas ?? '')
  const [conceptos, setConceptos] = useState(conceptosIniciales)
  const [res, setRes] = useState<RespuestaApi | null>(() =>
    typeof router.query.error === 'string' && router.query.error ? { ok: false, error: router.query.error, code: String(router.query.code || '') } : null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const elegirCliente = (c: any | null) => {
    setCliente(c)
    if (c && !esRect) setTipo('F1')
    if (!retManual) setRetencion(c?.aplica_retencion ? String(Number(ajustes.retencion_defecto)) : '0')
  }

  const setLinea = (i: number, k: keyof Linea, v: string) => setLineas(ls => ls.map((l, j) => j === i ? { ...l, [k]: v } : l))
  const calculadas = useMemo(() => lineas.map(l => {
    const r = REGIMENES[l.regimen] ?? REGIMENES['21']
    return calcularLinea({ cantidad: num(l.cantidad), precio_unitario: num(l.precio_unitario), descuento_pct: num(l.descuento_pct), tipo_iva: r.tipo })
  }), [lineas])
  const tot = useMemo(() => calcularTotales(calculadas, num(retencion)), [calculadas, retencion])
  const tipoEfectivo = esRect ? factura.tipo_factura : (!cliente ? 'F2' : tipo)
  const superaLimite = tipoEfectivo === 'F2' && tot.importe_total.greaterThan(D(ajustes.limite_simplificada))

  const anadirConcepto = (id: string) => {
    const c = conceptos.find((x: any) => x.id === id)
    if (!c) return
    const nueva = { descripcion: c.descripcion, cantidad: '1', precio_unitario: String(Number(c.precio_unitario)), descuento_pct: '0', regimen: String(Number(c.tipo_iva)) }
    setLineas(ls => (ls.length === 1 && !ls[0].descripcion && !ls[0].precio_unitario) ? [nueva] : [...ls, nueva])
    api(`/api/admin/facturacion/conceptos/${id}`, 'POST')
  }
  const guardarConcepto = async (l: Linea) => {
    const r = await api('/api/admin/facturacion/conceptos', 'POST', { descripcion: l.descripcion, precio_unitario: num(l.precio_unitario), tipo_iva: REGIMENES[l.regimen]?.tipo === '0' ? '0' : l.regimen })
    if (r.ok) setConceptos((cs: any[]) => [...cs, r.data])
    else setRes(r)
  }

  const cuerpo = () => ({
    tipo_factura: tipo,
    cliente_id: cliente?.id ?? null,
    destinatario_simplificada: !cliente ? dest : null,
    fecha_operacion: fechaOperacion || null,
    fecha_vencimiento: vencimiento || null,
    descripcion_operacion: descripcion,
    tipo_retencion: num(retencion),
    notas,
    lineas: lineas.map(l => {
      const r = REGIMENES[l.regimen] ?? REGIMENES['21']
      return { descripcion: l.descripcion, cantidad: num(l.cantidad), precio_unitario: num(l.precio_unitario), descuento_pct: num(l.descuento_pct), tipo_iva: r.tipo, calificacion: r.calificacion, operacion_exenta: r.exenta }
    }),
  })

  const guardar = async (): Promise<string | null> => {
    const r = await api(factura ? `/api/admin/facturacion/facturas/${factura.id}` : '/api/admin/facturacion/facturas', factura ? 'PUT' : 'POST', cuerpo())
    if (!r.ok) { setRes(r); return null }
    return r.data.id
  }

  const accionGuardar = async () => {
    setOcupado('guardar'); setRes(null)
    const id = await guardar()
    setOcupado(null)
    if (id) factura ? setRes({ ok: true }) : router.replace(`/admin/facturacion/facturas/${id}`)
  }

  const accionEmitir = async () => {
    if (!confirm(`¿Emitir la factura por ${fmt2(tot.importe_total).replace('.', ',')} €?\n\nSe le asignará número y fecha de hoy y ya no se podrá modificar (solo rectificar).`)) return
    setOcupado('emitir'); setRes(null)
    const id = await guardar()
    if (!id) { setOcupado(null); return }
    const r = await api(`/api/admin/facturacion/facturas/${id}/emitir`, 'POST')
    setOcupado(null)
    if (!r.ok) {
      // Borrador nuevo ya guardado: se abre su página con el motivo por el que no se emitió.
      if (!factura) router.replace(`/admin/facturacion/facturas/${id}?error=${encodeURIComponent(r.error || '')}&code=${r.code || ''}`)
      else setRes(r)
      return
    }
    router.replace(`/admin/facturacion/facturas/${id}?emitida=1`)
  }

  const eliminar = async () => {
    if (!confirm('¿Eliminar este borrador?')) return
    const r = await api(`/api/admin/facturacion/facturas/${factura.id}`, 'DELETE')
    if (r.ok) router.push('/admin/facturacion/facturas')
    else setRes(r)
  }

  const th = { padding: '8px 6px', fontSize: 11, fontWeight: 700, color: C.gris, textTransform: 'uppercase' as const, letterSpacing: 1, textAlign: 'left' as const }
  const celda = { padding: '6px 4px', verticalAlign: 'top' as const }

  return (
    <>
      {emisorError && <Aviso tipo="aviso">⚠️ {emisorError}. Puedes guardar el borrador, pero no emitirlo. <Link href="/admin/facturacion/ajustes" style={{ color: C.ambar, fontWeight: 700 }}>Ir a Ajustes →</Link></Aviso>}
      {factura?.bloqueo_motivo && <Aviso tipo="aviso">⚠️ Emisión automática bloqueada: {factura.bloqueo_motivo}</Aviso>}
      {res?.ok && <Aviso tipo="ok">✅ Borrador guardado</Aviso>}
      <ErrorApi r={res} />

      {esRect && (
        <Aviso tipo="info">
          Rectificativa {factura.tipo_factura} por {factura.tipo_rectificacion === 'S' ? 'sustitución' : 'diferencias'} de{' '}
          <Link href={`/admin/facturacion/facturas/${factura.fac_facturas?.id}`} style={{ color: C.azul, fontWeight: 700 }}>{factura.fac_facturas?.num_serie_factura}</Link>
          {' '}({fechaCorta(factura.fac_facturas?.fecha_expedicion)}) · Motivo: {factura.motivo_rectificacion}
          {factura.tipo_rectificacion === 'I' ? '. Deja solo las diferencias (importes en negativo para reducir).' : '. Las líneas deben reflejar la factura correcta completa.'}
        </Aviso>
      )}

      <div className="fac-g2" style={{ marginBottom: 16, alignItems: 'start' }}>
        <Card titulo="Cliente" style={{ padding: 0, overflow: 'visible' }}>
          <div style={{ padding: 20 }}>
            <SelectorCliente valor={cliente} onChange={elegirCliente} />
            {cliente && !esRect && (
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12, fontSize: 13, color: C.grisTexto, cursor: 'pointer' }}>
                <input type="checkbox" checked={tipo === 'F2'} onChange={e => setTipo(e.target.checked ? 'F2' : 'F1')} />
                Emitir como factura simplificada (F2)
              </label>
            )}
            {!cliente && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: C.gris, marginBottom: 8 }}>Sin cliente se emite factura simplificada (máx. {fmt2(ajustes.limite_simplificada).replace('.', ',')} € IVA incl.). Datos opcionales del destinatario:</div>
                <div className="fac-g2">
                  <input style={estiloInput} placeholder="Nombre" value={dest.razon_social} onChange={e => setDest(d => ({ ...d, razon_social: e.target.value }))} />
                  <input style={estiloInput} placeholder="NIF (opcional)" value={dest.nif} onChange={e => setDest(d => ({ ...d, nif: e.target.value }))} />
                </div>
              </div>
            )}
            {cliente && cliente.pais !== 'ES' && <div style={{ fontSize: 12, color: C.ambar, marginTop: 10 }}>Cliente fuera de España: revisa el régimen de IVA de las líneas (normalmente «No sujeta»).</div>}
            {cliente && tipoEfectivo !== 'F2' && (!cliente.nif || !cliente.direccion) && <div style={{ fontSize: 12, color: C.rojo, marginTop: 10 }}>Al cliente le falta {!cliente.nif ? 'el NIF' : 'la dirección'}: necesario para factura completa.</div>}
          </div>
        </Card>

        <Card titulo="Datos de la factura" style={{ padding: 0 }}>
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="fac-g2">
              <Campo label="Fecha de expedición" ayuda="Se asigna al emitir: siempre hoy">
                <input style={{ ...estiloInput, background: C.fondo, color: C.gris }} value={factura?.num_serie_factura ? '' : 'Al emitir'} disabled />
              </Campo>
              <Campo label="Fecha de operación" ayuda="Solo si el servicio se prestó otro día">
                <input type="date" style={estiloInput} value={fechaOperacion} onChange={e => setFechaOperacion(e.target.value)} />
              </Campo>
            </div>
            <div className="fac-g2">
              <Campo label="Vencimiento" ayuda={`Por defecto, ${ajustes.dias_vencimiento} días tras emitir`}>
                <input type="date" style={estiloInput} value={vencimiento} onChange={e => setVencimiento(e.target.value)} />
              </Campo>
              <Campo label="Retención IRPF (%)" ayuda={cliente?.aplica_retencion ? 'Cliente con retención' : 'Sin retención por defecto'}>
                <select style={estiloInput} value={String(Number(num(retencion)))} onChange={e => { setRetManual(true); setRetencion(e.target.value) }}>
                  {['0', '7', '15', '19'].concat([String(Number(num(retencion)))]).filter((v, i, a) => a.indexOf(v) === i).map(v => <option key={v} value={v}>{v} %</option>)}
                </select>
              </Campo>
            </div>
            <Campo label="Descripción de la operación" ayuda="Resumen para el registro VeriFactu. Si lo dejas vacío, se usa la primera línea.">
              <input style={estiloInput} value={descripcion} maxLength={500} onChange={e => setDescripcion(e.target.value)} placeholder={lineas[0]?.descripcion || 'Servicios de desarrollo de software'} />
            </Campo>
          </div>
        </Card>
      </div>

      <Card titulo="Conceptos" style={{ marginBottom: 16 }} extra={conceptos.length > 0 && (
        <select style={{ ...estiloInput, width: 260 }} value="" onChange={e => anadirConcepto(e.target.value)}>
          <option value="">＋ Añadir concepto frecuente…</option>
          {conceptos.map((c: any) => <option key={c.id} value={c.id}>{c.descripcion} · {fmt2(c.precio_unitario).replace('.', ',')} €</option>)}
        </select>
      )}>
        <div style={{ overflowX: 'auto', padding: '8px 14px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
            <thead><tr>
              <th style={th}>Descripción</th><th style={{ ...th, width: 80 }}>Cant.</th><th style={{ ...th, width: 110 }}>Precio (€)</th>
              <th style={{ ...th, width: 70 }}>Dto. %</th><th style={{ ...th, width: 170 }}>IVA</th><th style={{ ...th, width: 110, textAlign: 'right' }}>Base</th><th style={{ width: 70 }}></th>
            </tr></thead>
            <tbody>
              {lineas.map((l, i) => (
                <tr key={i}>
                  <td style={celda}><textarea rows={1} style={{ ...estiloInput, resize: 'vertical', minHeight: 38 }} value={l.descripcion} onChange={e => setLinea(i, 'descripcion', e.target.value)} placeholder="Concepto" /></td>
                  <td style={celda}><input style={{ ...estiloInput, textAlign: 'right' }} inputMode="decimal" value={l.cantidad} onChange={e => setLinea(i, 'cantidad', e.target.value)} /></td>
                  <td style={celda}><input style={{ ...estiloInput, textAlign: 'right' }} inputMode="decimal" value={l.precio_unitario} onChange={e => setLinea(i, 'precio_unitario', e.target.value)} placeholder="0,00" /></td>
                  <td style={celda}><input style={{ ...estiloInput, textAlign: 'right' }} inputMode="decimal" value={l.descuento_pct} onChange={e => setLinea(i, 'descuento_pct', e.target.value)} /></td>
                  <td style={celda}>
                    <select style={estiloInput} value={l.regimen} onChange={e => setLinea(i, 'regimen', e.target.value)}>
                      {Object.entries(REGIMENES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                    </select>
                  </td>
                  <td style={{ ...celda, textAlign: 'right', paddingTop: 16, fontWeight: 600 }}><Euros v={calculadas[i].base} /></td>
                  <td style={{ ...celda, whiteSpace: 'nowrap', paddingTop: 10 }}>
                    {l.descripcion && l.precio_unitario && !conceptos.some((c: any) => c.descripcion === l.descripcion) &&
                      <button title="Guardar como concepto frecuente" onClick={() => guardarConcepto(l)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15 }}>⭐</button>}
                    {lineas.length > 1 && <button title="Quitar línea" onClick={() => setLineas(ls => ls.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: C.gris }}>×</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Btn variante="fantasma" onClick={() => setLineas(ls => [...ls, lineaVacia(ivaDef)])} style={{ marginTop: 4 }}>+ Añadir línea</Btn>
        </div>
      </Card>

      <div className="fac-g2" style={{ alignItems: 'start' }}>
        <Card titulo="Notas" style={{ padding: 0 }}>
          <div style={{ padding: 20 }}>
            <textarea style={{ ...estiloInput, minHeight: 90, resize: 'vertical' }} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Aparecen en la factura (condiciones, forma de pago…)" />
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          {[
            ['Base imponible', tot.base_imponible],
            ['IVA', tot.cuota_iva],
            ['Total factura', tot.importe_total],
            ...(tot.cuota_retencion.isZero() ? [] : [[`Retención IRPF (${Number(num(retencion))} %)`, tot.cuota_retencion.negated()]]),
          ].map(([k, v]: any) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14, color: C.grisTexto }}><span>{k}</span><Euros v={v} /></div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${C.negro}`, marginTop: 8, paddingTop: 10, fontSize: 20, fontWeight: 800, color: C.negro }}>
            <span>{tot.cuota_retencion.isZero() ? 'Total' : 'Líquido a cobrar'}</span><Euros v={tot.liquido_a_cobrar} />
          </div>
          <div style={{ fontSize: 12, color: C.gris, marginTop: 6 }}>Tipo: {tipoEfectivo === 'F2' ? 'Simplificada (F2, serie S)' : esRect ? `Rectificativa (${tipoEfectivo}, serie R)` : 'Completa (F1, serie F)'}</div>
          {superaLimite && <div style={{ fontSize: 12, color: C.rojo, marginTop: 6 }}>Supera el límite de la factura simplificada: elige un cliente con NIF.</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {factura && <Btn variante="peligro" onClick={eliminar} disabled={!!ocupado}>Eliminar</Btn>}
            <Btn onClick={accionGuardar} disabled={!!ocupado}>{ocupado === 'guardar' ? 'Guardando…' : 'Guardar borrador'}</Btn>
            <Btn variante="primario" onClick={accionEmitir} disabled={!!ocupado || !!emisorError || superaLimite}>{ocupado === 'emitir' ? 'Emitiendo…' : 'Emitir factura'}</Btn>
          </div>
        </Card>
      </div>
    </>
  )
}
