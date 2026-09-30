import { GetServerSideProps } from 'next'
import { useEffect, useState } from 'react'
import { exigirAdmin } from '../../../lib/facturacion/api'
import { periodoActual } from '../../../lib/facturacion/dashboard'
import { Layout, Card, Btn, Aviso, Euros, api, estiloInput, C } from '../../../components/admin/facturacion/ui'

function TablaCasillas({ filas, destacar }: { filas: { c: string; d: string; v: number }[]; destacar?: string[] }) {
  return (
    <table className="fac-tabla">
      <tbody>{filas.map(f => (
        <tr key={f.c + f.d} style={destacar?.includes(f.c) ? { background: '#fdf8f4' } : undefined}>
          <td style={{ width: 56, color: C.gris, fontWeight: 700 }}>[{f.c}]</td>
          <td style={{ fontWeight: destacar?.includes(f.c) ? 700 : 400 }}>{f.d}</td>
          <td className="fac-num" style={{ fontWeight: destacar?.includes(f.c) ? 800 : 500 }}><Euros v={f.v} /></td>
        </tr>
      ))}</tbody>
    </table>
  )
}

export default function Informes({ anioActual, trimestreActual }: { anioActual: number; trimestreActual: number }) {
  const [anio, setAnio] = useState(anioActual)
  const [trimestre, setTrimestre] = useState(trimestreActual)
  const [datos, setDatos] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDatos(null); setError(null)
    api(`/api/admin/facturacion/informes?anio=${anio}&trimestre=${trimestre}`).then(r => r.ok ? setDatos(r.data) : setError(r.error!))
  }, [anio, trimestre])

  const t = datos?.trimestral
  const a = datos?.anual
  const url = (formato: string, conTrimestre = true) => `/api/admin/facturacion/informes/libros?anio=${anio}${conTrimestre ? `&trimestre=${trimestre}` : ''}&formato=${formato}`

  return (
    <Layout titulo="Informes y libros registro" acciones={<>
      <select style={{ ...estiloInput, width: 110 }} value={anio} onChange={e => setAnio(+e.target.value)}>
        {[anioActual + 1, anioActual, anioActual - 1].filter(y => y >= 2026).map(y => <option key={y}>{y}</option>)}
      </select>
      <select style={{ ...estiloInput, width: 90 }} value={trimestre} onChange={e => setTrimestre(+e.target.value)}>
        {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}T</option>)}
      </select>
    </>}>
      <Aviso tipo="info">
        Resúmenes orientativos para preparar los modelos, calculados con los mismos datos que los libros registro. El periodo de cada factura
        emitida es el de su fecha de operación (o, si no la tiene, de expedición). Revísalos con tu gestor antes de presentar.
      </Aviso>
      {error && <Aviso tipo="error">⚠️ {error}</Aviso>}

      <Card titulo="Libros registro (formato electrónico común AEAT)" style={{ marginBottom: 16 }}>
        <div style={{ padding: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <a href={url('xlsx', false)}><Btn variante="primario">⬇ Libros {anio} (XLSX unificado IVA/IRPF)</Btn></a>
          <a href={url('csv-expedidas')}><Btn>⬇ Expedidas/ingresos {trimestre}T (CSV)</Btn></a>
          <a href={url('csv-recibidas')}><Btn>⬇ Recibidas/gastos {trimestre}T (CSV)</Btn></a>
          <div style={{ fontSize: 12, color: C.gris, flexBasis: '100%' }}>
            El XLSX sigue el diseño normalizado (pestañas EXPEDIDAS_INGRESOS y RECIBIDAS_GASTOS, actividad A05 · IAE 763) y sirve para importar en Pre303, en el modelo 130 y en Renta Web.
            {t && ` Periodo: ${t.expedidas} línea(s) de expedidas y ${t.recibidas} de recibidas.`}
          </div>
        </div>
      </Card>

      {!datos && !error && <div style={{ padding: 40, textAlign: 'center', color: C.gris }}>Calculando…</div>}
      {t && (
        <div className="fac-g2" style={{ alignItems: 'start', marginBottom: 16 }}>
          <Card titulo={`Modelo 303 · IVA · ${trimestre}T ${anio}`} extra={<strong style={{ color: t.r303.resultado > 0 ? C.naranjaOsc : C.verde }}><Euros v={t.r303.resultado} /></strong>}>
            <TablaCasillas filas={t.r303.casillas} destacar={['27', '45', '46']} />
            <div style={{ padding: '10px 14px', fontSize: 12, color: C.gris, borderTop: `1px solid ${C.borde}` }}>Informativas (* numeración de casilla orientativa):</div>
            <TablaCasillas filas={t.r303.informativas} />
            <div style={{ padding: '10px 14px 16px', fontSize: 12, color: C.gris }}>
              {t.r303.resultado > 0 ? 'A ingresar' : t.r303.resultado < 0 ? 'A compensar en periodos siguientes (o a devolver en el 4T)' : 'Sin actividad'}.
              {' '}No incluye compensaciones de periodos anteriores ni regularizaciones.
            </div>
          </Card>
          <Card titulo={`Modelo 130 · IRPF · ${t.r130.periodo}`} extra={<strong style={{ color: t.r130.resultado > 0 ? C.naranjaOsc : C.verde }}><Euros v={Math.max(0, t.r130.resultado)} /></strong>}>
            <TablaCasillas filas={t.r130.casillas} destacar={['03', '07']} />
            <div style={{ padding: '10px 14px 16px', fontSize: 12, color: C.gris, lineHeight: 1.6 }}>
              Si el resultado es negativo, el pago es 0 € (se compensa en trimestres siguientes del mismo año).
              La casilla [05] se estima con los resultados positivos de los trimestres anteriores calculados aquí: cámbiala si presentaste otra cantidad.
              <br />Ingresos con retención en el año: <strong>{t.r130.porcentajeConRetencion} %</strong>
              {t.r130.porcentajeConRetencion >= 70 ? ' — si en el año anterior más del 70 % de los ingresos tuvo retención, no estás obligado a presentar el 130.' : '.'}
              {' '}No incluye el 5 % de gastos de difícil justificación (estimación directa simplificada), que se aplica en la declaración anual.
            </div>
          </Card>
        </div>
      )}

      {a && (
        <Card titulo={`Resumen anual ${anio} · base del modelo 390`}>
          <div className="fac-g2" style={{ alignItems: 'start' }}>
            <div>
              <table className="fac-tabla">
                <thead><tr><th>Trimestre</th><th className="fac-num">IVA devengado</th><th className="fac-num">IVA deducible</th><th className="fac-num">Resultado</th></tr></thead>
                <tbody>
                  {a.trimestres.map((q: any) => (
                    <tr key={q.trimestre}><td>{q.trimestre}T</td><td className="fac-num"><Euros v={q.devengado} /></td><td className="fac-num"><Euros v={q.deducible} /></td><td className="fac-num"><Euros v={q.resultado} /></td></tr>
                  ))}
                  <tr style={{ fontWeight: 800 }}><td>Año</td>
                    <td className="fac-num"><Euros v={a.anual.casillas.find((c: any) => c.c === '27').v} /></td>
                    <td className="fac-num"><Euros v={a.anual.casillas.find((c: any) => c.c === '45').v} /></td>
                    <td className="fac-num"><Euros v={a.anual.resultado} /></td></tr>
                </tbody>
              </table>
              <div style={{ padding: '10px 14px 16px', fontSize: 13, color: C.grisTexto }}>Volumen de operaciones (bases imponibles): <strong><Euros v={a.volumenOperaciones} /></strong></div>
            </div>
            <TablaCasillas filas={a.anual.casillas} destacar={['27', '45', '46']} />
          </div>
        </Card>
      )}
    </Layout>
  )
}

export const getServerSideProps: GetServerSideProps = async ctx => {
  const redir = await exigirAdmin(ctx)
  if (redir) return redir
  const p = periodoActual()
  return { props: { anioActual: Math.max(2026, p.anio), trimestreActual: p.anio < 2026 ? 4 : p.trimestre } }
}
