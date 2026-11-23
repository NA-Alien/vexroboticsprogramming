export function parseRoute(pathname, hash = '') {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/') return { page: 'home' };
  if (path === '/guides') return { page: 'guides' };
  if (path === '/sources') return { page: 'sources' };
  if (path === '/forum') return { page: 'forum' };
  const match = path.match(/^\/guides\/([a-z0-9-]+)$/);
  if (match) {
    const route = { page: 'guides', slug: match[1] };
    if (/^#[a-z0-9-]+$/.test(hash)) route.section = hash.slice(1);
    return route;
  }
  return { page: 'not-found' };
}

export function legacyDestination(hash) {
  if (hash === '#/') return '/';
  if (hash === '#/guides') return '/guides/';
  if (hash === '#/sources') return '/sources/';
  const match = hash.match(/^#\/guides\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
  return match ? `/guides/${match[1]}/${match[2] ? `#${match[2]}` : ''}` : null;
}
