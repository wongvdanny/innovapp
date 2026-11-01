import { describe, it, expect } from 'vitest'
import {
  DatosContables, Contrato, Ingreso, Gasto, mesAnterior, ultimosMeses, finDeMes, corte, mrrEn, clientesEn,
  kpisMes, evolucion, desglosePorLinea, progresoMeta, enfoque, csvIngresos, crecimiento,
} from '../calculos'

const ing = (fecha: string, base: number, linea = 'servix', origen: Ingreso['origen'] = 'factura'): Ingreso =>
  ({ fecha, base, iva: base * 0.21, linea, origen, ref: 'F-' + fecha, cliente: 'Cliente', descripcion: 'x' })
const gas = (fecha: string, coste: number, extra: Partial<Gasto> = {}): Gasto =>
  ({ id: fecha + coste, fecha, base: coste, coste, ivaDeducible: 0, estado: 'registrado', linea: 'otros', categoria: 'software', proveedor: 'P', recurrenteId: null, ...extra })
const con = (id: string, mensual: number, inicio: string | null, baja: string | null = null, linea = 'servix'): Contrato =>
  ({ id, linea, cliente: id, mensual, inicio, baja })

describe('fechas', () => {
  it('mes anterior cruza de año', () => {
    expect(mesAnterior('2026-01')).toBe('2025-12')
    expect(mesAnterior('2026-03', 14)).toBe('2025-01')
  })
  it('últimos meses en orden', () => expect(ultimosMeses('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']))
  it('fin de mes y corte', () => {
    expect(finDeMes('2028-02')).toBe('2028-02-29')
    expect(corte('2026-11', '2026-11-10')).toBe('2026-11-10')
    expect(corte('2026-10', '2026-11-10')).toBe('2026-10-31')
  })
  it('crecimiento sin base es null', () => {
    expect(crecimiento(100, 0)).toBeNull()
    expect(crecimiento(150, 100)).toBe(50)
  })
})

describe('contratos', () => {
  const cs = [con('a', 99, '2026-09-15'), con('b', 49, '2026-10-01', '2026-10-20', 'gymstack'), con('c', 0, '2026-09-01'), con('p', 99, null)]
  it('MRR solo de contratos activos en la fecha (la baja es exclusiva)', () => {
    expect(mrrEn(cs, '2026-10-10')).toBe(148)
    expect(mrrEn(cs, '2026-10-20')).toBe(99)
    expect(mrrEn(cs, '2026-10-10', 'gymstack')).toBe(49)
  })
  it('los gratuitos y los no iniciados no son clientes de pago', () => expect(clientesEn(cs, '2026-10-10')).toBe(2))
})

describe('KPIs del mes', () => {
  const d: DatosContables = {
    ingresos: [ing('2026-10-05', 100), ing('2026-10-20', 50, 'agentes', 'sin_factura'), ing('2026-09-30', 999)],
    gastos: [gas('2026-10-01', 30), gas('2026-10-02', 20, { estado: 'previsto' })],
    contratos: [con('a', 100, '2026-08-01'), con('b', 100, '2026-08-01', '2026-10-15'), con('c', 50, '2026-10-10')],
  }
  const k = kpisMes(d, '2026-10', '2026-11-01')
  it('ingresos, previstos aparte y beneficio', () => {
    expect([k.ingresos, k.ingresosSinFactura, k.gastosRegistrados, k.gastosPrevistos, k.beneficio]).toEqual([150, 50, 30, 20, 100])
  })
  it('MRR, ARR, clientes y ARPU a fin de mes', () => {
    expect([k.mrr, k.arr, k.clientes, k.arpu]).toEqual([150, 1800, 2, 75])
  })
  it('altas, bajas y churn sobre los clientes al inicio del mes', () => {
    expect([k.altas, k.bajas, k.churn]).toEqual([1, 1, 50])
  })
  it('mes en curso: corte en hoy (una baja futura aún no cuenta)', () => {
    const hoy = kpisMes(d, '2026-10', '2026-10-12')
    expect([hoy.bajas, hoy.mrr]).toEqual([0, 250])
  })
  it('sin clientes al inicio, churn null', () => expect(kpisMes({ ...d, contratos: [] }, '2026-10', '2026-11-01').churn).toBeNull())
})

describe('evolución y desglose', () => {
  const d: DatosContables = {
    ingresos: [ing('2026-09-10', 100), ing('2026-10-10', 150), ing('2026-10-11', 80, 'proyectos')],
    gastos: [gas('2026-10-01', 200, { linea: 'proyectos' })],
    contratos: [con('a', 99, '2026-09-01')],
  }
  it('12 meses con MRR por línea', () => {
    const e = evolucion(d, '2026-10', '2026-11-01', 12, ['servix', 'gymstack'])
    expect(e).toHaveLength(12)
    expect(e[11]).toMatchObject({ mes: '2026-10', ingresos: 230, mrr: 99, mrrPorLinea: { servix: 99, gymstack: 0 } })
    expect(e[10].ingresos).toBe(100)
  })
  it('crecimiento y margen por línea', () => {
    const [s, p] = desglosePorLinea(d, '2026-10', '2026-11-01', ['servix', 'proyectos'])
    expect([s.ingresos, s.crecimiento, s.margen, s.clientes]).toEqual([150, 50, 150, 1])
    expect([p.ingresos, p.crecimiento, p.margen, p.margenPct]).toEqual([80, null, -120, -150])
  })
})

describe('metas', () => {
  const d: DatosContables = {
    ingresos: [ing('2026-10-01', 300), ing('2026-10-10', 300)],
    gastos: [],
    contratos: [con('a', 500, '2026-09-01'), con('b', 200, '2026-10-05')],
  }
  it('flujo: proyección lineal por días', () => {
    const p = progresoMeta(d, { id: '1', metrica: 'ingresos', objetivo: 1000, periodo: 'mes', desde: '2026-10-01', hasta: '2026-10-31', producto_slug: null }, '2026-10-10')
    expect([p.actual, p.pct, p.proyeccion]).toEqual([600, 60, 1860])
  })
  it('stock: valor actual + ritmo desde el inicio del periodo', () => {
    const p = progresoMeta(d, { id: '2', metrica: 'mrr', objetivo: 1000, periodo: 'mes', desde: '2026-10-01', hasta: '2026-10-30', producto_slug: null }, '2026-10-10')
    expect([p.actual, p.proyeccion]).toEqual([700, 1100])
  })
  it('meta futura: sin progreso ni proyección', () => {
    const p = progresoMeta(d, { id: '3', metrica: 'altas', objetivo: 5, periodo: 'mes', desde: '2026-12-01', hasta: '2026-12-31', producto_slug: null }, '2026-10-10')
    expect([p.actual, p.proyeccion, p.terminada]).toEqual([0, null, false])
  })
})

describe('dónde enfocar', () => {
  it('alertas de línea estancada, margen negativo, churn y gasto que sube', () => {
    const d: DatosContables = {
      ingresos: [ing('2026-08-05', 100), ing('2026-09-05', 100), ing('2026-10-05', 90)],
      gastos: [
        ...['2026-07-01', '2026-08-01', '2026-09-01'].map(f => gas(f, 50, { proveedor: 'Meta', recurrenteId: 'r' })),
        gas('2026-10-01', 90, { proveedor: 'Meta', recurrenteId: 'r' }),
        gas('2026-10-02', 500, { linea: 'servix' }),
      ],
      contratos: [con('a', 99, '2026-01-01'), con('b', 99, '2026-01-01', '2026-10-03')],
    }
    const { ranking, alertas } = enfoque(d, '2026-10', '2026-11-01', ['servix', 'gymstack'])
    expect(ranking.map(r => r.linea)).toEqual(['servix'])
    expect(alertas.map(a => a.tipo).sort()).toEqual(['churn', 'estancada', 'gasto_sube', 'margen_negativo'])
  })
})

describe('CSV', () => {
  it('BOM, punto y coma, decimales con coma y comillas', () => {
    const t = csvIngresos([{ ...ing('2026-10-05', 100), descripcion: 'Iguala; octubre' }])
    expect(t.charCodeAt(0)).toBe(0xfeff)
    expect(t).toContain('05/10/2026;Factura;F-2026-10-05;Cliente;"Iguala; octubre";servix;100,00;21,00;121,00')
  })
})
