import { route, sideRoute, caveRoute, cave, stops, vlog, memories } from './data.mjs?v=4';
const $ = id => document.getElementById(id);
const trail = $('route'), branch = $('side-route'), player = $('player');
trail.setAttribute('d',route); branch.setAttribute('d',sideRoute);
const caveBranch = $('cave-route');caveBranch.setAttribute('d',caveRoute);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
function nearest(point) {
  let best=0, distance=Infinity;
  for(let d=0;d<=trail.getTotalLength();d+=.5){const p=trail.getPointAtLength(d), gap=Math.hypot(p.x-point[0],p.y-point[1]);if(gap<distance){best=d;distance=gap;}}
  return best;
}
const distances = Object.fromEntries(stops.map(stop=>[stop.id,nearest(stop.point)]));
const branches = {vlog:{path:branch,junction:distances.delaware},cave:{path:caveBranch,junction:nearest(cave.junction)}};
let position=distances.debt, sidePosition=null, activeBranch=null, frame=0, trip=0;
function place(path,d){const p=path.getPointAtLength(d);player.style.left=`${p.x/600*100}%`;player.style.top=`${p.y/930*100}%`;}
function walk(path,from,to,ticket,done){
  const duration=reduced.matches?0:Math.abs(to-from)/90*1000;
  const start=performance.now();
  function tick(now){
    if(ticket!==trip)return;
    const t=duration?Math.min(1,(now-start)/duration):1;
    // Cosine easing starts and ends each route segment without an abrupt stop.
    const d=from+(to-from)*(1-Math.cos(Math.PI*t))/2;
    if(path===trail)position=d;else sidePosition=d;
    place(path,d);
    if(t<1)frame=requestAnimationFrame(tick);else done();
  }
  frame=requestAnimationFrame(tick);
}
function action(text,url){const a=document.createElement('a');a.className='action';a.textContent=text;a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function markerIcon(stop){
  const icons={
    camp:'M3 11 12 4l9 7M5 10v10h14V10M10 20v-6h4v6',
    vlog:'M4 7h11v11H4ZM15 11l6-3v9l-6-3',
    cave:'M3 20V12a9 9 0 0 1 18 0v8ZM10 10l6 4-6 4Z',
    summit:'M6 21V3M6 4q5-3 12 0v9q-7-3-12 0',
    future:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5ZM12 14v3',
    debt:'M12 3 20 12 12 21 4 12ZM12 8v5M12 17v.1',
    completed:'m6 12 4 4 9-9'
  };
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const icon=document.createElementNS(svg.namespaceURI,'path');
  icon.setAttribute('d',icons[stop.id]||icons.completed);svg.append(icon);return svg;
}
function show(stop){
  $('stop-state').textContent=stop.state;$('stop-title').textContent=stop.title;$('stop-description').textContent=stop.description;
  $('actions').replaceChildren();
  if(stop.id==='camp'){const button=document.createElement('button');button.className='action';button.textContent=stop.action;button.onclick=()=>{$('camp').showModal();};$('actions').append(button);}
  else if(stop.id==='cave'){const button=document.createElement('button');button.className='action';button.textContent=stop.action;button.onclick=()=>visit(cave);$('actions').append(button);}
  else if(stop.url)$('actions').append(action(stop.action,stop.url));
  if(stop.id==='summit'||stop.id==='debt')$('actions').append(action('Support the journey','https://patreon.com/andrewchwalik'));
  const completed=stop.state==='COMPLETED', days=stop.id==='vlog';
  $('progress').hidden=!(completed||days);$('start').textContent=days?'0':'0%';$('end').textContent=days?'365':'100%';$('bar').max=days?365:1;$('bar').value=days?212:1;$('progress-message').textContent=days?'212 / 365 vlogs edited':'Completed';
  document.querySelectorAll('.stop').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===stop.id)));
}
function visit(stop){
  cancelAnimationFrame(frame);++trip;player.classList.remove('walking');
  if(stop.preview){show(stop);$('travel-status').textContent=`Preview: ${stop.title} The character remains on the accessible trail.`;return;}
  const ticket=trip;player.classList.add('walking');
  $('travel-status').textContent=`Walking to ${stop.label}.`;
  const arrived=()=>{player.classList.remove('walking');show(stop);$('travel-status').textContent=`Arrived at ${stop.label}. Details are below the map on mobile.`;if(stop.id==='camp')$('camp').showModal();if(stop.id==='cave')document.dispatchEvent(new Event('enter-cave'));};
  const destination=branches[stop.id];
  const onTrail=()=>walk(trail,position,destination?destination.junction:distances[stop.id],ticket,()=>{
    if(destination){activeBranch=destination;walk(destination.path,0,destination.path.getTotalLength(),ticket,arrived);}else arrived();
  });
  if(sidePosition!==null)walk(activeBranch.path,sidePosition,0,ticket,()=>{sidePosition=null;position=activeBranch.junction;activeBranch=null;onTrail();});else onTrail();
}
for(const stop of [...stops,vlog,cave]){
  const point=stop.markerPoint||stop.point;
  const button=document.createElement('button');button.className=`stop ${stop.preview?'preview':''} ${stop.id==='vlog'?'side':''} ${['firelands','future','vlog'].includes(stop.id)?'flip':''}`;button.dataset.id=stop.id;button.setAttribute('aria-label',`${stop.label}: ${stop.state.toLowerCase()}`);button.setAttribute('aria-pressed','false');
  const disc=document.createElement('span');disc.className='disc';disc.append(markerIcon(stop));
  button.style.setProperty('--x',`${point[0]/600*100}%`);button.style.setProperty('--y',`${point[1]/930*100}%`);
  button.append(disc);
  if(stop.id!=='cave'){const label=document.createElement('span');label.className='tag';label.textContent=stop.label;button.append(label);}
  button.onclick=()=>visit(stop);$('stops').append(button);
}
for(const memory of memories){const detail=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('p'),link=document.createElement('a');summary.textContent=memory.title;text.textContent=memory.text;link.textContent='Explore this story ↗';link.href=memory.url;link.target='_blank';link.rel='noopener noreferrer';detail.append(summary,text,link);$('memories').append(detail);}
$('close-camp').onclick=()=>$('camp').close();
place(trail,position);show(stops.find(stop=>stop.id==='debt'));
