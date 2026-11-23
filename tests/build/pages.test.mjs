import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { guides } from '../../src/content/guides.js';
import { pagePaths, siteOrigin } from '../../src/lib/metadata.js';

const documents = new Map(await Promise.all(pagePaths.map(async path => [path, await readFile(resolve('dist', `.${path}index.html`), 'utf8')])));

test('built guides contain their text and code before JavaScript runs', () => {
  for (const guide of guides) {
    const html = documents.get(`/guides/${guide.slug}/`);
    assert.ok(html.includes(`<h1>${guide.title}</h1>`), guide.slug);
    for (const section of guide.sections) assert.ok(html.includes(`id="${section.id}"`), `${guide.slug}/${section.id}`);
    if (guide.sections.some(section => section.code)) assert.ok(html.includes('<code>'), guide.slug);
    assert.ok(!html.includes('<!--page-content-->'));
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1);
  }
});

test('all internal links lead to built pages and existing section IDs', () => {
  for (const [path, html] of documents) {
    for (const [, href] of html.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
      if (!href.startsWith('/') && !href.startsWith('#')) continue;
      assert.ok(!href.startsWith('#/'), href);
      const url = new URL(href, siteOrigin + path);
      const target = documents.get(url.pathname);
      assert.ok(target, `${path}: missing ${href}`);
      if (url.hash) assert.ok(target.includes(`id="${url.hash.slice(1)}"`), `${path}: missing anchor ${href}`);
    }
  }
});

test('canonical URLs, descriptions, sitemap, and robots agree on the production domain', async () => {
  const titles = new Set(), descriptions = new Set();
  const sitemap = await readFile('dist/sitemap.xml', 'utf8');
  for (const [path, html] of documents) {
    titles.add(html.match(/<title>([^<]+)<\/title>/)[1]);
    descriptions.add(html.match(/<meta name="description" content="([^"]+)"/)[1]);
    assert.ok(html.includes(`<link rel="canonical" href="${siteOrigin}${path}">`));
    assert.ok(html.includes('<meta name="robots" content="index, follow">'));
    assert.ok(sitemap.includes(`<loc>${siteOrigin}${path}</loc>`));
  }
  assert.equal(titles.size, pagePaths.length);
  assert.equal(descriptions.size, pagePaths.length);
  assert.equal((sitemap.match(/<loc>/g) || []).length, pagePaths.length);
  assert.ok(!sitemap.includes('#') && !sitemap.includes('404'));
  assert.ok((await readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${siteOrigin}/sitemap.xml`));
});

test('the error page is excluded from indexing and has no canonical', async () => {
  const html = await readFile('dist/404.html', 'utf8');
  assert.ok(html.includes('<h1>Page not found</h1>'));
  assert.ok(html.includes('<meta name="robots" content="noindex, follow">'));
  assert.ok(!html.includes('rel="canonical"'));
});

test('published pages point to valid sharing images and app icons', async () => {
  for (const [path, html] of documents) {
    const card = path === '/forum/' ? 'forum' : 'site';
    assert.ok(html.includes(`<meta property="og:image" content="${siteOrigin}/brand/share-${card}.png">`), path);
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), path);
    assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
    assert.match(html, /rel="apple-touch-icon" sizes="180x180" href="\/brand\/apple-touch-icon\.png"/);
  }
  async function dimensions(path) {
    const png = await readFile(`dist${path}`);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', path);
    return `${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`;
  }
  const manifest = JSON.parse(await readFile('dist/site.webmanifest', 'utf8'));
  assert.equal(manifest.start_url, '/');
  for (const icon of manifest.icons) assert.equal(await dimensions(icon.src), icon.sizes);
  assert.equal(await dimensions('/brand/apple-touch-icon.png'), '180x180');
  assert.equal(await dimensions('/brand/share-site.png'), '1200x630');
  assert.equal(await dimensions('/brand/share-forum.png'), '1200x630');
});
