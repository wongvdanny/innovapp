import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

// Archivos de facturación fuera de /public: solo se sirven por endpoints autenticados.
// En BD se guardan rutas relativas a STORAGE_ROOT.

export const STORAGE_ROOT = path.join(process.cwd(), 'storage', 'facturacion')

export const MIME_ADJUNTOS: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/heic': '.heic',
}

/** Resuelve una ruta relativa impidiendo salir de STORAGE_ROOT. */
export function rutaAbsoluta(relativa: string): string {
  const abs = path.resolve(STORAGE_ROOT, relativa)
  if (!abs.startsWith(STORAGE_ROOT + path.sep)) throw new Error('Ruta fuera del almacenamiento de facturación')
  return abs
}

/** Mueve un archivo temporal (formidable) a <carpeta>/<año>/<uuid><ext> y devuelve la ruta relativa. */
export function guardarArchivo(tmp: string, carpeta: 'gastos' | 'facturas' | 'ajustes', ext: string, anio = new Date().getFullYear()): string {
  const relativa = path.join(carpeta, String(anio), `${randomUUID()}${ext}`)
  const destino = rutaAbsoluta(relativa)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.copyFileSync(tmp, destino)
  fs.unlinkSync(tmp)
  return relativa
}

/** Escribe un buffer (p. ej. PDF generado) con nombre fijo y devuelve la ruta relativa. */
export function escribirArchivo(relativa: string, datos: Buffer): string {
  const destino = rutaAbsoluta(relativa)
  fs.mkdirSync(path.dirname(destino), { recursive: true })
  fs.writeFileSync(destino, datos, { flag: 'wx' }) // nunca sobrescribe
  return relativa
}
