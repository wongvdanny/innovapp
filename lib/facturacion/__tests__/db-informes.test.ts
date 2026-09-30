import ExcelJS from 'exceljs'
import { describe, it, expect, vi, afterAll } from 'vitest'

// Libros registro y resúmenes 303/130/390 contra la BD, en una transacción revertida y en
// el año 2098 (ningún dato real ni de otros tests cae ahí). Cifras esperadas calculadas a mano.

vi.mock('../../prisma', async () => {
  const real = (await vi.importActual<any>('../../prisma')).prisma
  let tx: any = null
  const prisma = new Proxy({}, {
    get(_t, k) {
      if (k === '__usar') return (c: any) => { tx = c }
      if (k === '__real') return real
      if (k === '$transaction' && tx) return (fn: any) => (typeof fn === 'function' ? fn(tx) : Promise.all(fn))
      const c = tx ?? real
      const v = c[k]
      return typeof v === 'function' ? v.bind(c) : v
    },
  })
  return { prisma }
})

import { prisma } from '../../prisma'
import { crearCliente } from '../clientes'
import { guardarBorrador } from '../borradores'
import { emitirEnTx } from '../emision'
import { crearRectificativaEnTx } from '../rectificativas'
import { guardarGasto } from '../gastos'
import { filasExpedidas, filasRecibidas, informeTrimestral, informeAnual, librosXlsx, csvExpedidas, nombreFicheroLibros } from '../informes'

const DB = process.env.FAC_DB_TESTS === '1'
const actor = { usuario: 'test@vitest' }
const real = (prisma as any).__real
class Rollback extends Error {}
const A = 2098
const dia = (d: string) => new Date(`${A}-${d}T10:00:00Z`)
const casilla = (r: any, c: string) => r.casillas.find((x: any) => x.c === c)?.v

describe.skipIf(!DB)('informes y libros registro (revertido, año 2098)', () => {
  afterAll(() => real.$disconnect())

  it('libro de expedidas/recibidas, 303, 130, 390, XLSX y CSV', async () => {
    const eventosAntes = await real.fac_eventos.count()
    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T', emisor_nombre: 'Prueba Informes' } })
        const acme = await crearCliente({ tipo: 'empresa', razon_social: 'ACME SL', nif: 'B12345674', direccion: 'C/ Uno', pais: 'ES' }, actor)
        const fr = await crearCliente({ tipo: 'empresa', razon_social: 'Société SARL', nif: 'FR12345678901', direccion: 'Paris', pais: 'FR' }, actor)
        const L = (precio: number, extra: any = {}) => [{ descripcion: 'Servicio', cantidad: 1, precio_unitario: precio, tipo_iva: 21, ...extra }]
        const emitir = async (b: any, d: string) => emitirEnTx(tx, b.id, actor, { ahora: dia(d) })

        const a = await emitir(await guardarBorrador(null, { cliente_id: acme.id, lineas: L(1000) }, actor), '10-05')             // ret 7 %: 70
        await emitir(await guardarBorrador(null, { lineas: L(100) }, actor), '10-06')                                              // F2
        await emitir(await guardarBorrador(null, { cliente_id: fr.id, lineas: L(500, { tipo_iva: 0, calificacion: 'N2' }) }, actor), '10-07')
        await emitir(await guardarBorrador(null, { cliente_id: acme.id, tipo_retencion: '0', lineas: L(100, { tipo_iva: 0, operacion_exenta: 'E1' }) }, actor), '10-08')
        const e = await emitir(await guardarBorrador(null, { cliente_id: acme.id, tipo_retencion: '0', lineas: L(200) }, actor), '10-09')
        // Sustitución de e: 200 → 150
        const rs = await crearRectificativaEnTx(tx, e.id, { tipo: 'S', motivo: 'Precio' }, actor)
        await guardarBorrador(rs.id, { cliente_id: acme.id, tipo_retencion: '0', lineas: L(150) }, actor)
        await emitir(rs, '11-10')
        // Diferencias de a: −100 (retención −7)
        const ri = await crearRectificativaEnTx(tx, a.id, { tipo: 'I', motivo: 'Descuento' }, actor)
        await guardarBorrador(ri.id, { cliente_id: acme.id, lineas: L(-100) }, actor)
        await emitir(ri, '11-11')

        await guardarGasto(null, { proveedor: 'Hosting SL', proveedor_nif: 'B12345674', fecha: `${A}-10-02`, base_imponible: '100', tipo_iva: '21', categoria: 'hosting' }, null, actor)
        await guardarGasto(null, { proveedor: 'Gestoría', proveedor_nif: 'B12345674', fecha: `${A}-10-03`, base_imponible: '200', tipo_iva: '21', tipo_retencion: '15', deducible_pct: '50', categoria: 'asesoria' }, null, actor)
        await guardarGasto(null, { proveedor: 'TGSS', fecha: `${A}-10-31`, base_imponible: '300', tipo_iva: '0', categoria: 'cuota_autonomo' }, null, actor)
        await guardarGasto(null, { proveedor: 'Hetzner', proveedor_nif: 'DE123456789', proveedor_pais: 'DE', fecha: `${A}-11-01`, base_imponible: '50', tipo_iva: '0', categoria: 'hosting' }, null, actor)

        // Libro de expedidas: 7 facturas + la anotación negativa de la sustituida = 8 líneas
        const exp = await filasExpedidas(A, 4)
        expect(exp).toHaveLength(8)
        expect(exp.every(x => x.ejercicio === A && x.periodo === '4T' && x.codigo === 'A' && x.tipoActividad === '05' && x.epigrafe === '763')).toBe(true)
        const neg = exp.find(x => x.referencia === e.num_serie_factura && x.base < 0)!
        expect([neg.base, neg.cuota, neg.tipoFactura]).toEqual([-200, -42, 'F1'])
        const ue = exp.find(x => x.calificacion === 'N2')!
        expect([ue.tipoId, ue.pais, ue.nif, ue.total, ue.cuota]).toEqual(['02', 'FR', '12345678901', 500, 0])
        const exenta = exp.find(x => x.exenta === 'E1')!
        expect([exenta.calificacion, exenta.total]).toEqual(['', 100])
        const fa = exp.find(x => x.referencia === a.num_serie_factura)!
        expect([fa.serie, fa.numero.length, fa.tipoRetencion, fa.retencion, fa.fechaExpedicion]).toEqual([`F${A}`, 4, 7, 70, `05/10/${A}`])

        // Libro de recibidas
        const rec = await filasRecibidas(A, 4)
        expect(rec.map(r => [r.conceptoGasto, r.gastoDeducible, r.cuotaDeducible, r.numeroRecepcion])).toEqual([
          ['G22', 100, 21, '1'], ['G19', 100, 21, '2'], ['G45', 300, 0, '3'], ['G22', 50, 0, '4']])
        expect(rec[2].tipoFactura).toBe('F6')
        expect([rec[3].tipoId, rec[3].pais]).toEqual(['02', 'DE'])
        expect(rec[1].retencion).toBe(30)

        // 303 del 4T: devengado 241,50 · deducible 42 · resultado 199,50
        const t = await informeTrimestral(A, 4)
        expect([casilla(t.r303, '07'), casilla(t.r303, '09'), casilla(t.r303, '27'), casilla(t.r303, '28'), casilla(t.r303, '29'), casilla(t.r303, '46')])
          .toEqual([1150, 241.5, 241.5, 200, 42, 199.5])
        expect(t.r303.informativas.map((x: any) => x.v)).toEqual([500, 0, 100])
        // 130 acumulado: ingresos 1750 · gastos 550 · rendimiento 1200 · 20 % 240 · retenciones 63 · resultado 177
        expect(t.r130.casillas.map((x: any) => x.v)).toEqual([1750, 550, 1200, 240, 0, 63, 177])
        expect(t.r130.porcentajeConRetencion).toBe(51.4)
        // Trimestres sin actividad
        expect((await informeTrimestral(A, 2)).r303.resultado).toBe(0)

        // 390: el anual coincide con la suma de trimestres
        const an = await informeAnual(A)
        expect(an.anual.resultado).toBe(199.5)
        expect(an.trimestres.map(q => q.resultado)).toEqual([0, 0, 0, 199.5])
        expect(an.volumenOperaciones).toBe(1750)

        // XLSX: pestañas y cabeceras del diseño normalizado, datos desde la fila 9
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load((await librosXlsx(A)) as any)
        expect(wb.worksheets.map(w => w.name)).toEqual(['EXPEDIDAS_INGRESOS', 'RECIBIDAS_GASTOS'])
        const we = wb.getWorksheet('EXPEDIDAS_INGRESOS')!
        expect([we.getCell('A8').value, we.getCell('K8').value, we.getCell('X7').value, we.getCell('I3').value]).toEqual(['Ejercicio', 'Serie', 'Cuota IVA Repercutida', 'NIF: 00000000T'])
        expect([we.getCell('A9').value, we.getCell('B9').value, we.getCell('F9').value, we.getCell('V9').value]).toEqual([A, '4T', 'F1', 1000])
        expect(we.rowCount).toBe(8 + 8)
        expect(wb.getWorksheet('RECIBIDAS_GASTOS')!.getCell('G9').value).toBe('G22')
        expect(await nombreFicheroLibros(A)).toBe(`${A}00000000TTPrueba Informes.xlsx`)

        // CSV: BOM, «;», coma decimal
        const c = csvExpedidas(exp)
        expect(c.startsWith('﻿')).toBe(true)
        const lineas = c.trim().split('\r\n')
        expect(lineas).toHaveLength(9)
        expect(lineas[0]).toContain('Autoliquidación - Ejercicio;Autoliquidación - Periodo')
        expect(lineas.some(l => l.includes(';1000,00;') && l.includes(';210,00;'))).toBe(true)
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    }, { timeout: 120_000 })).rejects.toBeInstanceOf(Rollback)
    expect(await real.fac_eventos.count()).toBe(eventosAntes)
  })
})
