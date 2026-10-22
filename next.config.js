/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // scripts/deploy.sh compila en un directorio aparte (NEXT_DIST_DIR=.next-build) y lo cambia por
  // .next solo si el build termina bien; sin la variable, todo sigue igual.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['innovapp.es', 'www.innovapp.es'],
  // Sin indexar: estáticos que no son páginas de la web (hojas comerciales, PDFs) y las zonas
  // privadas que no usan <Seo noindex> (panel admin, gestor, área de cliente).
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
    ]
  },
}
module.exports = nextConfig
