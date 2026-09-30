import fs from 'fs'
import sharp from 'sharp'
import { prisma } from '../../../../../lib/prisma'
import { adminApi } from '../../../../../lib/facturacion/api'
import { leerMultipart } from '../../../../../lib/facturacion/subidas'
import { escribirArchivo, rutaAbsoluta } from '../../../../../lib/facturacion/storage'
import { registrarEvento } from '../../../../../lib/facturacion/eventos'
import { FacturacionError } from '../../../../../lib/facturacion/errores'

export const config = { api: { bodyParser: false } }

// Logo para el PDF de las facturas. Se convierte a PNG (pdfkit no admite WebP/SVG) y
// se guarda con nombre único: las facturas ya emitidas conservan el logo de su snapshot.
export default adminApi({
  GET: async (_req, res) => {
    const a = await prisma.fac_ajustes.findUniqueOrThrow({ where: { id: 1 }, select: { logo_path: true } })
    if (!a.logo_path || !fs.existsSync(rutaAbsoluta(a.logo_path))) throw new FacturacionError('NO_ENCONTRADA', 'Sin logo')
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'private, no-store')
    res.end(fs.readFileSync(rutaAbsoluta(a.logo_path)))
  },
  POST: async (req, _res, actor) => {
    const { archivo } = await leerMultipart(req)
    if (!archivo) throw new FacturacionError('DATOS_INVALIDOS', 'No se recibió ninguna imagen')
    let png: Buffer
    try {
      png = await sharp(archivo.filepath).resize({ width: 800, height: 240, fit: 'inside', withoutEnlargement: true }).png().toBuffer()
    } catch {
      throw new FacturacionError('DATOS_INVALIDOS', 'No es una imagen válida (usa PNG, JPG, WEBP o SVG)')
    } finally {
      fs.rmSync(archivo.filepath, { force: true })
    }
    const relativa = escribirArchivo(`ajustes/logo-${Date.now()}.png`, png)
    await prisma.fac_ajustes.update({ where: { id: 1 }, data: { logo_path: relativa, updated_at: new Date() } })
    await registrarEvento(prisma, actor, 'ajustes.logo', 'ajustes', '1', { logo_path: relativa })
    return { logo_path: relativa }
  },
  DELETE: async (_req, _res, actor) => {
    await prisma.fac_ajustes.update({ where: { id: 1 }, data: { logo_path: null, updated_at: new Date() } })
    await registrarEvento(prisma, actor, 'ajustes.logo', 'ajustes', '1', { logo_path: null })
  },
})
