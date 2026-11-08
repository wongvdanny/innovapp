import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { FormEvent, useMemo, useState } from 'react'
import { exigirAdmin } from '../lib/facturacion/api'
import { Documento, ESTADOS, Licitacion, Orden, RUBROS, norm, ordenarPor, pasaFiltros, plazoDe } from '../lib/licitaciones'

// Buscador de licitaciones (PLACSP), herramienta interna. Antes era public/licitaciones.php.
// Descarga el feed ATOM en el momento de buscar (una petición por página), sin cron ni base de datos.

type Resultado = { res: Licitacion[]; leidas: number; desde: string; prefijos: string[]; abiertas: boolean; error: string }

const importe = (n: number) => n ? n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' as any }) + ' €' : '—'

// Pliegos y anexos: se abren en el navegador (PLACSP rechaza la descarga desde el servidor).
function Docs({ docs }: { docs: Documento[] }) {
  const otros = docs.filter(d => d.tipo === 'Otro')
  const enlace = (d: Documento, texto: string) => <a key={d.url} href={d.url} target="_blank" rel="noopener noreferrer" title={d.nombre}>{texto}</a>
  if (!docs.length) return null
  return (
    <div className="docs">
      {docs.filter(d => d.tipo !== 'Otro').map(d => enlace(d, d.tipo))}
      {otros.length > 0 && (
        <details>
          <summary>Otros ({otros.length})</summary>
          {otros.map(d => enlace(d, d.nombre || 'Documento'))}
        </details>
      )}
      <style jsx>{`
        .docs{display:flex;flex-wrap:wrap;gap:4px 10px;margin-top:4px;font-size:12px}
        .docs :global(a){color:var(--ac);text-decoration:none;font-weight:600}.docs :global(a:hover){text-decoration:underline}
        details{flex-basis:100%}summary{cursor:pointer;color:var(--mut)}
        details :global(a){display:block;font-weight:400;padding:1px 0 1px 12px}
      `}</style>
    </div>
  )
}

export default function Licitaciones() {
  const [f, setF] = useState({ rubro: 'innovapp', cpv: '', q: '', prov: '', min: '', paginas: '8', abiertas: true })
  const [buscando, setBuscando] = useState('')
  const [r, setR] = useState<Resultado | null>(null)
  const [orden, setOrden] = useState<Orden>({ campo: 'defecto', asc: true })
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [exportando, setExportando] = useState(false)
  const set = (k: keyof typeof f, v: string | boolean) => setF(x => ({ ...x, [k]: v }))
  const filas = useMemo(() => (r ? ordenarPor(r.res, orden, r.abiertas) : []), [r, orden])
  const todas = filas.length > 0 && filas.every(l => sel.has(l.id))

  // Primer clic: importe de mayor a menor, el resto de columnas A→Z / más próximo primero; el segundo invierte.
  const ordenarCol = (campo: Orden['campo']) =>
    setOrden(o => o.campo === campo ? { campo, asc: !o.asc } : { campo, asc: campo !== 'importe' })
  const flecha = (campo: Orden['campo']) => (orden.campo === campo ? (orden.asc ? ' ▲' : ' ▼') : '')
  const marcar = (id: string) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const exportar = async () => {
    setExportando(true)
    const resp = await fetch('/api/admin/licitaciones/exportar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filas: filas.filter(l => sel.has(l.id)) }),
    }).catch(() => null)
    setExportando(false)
    if (!resp?.ok) return alert('No se pudo generar el Excel')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(await resp.blob())
    a.download = resp.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'licitaciones.xlsx'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const buscar = async (e: FormEvent) => {
    e.preventDefault()
    if (buscando) return
    const paginas = Math.max(1, Math.min(40, parseInt(f.paginas) || 8))
    const prefijos = Array.from(new Set([...RUBROS[f.rubro][1], ...f.cpv.split(/[\s,;]+/).map(c => c.replace(/\D/g, ''))].filter(Boolean)))
    const filtros = {
      prefijos, palabras: norm(f.q.trim()).split(/\s+/).filter(Boolean), prov: f.prov.trim(),
      abiertas: f.abiertas, minImp: parseFloat(f.min) || 0, hoy: new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' }),
    }
    const vistos = new Set<string>()
    let res: Licitacion[] = [], leidas = 0, desde = '', error = ''
    let url: string | null = ''
    while (url !== null && leidas < paginas) {
      setBuscando(`Descargando feed… página ${leidas + 1} de ${paginas}`)
      const resp: Response | null = await fetch(`/api/admin/licitaciones${url ? `?url=${encodeURIComponent(url)}` : ''}`).catch(() => null)
      const d = await resp?.json().catch(() => null)
      if (!resp?.ok || !d) { error = `No se pudo leer la página ${leidas + 1} del feed.`; break }
      leidas++
      for (const l of d.entradas as Licitacion[]) {
        if (vistos.has(l.id)) continue // el feed va de más reciente a más antiguo
        vistos.add(l.id)
        desde = l.upd
        if (pasaFiltros(l, filtros)) res.push(l)
      }
      url = d.siguiente
    }
    setR({ res, leidas, desde, prefijos, abiertas: f.abiertas, error })
    setSel(new Set())
    setOrden({ campo: 'defecto', asc: true })
    setBuscando('')
  }

  return (
    <div className="lic">
      <Head><title>Buscador de licitaciones</title><meta name="robots" content="noindex, nofollow" /></Head>
      <div className="wrap">
        <h1>Buscador de licitaciones · PLACSP</h1>
        <form onSubmit={buscar}>
          <label>Rubro<select value={f.rubro} onChange={e => set('rubro', e.target.value)}>
            {Object.entries(RUBROS).map(([k, [lab]]) => <option key={k} value={k}>{lab}</option>)}
          </select></label>
          <label>CPV adicionales (prefijos)<input value={f.cpv} onChange={e => set('cpv', e.target.value)} placeholder="ej. 7226, 79342" /></label>
          <label>Palabras clave<input value={f.q} onChange={e => set('q', e.target.value)} placeholder="ej. desarrollo web" /></label>
          <label>Provincia / órgano<input value={f.prov} onChange={e => set('prov', e.target.value)} placeholder="ej. Asturias" /></label>
          <label>Importe mín. (sin IVA)<input type="number" min={0} step={1000} value={f.min} onChange={e => set('min', e.target.value)} /></label>
          <label>Páginas del feed<input type="number" min={1} max={40} value={f.paginas} onChange={e => set('paginas', e.target.value)} /></label>
          <label className="chk"><input type="checkbox" checked={f.abiertas} onChange={e => set('abiertas', e.target.checked)} /> Solo en plazo</label>
          <button disabled={!!buscando}>{buscando || 'Buscar'}</button>
        </form>

        {r && (
          <>
            <p className="info">
              {r.error && <><span className="err">{r.error}</span><br /></>}
              {r.res.length} resultados · {r.leidas} páginas leídas
              {r.desde && <> · cubre actualizaciones desde {r.desde.slice(0, 16)}</>}
              {' '}· CPV: {r.prefijos.join(', ') || 'todos'}
            </p>
            {r.res.length > 0 && (
              <>
              <div className="barra">
                <label className="chk"><input type="checkbox" checked={todas} onChange={() => setSel(todas ? new Set() : new Set(filas.map(l => l.id)))} /> Seleccionar todas</label>
                <span className="mut">{sel.size} seleccionadas</span>
                <button type="button" onClick={exportar} disabled={!sel.size || exportando}>{exportando ? 'Generando…' : 'Exportar a Excel'}</button>
                {orden.campo !== 'defecto' && <button type="button" className="sec" onClick={() => setOrden({ campo: 'defecto', asc: true })}>Orden por defecto</button>}
              </div>
              <table>
                <thead><tr>
                  <th className="c"></th>
                  <th>Licitación</th>
                  <th className="o" onClick={() => ordenarCol('organo')}>Órgano{flecha('organo')}</th>
                  <th className="o" onClick={() => ordenarCol('prov')}>Lugar{flecha('prov')}</th>
                  <th className="o" onClick={() => ordenarCol('importe')}>Importe{flecha('importe')}</th>
                  <th className="o" onClick={() => ordenarCol('plazo')}>Plazo{flecha('plazo')}</th>
                  <th>Estado</th>
                </tr></thead>
                <tbody>
                  {filas.map(l => (
                    <tr key={l.id} className={sel.has(l.id) ? 'sel' : ''}>
                      <td className="c"><input type="checkbox" checked={sel.has(l.id)} onChange={() => marcar(l.id)} aria-label="Seleccionar" /></td>
                      <td><a href={l.link} target="_blank" rel="noopener noreferrer">{l.objeto || l.titulo}</a><div className="cpv">CPV {l.cpvs.join(', ')}</div><Docs docs={l.docs} /></td>
                      <td>{l.organo}</td>
                      <td>{l.prov}</td>
                      <td className="n">{importe(l.importe)}</td>
                      <td className="n">{plazoDe(l) || '—'}</td>
                      <td><span className="b">{ESTADOS[l.estado] ?? l.estado}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </>
            )}
          </>
        )}
      </div>
      <style jsx>{`
        .lic{--bg:#f6f7f9;--card:#fff;--tx:#1d2330;--mut:#6b7385;--ac:#2457d6;--bd:#e3e6ec;min-height:100vh;font:14px/1.45 system-ui,sans-serif;background:var(--bg);color:var(--tx)}
        .lic :global(*){box-sizing:border-box}
        .wrap{max-width:1200px;margin:0 auto;padding:20px 16px}h1{font-size:20px;margin:0 0 14px;font-weight:700}
        form{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:14px;display:grid;gap:10px;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));align-items:end}
        label{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--mut)}
        input,select{font:inherit;padding:7px 9px;border:1px solid var(--bd);border-radius:6px;color:var(--tx);background:#fff}
        .chk{flex-direction:row;align-items:center;gap:6px;color:var(--tx);font-size:14px}
        button{font:inherit;font-weight:600;padding:9px 14px;border:0;border-radius:6px;background:var(--ac);color:#fff;cursor:pointer}
        button:disabled{opacity:.75;cursor:wait}
        .info{margin:14px 2px;color:var(--mut)}.mut{color:var(--mut)}
        .barra{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0 0 10px}
        .sec{background:#fff;color:var(--ac);border:1px solid var(--bd)}
        th.o{cursor:pointer;user-select:none;white-space:nowrap}th.o:hover{color:var(--ac)}
        td.c,th.c{width:34px}tr.sel td{background:#f3f6fd}.err{color:#b42318}
        table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--bd);border-radius:10px;overflow:hidden}
        th,td{padding:9px 10px;border-bottom:1px solid var(--bd);text-align:left;vertical-align:top}
        th{background:#eef1f6;font-size:12px;color:var(--mut)}td.n{text-align:right;white-space:nowrap}
        a{color:var(--ac);text-decoration:none}a:hover{text-decoration:underline}.cpv{color:var(--mut);font-size:12px}
        .b{display:inline-block;padding:1px 7px;border-radius:10px;font-size:12px;background:#e7eefc;color:var(--ac)}
        @media(max-width:760px){table,thead,tbody,tr,td{display:block}thead{display:none}td{border:0;padding:3px 10px}tr{border-bottom:1px solid var(--bd);padding:8px 0}}
      `}</style>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  return { props: {} }
}
