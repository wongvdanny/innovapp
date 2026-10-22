/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://innovapp.es',
  // robots.txt lo genera next-sitemap (sustituye al manual de public/). Solo se bloquean
  // las zonas privadas: /login, /registro, /checkout, /baja... NO van en Disallow para que
  // Google pueda rastrearlas y leer su <meta name="robots" content="noindex">.
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/gestor', '/api', '/dashboard'] }],
  },
  exclude: [
    '/admin',
    '/admin*',
    '/api*',
    '/dashboard',
    '/dashboard/*',
    '/checkout*',
    '/registro',
    '/registro-news',
    '/login',
    '/baja',
    '/folleto',
    '/bienvenida',
    '/gestor',
    '/gestor*',
    '/hoja*.html',
    '/pdfs/*',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  transform: async (config, path) => {
    // La home tiene prioridad máxima; las páginas de servicio van justo detrás
    let priority = config.priority;
    if (path === '/') priority = 1.0;
    if (
      path === '/agentes-ia-prestashop' ||
      path === '/agentes-ia-woocommerce' ||
      path === '/desarrollo-prestashop-woocommerce'
    ) priority = 0.9;
    if (path === '/servix' || path === '/gymstack') priority = 0.8;

    return {
      loc: path,
      changefreq: config.changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
