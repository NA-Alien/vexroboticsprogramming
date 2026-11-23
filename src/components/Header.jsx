export function SearchIcon() {
  return <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5"/></svg>;
}

export default function Header({ onSearch, page }) {
  return <header className="site-header">
    <div className="header-inner">
      <button className="search-trigger" onClick={onSearch} aria-label="Search documentation" aria-keyshortcuts="/ Control+k Meta+k"><SearchIcon/><span>Search</span><kbd>/</kbd></button>
      <a href="/" className="site-logo" aria-label="VEX Robotics Programming home"><img src="/favicon.svg" alt="" width="34" height="34"/></a>
      <nav className="top-nav" aria-label="Main navigation">
        <a href="/guides/" aria-current={page === 'guides' ? 'page' : undefined}>Guides</a>
        <a href="/forum/" aria-current={page === 'forum' ? 'page' : undefined}>Forum</a>
        <a href="/sources/" aria-current={page === 'sources' ? 'page' : undefined}>Sources</a>
      </nav>
    </div>
  </header>;
}
