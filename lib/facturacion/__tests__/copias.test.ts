import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'

// Copias de seguridad: listado, validación de nombres, ZIP en streaming, tokens de un solo uso
// (sin BD) y reautenticación / límite por hora (BD, transacción revertida).

vi.mock('../../prisma', async () => {
  const real = (await vi.importActual<any>('../../prisma')).prisma
  let tx: any = null
  const prisma = new Proxy({}, {
    get(_t, k) {
      if (k === '__usar') return (c: any) => { tx = c }
      if (k === '__real') return real
      const c = tx ?? real
      const v = c[k]
      return typeof v === 'function' ? v.bind(c) : v
    },
  })
  return { prisma }
})

import { prisma } from '../../prisma'
import { DIR_BACKUPS, listarBackups, piezasDescarga, escribirZip, emitirToken, consumirToken, comprobarLimite, passwordCorrecta, nombreZip } from '../copias'
import { FacturacionError } from '../errores'

const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')
const falla = (fn: () => unknown, code: string) => expect(fn).toThrowError(expect.objectContaining({ code }))

describe('copias de seguridad (sin BD)', () => {
  const NUEVA = '20261005_033000', VIEJA = '20260930_170639'
  beforeAll(() => {
    expect(DIR_BACKUPS).not.toBe('/var/backups/innovapp') // nunca los backups reales
    fs.rmSync(DIR_BACKUPS, { recursive: true, force: true })
    const escribir = (rel: string, datos: Buffer | string) => { const p = path.join(DIR_BACKUPS, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, datos); return `${sha(datos)}  ${rel}` }
    const grande = Buffer.alloc(3 * 1024 * 1024, 7) // 3 MB
    const lineas = [
      escribir(`db/innovapp_db_${VIEJA}.dump`, 'PGDMP-vieja'),
      escribir(`storage/storage_facturacion_${VIEJA}.tar.gz`, 'tar-vieja'),
      escribir(`db/innovapp_db_${NUEVA}.dump`, grande),
      escribir(`fac/innovapp_fac_${NUEVA}.dump`, 'PGDMP-fac'),
      escribir(`storage/storage_facturacion_${NUEVA}.tar.gz`, 'tar-nueva'),
    ]
    fs.writeFileSync(path.join(DIR_BACKUPS, 'SHA256SUMS'), lineas.join('\n') + '\n')
    fs.writeFileSync(path.join(DIR_BACKUPS, 'db', 'basura.txt'), 'x')
  })
  afterAll(() => fs.rmSync(DIR_BACKUPS, { recursive: true, force: true }))

  it('lista por fecha descendente con tamaños y SHA256; las antiguas sin volcado de facturación', () => {
    const l = listarBackups()
    expect(l.map(b => b.ts)).toEqual([NUEVA, VIEJA])
    expect([l[0].completo?.bytes, l[0].facturacion?.sha256, l[0].fecha]).toEqual([3 * 1024 * 1024, sha('PGDMP-fac'), '2026-10-05T03:30:00'])
    expect(l[1].facturacion).toBeNull()
  })

  it('rechaza marcas y tipos manipulados (sin rutas del usuario)', () => {
    for (const ts of ['../../etc/passwd', '20261005_033000/../../x', '2026', '']) falla(() => piezasDescarga(ts, 'completo'), 'DATOS_INVALIDOS')
    falla(() => piezasDescarga(NUEVA, 'todo' as any), 'DATOS_INVALIDOS')
    falla(() => piezasDescarga('20250101_000000', 'completo'), 'NO_ENCONTRADA')
    falla(() => piezasDescarga(VIEJA, 'facturacion'), 'NO_ENCONTRADA')
  })

  it('ZIP en streaming con volcado, archivos, SHA256SUMS y LEEME', async () => {
    const tmp = path.join(DIR_BACKUPS, '..', `zip-${process.pid}.zip`)
    for (const [tipo, bd] of [['facturacion', `innovapp_fac_${NUEVA}.dump`], ['completo', `innovapp_db_${NUEVA}.dump`]] as const) {
      await escribirZip(NUEVA, tipo, fs.createWriteStream(tmp))
      const lista = execFileSync('unzip', ['-Z1', tmp], { encoding: 'utf8' }).trim().split('\n')
      expect(lista).toEqual([bd, `storage_facturacion_${NUEVA}.tar.gz`, 'SHA256SUMS', 'LEEME.txt'])
      const contenido = execFileSync('unzip', ['-p', tmp, bd], { maxBuffer: 16 * 1024 * 1024 })
      expect(sha(contenido)).toBe(listarBackups()[0][tipo]!.sha256)
      expect(execFileSync('unzip', ['-p', tmp, 'LEEME.txt'], { encoding: 'utf8' })).toContain('pg_restore')
    }
    fs.rmSync(tmp)
    expect(nombreZip(NUEVA, 'facturacion')).toBe(`innovapp-facturacion-${NUEVA}.zip`)
  })

  it('tokens de un solo uso, del mismo admin y con caducidad', () => {
    const t = emitirToken('a@x.es', NUEVA, 'facturacion')
    expect(t).toMatch(/^[0-9a-f]{64}$/)
    falla(() => consumirToken(t, 'otro@x.es'), 'DATOS_INVALIDOS')          // otro admin: y queda invalidado
    falla(() => consumirToken(t, 'a@x.es'), 'DATOS_INVALIDOS')
    const t2 = emitirToken('a@x.es', NUEVA, 'completo')
    expect(consumirToken(t2, 'a@x.es')).toMatchObject({ ts: NUEVA, tipo: 'completo' })
    falla(() => consumirToken(t2, 'a@x.es'), 'DATOS_INVALIDOS')            // segundo uso
    vi.useFakeTimers()
    const t3 = emitirToken('a@x.es', NUEVA, 'completo')
    vi.advanceTimersByTime(2 * 60_000 + 1)
    falla(() => consumirToken(t3, 'a@x.es'), 'DATOS_INVALIDOS')            // caducado
    vi.useRealTimers()
  })
})

const DB = process.env.FAC_DB_TESTS === '1'
class Rollback extends Error {}

describe.skipIf(!DB)('reautenticación y límite por hora (BD, revertido)', () => {
  const real = (prisma as any).__real
  afterAll(() => real.$disconnect())

  it('contraseña de admin, 5 descargas/hora y 5 fallos/hora', async () => {
    await expect(real.$transaction(async (tx: any) => {
      ;(prisma as any).__usar(tx)
      try {
        await tx.user.create({ data: { name: 'Admin', email: 'admin@vitest.test', password: await bcrypt.hash('secreta', 4), role: 'admin' } })
        await tx.user.create({ data: { name: 'Cliente', email: 'cliente@vitest.test', password: await bcrypt.hash('secreta', 4) } })
        expect(await passwordCorrecta('admin@vitest.test', 'secreta')).toBe(true)
        expect(await passwordCorrecta('admin@vitest.test', 'mala')).toBe(false)
        expect(await passwordCorrecta('admin@vitest.test', '')).toBe(false)
        expect(await passwordCorrecta('cliente@vitest.test', 'secreta')).toBe(false) // no admin
        expect(await passwordCorrecta('nadie@vitest.test', 'secreta')).toBe(false)

        const ev = (accion: string, usuario = 'admin@vitest.test') => tx.fac_eventos.create({ data: { usuario, accion, entidad: 'copia' } })
        expect(await comprobarLimite('admin@vitest.test')).toEqual({ restantes: 5 })
        for (let i = 0; i < 4; i++) await ev('copia.descargada')
        expect(await comprobarLimite('admin@vitest.test')).toEqual({ restantes: 1 })
        await ev('copia.descargada')
        await expect(comprobarLimite('admin@vitest.test')).rejects.toBeInstanceOf(FacturacionError)
        expect(await comprobarLimite('otro@vitest.test')).toEqual({ restantes: 5 })       // por administrador
        for (let i = 0; i < 5; i++) await ev('copia.password_incorrecta', 'otro@vitest.test')
        await expect(comprobarLimite('otro@vitest.test')).rejects.toThrow(/intentos de contraseña/)
      } finally {
        ;(prisma as any).__usar(null)
      }
      throw new Rollback()
    })).rejects.toBeInstanceOf(Rollback)
  })
})
