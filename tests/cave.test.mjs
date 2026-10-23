import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {theatreVideos} from '../theatre-videos.mjs';

test('cave cinema uses all seven films, replaces playback and cleans up on any close',()=>{
  class Element {
    constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.events={};this.hidden=false;this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c)};}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    cloneNode(){return new Element(this.tag);}
    setAttribute(key,value){this[key]=value;}
    addEventListener(event,callback){this.events[event]=callback;}
    querySelectorAll(){return this.children;}
    scrollIntoView(){}
    focus(){this.focused=true;}
    showModal(){this.open=true;}
    close(){this.open=false;this.events.close();}
  }
  const elements=Object.fromEntries(['cave-cinema','cave-screen','cave-films','cave-status','cave-youtube','leave-cave','player','cave-stop'].map(id=>[id,new Element()]));
  elements['cave-screen'].firstElementChild=new Element('p');
  const events={};
  runInNewContext(readFileSync(new URL('../mountain/cave.js',import.meta.url),'utf8').replace(/^import[^\n]+\n/,''),{
    theatreVideos,scrollY:100,scrollTo(){},document:{getElementById:id=>elements[id],createElement:tag=>new Element(tag),querySelector:()=>elements['cave-stop'],addEventListener:(name,callback)=>events[name]=callback}
  });
  events['enter-cave']();
  assert.equal(elements['cave-cinema'].open,true);
  assert.ok(elements.player.classes.has('inside-cave'));
  const buttons=elements['cave-films'].children;
  assert.equal(buttons.length,7);
  buttons.forEach((button,i)=>{
    button.events.click();
    assert.equal(elements['cave-screen'].children.length,1);
    assert.equal(elements['cave-screen'].children[0].src,`https://www.youtube-nocookie.com/embed/${theatreVideos[i].id}?autoplay=1&mute=1&playsinline=1&rel=0`);
    assert.equal(elements['cave-youtube'].href,`https://www.youtube.com/watch?v=${theatreVideos[i].id}`);
  });
  elements['leave-cave'].events.click();
  assert.equal(elements['cave-screen'].children[0].tag,'p');
  assert.equal(elements['cave-youtube'].href,'https://www.youtube.com/@AndrewChwalik');
  assert.equal(elements.player.classes.has('inside-cave'),false);
  assert.equal(elements['cave-stop'].focused,true);
  events['enter-cave']();buttons[0].events.click();elements['cave-cinema'].close();
  assert.equal(elements['cave-screen'].children[0].tag,'p','Escape-triggered close also removes playback');
});

test('YouTube sign sits in the cave room and defaults to the channel',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/<div class="cave-room"><a id="cave-youtube" href="https:\/\/www.youtube.com\/@AndrewChwalik"/);
  const programme=html.match(/<section class="cave-programme"[\s\S]*?<\/section>/)[0];
  assert.doesNotMatch(programme,/cave-youtube|Watch on YouTube/);
});

test('waterfall motion cannot intercept clicks and honors motion preferences',()=>{
  const css=readFileSync(new URL('../mountain/cave.css',import.meta.url),'utf8');
  assert.match(css,/\.water-effects\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/animation-play-state:\s*paused/);
  const source=readFileSync(new URL('../mountain/water.js',import.meta.url),'utf8');
  assert.match(source,/document.hidden/);assert.match(source,/IntersectionObserver/);
});

import { branchTransfer } from '../mountain/branch-travel.mjs';
test('switching side quests retraces the old branch before entering the cave and leaving it',()=>{
  const source=readFileSync(new URL('../mountain/mountain.js',import.meta.url),'utf8');
  const visit=source.slice(source.indexOf('function visit(stop)'),source.indexOf('for(const stop of'));
  const result=runInNewContext(`
    const trail={id:'trail'}, vlogPath={id:'vlog',getTotalLength:()=>40}, cavePath={id:'cave',getTotalLength:()=>20};
    const branches={vlog:{path:vlogPath,junction:100},cave:{path:cavePath,junction:200}};
    const distances={firelands:150};
    let position=100,sidePosition=40,activeBranch=branches.vlog,frame=0,trip=0;
    const records=[],events=[];
    const player={classList:{add(){},remove(){}}};
    const $=()=>({textContent:''});const show=()=>{};const cancelAnimationFrame=()=>{};
    const document={dispatchEvent:event=>events.push(event.type)};
    function Event(type){this.type=type;}
    function walk(path,from,to,ticket,done){records.push([path.id,from,to]);if(path===trail)position=to;else sidePosition=to;done();}
    ${visit}
    visit({id:'cave',label:'Cave cinema'});
    const atCave=sidePosition;
    visit({id:'firelands',label:'Firelands United'});
    ({records,events,atCave,position,sidePosition});
  `, { branchTransfer });
  assert.deepEqual(JSON.parse(JSON.stringify(result.records)),[
    ['vlog',40,0],['trail',100,200],['cave',0,20],['cave',20,0],['trail',200,150]
  ]);
  assert.equal(result.atCave,20);assert.equal(result.position,150);assert.equal(result.sidePosition,null);
  assert.equal(result.events[0],'enter-cave');
});
