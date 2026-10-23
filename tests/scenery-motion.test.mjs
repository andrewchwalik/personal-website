import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');

test('both worlds load non-interactive scenery motion with a reduced-motion fallback', () => {
  for (const page of ['../index.html', '../mountain/playground/index.html']) {
    const html = read(page);
    assert.match(html, /scenery-motion\.css\?v=1/);
    assert.match(html, /scenery-motion\.js\?v=2/);
  }
  const css = read('../mountain/scenery-motion.css');
  assert.match(css, /pointer-events: none/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /stroke-dashoffset: -96/);
});

test('river currents trace the rightward middle bend without a blanket offset', () => {
  const source = read('../mountain/scenery-motion.js');
  assert.match(source, /C993 1040 1004 1052 1005 1067/);
  assert.match(source, /C1004 1100 984 1119 976 1135/);
  assert.match(source, /currents.forEach\(\(d, layer\)/);
  assert.doesNotMatch(source, /translate\(5 0\)/);
});

test('flag cloth waves while the pole stays fixed and off-screen motion pauses', () => {
  const source = read('../mountain/scenery-motion.js');
  assert.match(source, /attributeName="d" dur="2.8s"/);
  assert.match(source, /clip-path="url\(#flag-sky-patch\)"/);
  assert.match(source, /svg.pauseAnimations\(\)/);
  assert.match(source, /document.hidden/);
  assert.match(source, /IntersectionObserver/);
  assert.match(source, /reduced.addEventListener\('change', pause\)/);
});
