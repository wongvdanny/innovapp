import type { NextApiRequest } from 'next'
import formidable from 'formidable'
import { MIME_ADJUNTOS, guardarArchivo } from './storage'
import { FacturacionError } from './errores'

/** Lee un multipart con campos + un archivo opcional 'adjunto' (máx. 10 MB, PDF o imagen). */
export function leerMultipart(req: NextApiRequest): Promise<{ campos: Record<string, string>; archivo: formidable.File | null }> {
  const form = formidable({ maxFileSize: 10 * 1024 * 1024, maxFiles: 1 })
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(new FacturacionError('DATOS_INVALIDOS', err.httpCode === 413 ? 'El archivo supera 10 MB' : 'No se pudo leer el formulario'))
      const campos: Record<string, string> = {}
      for (const [k, v] of Object.entries(fields)) campos[k] = Array.isArray(v) ? String(v[0] ?? '') : String(v ?? '')
      const f = files.adjunto
      resolve({ campos, archivo: (Array.isArray(f) ? f[0] : f) ?? null })
    })
  })
}

/** Valida el tipo del archivo y lo guarda en storage/facturacion/<carpeta>/<año>/. */
export function guardarAdjunto(archivo: formidable.File, carpeta: 'gastos' | 'ajustes', anio?: number) {
  const mime = archivo.mimetype || ''
  const ext = MIME_ADJUNTOS[mime]
  if (!ext) throw new FacturacionError('DATOS_INVALIDOS', 'Formato no admitido: sube un PDF o una imagen (JPG, PNG, WEBP, HEIC)')
  return { path: guardarArchivo(archivo.filepath, carpeta, ext, anio), mime }
}
