import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { prisma } from '../prisma'
import { FacturacionError } from '../facturacion/errores'

// Archivo opcional de una campaña: un PDF de hasta 5 MB. No va adjunto (la API batch de Resend no
// admite adjuntos): el correo lleva un botón «Descargar» con un enlace propio de cada envío.
// NEWSLETTER_STORAGE_ROOT solo para pruebas.
export const MAX_BYTES = 5 * 1024 * 1024
export const RAIZ = path.resolve(process.env.NEWSLETTER_STORAGE_ROOT || path.join(process.cwd(), 'storage', 'newsletter'))

const err = (m: string) => new FacturacionError('DATOS_INVALIDOS', m)

/** Nombre visible seguro: sin rutas ni caracteres de control, acabado en .pdf. */
export function nombreSeguro(original: string | null | undefined) {
  const base = path.basename(original || 'documento.pdf').replace(/[\u0000-\u001f"\\/]/g, '').trim().slice(0, 120) || 'documento.pdf'
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`
}

async function campanaEditable(campanaId: string) {
  const c = await prisma.newsletter_campanas.findUniqueOrThrow({ where: { id: campanaId }, select: { estado: true } })
  if (!['borrador', 'programada'].includes(c.estado)) throw new FacturacionError('ESTADO_INVALIDO', 'Una campaña enviada no se puede modificar')
}

/** Guarda (o sustituye) el PDF de la campaña. Comprueba tamaño y que de verdad sea un PDF. */
export async function guardarArchivo(campanaId: string, f: { filepath: string; originalFilename?: string | null; size: number }, usuario: string) {
  await campanaEditable(campanaId)
  if (f.size <= 0) throw err('El archivo está vacío')
  if (f.size > MAX_BYTES) throw err('El archivo supera el máximo de 5 MB')
  const datos = fs.readFileSync(f.filepath)
  if (datos.subarray(0, 5).toString('latin1') !== '%PDF-') throw err('Solo se admiten archivos PDF')
  const ruta = `${campanaId}/${crypto.randomUUID()}.pdf`
  const destino = path.join(RAIZ, ruta)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, datos, { mode: 0o640 })
  const previo = await prisma.newsletter_archivos.findUnique({ where: { campana_id: campanaId } })
  const a = await prisma.$transaction(async tx => {
    if (previo) await tx.newsletter_archivos.delete({ where: { id: previo.id } })
    return tx.newsletter_archivos.create({
      data: { campana_id: campanaId, nombre: nombreSeguro(f.originalFilename), ruta, bytes: f.size, mime: 'application/pdf',
        sha256: crypto.createHash('sha256').update(datos).digest('hex'), created_by: usuario },
    })
  })
  if (previo) fs.rmSync(path.join(RAIZ, previo.ruta), { force: true })
  return a
}

export async function eliminarArchivo(campanaId: string) {
  await campanaEditable(campanaId)
  const a = await prisma.newsletter_archivos.findUnique({ where: { campana_id: campanaId } })
  if (!a) return
  await prisma.newsletter_archivos.delete({ where: { id: a.id } })
  fs.rmSync(path.join(RAIZ, a.ruta), { force: true })
}

/**
 * Descarga pública: devuelve el archivo y registra la descarga. El envío solo se anota si
 * pertenece a la campaña del archivo (un enlace manipulado no atribuye descargas a otros).
 */
export async function registrarDescarga(archivoId: string, envioId: unknown) {
  if (!/^[0-9a-f-]{36}$/.test(archivoId)) return null
  const a = await prisma.newsletter_archivos.findUnique({ where: { id: archivoId } })
  if (!a) return null
  const e = typeof envioId === 'string' && /^[0-9a-f-]{36}$/.test(envioId)
    ? await prisma.newsletter_envios.findFirst({ where: { id: envioId, campana_id: a.campana_id }, select: { id: true } })
    : null
  await prisma.newsletter_descargas.create({ data: { archivo_id: a.id, envio_id: e?.id ?? null } })
  const abs = path.join(RAIZ, a.ruta)
  if (!abs.startsWith(RAIZ + path.sep) || !fs.existsSync(abs)) return null
  return { abs, nombre: a.nombre, bytes: a.bytes }
}
