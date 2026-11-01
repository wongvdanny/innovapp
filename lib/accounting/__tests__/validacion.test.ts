import { describe, it, expect } from 'vitest'
import { finPeriodo, normalizarMeta, normalizarProyecto, normalizarRecurrenteGasto } from '../validacion'

describe('validación de Contabilidad', () => {
  it('fin de periodo natural', () => {
    expect(finPeriodo('2026-10-01', 'mes')).toBe('2026-10-31')
    expect(finPeriodo('2026-10-01', 'trimestre')).toBe('2026-12-31')
    expect(finPeriodo('2026-01-01', 'anio')).toBe('2026-12-31')
  })
  it('meta: calcula el fin y rechaza datos malos', () => {
    expect(normalizarMeta({ metrica: 'mrr', periodo: 'anio', objetivo: '1000', desde: '2026-01-01' }).hasta.toISOString().slice(0, 10)).toBe('2026-12-31')
    expect(() => normalizarMeta({ metrica: 'mrr', periodo: 'anio', objetivo: '0', desde: '2026-01-01' })).toThrow()
    expect(() => normalizarMeta({ metrica: 'otra', periodo: 'mes', objetivo: '1', desde: '2026-01-01' })).toThrow()
  })
  it('proyecto: nombre obligatorio, fechas coherentes, sin campos extra', () => {
    expect(() => normalizarProyecto({ nombre: ' ' })).toThrow()
    expect(() => normalizarProyecto({ nombre: 'Web', fecha_inicio: '2026-11-10', fecha_entrega: '2026-11-01' })).toThrow()
    const p = normalizarProyecto({ nombre: 'Web', presupuesto: '1.500,50'.replace('.', ''), id: 'x', created_at: 'y' } as any)
    expect(p.presupuesto).toBe('1500.50')
    expect(Object.keys(p)).not.toContain('id')
  })
  it('recurrente de gasto: nunca emite ni envía y la línea lleva la base', () => {
    const r = normalizarRecurrenteGasto({ proveedor: 'Contabo GmbH', base: '10', tipo_iva: '0', proxima_fecha: '2026-10-01', categoria: 'hosting', emitir_auto: true }, ['hosting'])
    expect([r.tipo, r.emitir_auto, r.enviar_email, r.categoria]).toEqual(['gasto', false, false, 'hosting'])
    expect(r.lineas[0]).toMatchObject({ precio_unitario: '10', tipo_iva: '0' })
    expect(() => normalizarRecurrenteGasto({ proveedor: 'X', base: '10', proxima_fecha: '2026-10-01', dia_mes: 31 }, [])).toThrow()
  })
})
