import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { nearestPoint } from '../mountain/path-lookup.mjs';

test('route lookups reuse geometry and refine to sub-pixel accuracy', () => {
  let lengths = 0, points = 0;
  const path = {
    getTotalLength() { lengths++; return 2400; },
    getPointAtLength(d) { points++; return { x: d, y: 0 }; },
  };
  for (const x of [0, 12.3, 221.7, 1000, 2399.9, 2400]) {
    assert.ok(Math.abs(nearestPoint(path, [x, 5]) - x) <= .125);
  }
  assert.equal(lengths, 1);
  assert.ok(points < 800, `Expected fewer than 800 geometry calls, got ${points}`);
});

test('looping paths and separate path caches resolve correctly', () => {
  const circle = { getTotalLength: () => 200 * Math.PI, getPointAtLength: d => ({ x: 100 * Math.cos(d / 100), y: 100 * Math.sin(d / 100) }) };
  assert.ok(Math.abs(nearestPoint(circle, [0, 100]) - 50 * Math.PI) < .13);
  const line = { getTotalLength: () => 3, getPointAtLength: d => ({ x: d, y: 0 }) };
  assert.equal(nearestPoint(line, [3, 0]), 3);
});

test('fonts do not block either map and artwork is preloaded', () => {
  const css = readFileSync(new URL('../mountain/mountain.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /@import/);
  for (const file of ['index.html', 'mountain/playground/index.html']) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.match(html, /fonts.googleapis.com[^>]+media="print"/);
    assert.match(html, /rel="preload" as="image"/);
  }
});
