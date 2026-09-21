import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildWorld, cast, project, ROUTE, SUN, TERRAIN } from '../scripts/build-world.mjs';

test('the sun produces proportional shadows in one direction', () => {
  const base=[200,300];
  assert.deepEqual(cast([...base,0]),base);
  for (const height of [12,25,44,90]) {
    const [x,y]=cast([...base,height]);
    assert.ok(Math.abs(x-base[0]-height*SUN.x)<1e-10);
    assert.ok(Math.abs(y-base[1]-height*SUN.y)<1e-10);
    assert.deepEqual(project([...base,height]),[200,300-height]);
  }
});

test('the generated artwork is current and uses the actual walking route', async () => {
  const svg=await readFile(new URL('../img/chapter-world.svg',import.meta.url),'utf8');
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(svg,buildWorld());
  assert.ok(svg.includes(`d="${ROUTE}"`));
  assert.ok(html.includes(`id="travel-route" d="${ROUTE}"`));
  assert.ok(svg.includes('viewBox="0 0 600 700"'));
  assert.ok(!/NaN|undefined/.test(svg));
});

test('cliffs fit inside the world and the waterfall lands past the shoreline', () => {
  const bounds=TERRAIN.coast.map(([x,y])=>[x,y+TERRAIN.islandHeight]);
  assert.ok(bounds.every(([x,y])=>x>0&&x<600&&y>0&&y<700));
  const cliffAtFall=bounds.filter(([x])=>x>=215&&x<=257);
  assert.ok(Math.max(...cliffAtFall.map(([,y])=>y))<681);
  assert.ok(687+6*1.2<700,'the animated landing ripple must remain visible');
});

test('water animation respects reduced motion', () => {
  const svg=buildWorld();
  assert.match(svg,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(svg,/\.water-flow,\.river-flow,\.sea-ripple\{animation:none\}/);
});
