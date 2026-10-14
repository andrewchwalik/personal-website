import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { stops as mountainStops, memories } from '../mountain/data.mjs';
import { stops, route, bridgeRoute } from '../mountain/playground/data.mjs';
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('playground preserves every off-mountain accomplishment and its link', () => {
  assert.deepEqual(stops.map(stop => stop.id), ['president','startup','icecream','home','business']);
  assert.deepEqual(stops.map(stop => stop.url), memories.map(memory => memory.url));
  assert.ok(route.startsWith('M280 165'));
  assert.ok(bridgeRoute.startsWith('M372 522'));
  assert.ok(bridgeRoute.endsWith('600 646'));
  const art=readFileSync(new URL('../mountain/playground/world.webp', import.meta.url));
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.length<600_000);
  assert.equal(mountainStops.find(stop=>stop.id==='coaching').state,'IN PROGRESS');
});

test('both worlds share one guestbook controller and its existing moderation', () => {
  assert.match(source('../house.js'), /import \{ initGuestbook \} from '\.\/guestbook.js/);
  assert.match(source('../mountain/mountain.js'), /import \{ initGuestbook \} from '\.\.\/guestbook.js/);
  const shared=source('../guestbook.js');
  assert.match(shared, /import \{ contentError \} from '\.\/guestbook-filter.mjs'/);
  assert.match(shared, /https:\/\/andrew-home-base.chwalik.workers.dev/);
  assert.match(shared, /message.textContent = entry.message/);
  assert.match(shared, /contentError\(form.elements.message.value\)/);
  assert.match(shared, /name=\\"consent\\" type=\\"checkbox\\" required/);
  assert.doesNotMatch(source('../house.js'), /function validateDraft/);
});

test('mountain guestbook and bridge journeys finish on their branches', () => {
  const code=source('../mountain/mountain.js');
  const visit=code.slice(code.indexOf('function visit(stop)'),code.indexOf('for(const stop of'));
  const result=runInNewContext(`
    const trail={id:'trail'},book={id:'book',getTotalLength:()=>30},bridge={id:'bridge',getTotalLength:()=>60};
    const branches={guestbook:{path:book,junction:100},bridge:{path:bridge,junction:0}};
    const distances={};let position=200,sidePosition=null,activeBranch=null,frame=0,trip=0;
    const records=[], destinations=[];let opened=0;
    const player={classList:{add(){},remove(){}}};
    const $=()=>({textContent:''}),show=()=>{},cancelAnimationFrame=()=>{};
    const location={assign:url=>destinations.push(url)},openGuestbook=()=>opened++;
    function walk(path,from,to,ticket,done){records.push([path.id,from,to]);if(path===trail)position=to;else sidePosition=to;done();}
    ${visit}
    visit({id:'guestbook',label:'Guestbook'});visit({id:'bridge',label:'Playground'});
    ({records,destinations,opened});
  `);
  assert.equal(result.opened,1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.records)),[
    ['trail',200,100],['book',0,30],['book',30,0],['trail',100,0],['bridge',0,60]
  ]);
  assert.equal(result.destinations[0],'./playground/?from=mountain');
});

test('faster travel keeps easing, cancellation and reduced-motion support', () => {
  for(const path of ['../mountain/mountain.js','../mountain/playground/playground.js']) {
    const js=source(path);
    assert.match(js,/Math.abs\(to-from\)\/145\*1000/);
    assert.match(js,/Math.cos\(Math.PI\*t\)/);
    assert.match(js,/cancelAnimationFrame\(frame\)/);
    assert.match(js,/ticket!==trip/);
    assert.match(js,/reduced.matches\?0/);
  }
});
