import { describe, it, expect, vi, afterAll } from 'vitest'

// Lógica de las pantallas de admin (clientes, borradores, gastos, dashboard) contra la BD.
// Las funciones usan el cliente Prisma global y abren sus propias transacciones; aquí se
// sustituye por un proxy ligado a UNA transacción que se revierte al final, para no dejar
// nada (tampoco eventos, que son append-only). Solo con FAC_DB_TESTS=1.

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
import { crearCliente, actualizarCliente, buscarClientes } from '../clientes'
import { guardarBorrador, eliminarBorrador, duplicarFactura } from '../borradores'
import { emitirEnTx } from '../emision'
import { guardarGasto, eliminarGasto } from '../gastos'
import { resumenDashboard, periodoActual, cobrosSinFactura } from '../dashboard'
import { detalleFactura } from '../consultas'
import { fmt2 } from '../decimal'
import { FacturacionError } from '../errores'

const DB = process.env.FAC_DB_TESTS === '1'
const actor = { usuario: 'test@vitest' }
const real = (prisma as any).__real
class Rollback extends Error {}
const falla = (p: Promise<unknown>, code: string) => expect(p).rejects.toSatisfy((e: unknown) => e instanceof FacturacionError && e.code === code)

describe.skipIf(!DB)('admin de facturación contra la BD (revertido)', () => {
  afterAll(() => real.$disconnect())

  it('clientes, borradores, gastos y dashboard', async () => {
    const eventosAntes = await real.fac_eventos.count()
    const [clientesAntes, gastosAntes] = [await real.fac_clientes.count(), await real.fac_gastos.count()]

    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        // Clientes: validación de NIF, retención por defecto, duplicados
        await falla(crearCliente({ tipo: 'empresa', razon_social: 'Mal SL', nif: 'B12345675' }, actor), 'DATOS_INVALIDOS')
        const acme = await crearCliente({ tipo: 'empresa', razon_social: 'ACME SL', nif: 'b-1234567 4', direccion: 'C/ Uno 1', cp: '33001', municipio: 'Oviedo', pais: 'España' }, actor)
        expect([acme.nif, acme.pais, acme.aplica_retencion]).toEqual(['B12345674', 'ES', true])
        await falla(crearCliente({ tipo: 'autonomo', razon_social: 'Otro', nif: 'B12345674' }, actor), 'DATOS_INVALIDOS')
        const particular = await crearCliente({ tipo: 'particular', razon_social: 'Ana Pérez', nif: '12345678Z', direccion: 'C/ Dos', pais: 'ES' }, actor)
        expect(particular.aplica_retencion).toBe(false)
        const fr = await crearCliente({ tipo: 'empresa', razon_social: 'Société SARL', nif: '12345678901', pais: 'FR' }, actor)
        expect([fr.nif, fr.tipo_id, fr.aplica_retencion]).toEqual(['FR12345678901', '02', false])
        expect((await buscarClientes('acme')).map(c => c.id)).toEqual([acme.id])
        expect((await buscarClientes('12345678z')).map(c => c.id)).toEqual([particular.id])
        await actualizarCliente(fr.id, { ...fr, activo: false }, actor)
        expect((await buscarClientes('Société')).length).toBe(0)

        // Borrador con cliente: F1, retención automática 7 %, líneas recalculadas en servidor
        const b = await guardarBorrador(null, {
          cliente_id: acme.id,
          lineas: [{ descripcion: 'Desarrollo', cantidad: '10', precio_unitario: '45,50', tipo_iva: '21' }, { descripcion: 'Hosting', cantidad: 1, precio_unitario: 20, descuento_pct: 10, tipo_iva: 21 }],
        }, actor)
        expect([b.tipo_factura, b.serie_codigo, fmt2(b.tipo_retencion), fmt2(b.base_imponible), fmt2(b.cuota_iva), fmt2(b.cuota_retencion), fmt2(b.liquido_a_cobrar)])
          .toEqual(['F1', 'F', '7.00', '473.00', '99.33', '33.11', '539.22'])
        expect(b.numero).toBeNull()
        expect(b.descripcion_operacion).toBe('Desarrollo')

        // Validaciones de líneas
        await falla(guardarBorrador(null, { cliente_id: acme.id, lineas: [] }, actor), 'SIN_LINEAS')
        await falla(guardarBorrador(null, { lineas: [{ descripcion: 'X', cantidad: 1, precio_unitario: 'abc', tipo_iva: 21 }] }, actor), 'DATOS_INVALIDOS')
        await falla(guardarBorrador(null, { lineas: [{ descripcion: 'X', cantidad: 1, precio_unitario: 10, tipo_iva: 0 }] }, actor), 'DATOS_INVALIDOS')
        await falla(guardarBorrador(null, { lineas: [{ descripcion: 'X', cantidad: 1, precio_unitario: 10, tipo_iva: 7 }] }, actor), 'DATOS_INVALIDOS')

        // Edición: fecha de operación anterior y retención manual 0
        const b2 = await guardarBorrador(b.id, { cliente_id: acme.id, tipo_retencion: '0', fecha_operacion: '2026-09-15', lineas: [{ descripcion: 'Desarrollo septiembre', cantidad: 1, precio_unitario: 1000, tipo_iva: 21 }] }, actor)
        expect([fmt2(b2.importe_total), fmt2(b2.cuota_retencion), b2.fecha_operacion?.toISOString().slice(0, 10)]).toEqual(['1210.00', '0.00', '2026-09-15'])
        expect(await tx.fac_lineas.count({ where: { factura_id: b.id } })).toBe(1)

        // Sin cliente → F2 con destinatario opcional; exenta y no sujeta
        const s = await guardarBorrador(null, { destinatario_simplificada: { razon_social: 'Juan' }, lineas: [
          { descripcion: 'Curso', cantidad: 1, precio_unitario: 50, tipo_iva: 0, operacion_exenta: 'E1' },
          { descripcion: 'Soporte', cantidad: 1, precio_unitario: 10, tipo_iva: 21 },
        ] }, actor)
        expect([s.tipo_factura, s.serie_codigo, (s.cliente_snapshot as any).razon_social, fmt2(s.importe_total)]).toEqual(['F2', 'S', 'Juan', '62.10'])

        // Emitir y comprobar que la fecha de operación (anterior) se conserva
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T' } })
        const emitida = await emitirEnTx(tx, b.id, actor, { ahora: new Date('2026-10-05T10:00:00Z') })
        expect(emitida.fecha_operacion?.toISOString().slice(0, 10)).toBe('2026-09-15')
        await falla(guardarBorrador(b.id, { cliente_id: acme.id, lineas: [{ descripcion: 'X', cantidad: 1, precio_unitario: 1, tipo_iva: 21 }] }, actor), 'ESTADO_INVALIDO')
        await falla(eliminarBorrador(b.id, actor), 'ESTADO_INVALIDO')

        // Duplicar una emitida → borrador nuevo sin número ni fecha de operación
        const dup = await duplicarFactura(b.id, actor)
        expect([dup.estado, dup.numero, fmt2(dup.importe_total), dup.cliente_id]).toEqual(['borrador', null, '1210.00', acme.id])
        await eliminarBorrador(dup.id, actor)
        expect(await tx.fac_facturas.findUnique({ where: { id: dup.id } })).toBeNull()

        // Detalle con registros y eventos
        const det = await detalleFactura(b.id)
        expect(det.fac_registros_verifactu).toHaveLength(1)
        expect(det.eventos.map((e: any) => e.accion)).toEqual(expect.arrayContaining(['borrador.creado', 'borrador.actualizado', 'factura.estado']))

        // Gastos: cálculo, NIF de proveedor, cuota manual
        await falla(guardarGasto(null, { proveedor: 'X', fecha: '2026-10-02', proveedor_nif: '12345678A', base_imponible: '10' }, null, actor), 'DATOS_INVALIDOS')
        const g = await guardarGasto(null, { proveedor: 'Hetzner', proveedor_pais: 'DE', proveedor_nif: 'DE123', fecha: '2026-10-02', base_imponible: '100', tipo_iva: '21', categoria: 'hosting' }, null, actor)
        expect([fmt2(g.cuota_iva), fmt2(g.total), g.proveedor_nif]).toEqual(['21.00', '121.00', 'DE123'])
        const g2 = await guardarGasto(null, { proveedor: 'Gestoría', proveedor_nif: 'B12345674', fecha: '2026-10-03', base_imponible: '200', tipo_iva: '21', tipo_retencion: '15', deducible_pct: '50' }, null, actor)
        expect([fmt2(g2.cuota_retencion), fmt2(g2.total)]).toEqual(['30.00', '212.00'])
        const g3 = await guardarGasto(null, { proveedor: 'Tienda', fecha: '2026-10-04', base_imponible: '100', cuota_iva: '15.50' }, null, actor)
        expect(fmt2(g3.cuota_iva)).toBe('15.50')

        // Dashboard del 4T 2026: facturado 1000, IVA rep. 210, IVA sop. 21 + 42·50 % + 15,50
        const r = await resumenDashboard(periodoActual('2026-10-05'))
        expect(r.periodo).toMatchObject({ anio: 2026, trimestre: 4, desde: '2026-10-01', hasta: '2026-12-31' })
        expect([r.facturado.trimestre, r.ivaRepercutido.trimestre, r.ivaSoportado.trimestre, r.pendienteCobro.importe, r.pendienteCobro.facturas])
          .toEqual(['1000.00', '210.00', '57.50', '1210.00', 1])
        expect(r.gastosDeducibles.trimestre).toBe('300.00') // 100 + 200·50 % + 100
        expect(r.borradores).toBe(1) // la simplificada
        expect(await cobrosSinFactura()).toEqual([])

        await eliminarGasto(g3.id, actor)
        const evs = await tx.fac_eventos.findMany({ where: { usuario: 'test@vitest' } })
        expect(evs.map((e: any) => e.accion)).toEqual(expect.arrayContaining(['cliente.creado', 'cliente.actualizado', 'gasto.creado', 'gasto.eliminado', 'factura.duplicada', 'borrador.eliminado']))
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    }, { timeout: 60_000 })).rejects.toBeInstanceOf(Rollback)

    expect(await real.fac_eventos.count()).toBe(eventosAntes)
    expect(await real.fac_clientes.count()).toBe(clientesAntes)
    expect(await real.fac_gastos.count()).toBe(gastosAntes)
  })
})
