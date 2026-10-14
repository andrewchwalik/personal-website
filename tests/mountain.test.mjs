import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { route,sideRoute,caveRoute,cave,stops,vlog,memories,bridge,bridgeRoute,guestbook,guestbookRoute } from '../mountain/data.mjs';
test('mountain serves optimized game artwork rather than the retired SVG platforms',()=>{
  const art=readFileSync(new URL('../mountain/world-connected.webp',import.meta.url));
  assert.equal(art.toString('ascii',0,4),'RIFF');
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.length<600_000,'Keep the map fast on mobile connections');
  const html=readFileSync(new URL('../mountain/index.html',import.meta.url),'utf8');
  assert.match(html,/src="world-connected.webp"/);
  assert.doesNotMatch(html,/src="world.svg"/);
});
test('trail branches and destinations use the painted world coordinate space',()=>{
  assert.ok(route.startsWith(`M${bridge.junction.join(' ')}`));
  assert.ok(sideRoute.startsWith(`M${stops.find(stop=>stop.id==='delaware').point.join(' ')}`));
  assert.ok(bridgeRoute.startsWith(`M${bridge.junction.join(' ')}`));
  assert.ok(guestbookRoute.startsWith(`M${guestbook.junction.join(' ')}`));
  assert.ok(guestbookRoute.endsWith(`L${guestbook.point.join(' ')}`));
  assert.ok(sideRoute.endsWith(`L${vlog.point.join(' ')}`));
  assert.ok(caveRoute.startsWith(`M${cave.junction.join(' ')}`));
  assert.ok(caveRoute.endsWith(`L${cave.point.join(' ')}`));
  assert.deepEqual(cave.markerPoint,cave.junction);
  assert.ok(cave.markerPoint[1]>cave.point[1],'Marker sits below the cave, not on the entrance');
  assert.ok(cave.point[1]>stops.find(stop=>stop.id==='debt').point[1]);
  assert.ok(cave.point[1]<stops.find(stop=>stop.id==='firelands').point[1]);
  for(const stop of [...stops,vlog,cave]){
    assert.ok(stop.point[0]>0&&stop.point[0]<600);
    assert.ok(stop.point[1]>0&&stop.point[1]<930);
  }
});
test('mountain keeps the club journey distinct from the vlog and past accomplishments',()=>{
  assert.deepEqual(stops.map(s=>s.id),['masters','delaware','headcoach','firelands','coaching','debt','spanish','doctorate','future','summit']);
  assert.equal(stops.at(-1).title,'Buy European Club');
  assert.equal(stops.at(-1).label,'Buy European Club');
  assert.equal(stops.at(-1).preview,true);
  assert.equal(vlog.id,'vlog');assert.equal(memories.length,5);
  assert.equal(stops.filter(s=>s.state==='COMPLETED').length,4);
  assert.ok(memories.every(memory=>!memory.title.includes('masters')));
});
