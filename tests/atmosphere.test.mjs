import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('clouds drift only in the background sky and remain non-interactive',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../mountain/atmosphere.css',import.meta.url),'utf8');
  assert.match(html,/<clipPath id="distant-sky"><path clip-rule="evenodd"/);
  assert.match(html,/<g clip-path="url\(#distant-sky\)">/);
  assert.equal((html.match(/class="sky-cloud cloud-/g)||[]).length,3);
  assert.match(css,/pointer-events: none/);
  assert.match(css,/150s linear infinite/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation-play-state: paused/);
  assert.ok(readFileSync(new URL('../mountain/sky-cloud.webp',import.meta.url)).length<100_000);
});

test('shaded character keeps independent limbs for walking',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  for(const part of ['leg left','leg right','arm left','arm right'])assert.ok(html.includes(`class="${part}"`));
  for(const material of ['hero-skin','hero-shirt','hero-trousers','hero-hair','hero-ground'])assert.ok(html.includes(`url(#${material})`));
});
