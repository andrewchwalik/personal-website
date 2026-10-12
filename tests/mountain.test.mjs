import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildMountain } from '../scripts/build-mountain.mjs';
import { route,sideRoute,stops,vlog,memories } from '../mountain/data.mjs';
test('mountain artwork shares the interactive trails and is reproducible',()=>{
  const art=buildMountain();
  assert.equal(readFileSync(new URL('../mountain/world.svg',import.meta.url),'utf8'),art);
  assert.ok(art.includes(`d="${route}"`));assert.ok(art.includes(`d="${sideRoute}"`));
  assert.doesNotMatch(art,/NaN|undefined/);
  assert.match(art,/grey granite mountain/);
  assert.doesNotMatch(art,/#b9653d|#9e5038|#f3bd59/);
});
test('mountain keeps the club journey distinct from the vlog and past accomplishments',()=>{
  assert.deepEqual(stops.map(s=>s.id),['camp','delaware','firelands','debt','future','summit']);
  assert.equal(stops.at(-1).title,'Buy a soccer club in England.');
  assert.equal(stops.at(-1).preview,true);
  assert.equal(vlog.id,'vlog');assert.equal(memories.length,6);
  assert.equal(stops.filter(s=>s.state==='COMPLETED').length,2);
});
