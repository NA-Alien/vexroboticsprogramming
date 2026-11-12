import { guides } from '../content/guides.js';
import { guideGroups, functionLinks } from '../content/navigation.js';

const bySlug = new Map(guides.map(guide => [guide.slug, guide]));

function HomeIntroduction() {
  return <div className="home-introduction">
    <div className="home-start">
      <h1>VEX Robotics Programming</h1>
      <p>VEXcode C++ guides, from your first project to autonomous navigation.</p>
      <div className="home-walkthroughs">
        <h2>Walkthroughs by <a href="https://www.youtube.com/@CoderSponge" target="_blank" rel="noreferrer">CoderSponge</a></h2>
        <a href="https://www.youtube.com/watch?v=MrLuhMFzio8" target="_blank" rel="noreferrer">VS Code setup <span aria-hidden="true">↗</span></a>
        <a href="https://www.youtube.com/watch?v=0KN05wXiOKI" target="_blank" rel="noreferrer">Motors, driver control & autonomous <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </div>;
}

function SeasonFeature() {
  return <section className="season-feature" aria-labelledby="season-title">
      <div className="season-heading"><h2 id="season-title">Override</h2><span>2026–2027 · VEX V5</span></div>
      <a className="game-video" href="https://www.youtube.com/watch?v=68NxYIAzbkY" target="_blank" rel="noreferrer" aria-label="Watch the official Override game reveal on YouTube (opens in a new tab)">
        <img src="/images/override-reveal.jpg" alt="" width="480" height="360"/>
        <span className="game-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
        <span className="game-video-label">Watch the reveal on YouTube <span aria-hidden="true">↗</span></span>
      </a>
      <p>Stack Pins and Cups, control the Toggles, and finish in the Midfield.</p>
      <div className="season-links"><a href="https://manuals.vex.com/" target="_blank" rel="noreferrer">Game manual ↗</a><a href="https://www.vexrobotics.com/v5/competition" target="_blank" rel="noreferrer">Official game page ↗</a></div>
      <p className="season-credit">Game and video: VEX Robotics. Check the current manual for rules and updates.</p>
    </section>;
}

function ReferenceTools({ showSeason }) {
  return <aside className="reference-tools" aria-label="Quick reference">
    {showSeason && <SeasonFeature/>}
    <section className="function-reference"><h2>Function reference</h2><ul>{functionLinks.map(link => <li key={link.name}><a href={`/guides/${link.slug}/#${link.section}`}><code>{link.name}</code><span>{link.description}</span></a></li>)}</ul></section>
    <section className="conventions-reference"><h2>Units & coordinates</h2><dl><div><dt>Distance</dt><dd>Inches in movement and pose examples.</dd></div><div><dt>Turn targets</dt><dd>Degrees, clockwise positive.</dd></div><div><dt>Odometry</dt><dd>Radians, counterclockwise from +X.</dd></div></dl><a href="/guides/odometry/#coordinates">Coordinate convention</a></section>
    <details className="hardware-details"><summary>Example hardware</summary><p>V5 Brain, controller, two drive motors with 18:1 cartridges, and an inertial sensor.</p><p>Individual guides add an optical sensor, tracking wheels, or a distance sensor.</p><a href="/guides/getting-started/#hardware">Ports and configuration</a></details>
  </aside>;
}

export default function Home({ index = false }) {
  return <div className="home-content">
    <header className={`catalog-heading${index ? '' : ' home-heading'}`}>
      {index ? <><h1>Programming guides</h1><p>VEXcode C++ guides for setting up and programming a V5 robot.</p></> : <HomeIntroduction/>}
      <nav className="catalog-sections" aria-label="Guide sections">{guideGroups.map(group => <a key={group.id} href={`#group-${group.id}`} onClick={event => { event.preventDefault(); document.getElementById(`group-${group.id}`)?.scrollIntoView({ block: 'start' }); }}>{group.title}</a>)}</nav>
    </header>
    <div className="catalog-layout"><div className="topic-index">{guideGroups.map(group => <section className="topic-group" key={group.id} aria-labelledby={`group-${group.id}`}><div className="topic-group-heading"><h2 id={`group-${group.id}`}>{group.title}</h2><p>{group.description}</p></div><ul>{group.slugs.map(slug => { const guide = bySlug.get(slug); return <li key={slug}><a href={`/guides/${slug}/`}><h3>{guide.shortTitle}</h3><p>{guide.summary}</p></a></li>; })}</ul></section>)}</div><ReferenceTools showSeason={!index}/></div>
    <p className="catalog-source-note">Code examples use VEXcode C++. <a href="/sources/">Sources</a> include VEX, PROS, Purdue SIGBots, and LemLib. Check ports, dimensions, and gains against your robot.</p>
  </div>;
}
