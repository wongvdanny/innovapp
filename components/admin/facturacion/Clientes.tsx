import { useEffect, useRef, useState } from 'react'
import { validarNifEspanol, aplicaRetencionPorDefecto } from '../../../lib/facturacion/validacion'
import { Btn, Campo, Interruptor, Modal, ErrorApi, api, estiloInput, RespuestaApi, C } from './ui'

export const TIPOS = [['empresa', 'Empresa'], ['autonomo', 'Autónomo'], ['particular', 'Particular']] as const
const PAISES = [['ES', 'España'], ['PT', 'Portugal'], ['FR', 'Francia'], ['DE', 'Alemania'], ['IT', 'Italia'], ['NL', 'Países Bajos'], ['BE', 'Bélgica'], ['IE', 'Irlanda'],
  ['GB', 'Reino Unido'], ['US', 'Estados Unidos'], ['MX', 'México'], ['AR', 'Argentina'], ['CO', 'Colombia'], ['CL', 'Chile'], ['PE', 'Perú'], ['UY', 'Uruguay']]

const VACIO = { tipo: 'empresa', razon_social: '', nombre_comercial: '', nif: '', pais: 'ES', direccion: '', cp: '', municipio: '', provincia: '',
  email: '', telefono: '', notas: '', user_email: '', aplica_retencion: true, activo: true }

export function ClienteForm({ cliente, inicial, onGuardado, onCerrar }: { cliente?: any; inicial?: Record<string, string>; onGuardado: (c: any) => void; onCerrar: () => void }) {
  const [f, setF] = useState<any>(() => cliente ? {
    ...VACIO, ...Object.fromEntries(Object.entries(cliente).map(([k, v]) => [k, v ?? ''])), user_email: cliente.User?.email || '',
  } : { ...VACIO, ...inicial })
  const [retManual, setRetManual] = useState(!!cliente)
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [guardando, setGuardando] = useState(false)
  const set = (k: string, v: any) => setF((x: any) => {
    const n = { ...x, [k]: v }
    if (!retManual && (k === 'tipo' || k === 'pais')) n.aplica_retencion = aplicaRetencionPorDefecto(n.tipo, n.pais)
    return n
  })

  const nifError = f.nif && f.pais === 'ES' ? (validarNifEspanol(f.nif).valido ? null : validarNifEspanol(f.nif).error) : null

  const guardar = async () => {
    setGuardando(true)
    const r = await api(cliente ? `/api/admin/facturacion/clientes/${cliente.id}` : '/api/admin/facturacion/clientes', cliente ? 'PUT' : 'POST', f)
    setGuardando(false)
    if (r.ok) onGuardado(r.data)
    else setRes(r)
  }

  return (
    <Modal titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'} onCerrar={onCerrar} ancho={640}>
      <ErrorApi r={res} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="fac-g2">
          <Campo label="Tipo">
            <select style={estiloInput} value={f.tipo} onChange={e => set('tipo', e.target.value)}>
              {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Campo>
          <Campo label="País">
            <select style={estiloInput} value={f.pais} onChange={e => set('pais', e.target.value)}>
              {PAISES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              {!PAISES.some(([v]) => v === f.pais) && <option value={f.pais}>{f.pais}</option>}
            </select>
          </Campo>
        </div>
        <Campo label={f.tipo === 'empresa' ? 'Razón social *' : 'Nombre y apellidos *'}>
          <input style={estiloInput} value={f.razon_social} onChange={e => set('razon_social', e.target.value)} autoFocus />
        </Campo>
        <div className="fac-g2">
          <Campo label={f.pais === 'ES' ? 'NIF / NIE / CIF' : 'NIF-IVA o identificador fiscal'} error={nifError}
            ayuda={f.pais !== 'ES' ? 'UE: con o sin prefijo de país (p. ej. DE123456789)' : 'Obligatorio para factura completa (F1)'}>
            <input style={{ ...estiloInput, textTransform: 'uppercase', borderColor: nifError ? '#fca5a5' : C.borde }} value={f.nif} onChange={e => set('nif', e.target.value)} />
          </Campo>
          <Campo label="Nombre comercial">
            <input style={estiloInput} value={f.nombre_comercial} onChange={e => set('nombre_comercial', e.target.value)} />
          </Campo>
        </div>
        <Campo label="Dirección">
          <input style={estiloInput} value={f.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, número, piso" />
        </Campo>
        <div className="fac-g3">
          <Campo label="Código postal"><input style={estiloInput} value={f.cp} onChange={e => set('cp', e.target.value)} /></Campo>
          <Campo label="Municipio"><input style={estiloInput} value={f.municipio} onChange={e => set('municipio', e.target.value)} /></Campo>
          <Campo label="Provincia"><input style={estiloInput} value={f.provincia} onChange={e => set('provincia', e.target.value)} /></Campo>
        </div>
        <div className="fac-g2">
          <Campo label="Email (envío de facturas)"><input type="email" style={estiloInput} value={f.email} onChange={e => set('email', e.target.value)} /></Campo>
          <Campo label="Teléfono"><input style={estiloInput} value={f.telefono} onChange={e => set('telefono', e.target.value)} /></Campo>
        </div>
        <Interruptor valor={f.aplica_retencion} onChange={v => { setRetManual(true); set('aplica_retencion', v) }}
          label="Aplicar retención de IRPF" ayuda="Por defecto sí para empresas y autónomos en España. Se puede cambiar en cada factura." />
        {f.pais !== 'ES' && <div style={{ fontSize: 12, color: C.ambar, background: C.ambarFondo, borderRadius: 10, padding: '8px 12px' }}>
          Cliente fuera de España: los cobros online de este cliente no se facturan automáticamente. Revisa el régimen de IVA de cada línea (normalmente «No sujeta, N2»).
        </div>}
        <Campo label="Usuario de innovapp vinculado (email)" ayuda="Opcional: enlaza el cliente con su cuenta de innovapp.es">
          <input type="email" style={estiloInput} value={f.user_email} onChange={e => set('user_email', e.target.value)} />
        </Campo>
        <Campo label="Notas internas"><textarea style={{ ...estiloInput, minHeight: 60, resize: 'vertical' }} value={f.notas} onChange={e => set('notas', e.target.value)} /></Campo>
        {cliente && <Interruptor valor={f.activo} onChange={v => set('activo', v)} label="Cliente activo" ayuda="Los clientes con facturas no se borran: se desactivan." />}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
        <Btn onClick={onCerrar}>Cancelar</Btn>
        <Btn variante="primario" onClick={guardar} disabled={guardando || !f.razon_social.trim() || !!nifError}>{guardando ? 'Guardando…' : 'Guardar cliente'}</Btn>
      </div>
    </Modal>
  )
}

/** Autocompletado de cliente con alta rápida. */
export function SelectorCliente({ valor, onChange }: { valor: any | null; onChange: (c: any | null) => void }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState<any[]>([])
  const [abierto, setAbierto] = useState(false)
  const [nuevo, setNuevo] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const t = setTimeout(async () => {
      const r = await api(`/api/admin/facturacion/clientes?q=${encodeURIComponent(q)}&limite=8`)
      if (r.ok) setRes(r.data)
    }, 200)
    return () => clearTimeout(t)
  }, [q, abierto])

  useEffect(() => {
    const cerrar = (e: MouseEvent) => { if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])

  if (valor) return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, border: `1.5px solid ${C.borde}`, borderRadius: 12, padding: '12px 14px', background: C.fondo }}>
      <div style={{ fontSize: 13, color: C.grisTexto, lineHeight: 1.5 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.negro }}>{valor.razon_social}</div>
        {valor.nif || <span style={{ color: C.ambar }}>Sin NIF</span>} · {TIPOS.find(t => t[0] === valor.tipo)?.[1]} · {valor.pais}
        <div>{[valor.direccion, [valor.cp, valor.municipio].filter(Boolean).join(' '), valor.provincia].filter(Boolean).join(', ') || <span style={{ color: C.ambar }}>Sin dirección</span>}</div>
        {valor.email && <div>{valor.email}</div>}
      </div>
      <Btn variante="fantasma" onClick={() => { onChange(null); setQ(''); setAbierto(true) }}>Cambiar</Btn>
    </div>
  )

  return (
    <div ref={caja} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input style={estiloInput} placeholder="Buscar cliente por nombre, NIF o email…" value={q}
          onFocus={() => setAbierto(true)} onChange={e => { setQ(e.target.value); setAbierto(true) }} />
        <Btn onClick={() => setNuevo(true)}>+ Nuevo</Btn>
      </div>
      {abierto && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'white', border: `1px solid ${C.borde}`, borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.08)', zIndex: 50, overflow: 'hidden' }}>
          {res.map(c => (
            <div key={c.id} onMouseDown={() => { onChange(c); setAbierto(false) }}
              style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${C.borde}`, fontSize: 13 }}
              onMouseOver={e => (e.currentTarget.style.background = '#fdf8f4')} onMouseOut={e => (e.currentTarget.style.background = 'white')}>
              <strong>{c.razon_social}</strong> <span style={{ color: C.gris }}>{c.nif || 'sin NIF'}{c.email ? ` · ${c.email}` : ''}</span>
            </div>
          ))}
          {res.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: C.gris }}>Sin resultados · <a style={{ color: C.naranjaOsc, cursor: 'pointer', fontWeight: 700 }} onMouseDown={() => setNuevo(true)}>crear cliente</a></div>}
        </div>
      )}
      {nuevo && <ClienteForm inicial={q.trim() ? { razon_social: q.trim() } : undefined} onCerrar={() => setNuevo(false)} onGuardado={c => { setNuevo(false); onChange(c) }} />}
    </div>
  )
}
