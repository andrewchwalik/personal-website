import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('both worlds ship the soccer loader before JavaScript runs without duplicate SVG IDs',()=>{
  for(const path of ['../index.html','../mountain/playground/index.html']) {
    const html=read(path);
    assert.match(html,/class="world-loader" role="status"/);
    assert.match(html,/class="loader-ball"/);
    assert.match(html,/class="loader-player"/);
    assert.match(html,/\/mountain\/loading.css\?v=1/);
    const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
    assert.equal(new Set(ids).size,ids.length);
    assert.doesNotMatch(html,/Preparing your adventure/);
  }
});
test('loader stops after readiness or errors and respects reduced motion',()=>{
  const css=read('../mountain/loading.css');
  assert.match(css,/html:not\(.world-loading\) .world-loader,html.world-error .world-loader \{ display:none/);
  assert.match(css,/@keyframes loader-kick/);
  assert.match(css,/@keyframes loader-roll/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation:none!important/);
});
