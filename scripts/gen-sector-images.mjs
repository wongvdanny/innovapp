// Genera las imágenes del hero de las landings sectoriales (components/sector/SectorLanding.tsx).
//   Entrada (fuera de public/ y de git): storage/originales/sectores/<slug>.jpg y, opcional, <slug>-chat.png
//   Salida: public/sectores/<slug>.webp (foto 4:5, 960x1200, < 200 KB) y <slug>-chat.webp (máx. 800 px)
// Si falta la foto de un sector, se deja el placeholder que haya en public/sectores/<slug>.webp.
// Las zonas de ZONAS se difuminan antes de recortar: nombres, logos o teléfonos de terceros.
// Uso: node scripts/gen-sector-images.mjs
import sharp from 'sharp'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const ORIGENES = join(root, 'storage', 'originales', 'sectores')
const DESTINO = join(root, 'public', 'sectores')
const MAX_BYTES = 200 * 1024

// Por sector: zonas a difuminar [x, y, ancho, alto] en píxeles del original, y dónde empieza el
// recorte 4:5 (fracción de la altura sobrante que se quita por arriba: 0 = arriba, 1 = abajo).
const SECTORES = {
  peluquerias: { zonas: [], arriba: 0.3 },
  clinicas: {
    // Placa con el nombre y el número de colegiado del dentista, su logotipo y el termo «ODONTOLOGIA»
    zonas: [[1600, 1150, 1024, 430], [2010, 1540, 614, 250], [2180, 60, 444, 1140], [0, 2560, 120, 620]],
    arriba: 0.5,
  },
  talleres: {
    // Nombre del taller en el chaleco y marca del equipo de alineación
    zonas: [[3020, 3620, 470, 420], [1830, 2390, 330, 160]],
    arriba: 0.6,
  },
}

async function difuminar(img, zonas, ancho, alto) {
  if (!zonas.length) return img
  const base = await img.toBuffer()
  const capas = await Promise.all(zonas.map(async ([x, y, w, h]) => {
    const left = Math.max(0, x), top = Math.max(0, y)
    const width = Math.min(w, ancho - left), height = Math.min(h, alto - top)
    const input = await sharp(base).extract({ left, top, width, height }).blur(45).toBuffer()
    return { input, left, top }
  }))
  return sharp(await sharp(base).composite(capas).toBuffer())
}

async function webpBajoLimite(img, ruta) {
  for (const quality of [78, 72, 66, 60, 55]) {
    const buf = await img.clone().webp({ quality, effort: 6 }).toBuffer()
    if (buf.length <= MAX_BYTES || quality === 55) {
      await sharp(buf).toFile(ruta)
      return { quality, kb: Math.round(buf.length / 1024) }
    }
  }
}

for (const [slug, cfg] of Object.entries(SECTORES)) {
  const foto = join(ORIGENES, `${slug}.jpg`)
  if (!existsSync(foto)) {
    console.log(`· ${slug}: sin foto, se mantiene el placeholder`)
  } else {
    // rotate() aplica la orientación EXIF; la salida no lleva metadatos (sharp los quita)
    const rotada = await sharp(await sharp(foto).rotate().toBuffer())
    const { width, height } = await rotada.metadata()
    const limpia = await difuminar(rotada, cfg.zonas, width, height)
    const altoRecorte = Math.min(height, Math.round(width * 5 / 4))
    const top = Math.round((height - altoRecorte) * cfg.arriba)
    const final = limpia.extract({ left: 0, top, width, height: altoRecorte }).resize(960, 1200, { fit: 'cover' })
    const r = await webpBajoLimite(final, join(DESTINO, `${slug}.webp`))
    console.log(`✓ public/sectores/${slug}.webp (960x1200, calidad ${r.quality}, ${r.kb} KB)`)
  }

  const chat = join(ORIGENES, `${slug}-chat.png`)
  if (existsSync(chat)) {
    const r = await webpBajoLimite(sharp(chat).resize({ width: 800, withoutEnlargement: true }), join(DESTINO, `${slug}-chat.webp`))
    console.log(`✓ public/sectores/${slug}-chat.webp (máx. 800 px, ${r.kb} KB) · revisa que no se vean nombres ni teléfonos`)
  }
}
