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
