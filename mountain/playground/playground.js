import { route, bridgeRoute, bridgeJunction, bridgeMarker, stops } from './data.mjs?v=4';
import { wrapDistance, shortestLoopTarget } from './loop.mjs';
const $ = id => document.getElementById(id);
const trail=$('route'), bridge=$('bridge-route'), player=$('player');
trail.setAttribute('d',route);bridge.setAttribute('d',bridgeRoute);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function nearest(point){
  let best=0, gap=Infinity;
  for(let d=0;d<=trail.getTotalLength();d+=.5){const p=trail.getPointAtLength(d),distance=Math.hypot(p.x-point[0],p.y-point[1]);if(distance<gap){gap=distance;best=d;}}
  return best;
}
const junction=nearest(bridgeJunction);
let position=junction, bridgePosition=null, frame=0, trip=0;
function place(path,d){const p=path.getPointAtLength(path===trail?wrapDistance(d,trail.getTotalLength()):d);player.style.left=`${p.x/600*100}%`;player.style.top=`${p.y/930*100}%`;}
function walk(path,from,to,ticket,done){
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
  $('stop-state').textContent='COMPLETED / THE PLAYGROUND';$('stop-title').textContent=stop.title;$('stop-description').textContent=stop.text;
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
  const label=document.createElement('span');label.className='tag';label.textContent=stop.label;
  button.append(disc,label);button.onclick=()=>visit(stop.id==='bridge'?null:stop);$('stops').append(button);
}
if(new URLSearchParams(location.search).get('from')==='mountain'){
  bridgePosition=bridge.getTotalLength();place(bridge,bridgePosition);visit(stops.find(stop=>stop.id==='home'));
}else place(trail,position);
