import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { stops as mountainStops, memories } from '../mountain/data.mjs';
import { stops, route, bridgeRoute, bridgeJunction } from '../mountain/playground/data.mjs';
import { wrapDistance, shortestLoopTarget } from '../mountain/playground/loop.mjs';
const source = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('playground preserves every off-mountain accomplishment and its link', () => {
  assert.deepEqual(stops.map(stop => stop.id), ['president','startup','icecream','home','business','soccer','family','roadtrip']);
  assert.deepEqual(stops.slice(0,5).map(stop => stop.url), memories.map(memory => memory.url));
  assert.ok(route.endsWith('Z'), 'Playground trail is a closed loop');
  assert.ok(bridgeRoute.startsWith(`M${bridgeJunction.join(' ')}`));
  const art=readFileSync(new URL('../mountain/playground/world-junction.webp', import.meta.url));
  assert.equal(art.toString('ascii',8,12),'WEBP');
  assert.ok(art.length<600_000);
  assert.equal(mountainStops.find(stop=>stop.id==='coaching').state,'IN PROGRESS');
});

test('new playground stories have distinct equipment and safe optional links', () => {
  assert.equal(new Set(stops.map(stop=>stop.feature)).size,8);
  assert.deepEqual(stops.slice(5).map(stop=>stop.label),['College Athlete','Start a Family','USA Roadtrip']);
  for(const stop of stops){
    assert.ok(stop.point[0]>0 && stop.point[0]<600);
    assert.ok(stop.point[1]>0 && stop.point[1]<930);
    assert.ok(stop.title && stop.text && stop.feature);
  }
  const code=source('../mountain/playground/playground.js');
  const show=code.slice(code.indexOf('function show(stop)'),code.indexOf('function visit(stop)'));
  const result=runInNewContext(`
    const elements={};
    const $=id=>elements[id]??=({children:[],replaceChildren(){this.children=[]},append(link){this.children.push(link)}});
    const document={createElement:()=>({}),querySelectorAll:()=>[]}; const titleCase=text=>text;
    ${show}
    show({title:'Old',text:'Story',url:'https://example.com',id:'old'});
    const previous=$('actions').children.length;
    show({title:'New',text:'Story',id:'new'});
    ({previous,current:$('actions').children.length});
  `);
  assert.equal(result.previous,1);
  assert.equal(result.current,0);
});

test('loop travel takes the shorter direction without jumping across the seam', () => {
  assert.equal(shortestLoopTarget(90,10,100),110);
  assert.equal(shortestLoopTarget(10,90,100),-10);
  assert.equal(shortestLoopTarget(10,40,100),40);
  assert.equal(shortestLoopTarget(40,10,100),10);
  assert.equal(shortestLoopTarget(20,20,100),20);
  assert.equal(wrapDistance(-10,100),90);
  assert.equal(wrapDistance(110,100),10);
  assert.equal(wrapDistance(100,100),0);
  for(let from=0;from<100;from+=7)for(let to=0;to<100;to+=9){
    const target=shortestLoopTarget(from,to,100);
    assert.ok(Math.abs(target-from)<=50);
    assert.equal(wrapDistance(target,100),to);
  }
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

import { branchTransfer } from '../mountain/branch-travel.mjs';
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
  `, { branchTransfer });
  assert.equal(result.opened,1);
  assert.deepEqual(JSON.parse(JSON.stringify(result.records)),[
    ['trail',200,100],['book',0,30],['book',30,0],['trail',100,0],['bridge',0,60]
  ]);
  assert.equal(result.destinations[0],'/mountain/playground/?from=mountain');
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
