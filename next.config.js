/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // scripts/deploy.sh compila en un directorio aparte (NEXT_DIST_DIR=.next-build) y lo cambia por
  // .next solo si el build termina bien; sin la variable, todo sigue igual.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['innovapp.es', 'www.innovapp.es'],
  // Sin indexar: estáticos que no son páginas de la web (hojas comerciales, PDFs) y las zonas
  // privadas que no usan <Seo noindex> (panel admin, gestor, área de cliente). Las páginas de
  // flujo también llevan cabecera: /registro y /checkout pintan "Cargando..." en el HTML del
  // servidor, antes de <Seo noindex>, y ya no están en el Disallow de robots.txt.
  // Posts del blog fusionados en otro (los originales quedan en content/blog/.absorbed/).
  // statusCode 301 en vez de permanent: true, que en Next responde 308.
  async redirects() {
    const fusiones = {
      'responder-bien-whatsapp-no-perder-clientes': [
        'responder-whatsapp-tiempo-no-perder-clientes',
        'cliente-perdido-whatsapp-respuesta-lenta-lealtad',
        'whatsapp-respuesta-lenta-reputacion-online',
        'primera-impresion-whatsapp-clientes-recurrentes',
      ],
      'negocio-pierde-clientes-fuera-horario': ['vender-24-7-agente-ia-fuera-horario'],
      'automatizar-consultas-repetitivas-whatsapp': ['preguntas-frecuentes-ventas-automaticas'],
    }
    return [
      // /casos se quitó el 2026-10-31: los productos están ahora en la home (#productos)
      { source: '/casos', destination: '/#productos', statusCode: 301 },
      ...Object.entries(fusiones).flatMap(([destino, origenes]) =>
        origenes.map((o) => ({ source: `/blog/${o}`, destination: `/blog/${destino}`, statusCode: 301 }))
      ),
    ]
  },
  async headers() {
    const noindex = (source, value = 'noindex') => ({ source, headers: [{ key: 'X-Robots-Tag', value }] })
    return [
      noindex('/hoja.html'),
      noindex('/hoja-LATAM.html'),
      noindex('/pdfs/:path*'),
      noindex('/admin', 'noindex, nofollow'),
      noindex('/admin/:path*', 'noindex, nofollow'),
      noindex('/licitaciones', 'noindex, nofollow'),
      noindex('/gestor/:path*', 'noindex, nofollow, noarchive'),
      noindex('/dashboard', 'noindex, nofollow'),
      noindex('/dashboard/:path*', 'noindex, nofollow'),
      ...['/login', '/registro', '/registro-news', '/checkout', '/bienvenida', '/baja', '/folleto'].map((p) => noindex(p, 'noindex, nofollow')),
    ]
  },
}
// En producción, ninguna URL pública puede apuntar a localhost ni ir sin https (lib/urls-produccion.js).
// Al compilar se aborta (deploy.sh no publica y la web sigue con la versión anterior). Al arrancar solo
// se avisa: fallar aquí impediría también la vuelta atrás, que usa este mismo archivo.
const { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } = require('next/constants')
const { comprobarUrlsProduccion } = require('./lib/urls-produccion')

module.exports = phase => {
  if (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER) {
    const problemas = comprobarUrlsProduccion({ ...process.env, NODE_ENV: 'production' })
    if (problemas.length) {
      const msg = `URLs no válidas para producción:\n  - ${problemas.join('\n  - ')}`
      if (phase === PHASE_PRODUCTION_BUILD) throw new Error(msg)
      console.error(`[urls] ${msg}`)
    }
  }
  return nextConfig
}
