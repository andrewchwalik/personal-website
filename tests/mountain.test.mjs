import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { route,sideRoute,stops,vlog,memories } from '../mountain/data.mjs';
test('mountain serves optimized game artwork rather than the retired SVG platforms',()=>{
  const art=readFileSync(new URL('../mountain/world-painted.webp',import.meta.url));
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.length<600_000,'Keep the map fast on mobile connections');
  const html=readFileSync(new URL('../mountain/index.html',import.meta.url),'utf8');
  assert.match(html,/src="world-painted.webp"/);
  assert.doesNotMatch(html,/src="world.svg"/);
});
test('trail branches and destinations use the painted world coordinate space',()=>{
  assert.ok(route.startsWith(`M${stops[0].point.join(' ')}`));
  assert.ok(sideRoute.startsWith(`M${stops[1].point.join(' ')}`));
  assert.ok(sideRoute.endsWith(`L${vlog.point.join(' ')}`));
  for(const stop of [...stops,vlog]){
    assert.ok(stop.point[0]>0&&stop.point[0]<600);
    assert.ok(stop.point[1]>0&&stop.point[1]<930);
  }
});
test('mountain keeps the club journey distinct from the vlog and past accomplishments',()=>{
  assert.deepEqual(stops.map(s=>s.id),['camp','delaware','firelands','debt','future','summit']);
  assert.equal(stops.at(-1).title,'Buy a soccer club in England.');
  assert.equal(stops.at(-1).preview,true);
  assert.equal(vlog.id,'vlog');assert.equal(memories.length,6);
  assert.equal(stops.filter(s=>s.state==='COMPLETED').length,2);
});
