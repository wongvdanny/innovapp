/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // scripts/deploy.sh compila en un directorio aparte (NEXT_DIST_DIR=.next-build) y lo cambia por
  // .next solo si el build termina bien; sin la variable, todo sigue igual.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  allowedDevOrigins: ['innovapp.es', 'www.innovapp.es'],
}
module.exports = nextConfig
