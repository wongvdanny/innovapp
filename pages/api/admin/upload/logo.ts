import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import { isAdmin } from '../../../../lib/isAdmin'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'

export const config = { api: { bodyParser: false } }


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (!isAdmin(session)) return res.status(403).json({ error: 'No autorizado' })

  const form = formidable({ maxFileSize: 2 * 1024 * 1024 })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error al procesar archivo' })
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' })

    if (type === 'favicon') {
      fs.copyFileSync(file.filepath, path.join(process.cwd(), 'public', 'favicon.ico'))
    } else {
      // Siempre WebP real, sea cual sea el formato subido (antes se copiaba tal cual y acabó un SVG en logo.webp)
      try {
        await sharp(file.filepath, { density: 300 }).resize({ width: 830, withoutEnlargement: true })
          .webp({ quality: 90, alphaQuality: 100 }).toFile(path.join(process.cwd(), 'public', 'logo.webp'))
      } catch {
        return res.status(400).json({ error: 'El archivo no es una imagen válida' })
      }
    }
    return res.json({ ok: true, path: type === 'favicon' ? '/favicon.ico' : '/logo.webp' })
  })
}
