import { useRef, useState } from 'react';
import { guides } from '../content/guides.js';
import { sources } from '../content/sources.js';
import CodeBlock from './CodeBlock.jsx';
import Diagram from './Diagrams.jsx';
import { guideGroups, relatedGuideSlugs } from '../content/navigation.js';
import { useActiveSection } from '../hooks/useActiveSection.js';

export function Citations({ ids }) {
  if (!ids?.length) return null;
  return <p className="citations">References: {ids.map((id, index) => <span key={id}>{index > 0 ? ' · ' : ''}<a href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].publisher}: {sources[id].title}<span className="sr-only"> (opens in a new tab)</span></a></span>)}</p>;
}

export function SourceList({ ids = Object.keys(sources) }) {
  return <ol className="source-list">{ids.map(id => <li key={id}><span className="source-publisher">{sources[id].publisher}</span><a href={sources[id].url} target="_blank" rel="noreferrer">{sources[id].title}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a><p>{sources[id].note}</p></li>)}</ol>;
}

export default function GuidePage({ guide }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const mobileContents = useRef(null);
  const index = guides.indexOf(guide);
  const activeSection = useActiveSection(guide);
  return <div className="docs-layout">
    <aside className="guide-sidebar">
      <button className="mobile-guide-toggle" aria-expanded={menuOpen} aria-controls="guide-navigation" onClick={() => setMenuOpen(!menuOpen)}><span>Guides <span className="mobile-current-guide">/ {guide.shortTitle}</span></span><span aria-hidden="true">{menuOpen ? '−' : '+'}</span></button>
      <div id="guide-navigation" className={menuOpen ? 'guide-nav-content is-open' : 'guide-nav-content'}>
        <a className="sidebar-label" href="/guides/">All guides</a>
        <nav aria-label="Guide navigation">{guideGroups.map(group => <div className="sidebar-group" key={group.id}><strong>{group.title}</strong>{group.slugs.map(slug => { const item = guides.find(item => item.slug === slug); return <a key={slug} href={`/guides/${slug}/`} aria-current={item === guide ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{item.shortTitle}</a>; })}</div>)}</nav>
        <a className="sidebar-source-link" href="/sources/">Sources & references <span aria-hidden="true">↗</span></a>
      </div>
    </aside>
    <article className="guide-article">
      <div className="breadcrumb"><a href="/guides/">Guides</a><span aria-hidden="true">/</span><span>{guide.shortTitle}</span></div>
      <header className="article-heading"><h1>{guide.title}</h1><p>{guide.description}</p></header>
      <div className="prerequisites"><strong>Before you start</strong><p>{guide.prerequisite} <a href="/guides/getting-started/#configuration">Shared configuration ↗</a></p></div>
      <details className="mobile-toc" ref={mobileContents}><summary>On this page<span className="current-section">{guide.sections.find(section => section.id === activeSection)?.title || 'Sources'}</span></summary><nav aria-label="Article sections" onClick={event => { if (event.target.closest('a')) mobileContents.current.open = false; }}>{guide.sections.map(section => <a key={section.id} href={`/guides/${guide.slug}/#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined}>{section.title}</a>)}<a href={`/guides/${guide.slug}/#references`} aria-current={activeSection === 'references' ? 'location' : undefined}>Sources</a></nav></details>
      {guide.sections.map(section => <section className="article-section" id={section.id} key={section.id} tabIndex="-1" aria-labelledby={`heading-${section.id}`}>
        <h2 id={`heading-${section.id}`}><a className="section-anchor" href={`/guides/${guide.slug}/#${section.id}`}>{section.title}<span aria-hidden="true" className="anchor-symbol">#</span></a></h2>
        {section.paragraphs?.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {section.formula && <pre className="formula" tabIndex="0" aria-label={`${section.title} formula`}>{section.formula}</pre>}
        {section.diagram && <Diagram type={section.diagram}/>}
        {section.table && <div className="table-scroll" tabIndex="0" role="region" aria-label={`${section.title} table`}><table><thead><tr>{section.table.headings.map(heading => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>}
        {section.steps && <ol className="instruction-steps">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}
        {section.links && <ul className="resource-links">{section.links.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noreferrer">{link.label}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>}
        {section.code && <CodeBlock code={section.code} label={section.codeLabel}/>}
        <Citations ids={section.sources}/>
      </section>)}
      <nav className="related-guides" aria-label="Related guides"><h2>Related guides</h2><ul>{(relatedGuideSlugs[guide.slug] || []).map(slug => {
        const related = guides.find(item => item.slug === slug);
        return <li key={slug}><a href={`/guides/${slug}/`}>{related.shortTitle}<span>{related.summary}</span></a></li>;
      })}</ul></nav>
      <section className="article-section article-references" id="references" tabIndex="-1" aria-labelledby="heading-references"><h2 id="heading-references">Sources for this guide</h2><p>Examples are written for VEXcode C++. PROS and LemLib references explain related concepts; their APIs are different.</p><SourceList ids={guide.sources}/></section>
      <nav className="guide-pagination" aria-label="Previous and next guides">
        {index > 0 ? <a href={`/guides/${guides[index - 1].slug}/`}><span>Previous guide</span>{guides[index - 1].shortTitle}</a> : <a href="/guides/"><span>Back to</span>All guides</a>}
        {index < guides.length - 1 ? <a href={`/guides/${guides[index + 1].slug}/`}><span>Next guide</span>{guides[index + 1].shortTitle} →</a> : <a href="/sources/"><span>Further reading</span>Sources & references →</a>}
      </nav>
      <button className="back-to-top" onClick={() => { window.scrollTo({ top: 0 }); document.getElementById('main')?.focus({ preventScroll: true }); }}>Back to top ↑</button>
    </article>
    <aside className="page-toc"><strong>On this page</strong><nav aria-label="On this page">{guide.sections.map(section => <a key={section.id} href={`/guides/${guide.slug}/#${section.id}`} aria-current={activeSection === section.id ? 'location' : undefined}>{section.title}</a>)}<a href={`/guides/${guide.slug}/#references`} aria-current={activeSection === 'references' ? 'location' : undefined}>Sources</a></nav></aside>
  </div>;
}
