import { describe, it, expect, afterAll } from 'vitest'
import { prisma } from '../../prisma'
import { siguienteNumero } from '../numeracion'
import { emitirEnTx, anularEnTx, marcarEntregadaEnTx, marcarPagadaEnTx } from '../emision'
import { crearRectificativaEnTx } from '../rectificativas'
import { calcularLinea } from '../calculos'
import { fmt2 } from '../decimal'
import { verificarRegistros, verificarIntegridad, RegistroCadena } from '../verifactu/integridad'
import { FacturacionError } from '../errores'

// Tests contra innovapp_db. Solo se ejecutan con FAC_DB_TESTS=1.
// Todo el flujo de facturas va dentro de una transacción que se revierte al final:
// las facturas emitidas son inmutables y no deben quedar en la BD.

const DB = process.env.FAC_DB_TESTS === '1'
const ANIO_TEST = 2099
const actor = { usuario: 'test@vitest' }
class Rollback extends Error {}

async function esperarError(p: Promise<unknown>, code: string) {
  await expect(p).rejects.toSatisfy((e: unknown) => e instanceof FacturacionError && e.code === code)
}

describe.skipIf(!DB)('facturación contra la BD', () => {
  afterAll(async () => {
    await prisma.fac_series.deleteMany({ where: { anio: ANIO_TEST } })
    await prisma.$disconnect()
  })

  it('numeración: 25 emisiones concurrentes → 1..25 sin huecos ni duplicados', async () => {
    const nums = await Promise.all(Array.from({ length: 25 }, () =>
      prisma.$transaction(tx => siguienteNumero(tx, 'F', ANIO_TEST), { timeout: 30_000, maxWait: 30_000 })))
    expect(nums.map(n => n.numero).sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
    expect(new Set(nums.map(n => n.num_serie_factura)).size).toBe(25)
  })

  it('numeración: una transacción fallida no consume número', async () => {
    await expect(prisma.$transaction(async tx => {
      await siguienteNumero(tx, 'F', ANIO_TEST)
      throw new Rollback()
    })).rejects.toBeInstanceOf(Rollback)
    const n = await prisma.$transaction(tx => siguienteNumero(tx, 'F', ANIO_TEST))
    expect(n.num_serie_factura).toBe(`F${ANIO_TEST}-0026`)
  })

  it('flujo completo: emitir, rectificar, anular, cadena íntegra (revertido)', async () => {
    const ahora = new Date('2026-10-01T09:00:00Z')
    const antes = await prisma.fac_registros_verifactu.count()

    await expect(prisma.$transaction(async tx => {
      const linea = (desc: string, precio: number) => {
        const c = calcularLinea({ cantidad: 1, precio_unitario: precio, tipo_iva: 21 })
        return { descripcion: desc, cantidad: 1, precio_unitario: precio, tipo_iva: 21, base: fmt2(c.base), cuota: fmt2(c.cuota) }
      }
      const borrador = (tipo: string, clienteId: string | null, lineas: any[], extra: any = {}) =>
        tx.fac_facturas.create({ data: { serie_codigo: tipo === 'F2' ? 'S' : 'F', tipo_factura: tipo, cliente_id: clienteId, fac_lineas: { create: lineas }, ...extra } })

      const cliente = await tx.fac_clientes.create({
        data: { tipo: 'empresa', razon_social: 'ACME Test SL', nif: 'B12345674', direccion: 'Calle Test 1', cp: '33001', municipio: 'Oviedo', aplica_retencion: true },
      })

      // Emisor incompleto (NIF vacío en ajustes) → bloqueado
      const b0 = await borrador('F1', cliente.id, [linea('Desarrollo', 1000)])
      await esperarError(emitirEnTx(tx, b0.id, actor, { ahora }), 'EMISOR_INCOMPLETO')
      await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T' } })

      // Antes del inicio de actividad → bloqueado
      await esperarError(emitirEnTx(tx, b0.id, actor, { ahora: new Date('2026-09-30T12:00:00Z') }), 'ANTES_INICIO_ACTIVIDAD')

      // F1 con retención 7 %
      await tx.fac_facturas.update({ where: { id: b0.id }, data: { tipo_retencion: 7 } })
      const f1 = await emitirEnTx(tx, b0.id, actor, { ahora })
      expect(f1.num_serie_factura).toMatch(/^F2026-\d{4}$/)
      expect([f1.base_imponible, f1.cuota_iva, f1.importe_total, f1.cuota_retencion, f1.liquido_a_cobrar].map(fmt2))
        .toEqual(['1000.00', '210.00', '1210.00', '70.00', '1140.00'])
      expect((f1.emisor_snapshot as any).nif).toBe('00000000T')
      expect((f1.cliente_snapshot as any).razon_social).toBe('ACME Test SL')
      await esperarError(emitirEnTx(tx, b0.id, actor, { ahora }), 'ESTADO_INVALIDO')

      // Segunda F1: número correlativo
      const f2 = await emitirEnTx(tx, (await borrador('F1', cliente.id, [linea('Soporte', 100)])).id, actor, { ahora })
      expect(f2.numero).toBe(f1.numero! + 1)

      // F1 sin cliente → bloqueado · F2 por encima de 400 € → bloqueado (sin consumir número)
      await esperarError(emitirEnTx(tx, (await borrador('F1', null, [linea('X', 10)])).id, actor, { ahora }), 'CLIENTE_INCOMPLETO')
      await esperarError(emitirEnTx(tx, (await borrador('F2', null, [linea('Plan anual', 490)])).id, actor, { ahora }), 'SIMPLIFICADA_SUPERA_LIMITE')

      // F2 dentro del límite, sin cliente
      const s1 = await emitirEnTx(tx, (await borrador('F2', null, [linea('Plan mensual', 81.82)], { cliente_snapshot: { razon_social: 'Particular' } })).id, actor, { ahora })
      expect(s1.num_serie_factura).toMatch(/^S2026-\d{4}$/)

      // Entregada → no se puede anular; se rectifica por diferencias
      await marcarEntregadaEnTx(tx, f1.id, 'manual', actor)
      await esperarError(anularEnTx(tx, f1.id, 'error', actor, ahora), 'USAR_RECTIFICATIVA')
      const rb = await crearRectificativaEnTx(tx, f1.id, { tipo: 'I', motivo: 'Precio incorrecto' }, actor)
      const r1 = await emitirEnTx(tx, rb.id, actor, { ahora })
      expect(r1.num_serie_factura).toMatch(/^R2026-\d{4}$/)
      expect(r1.tipo_factura).toBe('R1')
      expect(fmt2(r1.importe_total)).toBe('-1210.00')
      expect(fmt2(r1.cuota_retencion)).toBe('-70.00')

      // Rectificativa por sustitución de una simplificada → R5 con importes rectificados
      const r5 = await emitirEnTx(tx, (await crearRectificativaEnTx(tx, s1.id, { tipo: 'S', motivo: 'Datos' }, actor)).id, actor, { ahora })
      expect(r5.tipo_factura).toBe('R5')
      expect(fmt2(r5.base_rectificada)).toBe('81.82')

      // Pagada → no se puede anular
      await marcarPagadaEnTx(tx, f2.id, { fecha: '2026-10-01', metodo: 'transferencia' }, actor)
      await esperarError(anularEnTx(tx, f2.id, 'error', actor, ahora), 'USAR_RECTIFICATIVA')

      // Emitida por error, sin entregar ni cobrar → anulación con registro
      const f3 = await emitirEnTx(tx, (await borrador('F1', cliente.id, [linea('Por error', 50)])).id, actor, { ahora })
      await esperarError(anularEnTx(tx, f3.id, '  ', actor, ahora), 'DATOS_INVALIDOS')
      const anulada = await anularEnTx(tx, f3.id, 'Emitida por error', actor, ahora)
      expect(anulada.estado).toBe('anulada')

      // Cadena íntegra y restricciones diferidas satisfechas
      const registros = await tx.fac_registros_verifactu.findMany({ orderBy: { id: 'asc' } })
      expect(registros.length - antes).toBe(7) // 6 altas + 1 anulación
      expect(registros.slice(-7).map(r => r.tipo_registro)).toEqual(['alta', 'alta', 'alta', 'alta', 'alta', 'alta', 'anulacion'])
      expect(verificarRegistros(registros as RegistroCadena[])).toEqual([])
      await tx.$executeRawUnsafe('SET CONSTRAINTS ALL IMMEDIATE')
      const integridad = await verificarIntegridad(tx)
      expect(integridad).toMatchObject({ ok: true, facturasEmitidas: 6, errores: [] })
      expect(integridad.ultimaHuella).toBe(registros.at(-1)!.huella)

      // Eventos: transiciones automáticas (trigger) + acciones
      const eventos = await tx.fac_eventos.findMany({ where: { usuario: 'test@vitest' } })
      const acciones = eventos.map(e => e.accion)
      expect(acciones.filter(a => a === 'factura.estado').length).toBe(8) // 6 emisiones + 1 pago + 1 anulación
      expect(acciones).toEqual(expect.arrayContaining(['factura.anulada', 'factura.entregada', 'factura.rectificativa_creada']))

      throw new Rollback()
    }, { timeout: 60_000 })).rejects.toBeInstanceOf(Rollback)

    // Nada ha quedado en la BD
    expect(await prisma.fac_registros_verifactu.count()).toBe(antes)
    expect(await prisma.fac_series.count({ where: { anio: 2026 } })).toBe(0)
    expect((await prisma.fac_ajustes.findUnique({ where: { id: 1 } }))!.nif).toBe('')
  })
})
