import { useCallback, useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { guides } from './content/guides.js';
import Header from './components/Header.jsx';
import GuidePage, { SourceList } from './components/GuidePage.jsx';
import SearchDialog from './components/SearchDialog.jsx';
import Home from './components/Home.jsx';
import { parseRoute } from './lib/routes.js';
import { pageMetadata } from './lib/metadata.js';

function SourcesPage() {
  return <div className="sources-page"><div className="breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span>Sources</span></div><h1>Sources & references</h1><p className="page-description">Primary documentation used in these guides, with links beside the relevant explanations.</p><div className="source-editorial"><h2>How these sources are used</h2><p>VEX documentation defines the device APIs used in the C++ examples. PROS documentation provides a useful comparison for motor control and task organization. Purdue SIGBots and LemLib cover feedback control, tracking, and tuning.</p><p>All examples here are written for VEXcode C++; a linked PROS or LemLib example cannot be pasted into VEXcode unchanged. The odometry and wall-reset equations are explained using the coordinate convention stated in these guides.</p><p>These are educational examples, reviewed against the linked documentation. They have not been compiled with the VEX toolchain or tested on a physical robot. Verify wiring, dimensions, sensor signs, and controller behavior on your hardware.</p></div><SourceList/><p className="source-review-date">References consulted November 11, 2026. This is an independent resource, not an official VEX Robotics publication.</p></div>;
}

export default function App({ initialRoute }) {
  const [route, setRoute] = useState(() => initialRoute || parseRoute(location.pathname, location.hash));
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const guide = guides.find(item => item.slug === route.slug);
  const notFound = route.page === 'not-found' || (route.slug && !guide);
  useEffect(() => {
    const onHash = () => setRoute(parseRoute(location.pathname, location.hash));
    const onKey = e => {
      const editing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(value => !value); }
      else if (e.key === '/' && !editing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); setSearchOpen(true); }
    };
    const onRepeatedLink = e => {
      if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      const href = e.target instanceof Element ? e.target.closest('a')?.getAttribute('href') : null;
      if (!href) return;
      const target = new URL(href, location.href);
      if (target.origin !== location.origin || target.pathname !== location.pathname || target.search !== location.search || !target.hash || target.hash !== location.hash) return;
      const section = document.getElementById(target.hash.slice(1));
      if (!section) return;
      e.preventDefault();
      if (section) { section.scrollIntoView({ block: 'start' }); section.focus({ preventScroll: true }); }
    };
    addEventListener('hashchange', onHash); addEventListener('keydown', onKey);
    document.addEventListener('click', onRepeatedLink);
    return () => { removeEventListener('hashchange', onHash); removeEventListener('keydown', onKey); document.removeEventListener('click', onRepeatedLink); };
  }, []);
  useEffect(() => {
    document.title = pageMetadata(location.pathname).title;
    const section = route.section && document.getElementById(route.section);
    if (section) section.scrollIntoView({ block: 'start' });
    if (!searchOpen) (section || document.getElementById('main'))?.focus({ preventScroll: true });
  }, [route.page, route.slug, route.section, notFound]);
  return <>
    <a className="skip-link" href="#main" onClick={e => { e.preventDefault(); document.getElementById('main').focus(); }}>Skip to content</a>
    <Header onSearch={() => setSearchOpen(true)} page={route.page}/>
    <main id="main" tabIndex="-1">
      {notFound ? <div className="not-found"><h1>Page not found</h1><p>This guide or section does not exist.</p><a className="button-primary" href="/guides/">View all guides →</a></div> : route.page === 'sources' ? <SourcesPage/> : guide ? <GuidePage key={guide.slug} guide={guide}/> : <Home index={route.page === 'guides'}/>}
    </main>
    <footer className="site-footer"><a className="footer-brand" href="/">VEX Robotics Programming</a><a className="creator-credit" href="https://www.youtube.com/@CoderSponge" target="_blank" rel="noreferrer">Made by CoderSponge ↗</a><a href="/sources/">Sources & references</a><span className="footer-independent">Independent documentation</span></footer>
    <SearchDialog open={searchOpen} onClose={closeSearch}/>
    {import.meta.env.PROD && <Analytics />}
  </>;
}

