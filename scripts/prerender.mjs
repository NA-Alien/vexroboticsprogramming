import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createServer } from 'vite';
import { pagePaths, pageMetadata, siteOrigin } from '../src/lib/metadata.js';

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderHead(page) {
  const title = escapeHtml(page.title), description = escapeHtml(page.description);
  const canonical = page.canonical && escapeHtml(page.canonical);
  return `<title>${title}</title>
    <meta name="description" content="${description}">
    <meta name="robots" content="${page.robots}">
    ${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="VEX Robotics Programming">
    ${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
    <meta name="twitter:card" content="summary">`;
}

const template = await readFile(resolve('dist/index.html'), 'utf8');
if (!template.includes('<!--page-content-->') || !template.includes('<!--page-head-start-->')) {
  throw new Error('The built HTML is missing the static-page placeholders.');
}
const server = await createServer({
  configFile: false,
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, watch: null },
  esbuild: { jsx: 'automatic' },
  optimizeDeps: { noDiscovery: true },
  logLevel: 'error'
});
try {
  const { renderPage } = await server.ssrLoadModule('/src/entry-server.jsx');
  for (const path of [...pagePaths, '/404.html']) {
    const markup = renderPage(path);
    const html = template
      .replace(/<!--page-head-start-->[\s\S]*?<!--page-head-end-->/, () => renderHead(pageMetadata(path)))
      .replace('<!--page-content-->', () => markup);
    const file = resolve('dist', path === '/404.html' ? '404.html' : `.${path}index.html`);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, html);
  }
  const urls = pagePaths.map(path => `  <url><loc>${escapeHtml(siteOrigin + path)}</loc></url>`).join('\n');
  await writeFile(resolve('dist/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await writeFile(resolve('dist/robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`);
  console.log(`Generated ${pagePaths.length} searchable pages, 404.html, sitemap.xml, and robots.txt.`);
} finally {
  await server.close();
}
