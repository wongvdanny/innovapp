import fs from 'fs'
import { describe, it, expect, vi, afterAll } from 'vitest'

// Cobros online → factura, recurrentes y recordatorios, contra la BD dentro de una
// transacción revertida (mismo proxy que db-admin). Resend es un doble. FAC_DB_TESTS=1.

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
const correos: any[] = []
vi.mock('../../email', () => ({ sendFacturaEmail: async (m: any) => { correos.push(m); return `re_${correos.length}` } }))

import { prisma } from '../../prisma'
import { STORAGE_ROOT } from '../storage'
import { facturarCobro, reintentarCobrosPendientes, conciliarCobro } from '../pagos'
import { cobrosSinFactura } from '../dashboard'
import { guardarBorrador } from '../borradores'
import { emitirEnTx } from '../emision'
import { proximaFecha, mesSiguiente, sustituirPeriodo, guardarRecurrente, procesarRecurrentes } from '../recurrentes'
import { enviarRecordatorios } from '../recordatorios'
import { fmt2 } from '../decimal'

const DB = process.env.FAC_DB_TESTS === '1'
const actor = { usuario: 'test@vitest' }
const real = (prisma as any).__real
class Rollback extends Error {}
const OCT1 = new Date('2026-10-01T10:00:00Z')

describe('recurrentes: fechas', () => {
  it('próxima fecha y mes siguiente', () => {
    expect(proximaFecha(1, '2026-09-30')).toBe('2026-10-01')
    expect(proximaFecha(15, '2026-10-15')).toBe('2026-10-15')
    expect(proximaFecha(5, '2026-12-20')).toBe('2027-01-05')
    expect(mesSiguiente('2026-12-05', 5)).toBe('2027-01-05')
    expect(mesSiguiente('2026-01-28', 28)).toBe('2026-02-28')
    expect(sustituirPeriodo('Iguala {mes} {año}', '2026-11-01')).toBe('Iguala noviembre 2026')
  })
})

describe.skipIf(!DB)('automatizaciones contra la BD (revertido)', () => {
  afterAll(async () => { fs.rmSync(STORAGE_ROOT, { recursive: true, force: true }); await real.$disconnect() })

  it('cobros online, recurrentes y recordatorios', async () => {
    const eventosAntes = await real.fac_eventos.count()
    const facturasAntes = await real.fac_facturas.count()
    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        const plan = await tx.plan.findFirstOrThrow({ where: { price: 49 }, include: { Product: true } })
        let n = 0
        const cobro = async (importe: number, billing: any, provider = 'stripe', paidAt = OCT1) => {
          n++
          const user = await tx.user.create({ data: { name: `Cliente Prueba ${n}`, email: `prueba${n}@vitest.test`, password: 'x' } })
          const sub = await tx.subscription.create({ data: { userId: user.id, planId: plan.id, productId: plan.productId, status: 'active', startDate: OCT1, endDate: new Date('2026-11-01T10:00:00Z'), billingData: JSON.stringify(billing) } })
          return tx.invoice.create({ data: { userId: user.id, subscriptionId: sub.id, amount: importe, status: 'paid', paidAt, provider, providerRef: `ref_${n}` } })
        }
        const completo = { company: 'ACME SL', nif: 'B12345674', address: 'C/ Uno 1', city: 'Oviedo', zip: '33001', country: 'España' }
        const sinNif = { address: 'C/ Dos 2', city: 'Gijón', zip: '33201', country: 'España' }

        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T', email: 'yo@innovapp.es' } })
        await tx.stripeConfig.updateMany({ data: { environment: 'test' } })

        // Pasarela en modo pruebas → nunca se factura
        const iTest = await cobro(49, completo)
        expect(await facturarCobro(iTest.id, actor, { ahora: OCT1 })).toMatchObject({ estado: 'omitida', motivo: 'pasarela stripe en modo pruebas' })
        await tx.stripeConfig.updateMany({ data: { environment: 'production' } })
        await tx.redsysConfig.updateMany({ data: { environment: 'production' } })
        await tx.invoice.delete({ where: { id: iTest.id } })

        // Cobro anterior al inicio de actividad → omitido
        const iAntes = await cobro(49, completo, 'stripe', new Date('2026-09-30T10:00:00Z'))
        expect((await facturarCobro(iAntes.id, actor, { ahora: OCT1 })).estado).toBe('omitida')

        // Empresa con CIF y dirección → F1 emitida, pagada, 49,00 € exactos, sin retención, enviada
        const i1 = await cobro(49, completo)
        const r1: any = await facturarCobro(i1.id, actor, { ahora: OCT1 })
        expect(r1).toMatchObject({ estado: 'emitida' })
        const f1 = await tx.fac_facturas.findUnique({ where: { id: r1.facturaId }, include: { fac_lineas: true, fac_clientes: true } })
        expect([f1.tipo_factura, f1.estado, f1.metodo_pago, f1.origen, f1.pago_ref, fmt2(f1.importe_total), fmt2(f1.base_imponible), fmt2(f1.cuota_iva), fmt2(f1.cuota_retencion)])
          .toEqual(['F1', 'pagada', 'stripe', 'stripe', `stripe:ref_${n}`, '49.00', '40.50', '8.50', '0.00'])
        expect(f1.fecha_pago.toISOString().slice(0, 10)).toBe('2026-10-01')
        expect([f1.fac_clientes.nif, f1.fac_clientes.tipo, f1.fac_clientes.user_id, f1.fac_clientes.email]).toEqual(['B12345674', 'empresa', i1.userId, `prueba${n}@vitest.test`])
        expect(f1.fac_lineas[0].descripcion).toContain(plan.name)
        expect(correos.at(-1)).toMatchObject({ to: f1.fac_clientes.email })
        expect(f1.entregada_via).toBe('email')

        // Idempotente: webhook repetido
        const regs = await tx.fac_registros_verifactu.count()
        expect(await facturarCobro(i1.id, actor, { ahora: OCT1 })).toEqual({ estado: 'existente', facturaId: r1.facturaId })
        expect(await tx.fac_registros_verifactu.count()).toBe(regs)

        // Particular sin NIF, 99 € (Redsys) → simplificada F2 en serie S
        const i2 = await cobro(99, sinNif, 'redsys')
        const r2: any = await facturarCobro(i2.id, actor, { ahora: OCT1 })
        const f2 = await tx.fac_facturas.findUnique({ where: { id: r2.facturaId } })
        expect([f2.tipo_factura, f2.serie_codigo, f2.cliente_id, f2.metodo_pago, fmt2(f2.importe_total)]).toEqual(['F2', 'S', null, 'redsys', '99.00'])
        expect((f2.cliente_snapshot as any).razon_social).toBe(`Cliente Prueba ${n}`)

        // Particular sin NIF, 490 € → bloqueada; reintentar sin cambios no genera ruido
        const i3 = await cobro(490, sinNif)
        const r3: any = await facturarCobro(i3.id, actor, { ahora: OCT1 })
        expect(r3.estado).toBe('bloqueada')
        expect(r3.motivo).toMatch(/Faltan el NIF.*400,00|400\.00/)
        const evs3 = await tx.fac_eventos.count()
        expect(await facturarCobro(i3.id, actor, { ahora: OCT1 })).toMatchObject({ estado: 'bloqueada', facturaId: r3.facturaId })
        expect(await tx.fac_eventos.count()).toBe(evs3)
        expect((await cobrosSinFactura()).map((x: any) => x.invoice_id)).toContain(i3.id)

        // El admin completa el NIF del cliente → el reintento del cron la emite y quita el bloqueo
        const cli3 = await tx.fac_clientes.findFirst({ where: { user_id: i3.userId } })
        await tx.fac_clientes.update({ where: { id: cli3.id }, data: { nif: '12345678Z' } })
        const reint = await reintentarCobrosPendientes(actor, { ahora: OCT1 })
        expect(reint.find(x => x.invoiceId === i3.id)).toMatchObject({ estado: 'emitida' })
        expect(await tx.fac_facturas.findUnique({ where: { id: r3.facturaId } })).toBeNull()
        expect((await cobrosSinFactura()).map((x: any) => x.invoice_id)).not.toContain(i3.id)

        // Cliente fuera de España, 29,99 € → bloqueada; editar el borrador conserva el total cobrado
        const i4 = await cobro(29.99, { ...sinNif, country: 'México' })
        const r4: any = await facturarCobro(i4.id, actor, { ahora: OCT1 })
        expect(r4.motivo).toMatch(/fuera de España \(MX\)/)
        const b4 = await tx.fac_facturas.findUnique({ where: { id: r4.facturaId }, include: { fac_lineas: true } })
        expect([fmt2(b4.fac_lineas[0].base), fmt2(b4.fac_lineas[0].cuota)]).toEqual(['24.79', '5.20'])
        const l = b4.fac_lineas[0]
        const cliES = await tx.fac_clientes.create({ data: { tipo: 'particular', razon_social: 'Resuelto', nif: '12345678Z', direccion: 'C/ Tres', pais: 'ES' } })
        const g4 = await guardarBorrador(b4.id, { cliente_id: cliES.id, tipo_retencion: '0', lineas: [{ descripcion: l.descripcion, cantidad: '1', precio_unitario: l.precio_unitario.toString(), tipo_iva: '21' }] }, actor)
        expect(fmt2(g4.importe_total)).toBe('29.99') // sin recalcular: 24,79 + 5,21 daría 30,00
        // Emisión manual + conciliación automática con el cobro
        await emitirEnTx(tx, b4.id, actor, { ahora: OCT1 })
        const c4 = await conciliarCobro(b4.id, actor)
        expect([c4?.estado, c4?.metodo_pago]).toEqual(['pagada', 'stripe'])

        // Emisor incompleto → bloqueada con ese motivo
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '' } })
        const i5 = await cobro(49, completo)
        expect((await facturarCobro(i5.id, actor, { ahora: OCT1 }) as any).motivo).toMatch(/faltan datos del emisor/)
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T' } })

        // Recurrente con 3 meses de retraso → se pone al día sin duplicar
        const cliRec = await tx.fac_clientes.create({ data: { tipo: 'empresa', razon_social: 'Iguala SL', nif: 'B12345674', direccion: 'C/ Cuatro', email: 'iguala@vitest.test', pais: 'ES', aplica_retencion: true } })
        const rec = await guardarRecurrente(null, { cliente_id: cliRec.id, descripcion: 'Iguala mensual', dia_mes: 1, proxima_fecha: '2026-10-01',
          lineas: [{ descripcion: 'Soporte {mes} {año}', cantidad: 1, precio_unitario: 300, tipo_iva: 21 }] }, actor)
        const antesCorreos = correos.length
        const gen = await procesarRecurrentes(actor, new Date('2026-12-15T10:00:00Z'))
        expect(gen.map(g => [g.periodo, g.estado])).toEqual([['2026-10-01', 'emitida'], ['2026-11-01', 'emitida'], ['2026-12-01', 'emitida']])
        expect(await procesarRecurrentes(actor, new Date('2026-12-15T11:00:00Z'))).toEqual([]) // segunda ejecución: nada
        const facsRec = await tx.fac_facturas.findMany({ where: { recurrente_id: rec.id }, include: { fac_lineas: true }, orderBy: { numero: 'asc' } })
        expect(facsRec.map((f: any) => f.fac_lineas[0].descripcion)).toEqual(['Soporte octubre 2026', 'Soporte noviembre 2026', 'Soporte diciembre 2026'])
        expect(facsRec.map((f: any) => fmt2(f.cuota_retencion))).toEqual(['21.00', '21.00', '21.00']) // 7 % de 300
        expect(correos.length - antesCorreos).toBe(3)
        expect((await tx.fac_recurrentes.findUnique({ where: { id: rec.id } })).proxima_fecha.toISOString().slice(0, 10)).toBe('2027-01-01')

        // Recordatorios: vencidas no pagadas, cada 7 días, máximo 3; las pagadas nunca
        await tx.fac_facturas.updateMany({ where: { recurrente_id: rec.id }, data: { recordatorios_enviados: 3 } }) // aislar el caso
        const bRec = await guardarBorrador(null, { cliente_id: cliRec.id, lineas: [{ descripcion: 'Proyecto', cantidad: 1, precio_unitario: 100, tipo_iva: 21 }] }, actor)
        const fv = await emitirEnTx(tx, bRec.id, actor, { ahora: new Date('2026-12-15T12:00:00Z') }) // vence el 30/12
        const rec1 = await enviarRecordatorios(actor, new Date('2027-01-05T10:00:00Z'))
        expect(rec1.map(x => [x.numero, x.ok])).toEqual([[fv.num_serie_factura, true]])
        expect(correos.at(-1).asunto).toBe(`Recordatorio: factura ${fv.num_serie_factura} vencida el 30/12/2026`)
        expect(await enviarRecordatorios(actor, new Date('2027-01-08T10:00:00Z'))).toEqual([])      // aún no toca
        expect((await enviarRecordatorios(actor, new Date('2027-01-12T10:00:00Z'))).length).toBe(1)
        expect((await enviarRecordatorios(actor, new Date('2027-01-20T10:00:00Z'))).length).toBe(1)
        expect(await enviarRecordatorios(actor, new Date('2027-02-01T10:00:00Z'))).toEqual([])      // máximo alcanzado
        expect((await tx.fac_facturas.findUnique({ where: { id: fv.id } })).recordatorios_enviados).toBe(3)
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    }, { timeout: 120_000 })).rejects.toBeInstanceOf(Rollback)
    expect(await real.fac_eventos.count()).toBe(eventosAntes)
    expect(await real.fac_facturas.count()).toBe(facturasAntes)
  })
})
