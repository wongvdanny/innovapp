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
  async headers() {
    const noindex = (source, value = 'noindex') => ({ source, headers: [{ key: 'X-Robots-Tag', value }] })
    return [
      noindex('/hoja.html'),
      noindex('/hoja-LATAM.html'),
      noindex('/pdfs/:path*'),
      noindex('/admin', 'noindex, nofollow'),
      noindex('/admin/:path*', 'noindex, nofollow'),
      noindex('/gestor/:path*', 'noindex, nofollow, noarchive'),
      noindex('/dashboard', 'noindex, nofollow'),
      noindex('/dashboard/:path*', 'noindex, nofollow'),
      ...['/login', '/registro', '/registro-news', '/checkout', '/bienvenida', '/baja', '/folleto'].map((p) => noindex(p, 'noindex, nofollow')),
    ]
  },
}
module.exports = nextConfig
