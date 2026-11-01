// ARCHIVADO (2026-11-01): no se usa. Google descubre el sitemap por robots.txt
// («Sitemap: https://innovapp.es/sitemap.xml», lo genera next-sitemap en cada despliegue).
// Nunca llegó a funcionar: faltaba la cuenta de servicio y se decidió no crearla.
//
// Para reactivarlo:
//   1. En Google Cloud: activar «Google Search Console API», crear una cuenta de servicio y
//      una clave JSON. En Search Console (propiedad https://innovapp.es/): Configuración →
//      Usuarios y permisos → añadir el email de la cuenta de servicio con permiso Completo
//      (Propietario si la API devuelve 403).
//   2. Subir el JSON al servidor fuera de public/ y de git, con permisos 600 (y volver a
//      ignorar su carpeta en .gitignore), y añadir a .env:
//        GSC_SERVICE_ACCOUNT_PATH=/ruta/absoluta/al/json
//   3. Devolver este archivo a scripts/ y volver a llamarlo en lib/blog-manual.ts, al final
//      de publicarBorrador():
//        await paso('No se pudo avisar a Google Search Console', () =>
//          exec('node', ['scripts/submit-sitemap.mjs'], { cwd: ROOT, timeout: 60_000 }))
//   4. Necesita el paquete googleapis (sigue en package.json).
//
// Notifica a Google Search Console de que el sitemap se ha actualizado.
// Uso: node scripts/submit-sitemap.mjs
import { google } from 'googleapis'

try {
  process.loadEnvFile()
} catch {
  // Sin .env local -- no es un error, las variables pueden venir ya del entorno.
}

const SITE_URL = 'https://innovapp.es/'
// Confirmado contra public/sitemap-0.xml (generado por next-sitemap, ver next-sitemap.config.js).
const SITEMAP_URL = 'https://innovapp.es/sitemap-0.xml'

async function main() {
  const keyFile = process.env.GSC_SERVICE_ACCOUNT_PATH
  if (!keyFile) {
    console.error('Error: falta la variable de entorno GSC_SERVICE_ACCOUNT_PATH (ruta al JSON de la cuenta de servicio de Google).')
    process.exit(1)
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
    })

    const searchconsole = google.searchconsole({ version: 'v1', auth })

    await searchconsole.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: SITEMAP_URL,
    })

    console.log(`✓ Sitemap enviado a Google Search Console: ${SITEMAP_URL}`)
  } catch (error) {
    console.error('Error al enviar el sitemap a Google Search Console:', error.message)
    process.exit(1)
  }
}

main()
