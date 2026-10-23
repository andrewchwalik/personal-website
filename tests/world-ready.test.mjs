import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { titleCase } from '../mountain/world-ready.mjs';
import { route, slideRoute, stops } from '../mountain/playground/data.mjs';

test('titles capitalize words without changing apostrophes or acronyms',()=>{
  assert.equal(titleCase("Get my master's degree."),"Get My Master's Degree.");
  assert.equal(titleCase('USA Roadtrip'),'USA Roadtrip');
});

test('world reveal waits for artwork decoding and a complete paint setup',async()=>{
  const source=readFileSync(new URL('../mountain/world-ready.mjs',import.meta.url),'utf8');
  let finishDecode;
  const decoded=new Promise(resolve=>{finishDecode=resolve;});
  const changes=[];
  const stage={querySelector:()=>({decode:()=>decoded}),removeAttribute:name=>changes.push(name)};
  const context={document:{querySelector:()=>stage,documentElement:{classList:{remove:name=>changes.push(name)}}},requestAnimationFrame:callback=>callback()};
  const promise=runInNewContext(source.replaceAll('export ','')+';revealWorld()',context);
  assert.deepEqual(changes,[]);
  finishDecode();
  assert.equal(await promise,true);
  assert.deepEqual(changes,['world-loading','aria-busy']);
});

test('playset traversal has separate rope and slide approaches meeting at the platform',()=>{
  assert.ok(route.includes('238 221 L264 148 L245 140'));
  assert.ok(slideRoute.includes('182 198 Q205 170 217 133 L245 140'));
  const rockWall = 'L245 140 L294 142 L310 195';
  assert.ok(route.includes(rockWall), 'Left-to-right leaves the platform down the rock wall');
  assert.ok(slideRoute.includes(rockWall), 'Reverse traversal climbs the same rock wall before the slide');
  assert.ok(route.startsWith('M363 110'));
  assert.ok(slideRoute.endsWith('363 110'), 'Both routes join the same right-hand path');
  assert.deepEqual(stops.find(stop=>stop.id==='president').point,[245,140]);
  assert.equal(stops.find(stop=>stop.id==='soccer').label,'College Athlete');
});

test('failed artwork stays covered and offers a retry instead of an incomplete map',async()=>{
  const source=readFileSync(new URL('../mountain/world-ready.mjs',import.meta.url),'utf8');
  const changes=[],buttons=[];
  const stage={querySelector:()=>({decode:async()=>{throw Error('offline')}}),append:button=>buttons.push(button)};
  const context={document:{querySelector:()=>stage,createElement:()=>({}),documentElement:{classList:{add:name=>changes.push(name)}}}};
  assert.equal(await runInNewContext(source.replaceAll('export ','')+';revealWorld()',context),false);
  assert.deepEqual(changes,['world-error']);
  assert.match(buttons[0].textContent,/retry/);
});
