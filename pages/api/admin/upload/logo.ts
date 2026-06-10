import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/authOptions'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = { api: { bodyParser: false } }

const ADMIN_EMAIL = 'wongvdanny@gmail.com'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getServerSession(req, res, authOptions)
  if (session?.user?.email !== ADMIN_EMAIL) return res.status(403).json({ error: 'No autorizado' })

  const form = formidable({ maxFileSize: 2 * 1024 * 1024 })
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error al procesar archivo' })
    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type
    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' })

    const ext = path.extname(file.originalFilename || '.webp')
    const dest = type === 'favicon'
      ? path.join(process.cwd(), 'public', 'favicon.ico')
      : path.join(process.cwd(), 'public', 'logo.webp')

    fs.copyFileSync(file.filepath, dest)
    return res.json({ ok: true, path: type === 'favicon' ? '/favicon.ico' : '/logo.webp' })
  })
}
