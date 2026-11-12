import test from 'node:test';
import assert from 'node:assert/strict';
import { guideGroups, functionLinks } from '../src/content/navigation.js';
import { guides } from '../src/content/guides.js';

test('topic groups include every guide exactly once', () => {
  const slugs = guideGroups.flatMap(group => group.slugs);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.deepEqual([...slugs].sort(), guides.map(guide => guide.slug).sort());
});

test('each function reference points to a real guide section containing the function', () => {
  for (const link of functionLinks) {
    const guide = guides.find(guide => guide.slug === link.slug);
    const section = guide?.sections.find(section => section.id === link.section);
    assert.ok(section, `${link.name} destination exists`);
    assert.ok(section.code.includes(link.name.replace('()', '(')), `${link.name} is shown at its destination`);
  }
});
