// URLs públicas con las que se construyen enlaces (correos, baja, List-Unsubscribe, descargas,
// recuperación de contraseña…). En producción nunca pueden apuntar a localhost ni ir sin https.
// CommonJS: también la carga next.config.js. PERMITIR_URLS_LOCALES=1 solo en entornos de prueba.

const VARIABLES_URL = ['NEXTAUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'NEWSLETTER_BASE_URL']
const LOCAL = /^(localhost|.*\.localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|\[?::1?\]?)$/i

/** Problemas de las URLs definidas en `env` (sin mirar NODE_ENV). */
function problemasUrls(env) {
  const problemas = []
  for (const k of VARIABLES_URL) {
    const v = env[k]
    if (!v) continue
    let u
    try { u = new URL(v) } catch { problemas.push(`${k} no es una URL válida («${v}»)`); continue }
    if (LOCAL.test(u.hostname)) problemas.push(`${k} apunta a ${u.hostname} («${v}»)`)
    else if (u.protocol !== 'https:') problemas.push(`${k} no usa https («${v}»)`)
  }
  return problemas
}

/** En producción (salvo PERMITIR_URLS_LOCALES=1), la lista de problemas; fuera de producción, []. */
function comprobarUrlsProduccion(env = process.env) {
  if (env.NODE_ENV !== 'production' || env.PERMITIR_URLS_LOCALES === '1') return []
  return problemasUrls(env)
}

module.exports = { VARIABLES_URL, problemasUrls, comprobarUrlsProduccion }
