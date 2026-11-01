import { ConfigMetricas } from '../secciones/MetricasProducto'
import { Section, euros, fecha } from '../ui'

// Registro de paneles de métricas por slug de producto. Un producto sin entrada aquí usa el
// panel genérico (suscripciones y planes de innovapp): añadir un producto a la tabla Product
// no obliga a tocar nada más.

const propietario = (r: any) => <><div className="adm-fuerte">{r.owner}</div><div className="adm-muted adm-peq">{r.email}</div></>
const nombreSlug = (r: any) => <><div className="adm-fuerte">{r.name}</div><div className="adm-muted adm-peq">/{r.slug}</div></>
const suma = (filas: any[], campo: string) => filas.reduce((a, r) => a + (r[campo] || 0), 0)

export const METRICAS: Record<string, ConfigMetricas> = {
  servix: {
    endpoint: '/api/admin/restaurants',
    titulo: 'Detalle por restaurante',
    vacio: 'No hay restaurantes activos',
    kpis: f => [['Restaurantes activos', f.length], ['Comandas en el periodo', suma(f, 'totalOrders')], ['Ventas en el periodo', euros(suma(f, 'totalSales'))]],
    orden: (a, b) => b.totalSales - a.totalSales,
    columnas: [
      { key: 'r', header: 'Restaurante', render: nombreSlug },
      { key: 'p', header: 'Propietario', render: propietario },
      { key: 'plan', header: 'Plan', render: r => r.plan },
      { key: 'vence', header: 'Vence', render: r => <span className="adm-muted" suppressHydrationWarning>{fecha(r.endDate)}</span> },
      { key: 'mesas', header: 'Mesas', num: true, render: r => r.tables },
      { key: 'emp', header: 'Empleados', num: true, render: r => r.employees },
      { key: 'com', header: 'Comandas', num: true, render: r => r.totalOrders },
      {
        key: 'ventas', header: 'Ventas', num: true, render: r => <>
          <div className="adm-fuerte" style={{ color: r.totalSales > 0 ? 'var(--adm-ok)' : 'var(--adm-muted)' }}>{euros(r.totalSales)}</div>
          {r.totalOrders > 0 && <div className="adm-muted adm-peq">{euros(r.totalSales / r.totalOrders)} / comanda</div>}
        </>,
      },
    ],
  },

  gymstack: {
    endpoint: '/api/admin/gyms',
    titulo: 'Detalle por gimnasio',
    vacio: 'No hay gimnasios activos',
    kpis: f => [['Gimnasios activos', f.length], ['Reservas en el periodo', suma(f, 'totalBookings')], ['Cuotas cobradas', euros(suma(f, 'totalSales'))]],
    orden: (a, b) => b.totalSales - a.totalSales,
    columnas: [
      { key: 'g', header: 'Gimnasio', render: nombreSlug },
      { key: 'p', header: 'Propietario', render: propietario },
      { key: 'plan', header: 'Plan', render: r => r.plan },
      { key: 'vence', header: 'Vence', render: r => <span className="adm-muted" suppressHydrationWarning>{fecha(r.endDate)}</span> },
      { key: 'socios', header: 'Socios activos', num: true, render: r => r.activeMembers },
      { key: 'staff', header: 'Personal', num: true, render: r => r.staff },
      { key: 'res', header: 'Reservas', num: true, render: r => r.totalBookings },
      { key: 'cuotas', header: 'Cuotas cobradas', num: true, render: r => <span className="adm-fuerte" style={{ color: r.totalSales > 0 ? 'var(--adm-ok)' : 'var(--adm-muted)' }}>{euros(r.totalSales)}</span> },
    ],
  },

  news: {
    endpoint: '/api/admin/news',
    titulo: 'Suscriptores',
    vacio: 'Sin suscriptores en este periodo',
    kpis: f => [['Suscriptores activos', f.length], ['Audios generados', suma(f, 'digestsGenerated')], ['Ingresos (MRR)', euros(suma(f, 'planPrice'))]],
    columnas: [
      { key: 'n', header: 'Nombre', render: r => <span className="adm-fuerte">{r.name}</span> },
      { key: 'e', header: 'Email', render: r => <span className="adm-muted">{r.email}</span> },
      { key: 'pais', header: 'País', render: r => r.country },
      { key: 'zona', header: 'Provincia / ciudad', render: r => [r.city, r.province].filter(Boolean).join(', ') || '—' },
      { key: 'temas', header: 'Temas', render: r => (r.topics || []).join(', ') || '—' },
      { key: 'plan', header: 'Plan', render: r => `${r.plan} · ${r.planPrice}€` },
      { key: 'audios', header: 'Audios', num: true, render: r => r.digestsGenerated },
      { key: 'ultima', header: 'Última generación', render: r => <span className="adm-muted" suppressHydrationWarning>{fecha(r.lastDigestDate)}</span> },
    ],
    extra: {
      endpoint: '/api/admin/news-costs',
      render: c => (
        <Section title="💸 Consumo y coste estimado de APIs"
          subtitle="Claude Haiku 4.5: 1/5 $ por millón de tokens E/S. Google TTS Neural2: 16 $ por millón de caracteres, 1M gratis al mes. NewsData.io: gratis hasta 200 llamadas/día.">
          <div className="adm-grid" style={{ ['--min' as any]: '150px' }}>
            {([
              ['Generaciones', c.runs], ['Llamadas NewsData', c.newsdataCalls],
              ['Tokens Claude E/S', `${c.claudeInputTokens} / ${c.claudeOutputTokens}`],
              ['Caracteres TTS', c.ttsCharacters.toLocaleString('es-ES')], ['Coste total est.', `$${c.totalCostUsd.toFixed(4)}`],
            ] as [string, string][]).map(([l, v]) => (
              <div key={l}><div style={{ fontSize: 18, fontWeight: 800 }}>{v}</div><div className="adm-muted adm-peq">{l}</div></div>
            ))}
          </div>
        </Section>
      ),
    },
  },
}
