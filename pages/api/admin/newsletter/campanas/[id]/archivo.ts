import formidable from 'formidable'
import { NextApiRequest } from 'next'
import { adminApi, texto } from '../../../../../../lib/facturacion/api'
import { FacturacionError } from '../../../../../../lib/facturacion/errores'
import { MAX_BYTES, eliminarArchivo, guardarArchivo } from '../../../../../../lib/newsletter/archivos'

export const config = { api: { bodyParser: false } }

function leerPdf(req: NextApiRequest): Promise<formidable.File> {
  const form = formidable({ maxFileSize: MAX_BYTES, maxFiles: 1 })
  return new Promise((ok, ko) => form.parse(req, (e, _campos, archivos) => {
    if (e) return ko(new FacturacionError('DATOS_INVALIDOS', /maxFileSize|exceeded/i.test(String(e.message)) ? 'El archivo supera el máximo de 5 MB' : 'No se ha podido leer el archivo'))
    const f = Array.isArray(archivos.archivo) ? archivos.archivo[0] : (archivos.archivo as formidable.File | undefined)
    f ? ok(f) : ko(new FacturacionError('DATOS_INVALIDOS', 'Falta el archivo'))
  }))
}

// PDF opcional de la campaña (máx. 5 MB): POST multipart con «archivo» lo sube o sustituye; DELETE lo quita.
export default adminApi({
  POST: async (req, _res, actor) => guardarArchivo(texto(req.query.id), await leerPdf(req), actor.usuario),
  DELETE: async req => { await eliminarArchivo(texto(req.query.id)); return { ok: true } },
})
