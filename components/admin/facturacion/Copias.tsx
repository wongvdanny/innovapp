import { useEffect, useState } from 'react'
import { Card, Btn, Campo, Modal, ErrorApi, api, estiloInput, RespuestaApi, C } from './ui'

// Copias de seguridad: listado, descarga (solo facturación / completa) y "Crear backup ahora".
// Cada descarga pide de nuevo la contraseña y usa un token de un solo uso.

const tam = (b?: number) => b === undefined ? '—' : b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`
const fecha = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} ${iso.slice(11, 16)}`

type Peticion = { tipo: 'facturacion' | 'completo'; ts?: string; crear?: boolean }

export default function Copias() {
  const [datos, setDatos] = useState<any>(null)
  const [pide, setPide] = useState<Peticion | null>(null)
  const [password, setPassword] = useState('')
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  const cargar = async () => { const r = await api('/api/admin/facturacion/copias'); if (r.ok) setDatos(r.data) }
  useEffect(() => { cargar() }, [])

  const abrir = (p: Peticion) => { setPide(p); setPassword(''); setRes(null) }
  const confirmar = async () => {
    setOcupado(true); setRes(null)
    const r = await api<{ token: string; ts: string }>('/api/admin/facturacion/copias/autorizar', 'POST', { password, ...pide })
    setOcupado(false)
    if (!r.ok) { setRes(r); return }
    setPide(null); setPassword('')
    // Descarga directa del navegador (streaming a disco): la respuesta es un adjunto, no cambia de página
    window.location.href = `/api/admin/facturacion/copias/descargar?t=${r.data!.token}`
    setAviso(`Descargando la copia ${r.data!.ts}${pide?.crear ? ' recién creada' : ''}…`)
    setTimeout(() => { setAviso(null); cargar() }, 4000)
  }

  return (
    <Card titulo="Copias de seguridad" style={{ marginTop: 16 }} extra={
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {datos && <span style={{ fontSize: 12, color: C.gris }}>{datos.restantes} de {datos.limite} descargas disponibles esta hora</span>}
        <Btn variante="primario" onClick={() => abrir({ tipo: 'facturacion', crear: true })} disabled={!datos?.restantes}>Crear backup ahora</Btn>
      </div>
    }>
      <div style={{ padding: '10px 20px 0', fontSize: 12, color: C.gris, lineHeight: 1.6 }}>
        Copia automática cada día a las 03:30 (se conservan 30 días). <strong>Solo facturación</strong>: tablas de facturación + PDFs y adjuntos.
        <strong> Completa</strong>: toda la base de datos de innovapp + PDFs y adjuntos. Contienen datos fiscales y personales: guárdalas cifradas.
      </div>
      {aviso && <div style={{ margin: '10px 20px 0', fontSize: 13, color: C.verde, fontWeight: 600 }}>✅ {aviso}</div>}
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table className="fac-tabla">
          <thead><tr><th>Fecha</th><th>Solo facturación</th><th>Completa</th><th>PDFs y adjuntos</th><th>SHA256 (volcado completo)</th><th></th></tr></thead>
          <tbody>
            {(datos?.copias || []).map((b: any) => (
              <tr key={b.ts}>
                <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fecha(b.fecha)}</td>
                <td>{b.facturacion ? tam(b.facturacion.bytes) : <span style={{ color: C.gris }}>—</span>}</td>
                <td>{tam(b.completo?.bytes)}</td>
                <td>{tam(b.archivos?.bytes)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 11 }} title={[b.facturacion && `facturación: ${b.facturacion.sha256}`, b.completo && `completa: ${b.completo.sha256}`, b.archivos && `archivos: ${b.archivos.sha256}`].filter(Boolean).join('\n')}>
                  {b.completo?.sha256 ? `${b.completo.sha256.slice(0, 12)}…` : '—'}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <Btn onClick={() => abrir({ tipo: 'facturacion', ts: b.ts })} disabled={!b.facturacion || !b.archivos || !datos.restantes} style={{ marginRight: 6 }}>⬇ Facturación</Btn>
                  <Btn onClick={() => abrir({ tipo: 'completo', ts: b.ts })} disabled={!b.completo || !b.archivos || !datos.restantes}>⬇ Completa</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {datos?.copias?.length === 0 && <div style={{ padding: 30, textAlign: 'center', color: C.gris }}>Aún no hay copias</div>}
      </div>

      {pide && (
        <Modal titulo={pide.crear ? 'Crear backup ahora y descargarlo' : `Descargar copia ${pide.tipo === 'facturacion' ? 'de facturación' : 'completa'}`} onCerrar={() => setPide(null)} ancho={440}>
          <ErrorApi r={res} />
          {pide.crear && (
            <Campo label="Tipo de descarga" style={{ marginBottom: 14 }}>
              <select style={estiloInput} value={pide.tipo} onChange={e => setPide(p => ({ ...p!, tipo: e.target.value as any }))}>
                <option value="facturacion">Solo facturación (habitual)</option>
                <option value="completo">Completa (toda la BD)</option>
              </select>
            </Campo>
          )}
          <Campo label="Confirma tu contraseña" ayuda="Por seguridad, cada descarga pide de nuevo la contraseña y queda registrada.">
            <input type="password" autoComplete="current-password" style={estiloInput} value={password} autoFocus
              onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && password) confirmar() }} />
          </Campo>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setPide(null)}>Cancelar</Btn>
            <Btn variante="primario" onClick={confirmar} disabled={ocupado || !password}>{ocupado ? (pide.crear ? 'Creando copia…' : 'Comprobando…') : 'Descargar'}</Btn>
          </div>
        </Modal>
      )}
    </Card>
  )
}
