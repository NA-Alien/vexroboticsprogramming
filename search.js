export function searchGuides(query, guides) {
  const phrase = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const terms = phrase.split(' ').filter(Boolean);
  if (!terms.length) return [];
  const results = [];
  for (const guide of guides) {
    for (const section of guide.sections) {
      const prose = [section.title, ...(section.paragraphs || []), ...(section.steps || []), section.formula || '', section.code || '', ...(section.table?.rows || []).flat()].join(' ');
      const text = `${guide.title} ${guide.summary} ${prose}`.toLowerCase();
      if (!terms.every(term => text.includes(term))) continue;
      const match = terms.map(term => prose.toLowerCase().indexOf(term)).filter(i => i >= 0);
      const start = match.length ? Math.max(0, Math.min(...match) - 45) : 0;
      results.push({ guide, section, snippet: (start ? '…' : '') + prose.slice(start, start + 170).replace(/\s+/g, ' ') + (prose.length > start + 170 ? '…' : ''), score: terms.reduce((sum, term) => sum + (section.title.toLowerCase().includes(term) ? 3 : 0) + (guide.title.toLowerCase().includes(term) ? 2 : 0), 0) });
    }
  }
  for (const result of results) {
    if (result.guide.title.toLowerCase() === phrase && result.section === result.guide.sections[0]) result.score += 100;
  }
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
}
