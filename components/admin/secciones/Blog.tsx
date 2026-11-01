import { useEffect, useState } from 'react'
import { Badge, Button, EmptyState, Notice, Section } from '../ui'

// Generación manual de posts del blog. La generación corre en el servidor en segundo plano
// (lib/blog-manual.ts); aquí se lanza y se consulta.
export default function Blog() {
  const [datos, setDatos] = useState<any>(null)
  const [error, setError] = useState('')

  const cargar = () =>
    fetch('/api/admin/blog')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`Error ${r.status}`))))
      .then(d => { setDatos(d); setError('') })
      .catch(e => setError(e.message))

  const generando = datos?.estado?.fase === 'generando'

  // Carga inicial y, mientras se genera, una consulta cada 3 segundos.
  useEffect(() => {
    if (!datos) { cargar(); return }
    if (!generando) return
    const t = setInterval(cargar, 3000)
    return () => clearInterval(t)
  }, [datos === null, generando])

  const generar = async () => {
    if (!confirm('Se generará un post nuevo con IA y, si pasa la verificación de hechos, quedará como borrador para que lo revises. ¿Continuar?')) return
    setError('')
    const r = await fetch('/api/admin/blog', { method: 'POST' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setError(d.error || `Error ${r.status}`)
    cargar()
  }

  const actuarBorrador = async (accion: 'publicar' | 'descartar', b: any) => {
    const pregunta = accion === 'publicar'
      ? (b.sustituye ? `Se sustituirá el post publicado /blog/${b.slug} por el borrador. ¿Publicar?` : `¿Publicar «${b.title}»?`)
      : `¿Descartar «${b.title}»? No se publicará.`
    if (!confirm(pregunta)) return
    setError('')
    const r = await fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accion, slug: b.slug }) })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setError(d.error || `Error ${r.status}`)
    else if (d.avisos?.length) setError(d.avisos.join(' · '))
    cargar()
  }

  if (!datos) return error ? <Notice tone="error">⚠️ {error}</Notice> : <EmptyState title="Cargando…" />

  const e = datos.estado
  const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })

  return (
    <div className="adm-stack">
      <div className="adm-grid" style={{ ['--min' as any]: '340px', alignItems: 'start' }}>
        <Section title="Generar un post">
          <p className="adm-muted" style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 16px' }}>
            Genera un post con IA sobre un tema que no se haya tratado y lo contrasta con los hechos verificados del producto.
            Si pasa, queda como borrador pendiente (abajo) y te llega un email con la vista previa: no se publica hasta que lo apruebes. Tarda unos minutos.
            El cron lo hace solo los lunes y jueves a las 6:00.
          </p>
          <Button variant="primario" onClick={generar} disabled={generando}>{generando ? 'Generando… (puedes dejar esta pestaña abierta)' : '✍️ Generar post ahora'}</Button>
          {error && <Notice tone="error" style={{ marginTop: 16 }}>{error}</Notice>}
          {e.fase === 'borrador' && (
            <Notice tone="ok" style={{ marginTop: 16 }}>
              <strong>Borrador listo</strong> ({fechaHora(e.fin)}): «{e.titulo}».{' '}
              <a href={`/admin/blog/borrador/${e.slug}`} style={{ fontWeight: 700, textDecoration: 'underline' }}>Revisar y publicar →</a>
            </Notice>
          )}
          {(e.fase === 'rechazado' || e.fase === 'error') && (
            <Notice tone="error" style={{ marginTop: 16, lineHeight: 1.7 }}>
              <strong>{e.fase === 'rechazado' ? 'No hay borrador: la verificación lo ha rechazado' : 'No se ha podido generar el post'}</strong>
              {e.titulo ? <> («{e.titulo}»)</> : null} · {fechaHora(e.fin)}
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {e.detalle.map((d: string, i: number) => <li key={i} style={{ overflowWrap: 'anywhere' }}>{d}</li>)}
              </ul>
              {e.fase === 'rechazado' && <div style={{ marginTop: 8 }}>El borrador queda guardado en content/blog/.rejected/. Puedes volver a pulsar el botón: probará con otro tema.</div>}
            </Notice>
          )}
        </Section>

        <Section title="Últimos posts" actions={<Badge tone="info">{datos.totalPosts} publicados</Badge>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {datos.posts.map((p: any) => (
              <a key={p.slug} href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="adm-lista-item">
                <span>{p.title}</span>
                <span className="adm-muted adm-peq" style={{ whiteSpace: 'nowrap' }}>{p.date}</span>
              </a>
            ))}
            {datos.posts.length === 0 && <EmptyState title="Todavía no hay posts" />}
          </div>
          <p className="adm-muted adm-peq" style={{ marginTop: 14, marginBottom: 0 }}>{datos.rechazados} borradores rechazados guardados.</p>
        </Section>
      </div>

      <Section title={`Borradores pendientes de aprobación (${datos.borradores.length})`}>
        {datos.borradores.length === 0 && <p className="adm-muted" style={{ margin: 0, fontSize: 14 }}>No hay borradores pendientes.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {datos.borradores.map((b: any) => (
            <div key={b.slug} className="adm-lista-item" style={{ flexWrap: 'wrap', background: 'var(--adm-warn-bg)', border: '1px solid var(--adm-warn-border)' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="adm-fuerte" style={{ fontSize: 14 }}>{b.title}</div>
                <div className="adm-peq" style={{ color: 'var(--adm-warn)' }}>
                  {b.fusion ? `Fusión de ${b.fusion.length} posts · sustituye a /blog/${b.slug}` : `Nuevo · /blog/${b.slug}`} · {b.updated ?? b.date}
                </div>
              </div>
              <a href={`/admin/blog/borrador/${b.slug}`} className="adm-fuerte" style={{ color: 'var(--adm-accent)' }}>Vista previa</a>
              <Button small onClick={() => actuarBorrador('descartar', b)}>Descartar</Button>
              <Button small variant="primario" onClick={() => actuarBorrador('publicar', b)}>Publicar</Button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
