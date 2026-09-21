import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildHouse } from '../scripts/build-house.mjs';

test('the room artwork is reproducible and fits one responsive coordinate system', async () => {
  const svg = await readFile(new URL('../img/home-base.svg', import.meta.url), 'utf8');
  assert.equal(svg, buildHouse());
  assert.match(svg, /viewBox="0 0 600 600"/);
  assert.doesNotMatch(svg, /undefined|NaN/);
});
test('the optional house branch matches its drawn path', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const svg = await readFile(new URL('../img/chapter-world.svg', import.meta.url), 'utf8');
  const branch = html.match(/id="house-route" d="([^"]+)"/)[1];
  assert.ok(svg.includes(`d="${branch}"`));
  assert.ok(html.includes('https://www.youtube.com/@FirelandsUnited/videos'));
  assert.ok(html.includes('name="consent" type="checkbox" required'));
});
