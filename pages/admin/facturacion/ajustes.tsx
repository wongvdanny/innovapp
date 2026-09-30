import { GetServerSideProps } from 'next'
import { useState } from 'react'
import { prisma } from '../../../lib/prisma'
import { exigirAdmin, aJson } from '../../../lib/facturacion/api'
import { validarNifEspanol } from '../../../lib/facturacion/validacion'
import { Layout, Card, Btn, Campo, Interruptor, Aviso, Euros, ErrorApi, api, estiloInput, useMensaje, RespuestaApi, C } from '../../../components/admin/facturacion/ui'
import Copias from '../../../components/admin/facturacion/Copias'

const s = (v: any) => (v === null || v === undefined ? '' : String(v))

export default function Ajustes({ ajustes, conceptos: iniciales }: any) {
  const [f, setF] = useState<any>(() => Object.fromEntries(Object.entries(ajustes).map(([k, v]) => [k, typeof v === 'boolean' ? v : s(v)])))
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [conceptos, setConceptos] = useState<any[]>(iniciales)
  const [nuevo, setNuevo] = useState({ descripcion: '', precio_unitario: '', tipo_iva: '21' })
  const [integridad, setIntegridad] = useState<any>(null)
  const [logo, setLogo] = useState<string | null>(ajustes.logo_path)
  const [subiendoLogo, setSubiendoLogo] = useState(false)
  const { mostrar, Mensaje } = useMensaje()
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }))
  const nifError = f.nif && !validarNifEspanol(f.nif).valido ? validarNifEspanol(f.nif).error : null

  const guardar = async () => {
    if (f.verifactu_activo && !ajustes.verifactu_activo &&
      !confirm('¿Activar el modo VERI*FACTU?\n\nLas facturas emitidas a partir de ahora llevarán QR y la leyenda «Factura verificable en la sede electrónica de la AEAT». El envío a la AEAT todavía NO está implementado: actívalo solo cuando lo esté.')) return
    setGuardando(true); setRes(null)
    const { id, updated_at, logo_path, fecha_inicio_actividad, pais, iae, ...cuerpo } = f
    const r = await api('/api/admin/facturacion/ajustes', 'PUT', cuerpo)
    setGuardando(false)
    if (r.ok) { mostrar('ok', 'Ajustes guardados'); setF((x: any) => ({ ...x, nif: r.data.nif, iban: r.data.iban })) } else setRes(r)
  }

  const crearConcepto = async () => {
    const r = await api('/api/admin/facturacion/conceptos', 'POST', nuevo)
    if (r.ok) { setConceptos(c => [...c, r.data]); setNuevo({ descripcion: '', precio_unitario: '', tipo_iva: '21' }) } else mostrar('error', r.error!)
  }
  const borrarConcepto = async (id: string) => {
    const r = await api(`/api/admin/facturacion/conceptos/${id}`, 'DELETE')
    if (r.ok) setConceptos(c => c.filter(x => x.id !== id))
  }
  const subirLogo = async (archivo?: File) => {
    if (!archivo) return
    if (archivo.size > 5 * 1024 * 1024) return mostrar('error', 'El logo no puede superar 5 MB')
    setSubiendoLogo(true)
    const fd = new FormData(); fd.append('adjunto', archivo)
    const r = await api('/api/admin/facturacion/ajustes/logo', 'POST', fd)
    setSubiendoLogo(false)
    r.ok ? (setLogo(r.data.logo_path), mostrar('ok', 'Logo actualizado: se usará en las próximas facturas')) : mostrar('error', r.error!)
  }
  const quitarLogo = async () => {
    if (!confirm('¿Quitar el logo? Las próximas facturas mostrarán el nombre comercial.')) return
    const r = await api('/api/admin/facturacion/ajustes/logo', 'DELETE')
    if (r.ok) setLogo(null)
  }

  const verificar = async () => {
    setIntegridad({ cargando: true })
    const r = await api('/api/admin/facturacion/integridad')
    setIntegridad(r.ok ? r.data : { ok: false, errores: [{ detalle: r.error }] })
  }

  const texto = (k: string, label: string, props: any = {}) => (
    <Campo label={label} {...(props.campo || {})}><input style={estiloInput} value={f[k]} onChange={e => set(k, e.target.value)} {...(props.input || {})} /></Campo>
  )

  return (
    <Layout titulo="Ajustes de facturación" acciones={<Btn variante="primario" onClick={guardar} disabled={guardando || !!nifError}>{guardando ? 'Guardando…' : '💾 Guardar ajustes'}</Btn>}>
      <Mensaje />
      <ErrorApi r={res} />
      {!ajustes.nif && <Aviso tipo="aviso">⚠️ Falta tu NIF: sin él no se puede emitir ninguna factura.</Aviso>}

      <div className="fac-g2" style={{ alignItems: 'start', marginBottom: 16 }}>
        <Card titulo="Datos del emisor">
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {texto('emisor_nombre', 'Nombre y apellidos *')}
            <div className="fac-g2">
              <Campo label="NIF *" error={nifError}><input style={{ ...estiloInput, textTransform: 'uppercase', borderColor: nifError ? '#fca5a5' : C.borde }} value={f.nif} onChange={e => set('nif', e.target.value)} /></Campo>
              {texto('nombre_comercial', 'Nombre comercial')}
            </div>
            {texto('direccion', 'Dirección *')}
            <div className="fac-g3">{texto('cp', 'Código postal *')}{texto('municipio', 'Municipio *')}{texto('provincia', 'Provincia')}</div>
            <div className="fac-g2">{texto('email', 'Email (remitente y copia)', { input: { type: 'email' } })}{texto('telefono', 'Teléfono')}</div>
            {texto('iban', 'IBAN (aparece en la factura para transferencias)', { input: { placeholder: 'ES00 0000 0000 0000 0000 0000' } })}
            <Campo label="Logo en las facturas" ayuda="PNG, JPG, WEBP o SVG. Se convierte a PNG. Sin logo, se muestra el nombre comercial.">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 170, height: 56, border: `1px dashed ${C.borde}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', overflow: 'hidden' }}>
                  {logo ? <img src={`/api/admin/facturacion/ajustes/logo?v=${encodeURIComponent(logo)}`} alt="Logo" style={{ maxWidth: 160, maxHeight: 48, objectFit: 'contain' }} />
                    : <span style={{ color: C.naranja, fontWeight: 800 }}>{f.nombre_comercial || 'Sin logo'}</span>}
                </div>
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { subirLogo(e.target.files?.[0]); e.target.value = '' }} />
                  <span style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: `1px solid ${C.borde}`, display: 'inline-block' }}>{subiendoLogo ? 'Subiendo…' : logo ? 'Cambiar' : 'Subir logo'}</span>
                </label>
                {logo && <Btn variante="fantasma" onClick={quitarLogo}>Quitar</Btn>}
              </div>
            </Campo>
            <div style={{ fontSize: 12, color: C.gris }}>Actividad: IAE {ajustes.iae} · Inicio: {ajustes.fecha_inicio_actividad.slice(0, 10).split('-').reverse().join('/')} · País: {ajustes.pais}</div>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card titulo="Impuestos y facturas">
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="fac-g3">
                {texto('iva_defecto', 'IVA por defecto (%)', { input: { inputMode: 'decimal' } })}
                <Campo label="Retención IRPF (%)" ayuda="7 % los 3 primeros años"><select style={estiloInput} value={String(Number(f.retencion_defecto))} onChange={e => set('retencion_defecto', e.target.value)}>{['7', '15'].map(v => <option key={v} value={v}>{v} %</option>)}</select></Campo>
                {texto('limite_simplificada', 'Límite simplificada (€)', { input: { inputMode: 'decimal' } })}
              </div>
              <Interruptor valor={f.retencion_en_cobros_online} onChange={v => set('retencion_en_cobros_online', v)} label="Aplicar retención en cobros online"
                ayuda="Desactivado: las facturas automáticas de Stripe/Redsys van sin retención (el cliente paga el total)." />
              {texto('dias_vencimiento', 'Días hasta el vencimiento', { input: { inputMode: 'numeric' } })}
              <Campo label="Texto al pie de la factura"><textarea style={{ ...estiloInput, minHeight: 60 }} value={f.texto_pie} onChange={e => set('texto_pie', e.target.value)} placeholder="Gracias por tu confianza…" /></Campo>
            </div>
          </Card>

          <Card titulo="Recordatorios de facturas vencidas">
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Interruptor valor={f.recordatorios_activos} onChange={v => set('recordatorios_activos', v)} label="Enviar recordatorios por email" ayuda="Se activan cuando esté el cron (fase de automatizaciones)." />
              <div className="fac-g2">{texto('recordatorio_cada_dias', 'Cada cuántos días', { input: { inputMode: 'numeric' } })}{texto('recordatorio_max', 'Máximo de recordatorios', { input: { inputMode: 'numeric' } })}</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="fac-g2" style={{ alignItems: 'start' }}>
        <Card titulo="VERI*FACTU">
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Interruptor valor={f.verifactu_activo} onChange={v => set('verifactu_activo', v)} label="Modo VERI*FACTU"
              ayuda="QR con cotejo y leyenda «Factura verificable en la sede electrónica de la AEAT». Requiere el envío a la AEAT (aún no implementado)." />
            <Interruptor valor={f.qr_no_verifactu} onChange={v => set('qr_no_verifactu', v)} label="QR tributario sin VERI*FACTU"
              ayuda="Incluye el QR (servicio ValidarQRNoVerifactu) en facturas emitidas sin modo VERI*FACTU. Actívalo cuando entre en vigor la obligación." />
            <div style={{ fontSize: 12, color: C.gris }}>La huella encadenada (SHA-256) se genera siempre, con cualquier modo.</div>
            <div><Btn onClick={verificar} disabled={integridad?.cargando}>{integridad?.cargando ? '⏳ Verificando…' : '🔗 Verificar integridad de la cadena'}</Btn></div>
            {integridad && !integridad.cargando && (integridad.ok
              ? <Aviso tipo="ok">✅ Cadena íntegra: {integridad.registros} registros, {integridad.facturasEmitidas} facturas.{integridad.ultimaHuella && <div style={{ fontFamily: 'monospace', fontSize: 11, wordBreak: 'break-all', marginTop: 4 }}>Última huella: {integridad.ultimaHuella}</div>}</Aviso>
              : <Aviso tipo="error">⚠️ {integridad.errores.length} problema(s):<ul style={{ margin: '6px 0 0 18px' }}>{integridad.errores.map((e: any, i: number) => <li key={i}>{e.detalle}</li>)}</ul></Aviso>)}
          </div>
        </Card>

        <Card titulo="Conceptos frecuentes">
          <div style={{ padding: 20 }}>
            {conceptos.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.borde}`, fontSize: 13 }}>
                <span>{c.descripcion}</span>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', whiteSpace: 'nowrap' }}><Euros v={c.precio_unitario} /> · {Number(c.tipo_iva)} %
                  <button onClick={() => borrarConcepto(c.id)} title="Eliminar" style={{ border: 'none', background: 'none', cursor: 'pointer', color: C.gris, fontSize: 16 }}>×</button></span>
              </div>
            ))}
            {conceptos.length === 0 && <div style={{ fontSize: 13, color: C.gris, marginBottom: 10 }}>También puedes guardarlos con ⭐ desde el editor de facturas.</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px auto', gap: 8, marginTop: 12 }}>
              <input style={estiloInput} placeholder="Descripción" value={nuevo.descripcion} onChange={e => setNuevo(n => ({ ...n, descripcion: e.target.value }))} />
              <input style={{ ...estiloInput, textAlign: 'right' }} placeholder="Precio" inputMode="decimal" value={nuevo.precio_unitario} onChange={e => setNuevo(n => ({ ...n, precio_unitario: e.target.value }))} />
              <select style={estiloInput} value={nuevo.tipo_iva} onChange={e => setNuevo(n => ({ ...n, tipo_iva: e.target.value }))}>{['21', '10', '4', '0'].map(v => <option key={v} value={v}>{v} %</option>)}</select>
              <Btn onClick={crearConcepto} disabled={!nuevo.descripcion.trim()}>Añadir</Btn>
            </div>
          </div>
        </Card>
      </div>

      <Copias />
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const [ajustes, conceptos] = await Promise.all([
    prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.fac_conceptos.findMany({ where: { activo: true }, orderBy: [{ usos: 'desc' }, { descripcion: 'asc' }] }),
  ])
  return { props: aJson({ ajustes, conceptos }) }
}
