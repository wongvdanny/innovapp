/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://innovapp.es',
  generateRobotsTxt: false, // ya tenéis el vuestro manual
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/dashboard',
    '/dashboard/*',
    '/checkout',
    '/registro',
    '/login',
    '/bienvenida',
  ],
  changefreq: 'weekly',
  priority: 0.7,
  transform: async (config, path) => {
    // La home tiene prioridad máxima; las páginas de producto van justo detrás
    let priority = config.priority;
    if (path === '/') priority = 1.0;
    if (path === '/servix' || path === '/gymstack') priority = 0.9;

    return {
      loc: path,
      changefreq: config.changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
