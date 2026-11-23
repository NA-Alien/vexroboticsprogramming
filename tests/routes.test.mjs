import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, legacyDestination } from '../src/lib/routes.js';
import { pageMetadata, pagePaths } from '../src/lib/metadata.js';
import { guides } from '../src/content/guides.js';

test('normal page URLs and section anchors have separate roles', () => {
  assert.deepEqual(parseRoute('/guides/odometry/', '#offsets'), { page: 'guides', slug: 'odometry', section: 'offsets' });
  assert.deepEqual(parseRoute('/guides/'), { page: 'guides' });
  assert.deepEqual(parseRoute('/sources/'), { page: 'sources' });
  assert.deepEqual(parseRoute('/forum/'), { page: 'forum' });
  assert.deepEqual(parseRoute('/forum/welcome/'), { page: 'forum', welcome: true });
  assert.deepEqual(parseRoute('/'), { page: 'home' });
  assert.deepEqual(parseRoute('/guides/odometry/extra/'), { page: 'not-found' });
});

test('legacy hash routes migrate to local page and anchor URLs', () => {
  assert.equal(legacyDestination('#/guides/odometry/offsets'), '/guides/odometry/#offsets');
  assert.equal(legacyDestination('#/guides/pid'), '/guides/pid/');
  assert.equal(legacyDestination('#/sources'), '/sources/');
  assert.equal(legacyDestination('#/'), '/');
  assert.equal(legacyDestination('#offsets'), null);
  assert.equal(legacyDestination('#//evil.example'), null);
  assert.equal(legacyDestination('#/guides/pid/offsets/extra'), null);
});

test('every published page has unique metadata and an absolute canonical without fragments', () => {
  assert.equal(pagePaths.length, guides.length + 5);
  assert.ok(pagePaths.includes('/forum/'));
  assert.match(pageMetadata('/forum/').title, /Forum/);
  const pages = pagePaths.map(pageMetadata);
  assert.equal(new Set(pages.map(page => page.title)).size, pages.length);
  assert.equal(new Set(pages.map(page => page.description)).size, pages.length);
  for (const page of pages) {
    assert.equal(page.robots, 'index, follow');
    assert.match(page.canonical, /^https:\/\/vexroboticsprogramming\.com\//);
    assert.ok(!page.canonical.includes('#'));
  }
  assert.equal(pageMetadata('/guides/missing/').robots, 'noindex, follow');
  assert.equal(pageMetadata('/404.html').canonical, null);
});
