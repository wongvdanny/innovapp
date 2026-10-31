// Genera, con sharp, las imágenes de marca:
//   public/og-image.png        1200x630, la imagen OG por defecto (components/Seo.tsx)
//   public/favicon.ico         icono cuadrado (ICO con PNG de 16, 32 y 48 px)
//   public/icon.png            512x512 · public/apple-touch-icon.png 180x180
//   public/logo.webp           WebP real del wordmark para fondo claro (antes era un SVG con extensión .webp)
//   public/brand/og-image.png  (la anterior, se mantiene por las URL ya compartidas)
//   public/brand/logo.png      raster del wordmark light, para JSON-LD "logo"
// Uso: node scripts/gen-og-image.mjs
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
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

// --- og-image.png (nueva): fondo de la home, wordmark y una barra naranja de acento ---
const fondoOg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1E1E1E"/><stop offset=".6" stop-color="#1E1E1E"/><stop offset="1" stop-color="#33261C"/></linearGradient>
    <radialGradient id="r" cx="1" cy="0" r=".7"><stop offset="0" stop-color="#EE7528" stop-opacity=".22"/><stop offset="1" stop-color="#EE7528" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/><rect width="1200" height="630" fill="url(#r)"/>
  <rect x="510" y="420" width="180" height="8" rx="4" fill="#EE7528"/>
</svg>`)
const logoOg = await sharp(darkSvg, { density: 300 }).resize({ width: 760 }).png().toBuffer()
const { height: altoLogoOg } = await sharp(logoOg).metadata()
await sharp(fondoOg)
  .composite([{ input: logoOg, left: Math.round((1200 - 760) / 2), top: Math.round(370 - altoLogoOg) }])
  .png()
  .toFile(join(root, 'public', 'og-image.png'))
console.log('✓ public/og-image.png (1200x630)')

// --- Favicon cuadrado: la «i» del logo (trazo blanco y punto naranja) sobre #1E1E1E ---
const icono = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#1E1E1E"/>
  <circle cx="256" cy="148" r="52" fill="#EE7528"/>
  <rect x="214" y="232" width="84" height="196" rx="18" fill="#FFFFFF"/>
</svg>`)
const png = (lado) => sharp(icono, { density: 300 }).resize(lado, lado).png().toBuffer()
await sharp(await png(512)).toFile(join(root, 'public', 'icon.png'))
await sharp(await png(180)).toFile(join(root, 'public', 'apple-touch-icon.png'))
// ICO con PNG embebidos (formato admitido por todos los navegadores actuales)
const tamanos = [16, 32, 48]
const imagenes = await Promise.all(tamanos.map(png))
const cabecera = Buffer.alloc(6 + 16 * tamanos.length)
cabecera.writeUInt16LE(0, 0); cabecera.writeUInt16LE(1, 2); cabecera.writeUInt16LE(tamanos.length, 4)
let desplazamiento = cabecera.length
tamanos.forEach((t, i) => {
  const o = 6 + 16 * i
  cabecera.writeUInt8(t, o); cabecera.writeUInt8(t, o + 1); cabecera.writeUInt8(0, o + 2); cabecera.writeUInt8(0, o + 3)
  cabecera.writeUInt16LE(1, o + 4); cabecera.writeUInt16LE(32, o + 6)
  cabecera.writeUInt32LE(imagenes[i].length, o + 8); cabecera.writeUInt32LE(desplazamiento, o + 12)
  desplazamiento += imagenes[i].length
})
writeFileSync(join(root, 'public', 'favicon.ico'), Buffer.concat([cabecera, ...imagenes]))
console.log('✓ public/favicon.ico (16, 32, 48) · public/icon.png (512) · public/apple-touch-icon.png (180)')

// --- logo.webp: WebP real del wordmark para fondo claro ---
await sharp(lightSvg, { density: 300 }).resize({ width: 830 }).webp({ quality: 90, alphaQuality: 100 }).toFile(join(root, 'public', 'logo.webp'))
console.log('✓ public/logo.webp (WebP real, 830 px)')
