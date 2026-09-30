import { GetServerSideProps } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { exigirAdmin, aJson } from '../../../lib/facturacion/api'
import { documentoGestor } from '../../../lib/facturacion/gestor'
import { DIAS_ENLACE, DocumentoGestor } from '../../../lib/facturacion/gestor-tipos'
import { Layout, Card, Btn, Campo, Modal, Aviso, ErrorApi, api, estiloInput, useMensaje, RespuestaApi, C } from '../../../components/admin/facturacion/ui'
import GestorDocumento from '../../../components/facturacion/GestorDocumento'

const fechaHora = (iso?: string | null) => iso ? new Date(iso).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

function Enlaces() {
  const [lista, setLista] = useState<any[]>([])
  const [nota, setNota] = useState('')
  const [nuevo, setNuevo] = useState<{ url: string; expira_at: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const cargar = async () => { const r = await api('/api/admin/facturacion/gestor/enlaces'); if (r.ok) setLista(r.data) }
  useEffect(() => { cargar() }, [])

  const crear = async () => {
    const r = await api('/api/admin/facturacion/gestor/enlaces', 'POST', { nota })
    if (!r.ok) return setRes(r)
    setNuevo(r.data); setNota(''); setCopiado(false); cargar()
  }
  const revocar = async (e: any) => {
    if (!confirm(`¿Revocar el enlace …${e.token_sufijo}? Dejará de funcionar al instante.`)) return
    const r = await api(`/api/admin/facturacion/gestor/enlaces/${e.id}`, 'DELETE')
    r.ok ? cargar() : setRes(r)
  }
  const estado = (e: any) => e.revocado_at ? ['Revocado', C.rojo] : new Date(e.expira_at) < new Date() ? ['Caducado', C.gris] : ['Activo', C.verde]

  return (
    <Card titulo="Enlaces para la gestoría" style={{ marginBottom: 16 }}>
      <div style={{ padding: 20 }}>
        <ErrorApi r={res} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Campo label="Nota (opcional)" style={{ flex: '1 1 240px' }}>
            <input style={estiloInput} value={nota} onChange={e => setNota(e.target.value)} placeholder="p. ej. Gestoría López, 4T 2026" />
          </Campo>
          <Btn variante="primario" onClick={crear}>Generar enlace para gestor</Btn>
        </div>
        <div style={{ fontSize: 12, color: C.gris, marginTop: 8 }}>Solo lectura, sin login, válido {DIAS_ENLACE} días y revocable. Cada acceso queda registrado. No es indexable.</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="fac-tabla">
          <thead><tr><th>Enlace</th><th>Nota</th><th>Creado</th><th>Caduca</th><th>Accesos</th><th>Último acceso</th><th>Estado</th><th></th></tr></thead>
          <tbody>{lista.map(e => {
            const [txt, color] = estado(e)
            return (
              <tr key={e.id}>
                <td style={{ fontFamily: 'monospace' }}>…{e.token_sufijo}</td>
                <td>{e.nota || '—'}</td>
                <td>{fechaHora(e.created_at)}</td>
                <td>{fechaHora(e.expira_at)}</td>
                <td className="fac-num">{e.accesos}</td>
                <td>{fechaHora(e.ultimo_acceso_at)}</td>
                <td style={{ color, fontWeight: 700 }}>{txt}</td>
                <td>{txt === 'Activo' && <Btn variante="peligro" onClick={() => revocar(e)}>Revocar</Btn>}</td>
              </tr>
            )
          })}</tbody>
        </table>
        {lista.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: C.gris }}>Aún no hay enlaces</div>}
      </div>
      {nuevo && (
        <Modal titulo="Enlace para la gestoría" onCerrar={() => setNuevo(null)} ancho={560}>
          <Aviso tipo="aviso">Copia el enlace ahora: por seguridad no se guarda y no se podrá volver a mostrar. Caduca el {fechaHora(nuevo.expira_at)}.</Aviso>
          <input readOnly style={{ ...estiloInput, fontFamily: 'monospace', fontSize: 12 }} value={nuevo.url} onFocus={e => e.target.select()} />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <Btn variante="primario" onClick={async () => { await navigator.clipboard.writeText(nuevo.url); setCopiado(true) }}>{copiado ? '✓ Copiado' : 'Copiar enlace'}</Btn>
            <Btn onClick={() => setNuevo(null)}>Cerrar</Btn>
          </div>
        </Modal>
      )}
    </Card>
  )
}

function Dudas({ onCambio }: { onCambio: () => void }) {
  const [lista, setLista] = useState<any[]>([])
  const [edit, setEdit] = useState<any | null>(null)
  const [res, setRes] = useState<RespuestaApi | null>(null)
  const cargar = async () => { const r = await api('/api/admin/facturacion/gestor/dudas'); if (r.ok) setLista(r.data) }
  useEffect(() => { cargar() }, [])

  const guardar = async () => {
    const nueva = !edit.id
    const r = await api(nueva ? '/api/admin/facturacion/gestor/dudas' : `/api/admin/facturacion/gestor/dudas/${edit.id}`, nueva ? 'POST' : 'PUT',
      nueva ? { tema: edit.tema, pregunta: edit.pregunta } : { tema: edit.tema, pregunta: edit.pregunta, respuesta: edit.respuesta, estado: edit.estado })
    if (!r.ok) return setRes(r)
    setEdit(null); cargar(); onCambio()
  }

  return (
    <Card titulo={`Dudas (${lista.filter(d => d.estado === 'abierta').length} abiertas)`} style={{ marginBottom: 16 }}
      extra={<Btn onClick={() => { setRes(null); setEdit({ tema: '', pregunta: '', respuesta: '', estado: 'abierta' }) }}>+ Nueva duda</Btn>}>
      <div style={{ overflowX: 'auto' }}>
        <table className="fac-tabla">
          <thead><tr><th>Tema</th><th>Pregunta</th><th>Estado</th><th></th></tr></thead>
          <tbody>{lista.map(d => (
            <tr key={d.id} className="fac-click" onClick={() => { setRes(null); setEdit({ ...d, respuesta: d.respuesta ?? '' }) }}>
              <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{d.tema}</td>
              <td style={{ color: C.grisTexto }}>{d.pregunta}{d.respuesta && <div style={{ color: C.verde, marginTop: 4 }}>→ {d.respuesta}</div>}</td>
              <td style={{ color: d.estado === 'resuelta' ? C.verde : C.ambar, fontWeight: 700 }}>{d.estado === 'resuelta' ? 'Resuelta' : 'Abierta'}</td>
              <td><Btn variante="fantasma">Editar</Btn></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {edit && (
        <Modal titulo={edit.id ? 'Editar duda' : 'Nueva duda'} onCerrar={() => setEdit(null)} ancho={600}>
          <ErrorApi r={res} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Campo label="Tema"><input style={estiloInput} value={edit.tema} onChange={e => setEdit((x: any) => ({ ...x, tema: e.target.value }))} /></Campo>
            <Campo label="Pregunta"><textarea style={{ ...estiloInput, minHeight: 80 }} value={edit.pregunta} onChange={e => setEdit((x: any) => ({ ...x, pregunta: e.target.value }))} /></Campo>
            {edit.id && <>
              <Campo label="Respuesta de la gestoría"><textarea style={{ ...estiloInput, minHeight: 70 }} value={edit.respuesta} onChange={e => setEdit((x: any) => ({ ...x, respuesta: e.target.value }))} /></Campo>
              <Campo label="Estado"><select style={estiloInput} value={edit.estado} onChange={e => setEdit((x: any) => ({ ...x, estado: e.target.value }))}>
                <option value="abierta">Abierta</option><option value="resuelta">Resuelta</option></select></Campo>
            </>}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <Btn onClick={() => setEdit(null)}>Cancelar</Btn>
            <Btn variante="primario" onClick={guardar} disabled={!edit.tema.trim() || !edit.pregunta.trim()}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </Card>
  )
}

export default function Gestor({ doc }: { doc: DocumentoGestor }) {
  const router = useRouter()
  const { Mensaje } = useMensaje()
  return (
    <Layout titulo="Documento para la gestoría" acciones={<a href="/api/admin/facturacion/gestor/pdf"><Btn variante="primario">⬇ Descargar PDF</Btn></a>}>
      <Mensaje />
      <Enlaces />
      <Dudas onCambio={() => router.replace(router.asPath)} />
      <Card titulo="Vista previa (lo mismo que ve la gestoría)">
        <div style={{ padding: 'clamp(16px, 3vw, 32px)' }}><GestorDocumento doc={doc} /></div>
      </Card>
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  return { props: aJson({ doc: await documentoGestor() }) }
}
