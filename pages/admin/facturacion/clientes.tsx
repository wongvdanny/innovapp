import Link from 'next/link'
import { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { exigirAdmin } from '../../../lib/facturacion/api'
import { Layout, Card, Btn, api, estiloInput, useMensaje, C } from '../../../components/admin/facturacion/ui'
import { ClienteForm, TIPOS } from '../../../components/admin/facturacion/Clientes'

export default function Clientes() {
  const [q, setQ] = useState('')
  const [inactivos, setInactivos] = useState(false)
  const [lista, setLista] = useState<any[] | null>(null)
  const [editando, setEditando] = useState<any | null | undefined>(undefined) // undefined = cerrado, null = nuevo
  const { mostrar, Mensaje } = useMensaje()

  const cargar = async () => {
    const r = await api(`/api/admin/facturacion/clientes?q=${encodeURIComponent(q)}&limite=200${inactivos ? '&inactivos=1' : ''}`)
    if (r.ok) setLista(r.data)
  }
  useEffect(() => { const t = setTimeout(cargar, 200); return () => clearTimeout(t) }, [q, inactivos]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout titulo="Clientes" acciones={<Btn variante="primario" onClick={() => setEditando(null)}>+ Nuevo cliente</Btn>}>
      <Mensaje />
      <Card style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input style={{ ...estiloInput, flex: '1 1 260px', width: 'auto' }} placeholder="Buscar por nombre, NIF o email…" value={q} onChange={e => setQ(e.target.value)} />
          <label style={{ fontSize: 13, color: C.grisTexto, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
            <input type="checkbox" checked={inactivos} onChange={e => setInactivos(e.target.checked)} /> Mostrar desactivados
          </label>
        </div>
      </Card>
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="fac-tabla">
            <thead><tr><th>Cliente</th><th>NIF</th><th>Tipo</th><th>Localidad</th><th>Email</th><th>Retención</th><th></th></tr></thead>
            <tbody>{(lista || []).map(c => (
              <tr key={c.id} className="fac-click" onClick={() => setEditando(c)} style={{ opacity: c.activo ? 1 : 0.5 }}>
                <td style={{ fontWeight: 700 }}>{c.razon_social}{c.User && <div style={{ fontSize: 11, color: C.gris, fontWeight: 400 }}>Usuario: {c.User.email}</div>}</td>
                <td>{c.nif || <span style={{ color: C.ambar }}>Sin NIF</span>}</td>
                <td>{TIPOS.find(t => t[0] === c.tipo)?.[1]}</td>
                <td>{[c.municipio, c.pais !== 'ES' ? c.pais : null].filter(Boolean).join(' · ') || '—'}</td>
                <td>{c.email || '—'}</td>
                <td>{c.aplica_retencion ? 'Sí' : 'No'}</td>
                <td onClick={e => e.stopPropagation()} style={{ whiteSpace: 'nowrap' }}>
                  <Link href={`/admin/facturacion/facturas/nueva?cliente=${c.id}`} style={{ color: C.naranjaOsc, fontWeight: 700, marginRight: 12 }}>+ Factura</Link>
                  <Link href={`/admin/facturacion/facturas?cliente_id=${c.id}`} style={{ color: C.grisTexto }}>Facturas</Link>
                </td>
              </tr>
            ))}</tbody>
          </table>
          {lista?.length === 0 && <div style={{ padding: 48, textAlign: 'center', color: C.gris }}>{q ? 'Sin resultados' : 'Aún no hay clientes'}</div>}
        </div>
      </Card>
      {editando !== undefined && (
        <ClienteForm cliente={editando ?? undefined} onCerrar={() => setEditando(undefined)}
          onGuardado={() => { setEditando(undefined); mostrar('ok', 'Cliente guardado'); cargar() }} />
      )}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => (await exigirAdmin(ctx)) ?? { props: {} }
