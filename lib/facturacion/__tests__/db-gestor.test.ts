import { describe, it, expect, vi, afterAll } from 'vitest'

// Documento para la gestoría y enlaces de solo lectura, contra la BD en una transacción revertida.

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
import { documentoGestor, crearEnlace, revocarEnlace, accederConToken, DIAS_ENLACE } from '../gestor'
import { generarPdfGestor } from '../pdf/gestor'

const DB = process.env.FAC_DB_TESTS === '1'
const actor = { usuario: 'test@vitest' }
const real = (prisma as any).__real
class Rollback extends Error {}

describe.skipIf(!DB)('documento y enlaces de la gestoría (revertido)', () => {
  afterAll(() => real.$disconnect())

  it('contenido desde datos reales, token nunca guardado, accesos registrados', async () => {
    const eventosAntes = await real.fac_eventos.count()
    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        // El contenido sigue a los ajustes y a las dudas de la BD
        await tx.fac_ajustes.update({ where: { id: 1 }, data: { retencion_en_cobros_online: false, limite_simplificada: 400, nombre_comercial: 'innovapp' } })
        const d1 = await documentoGestor()
        const ret = (d: any) => d.criterios.find((c: any) => c.tema.startsWith('Retención en cobros online')).aplicado
        expect(ret(d1)).toMatch(/^Sin retención/)
        expect(d1.criterios.find(c => c.tema === 'Factura simplificada')!.aplicado).toContain('400,00 €')
        expect(d1.criterios.find(c => c.tema === 'Actividad en los libros')!.aplicado).toContain('Código A, tipo 05')
        expect(d1.criterios.find(c => c.tema === 'Concepto de gasto')!.aplicado).toContain('G19: asesoría y gestoría')
        expect(d1.dudas.length).toBe(await tx.fac_dudas_gestor.count())
        expect(d1.verifactu.pendientes.find(p => p.texto.startsWith('Desarrollo del XML'))!.hecho).toBe(false)

        await tx.fac_ajustes.update({ where: { id: 1 }, data: { retencion_en_cobros_online: true, retencion_defecto: 15, limite_simplificada: 300 } })
        const primera = await tx.fac_dudas_gestor.findFirst({ where: { estado: 'abierta' }, orderBy: { orden: 'asc' } })
        await tx.fac_dudas_gestor.update({ where: { id: primera.id }, data: { estado: 'resuelta', respuesta: 'Sí, alta en el ROI.' } })
        const d2 = await documentoGestor()
        expect(ret(d2)).toBe('Se aplica el 15 % a empresas y autónomos residentes en España.')
        expect(d2.criterios.find(c => c.tema === 'Factura simplificada')!.aplicado).toContain('300,00 €')
        expect(d2.dudas.find(d => d.id === primera.id)).toMatchObject({ estado: 'resuelta', respuesta: 'Sí, alta en el ROI.' })
        expect(d2.lead).toMatch(new RegExp(`Quedan ${d1.dudas.filter(d => d.estado === 'abierta').length - 1} duda`))

        // PDF
        const pdf = await generarPdfGestor(d2)
        expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')

        // Enlace: el token solo se devuelve al crear; en BD, su hash
        const { id, token, expira_at } = await crearEnlace(actor, 'Gestoría de prueba')
        expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
        expect(Math.round((expira_at.getTime() - Date.now()) / 86_400_000)).toBe(DIAS_ENLACE)
        const fila = await tx.fac_enlaces_gestor.findUnique({ where: { id } })
        expect(JSON.stringify(fila)).not.toContain(token)
        expect([fila.token_sufijo, fila.token_sha256.length]).toEqual([token.slice(-6), 64])

        // Accesos: válido (cuenta y registra), manipulado, desconocido
        expect((await accederConToken(token, '1.2.3.4', 'Mozilla/5.0'))?.id).toBe(id)
        expect((await accederConToken(token, '1.2.3.4', 'Mozilla/5.0'))?.id).toBe(id)
        expect((await tx.fac_enlaces_gestor.findUnique({ where: { id } })).accesos).toBe(2)
        expect(await accederConToken(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A'), '5.6.7.8', null)).toBeNull()
        expect(await accederConToken('../../etc/passwd', '5.6.7.8', null)).toBeNull()

        // Revocado y caducado
        await revocarEnlace(id, actor)
        expect(await accederConToken(token, '1.2.3.4', null)).toBeNull()
        const otro = await crearEnlace(actor)
        await tx.fac_enlaces_gestor.update({ where: { id: otro.id }, data: { created_at: new Date(Date.now() - 40 * 86_400_000), expira_at: new Date(Date.now() - 1000) } })
        expect(await accederConToken(otro.token, '1.2.3.4', null)).toBeNull()

        const evs = await tx.fac_eventos.findMany({ where: { entidad: 'gestor' }, orderBy: { id: 'asc' } })
        const acciones = evs.map((e: any) => `${e.accion}${e.payload?.motivo ? ':' + e.payload.motivo : ''}`)
        expect(acciones).toEqual(expect.arrayContaining(['gestor.enlace_creado', 'gestor.acceso', 'gestor.acceso_denegado:desconocido', 'gestor.enlace_revocado', 'gestor.acceso_denegado:revocado', 'gestor.acceso_denegado:caducado']))
        const acceso = evs.find((e: any) => e.accion === 'gestor.acceso')
        expect([acceso.ip, acceso.usuario, acceso.payload.user_agent]).toEqual(['1.2.3.4', 'gestoría (enlace)', 'Mozilla/5.0'])
        expect(JSON.stringify(evs, (_k, v) => (typeof v === 'bigint' ? String(v) : v))).not.toContain(token) // el token completo no aparece en el log
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    }, { timeout: 60_000 })).rejects.toBeInstanceOf(Rollback)
    expect(await real.fac_eventos.count()).toBe(eventosAntes)
  })
})
