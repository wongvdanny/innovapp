import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import { execFile } from 'child_process'
import archiver from 'archiver'
import bcrypt from 'bcryptjs'
import type { Writable } from 'stream'
import { prisma } from '../prisma'
import { FacturacionError } from './errores'

// Copias de seguridad desde el panel. Los backups los genera /usr/local/sbin/innovapp-backup
// (root, vía una regla de sudoers sin argumentos) en /var/backups/innovapp (root:innovapp-bk, 750/640).
// Aquí solo se listan y se sirven en streaming: los nombres de archivo NUNCA vienen del usuario,
// se construyen a partir de una marca de tiempo validada.

export const DIR_BACKUPS = path.resolve(process.env.FAC_BACKUP_DIR || '/var/backups/innovapp')
export const SCRIPT_BACKUP = '/usr/local/sbin/innovapp-backup'
export const LIMITE_DESCARGAS_HORA = 5
const TS_RE = /^\d{8}_\d{6}$/
const TOKEN_TTL_MS = 2 * 60_000

export type TipoCopia = 'facturacion' | 'completo'

interface Pieza { nombre: string; ruta: string; bytes: number; sha256: string | null }
export interface Backup {
  ts: string
  fecha: string                 // ISO local de Madrid, para mostrar
  completo: Pieza | null        // db/innovapp_db_<ts>.dump
  facturacion: Pieza | null     // fac/innovapp_fac_<ts>.dump
  archivos: Pieza | null        // storage/storage_facturacion_<ts>.tar.gz
}

const RUTAS = (ts: string) => ({
  completo: `db/innovapp_db_${ts}.dump`,
  facturacion: `fac/innovapp_fac_${ts}.dump`,
  archivos: `storage/storage_facturacion_${ts}.tar.gz`,
})

function sumas(): Map<string, string> {
  const m = new Map<string, string>()
  try {
    for (const l of fs.readFileSync(path.join(DIR_BACKUPS, 'SHA256SUMS'), 'utf8').split('\n')) {
      const [sha, rel] = l.trim().split(/\s+/)
      if (sha && rel) m.set(rel, sha)
    }
  } catch { /* sin manifiesto */ }
  return m
}

function pieza(rel: string, shas: Map<string, string>): Pieza | null {
  const ruta = path.join(DIR_BACKUPS, rel)
  try {
    const st = fs.statSync(ruta)
    return st.isFile() ? { nombre: path.basename(rel), ruta, bytes: st.size, sha256: shas.get(rel) ?? null } : null
  } catch { return null }
}

const fechaDeTs = (ts: string) => `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}T${ts.slice(9, 11)}:${ts.slice(11, 13)}:${ts.slice(13, 15)}`

/** Backups disponibles, del más reciente al más antiguo. */
export function listarBackups(): Backup[] {
  const shas = sumas()
  const marcas = new Set<string>()
  for (const sub of ['db', 'fac', 'storage']) {
    let nombres: string[] = []
    try { nombres = fs.readdirSync(path.join(DIR_BACKUPS, sub)) } catch { continue }
    for (const n of nombres) { const m = n.match(/_(\d{8}_\d{6})\.(dump|tar\.gz)$/); if (m) marcas.add(m[1]) }
  }
  return Array.from(marcas).sort().reverse().map(ts => {
    const r = RUTAS(ts)
    return { ts, fecha: fechaDeTs(ts), completo: pieza(r.completo, shas), facturacion: pieza(r.facturacion, shas), archivos: pieza(r.archivos, shas) }
  }).filter(b => b.completo || b.facturacion)
}

/** Archivos que componen una descarga. Lanza si la marca o el tipo no son válidos o falta algo. */
export function piezasDescarga(ts: string, tipo: TipoCopia): Pieza[] {
  if (!TS_RE.test(ts)) throw new FacturacionError('DATOS_INVALIDOS', 'Copia no válida')
  if (tipo !== 'facturacion' && tipo !== 'completo') throw new FacturacionError('DATOS_INVALIDOS', 'Tipo de copia no válido')
  const b = listarBackups().find(x => x.ts === ts)
  const bd = b?.[tipo]
  if (!b || !bd) throw new FacturacionError('NO_ENCONTRADA', tipo === 'facturacion'
    ? 'Esta copia no incluye el volcado de facturación (es anterior a esa opción): usa la completa'
    : 'Copia no encontrada')
  if (!b.archivos) throw new FacturacionError('NO_ENCONTRADA', 'Falta el archivo de PDFs y adjuntos de esta copia')
  return [bd, b.archivos]
}

export const nombreZip = (ts: string, tipo: TipoCopia) => `innovapp-${tipo === 'facturacion' ? 'facturacion' : 'completo'}-${ts}.zip`

function leeme(ts: string, tipo: TipoCopia, piezas: Pieza[]) {
  const [bd] = piezas
  return [
    `Copia de seguridad de innovapp (${tipo === 'facturacion' ? 'solo facturación' : 'completa'}) · ${fechaDeTs(ts).replace('T', ' ')}`,
    '',
    'Contenido:',
    ...piezas.map(p => `  ${p.nombre}  (${p.bytes} bytes)  SHA256 ${p.sha256 ?? 'no disponible'}`),
    '',
    'Comprobar integridad:  sha256sum -c SHA256SUMS',
    '',
    tipo === 'facturacion'
      ? `Restaurar (tablas fac_* sobre innovapp_db, que ya debe tener la tabla "User"):\n  pg_restore --no-owner --clean --if-exists -d innovapp_db ${bd.nombre}`
      : `Restaurar (base de datos completa, sobre una BD vacía):\n  createdb innovapp_db && pg_restore --no-owner -d innovapp_db ${bd.nombre}`,
    `Archivos (PDFs de facturas, adjuntos de gastos, logo):\n  tar -xzf ${piezas[1].nombre} -C /var/www/innovapp/storage`,
    '',
    'Aviso: contiene datos fiscales y personales. Guárdala cifrada.',
  ].join('\n')
}

/** Escribe el ZIP en streaming (sin cargar los volcados en memoria). Los volcados ya van comprimidos. */
export async function escribirZip(ts: string, tipo: TipoCopia, destino: Writable) {
  const piezas = piezasDescarga(ts, tipo)
  const zip = archiver('zip', { store: true })
  const fin = new Promise<void>((res, rej) => {
    zip.on('error', rej)
    destino.on('error', rej)
    destino.on('finish', () => res())
    destino.on('close', () => res())
  })
  zip.pipe(destino)
  for (const p of piezas) zip.append(fs.createReadStream(p.ruta), { name: p.nombre })
  zip.append(piezas.map(p => `${p.sha256 ?? ''}  ${p.nombre}`).join('\n') + '\n', { name: 'SHA256SUMS' })
  zip.append(leeme(ts, tipo, piezas), { name: 'LEEME.txt' })
  await zip.finalize()
  await fin
  return piezas
}

/** Ejecuta el backup (sudo, sin argumentos) y devuelve la marca de tiempo creada. */
export function crearBackupAhora(): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile('sudo', ['-n', SCRIPT_BACKUP], { timeout: 5 * 60_000, env: { PATH: '/usr/bin:/bin' } as unknown as NodeJS.ProcessEnv, encoding: 'utf8' }, (err, stdout: string, stderr: string) => {
      const ts = stdout.match(/BACKUP_TS=(\d{8}_\d{6})/)?.[1]
      if (err || !ts) return reject(new FacturacionError('DATOS_INVALIDOS', `No se pudo crear la copia: ${(stderr || err?.message || 'sin marca de tiempo').trim().slice(0, 200)}`))
      resolve(ts)
    })
  })
}

// ── Reautenticación, límite y tokens de un solo uso ──

export async function comprobarLimite(usuario: string) {
  const desde = new Date(Date.now() - 3600_000)
  const [descargas, fallos] = await Promise.all([
    prisma.fac_eventos.count({ where: { accion: 'copia.descargada', usuario, created_at: { gte: desde } } }),
    prisma.fac_eventos.count({ where: { accion: 'copia.password_incorrecta', usuario, created_at: { gte: desde } } }),
  ])
  if (descargas >= LIMITE_DESCARGAS_HORA) throw new FacturacionError('DATOS_INVALIDOS', `Límite alcanzado: ${LIMITE_DESCARGAS_HORA} descargas por hora. Inténtalo más tarde.`)
  if (fallos >= 5) throw new FacturacionError('DATOS_INVALIDOS', 'Demasiados intentos de contraseña fallidos. Espera una hora.')
  return { restantes: LIMITE_DESCARGAS_HORA - descargas }
}

export async function passwordCorrecta(email: string, password: string) {
  if (!password) return false
  const u = await prisma.user.findUnique({ where: { email }, select: { password: true, role: true } })
  return !!u && u.role === 'admin' && bcrypt.compare(password, u.password)
}

// En globalThis (como lib/prisma.ts): Next empaqueta cada ruta de API por separado y el token
// se emite en /autorizar y se consume en /descargar; así ambas ven el mismo mapa.
type DatosToken = { usuario: string; ts: string; tipo: TipoCopia; expira: number }
const g = globalThis as unknown as { __facTokensCopias?: Map<string, DatosToken> }
const tokens = (g.__facTokensCopias ??= new Map<string, DatosToken>())

export function emitirToken(usuario: string, ts: string, tipo: TipoCopia) {
  const ahora = Date.now()
  tokens.forEach((v, k) => { if (v.expira < ahora) tokens.delete(k) })
  const t = randomBytes(32).toString('hex')
  tokens.set(t, { usuario, ts, tipo, expira: ahora + TOKEN_TTL_MS })
  return t
}

/** Consume el token (un solo uso). Solo vale para el mismo administrador que lo pidió. */
export function consumirToken(token: string, usuario: string) {
  const d = tokens.get(token)
  tokens.delete(token)
  if (!d || d.expira < Date.now() || d.usuario !== usuario) throw new FacturacionError('DATOS_INVALIDOS', 'Autorización caducada o no válida. Vuelve a introducir la contraseña.')
  return d
}
