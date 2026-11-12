import { useEffect, useState } from 'react';

export function useActiveSection(guide) {
  const [active, setActive] = useState(guide.sections[0].id);
  useEffect(() => {
    const ids = [...guide.sections.map(section => section.id), 'references'];
    let frame = null;
    function update() {
      let current = ids[0];
      for (const id of ids) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= 160) current = id;
      }
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 3) current = ids[ids.length - 1];
      setActive(current);
    }
    function onScroll() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => { frame = null; update(); });
    }
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); if (frame !== null) cancelAnimationFrame(frame); };
  }, [guide]);
  return active;
}
