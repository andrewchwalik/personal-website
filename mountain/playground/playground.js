import { route, slideRoute, bridgeRoute, bridgeJunction, bridgeMarker, stops } from './data.mjs?v=5';
import { revealWorld, titleCase } from '../world-ready.mjs';
import { wrapDistance, shortestLoopTarget } from './loop.mjs';
const $ = id => document.getElementById(id);
const trail=$('route'), bridge=$('bridge-route'), player=$('player');
trail.setAttribute('d',route);bridge.setAttribute('d',bridgeRoute);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function nearest(point,path=trail){
  let best=0, gap=Infinity;
  for(let d=0;d<=path.getTotalLength();d+=.5){const p=path.getPointAtLength(d),distance=Math.hypot(p.x-point[0],p.y-point[1]);if(distance<gap){gap=distance;best=d;}}
  return best;
}
const junction=nearest(bridgeJunction);
const slide=document.createElementNS('http://www.w3.org/2000/svg','path');
slide.setAttribute('d',slideRoute);trail.parentNode.append(slide);
const playStart=nearest([112,236]), playTop=nearest([245,140]), slideTop=nearest([245,140],slide);
let direction=1;
let position=junction, bridgePosition=null, frame=0, trip=0;
function place(path,d){
  const distance=path===trail?wrapDistance(d,trail.getTotalLength()):d;
  let p=path.getPointAtLength(distance);
  const inPlayset=path===trail && distance>=playStart;
  if(inPlayset && direction<0){
    const at=distance<=playTop
      ? (distance-playStart)/(playTop-playStart)*slideTop
      : slideTop+(distance-playTop)/(trail.getTotalLength()-playTop)*(slide.getTotalLength()-slideTop);
    p=slide.getPointAtLength(at);
  }
  player.classList.toggle('sliding',inPlayset && direction<0 && distance<playTop);
  player.classList.toggle('climbing',inPlayset && direction>0 && distance<playTop);
  player.style.left=`${p.x/600*100}%`;player.style.top=`${p.y/930*100}%`;
}
function walk(path,from,to,ticket,done){
  direction=Math.sign(to-from)||direction;
  const duration=reduced.matches?0:Math.abs(to-from)/145*1000,start=performance.now();
  function tick(now){
    if(ticket!==trip)return;
    const t=duration?Math.min(1,(now-start)/duration):1;
    const d=from+(to-from)*(1-Math.cos(Math.PI*t))/2;
    if(path===trail)position=wrapDistance(d,trail.getTotalLength());else bridgePosition=d;
    place(path,d);
    if(t<1)frame=requestAnimationFrame(tick);else done();
  }
  frame=requestAnimationFrame(tick);
}
function show(stop){
  $('stop-state').textContent='COMPLETED / THE PLAYGROUND';$('stop-title').textContent=titleCase(stop.title);$('stop-description').textContent=stop.text;
  $('actions').replaceChildren();
  if(stop.url){
    const link=document.createElement('a');link.className='action';link.href=stop.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Explore this story';
    $('actions').append(link);
  }
  $('progress').hidden=false;
  document.querySelectorAll('.stop').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===stop.id)));
}
function visit(stop){
  cancelAnimationFrame(frame);const ticket=++trip;player.classList.add('walking');
  $('travel-status').textContent=stop?'Walking to '+stop.label+'.':'Crossing back to the mountain.';
  const arrived=()=>{player.classList.remove('walking');if(stop){show(stop);$('travel-status').textContent='Arrived at '+stop.label+'.';}else location.assign('../?from=playground');};
  const onTrail=()=>walk(trail,position,shortestLoopTarget(position,stop?nearest(stop.point):junction,trail.getTotalLength()),ticket,()=>{
    if(stop)arrived();else walk(bridge,0,bridge.getTotalLength(),ticket,arrived);
  });
  if(bridgePosition!==null)walk(bridge,bridgePosition,0,ticket,()=>{bridgePosition=null;position=junction;onTrail();});else onTrail();
}
for(const stop of [...stops,{id:'bridge',label:'The mountain',point:bridgeMarker}]){
  const button=document.createElement('button');button.className='stop'+(stop.flip||stop.id==='bridge'?' flip':'');button.dataset.id=stop.id;
  button.style.setProperty('--x',stop.point[0]/600*100+'%');button.style.setProperty('--y',stop.point[1]/930*100+'%');
  button.setAttribute('aria-label',stop.id==='bridge'?'Walk back to the mountain':stop.label+': completed');button.setAttribute('aria-pressed','false');
  const disc=document.createElement('span');disc.className='disc';
  const symbol=document.createElement('span');symbol.className='symbol';symbol.setAttribute('aria-hidden','true');symbol.textContent=stop.id==='bridge'?'\u2192':'\u2713';disc.append(symbol);
  button.append(disc);
  if(stop.id!=='bridge'){const label=document.createElement('span');label.className='tag';label.textContent=titleCase(stop.label);button.append(label);}
  button.onclick=()=>visit(stop.id==='bridge'?null:stop);$('stops').append(button);
}
const fromMountain=new URLSearchParams(location.search).get('from')==='mountain';
if(fromMountain){bridgePosition=bridge.getTotalLength();place(bridge,bridgePosition);}
else place(trail,position);
const ready=await revealWorld();
if(ready && fromMountain)visit(stops.find(stop=>stop.id==='home'));
