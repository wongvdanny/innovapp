import type { DocumentoGestor } from '../../lib/facturacion/gestor-tipos'

// Documento para la gestoría. Lo usan /admin/facturacion/gestor y el enlace público /gestor/<token>.
const C = { naranja: '#EE7528', negro: '#1E1E1E', gris: '#6B7C85', borde: '#E5E7EB', fondo: '#F8FAFB', verde: '#166534', ambar: '#92400E' }
const FUENTE = 'var(--font-gabarito), system-ui, sans-serif'

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 20, fontWeight: 800, color: C.negro, margin: '36px 0 12px', paddingBottom: 8, borderBottom: `2px solid ${C.naranja}` }}>{children}</h2>
}

export default function GestorDocumento({ doc }: { doc: DocumentoGestor }) {
  return (
    <article style={{ fontFamily: FUENTE, color: C.negro, lineHeight: 1.55, fontSize: 15 }}>
      <style jsx>{`
        .gd-tabla { width: 100%; border-collapse: collapse; font-size: 14px; }
        .gd-tabla th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${C.gris}; padding: 10px 12px; background: ${C.fondo}; }
        .gd-tabla td { padding: 10px 12px; border-top: 1px solid ${C.borde}; vertical-align: top; }
        @media (max-width: 640px) {
          .gd-tabla thead { display: none; }
          .gd-tabla tr { display: block; border-top: 1px solid ${C.borde}; padding: 8px 0; }
          .gd-tabla td { display: block; border: none; padding: 4px 0; }
        }
      `}</style>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.naranja, letterSpacing: 1, textTransform: 'uppercase' }}>{doc.emisor.nombreComercial || doc.emisor.nombre}</div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: '6px 0 4px', lineHeight: 1.2 }}>{doc.titulo}</h1>
      <div style={{ fontSize: 13, color: C.gris }}>{doc.emisor.nombre} · generado el {fechaHora(doc.generado)} con los datos del sistema</div>
      <p style={{ fontSize: 16, marginTop: 18 }}>{doc.lead}</p>

      <H2>Qué hace el sistema</H2>
      <ul style={{ paddingLeft: 20, margin: 0 }}>
        {doc.resumen.map(r => <li key={r.titulo} style={{ marginBottom: 8 }}><strong>{r.titulo}:</strong> {r.texto}</li>)}
      </ul>

      <H2>Criterios aplicados</H2>
      <div style={{ overflowX: 'auto' }}>
        <table className="gd-tabla">
          <thead><tr><th style={{ width: '24%' }}>Tema</th><th>Cómo se aplica hoy</th><th style={{ width: 110 }}>Confirmar</th></tr></thead>
          <tbody>{doc.criterios.map(c => (
            <tr key={c.tema}>
              <td style={{ fontWeight: 700 }}>{c.tema}</td>
              <td>{c.aplicado}</td>
              <td>{c.confirmar ? <span style={{ color: C.ambar, fontWeight: 700 }}>Sí</span> : <span style={{ color: C.gris }}>—</span>}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <H2>VeriFactu: estado y pendientes</H2>
      <p style={{ marginTop: 0 }}>{doc.verifactu.estado}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {doc.verifactu.pendientes.map(p => (
          <li key={p.texto} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span aria-label={p.hecho ? 'Hecho' : 'Pendiente'} style={{ flexShrink: 0, fontWeight: 800, color: p.hecho ? C.verde : C.gris }}>{p.hecho ? '✓' : '○'}</span>
            <span style={{ color: p.hecho ? C.gris : C.negro }}>{p.texto}</span>
          </li>
        ))}
      </ul>

      <H2>Dudas para la gestoría</H2>
      {doc.dudas.length === 0 && <p>No hay dudas registradas.</p>}
      <ol style={{ paddingLeft: 20, margin: 0 }}>
        {doc.dudas.map(d => (
          <li key={d.id} style={{ marginBottom: 12 }}>
            <strong>{d.tema}.</strong> {d.pregunta}
            {d.estado === 'resuelta'
              ? <div style={{ marginTop: 4, padding: '8px 12px', background: '#F0FDF4', borderRadius: 8, color: C.verde, fontSize: 14 }}><strong>Resuelta:</strong> {d.respuesta || '—'}</div>
              : <div style={{ marginTop: 2, fontSize: 12, color: C.ambar, fontWeight: 700 }}>Abierta</div>}
          </li>
        ))}
      </ol>

      <H2>Fuentes</H2>
      <ul style={{ paddingLeft: 20, margin: 0, fontSize: 14 }}>
        {doc.fuentes.map(f => <li key={f.url}><a href={f.url} target="_blank" rel="noopener noreferrer" style={{ color: '#C85F1B' }}>{f.texto}</a></li>)}
      </ul>
    </article>
  )
}
