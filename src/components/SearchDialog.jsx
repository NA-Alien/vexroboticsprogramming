import { useEffect, useRef, useState } from 'react';
import { guides } from '../content/guides.js';
import { searchGuides } from '../lib/search.js';
import { SearchIcon } from './Header.jsx';

export default function SearchDialog({ open, onClose }) {
  const dialog = useRef(null);
  const input = useRef(null);
  const [query, setQuery] = useState('');
  const results = searchGuides(query, guides);
  useEffect(() => {
    if (!open) return;
    const restore = document.activeElement;
    setQuery('');
    dialog.current.showModal();
    input.current.focus();
    return () => { dialog.current?.close(); if (restore?.isConnected) restore.focus(); };
  }, [open]);
  function keyboard(event) {
    if (event.key === 'Tab') {
      const controls = [...dialog.current.querySelectorAll('button:not([disabled]), input, a[href]')].filter(control => control.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const controls = [input.current, ...dialog.current.querySelectorAll('.search-result')];
      const index = controls.indexOf(document.activeElement);
      const next = (index + (event.key === 'ArrowDown' ? 1 : -1) + controls.length) % controls.length;
      event.preventDefault(); controls[next].focus();
    }
    if (event.key === 'Enter' && document.activeElement === input.current && results.length) {
      event.preventDefault(); dialog.current.querySelector('.search-result')?.click();
    }
  }
  return <dialog ref={dialog} className="search-dialog" aria-labelledby="search-heading" onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={keyboard} onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className="search-dialog-top"><h2 id="search-heading">Search documentation</h2><button className="plain-button" onClick={onClose} aria-label="Close search">Close <kbd>Esc</kbd></button></div>
    <div className="search-input-wrap"><SearchIcon/><input ref={input} value={query} onChange={e => setQuery(e.target.value)} aria-label="Search guides" placeholder="Search a topic, function, or sensor…" autoComplete="off" spellCheck="false"/>{query && <button className="clear-search" aria-label="Clear search" onClick={() => { setQuery(''); input.current.focus(); }}>×</button>}</div>
    <div className="search-results">
      {!query.trim() ? <div className="search-suggestions"><p>Browse a guide</p>{guides.map(guide => <a className="search-result" key={guide.slug} href={`/guides/${guide.slug}/`} onClick={onClose}>{guide.title}<span aria-hidden="true">→</span></a>)}</div> : <>
        <p className="search-count" role="status">{results.length ? `${results.length} matching sections` : `No results for “${query}”`}</p>
        {!results.length && <p className="empty-search">Try “heading”, “tracking wheel”, or “timeout”.</p>}
        {results.map(({ guide, section, snippet }) => <a className="search-result" key={`${guide.slug}-${section.id}`} href={`/guides/${guide.slug}/#${section.id}`} onClick={onClose}><span><span className="search-guide-name">{guide.title}</span><strong>{section.title}</strong><span className="result-snippet">{snippet}</span></span><span aria-hidden="true">→</span></a>)}
      </>}
    </div>
    <div className="search-help">↑ ↓ to move <span>Enter to open</span><span>Esc to close</span></div>
  </dialog>;
}
