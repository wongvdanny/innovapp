// Genera public/brand/og-image.png (1200x630, fondo #1E1E1E, wordmark dark centrado)
// y public/brand/logo.png (raster del wordmark light, para JSON-LD "logo").
// Uso: node scripts/gen-og-image.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const brand = join(root, 'public', 'brand')

// --- og-image.png ---
const LOGO_W = 880 // ancho del wordmark dentro de la tarjeta (ratio 830:222)
const darkSvg = readFileSync(join(brand, 'logo-dark-bg.svg'))
const logo = await sharp(darkSvg, { density: 300 })
  .resize({ width: LOGO_W })
  .png()
  .toBuffer()

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: '#1E1E1E' },
})
  .composite([{ input: logo, gravity: 'center' }])
  .png()
  .toFile(join(brand, 'og-image.png'))
console.log('✓ public/brand/og-image.png (1200x630)')

// --- logo.png (wordmark sobre transparente, para schema.org Organization.logo) ---
const lightSvg = readFileSync(join(brand, 'logo-light-bg.svg'))
await sharp(lightSvg, { density: 300 })
  .resize({ width: 1000 })
  .png()
  .toFile(join(brand, 'logo.png'))
console.log('✓ public/brand/logo.png (1000x268)')
