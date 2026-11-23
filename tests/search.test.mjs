import test from 'node:test';
import assert from 'node:assert/strict';
import { searchGuides } from '../src/lib/search.js';
import { guides } from '../src/content/guides.js';

const fixture = [{ slug: 'pid', title: 'PID control', summary: 'Tune your turn', sections: [
  { id: 'settling', title: 'Settling and timeouts', paragraphs: ['A turn controller must stay within the tolerance.'], code: 'wait(10, msec);' },
  { id: 'derivative', title: 'Derivative', paragraphs: ['Control overshoot with damping.'] }
] }];
test('search finds section content with case-insensitive multiword queries', () => {
  const result = searchGuides('TURN tolerance', fixture);
  assert.equal(result[0].section.id, 'settling');
  assert.match(result[0].snippet, /tolerance/);
});
test('search matches a guide title and returns a usable destination', () => {
  assert.equal(searchGuides('PID', fixture)[0].guide.slug, 'pid');
});

test('search opens Motion chaining under Driving to coordinates', () => {
  const [result] = searchGuides('motion chaining', guides);
  assert.equal(result.guide.slug, 'drive-to-point');
  assert.equal(result.section.id, 'motion-chaining');
});

test('an exact guide title opens the beginning before related later sections', () => {
  for (const guide of guides) {
    const [first] = searchGuides(`  ${guide.title.toUpperCase().replaceAll(' ', '  ')}  `, guides);
    assert.equal(first.guide.slug, guide.slug);
    assert.equal(first.section.id, guide.sections[0].id);
  }
});
test('empty and unknown queries have no fabricated results', () => {
  assert.deepEqual(searchGuides('  ', fixture), []);
  assert.deepEqual(searchGuides('pneumatic', fixture), []);
});
test('punctuation is literal, not executable regex', () => {
  assert.deepEqual(searchGuides('[.*', fixture), []);
  assert.equal(searchGuides('wait(10,', fixture)[0].section.id, 'settling');
});
