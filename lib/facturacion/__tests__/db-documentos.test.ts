import fs from 'fs'
import { describe, it, expect, vi, afterAll, beforeEach } from 'vitest'

// PDF definitivo, vista previa y envío por email contra la BD, en una transacción revertida
// (mismo proxy que db-admin.test.ts). Resend se sustituye por un doble; los PDFs se
// escriben en FAC_STORAGE_ROOT temporal (vitest.config.ts). Solo con FAC_DB_TESTS=1.

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

const enviados: any[] = []
let fallarResend = false
vi.mock('../../email', () => ({
  sendFacturaEmail: async (m: any) => {
    if (fallarResend) throw new Error('Resend: validation_error — dominio no verificado')
    enviados.push(m)
    return 're_test_123'
  },
}))

import { prisma } from '../../prisma'
import { STORAGE_ROOT, rutaAbsoluta } from '../storage'
import { guardarBorrador } from '../borradores'
import { crearCliente } from '../clientes'
import { emitirEnTx } from '../emision'
import { asegurarPdf, leerPdf, pdfVistaPrevia } from '../documentos'
import { enviarFactura } from '../envio'
import { FacturacionError } from '../errores'

const DB = process.env.FAC_DB_TESTS === '1'
const actor = { usuario: 'test@vitest' }
const real = (prisma as any).__real
class Rollback extends Error {}
const falla = (p: Promise<unknown>, code: string) => expect(p).rejects.toSatisfy((e: unknown) => e instanceof FacturacionError && e.code === code)

describe.skipIf(!DB)('PDF y envío de facturas (revertido)', () => {
  beforeEach(() => fs.rmSync(STORAGE_ROOT, { recursive: true, force: true }))
  afterAll(async () => { fs.rmSync(STORAGE_ROOT, { recursive: true, force: true }); await real.$disconnect() })

  it('los tests nunca usan el almacenamiento real', () => {
    expect(STORAGE_ROOT).not.toContain('/var/www/innovapp/storage')
  })

  it('vista previa, PDF definitivo inmutable, envío y errores de Resend', async () => {
    const eventosAntes = await real.fac_eventos.count()
    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { nif: '00000000T', email: 'yo@innovapp.es', iban: 'ES91 2100 0418 4502 0005 1332' } })
        const cli = await crearCliente({ tipo: 'empresa', razon_social: 'ACME SL', nif: 'B12345674', direccion: 'C/ Uno 1', cp: '33001', municipio: 'Oviedo', email: 'facturas@acme.test' }, actor)
        const b = await guardarBorrador(null, { cliente_id: cli.id, lineas: [{ descripcion: 'Desarrollo', cantidad: 10, precio_unitario: 50, tipo_iva: 21 }] }, actor)

        // Borrador: vista previa sí (no se guarda), PDF definitivo no
        const vista = await pdfVistaPrevia(b.id)
        expect(vista.subarray(0, 5).toString()).toBe('%PDF-')
        await falla(asegurarPdf(b.id), 'ESTADO_INVALIDO')
        expect(fs.existsSync(STORAGE_ROOT)).toBe(false)

        // Emitida: el PDF se genera una vez, se guarda y pdf_path queda fijado
        const f = await emitirEnTx(tx, b.id, actor, { ahora: new Date('2026-10-01T09:00:00Z') })
        await falla(enviarFactura(f.id, { to: 'no-es-un-email' }, actor), 'DATOS_INVALIDOS')
        const ruta = await asegurarPdf(f.id)
        expect(ruta).toBe(`facturas/2026/${f.num_serie_factura}.pdf`)
        expect((await tx.fac_facturas.findUnique({ where: { id: f.id } })).pdf_path).toBe(ruta)
        const mtime = fs.statSync(rutaAbsoluta(ruta)).mtimeMs
        expect(await asegurarPdf(f.id)).toBe(ruta)                       // idempotente
        expect(fs.statSync(rutaAbsoluta(ruta)).mtimeMs).toBe(mtime)       // no se reescribe
        const { nombre, datos } = await leerPdf(f.id)
        expect([nombre, datos.subarray(0, 5).toString()]).toEqual([`${f.num_serie_factura}.pdf`, '%PDF-'])

        // Descargar el PDF no la marca como entregada
        expect((await tx.fac_facturas.findUnique({ where: { id: f.id } })).entregada_at).toBeNull()

        // Error de Resend: se registra, NO se marca entregada, y se puede anular todavía
        fallarResend = true
        await falla(enviarFactura(f.id, {}, actor), 'DATOS_INVALIDOS')
        expect((await tx.fac_facturas.findUnique({ where: { id: f.id } })).entregada_at).toBeNull()
        fallarResend = false

        // Envío correcto al email del cliente, con PDF adjunto y copia oculta
        const r = await enviarFactura(f.id, { mensaje: 'Gracias <b>de verdad</b>', copia: true }, actor)
        expect(r).toMatchObject({ ok: true, to: 'facturas@acme.test', resendId: 're_test_123' })
        const m = enviados.at(-1)
        expect([m.to, m.bcc, m.replyTo, m.adjunto.nombre]).toEqual(['facturas@acme.test', 'yo@innovapp.es', 'yo@innovapp.es', `${f.num_serie_factura}.pdf`])
        expect(m.asunto).toContain(f.num_serie_factura)
        expect(m.html).toContain('Gracias &lt;b&gt;de verdad&lt;/b&gt;')  // mensaje escapado
        expect(m.html).toContain('ES91 2100 0418 4502 0005 1332')
        const tras = await tx.fac_facturas.findUnique({ where: { id: f.id } })
        expect([tras.entregada_via, !!tras.entregada_at]).toEqual(['email', true])

        const acciones = (await tx.fac_eventos.findMany({ where: { entidad_id: f.id }, orderBy: { id: 'asc' } })).map((e: any) => e.accion)
        expect(acciones).toEqual(expect.arrayContaining(['factura.email_error', 'factura.email_enviado', 'factura.entregada']))
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    }, { timeout: 60_000 })).rejects.toBeInstanceOf(Rollback)
    expect(await real.fac_eventos.count()).toBe(eventosAntes)
  })
})
