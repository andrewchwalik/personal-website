import { route, sideRoute, caveRoute, cave, stops, vlog, bridgeRoute, bridge, guestbookRoute, guestbook } from './data.mjs?v=10';
import { revealWorld, titleCase } from './world-ready.mjs';
import { nearestPoint } from './path-lookup.mjs';
import { branchTransfer } from './branch-travel.mjs';
import { updatePanel } from './detail-panel.mjs?v=2';
import { initGuestbook } from '../guestbook.js?v=2';
const openGuestbook = initGuestbook();
const $ = id => document.getElementById(id);
const trail = $('route'), branch = $('side-route'), player = $('player');
trail.setAttribute('d',route); branch.setAttribute('d',sideRoute);
const caveBranch = $('cave-route');caveBranch.setAttribute('d',caveRoute);
const bridgeBranch = $('bridge-route');bridgeBranch.setAttribute('d',bridgeRoute);
const bookBranch = $('guestbook-route');bookBranch.setAttribute('d',guestbookRoute);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
function nearest(point) {
  return nearestPoint(trail, point);
}
const distances = Object.fromEntries(stops.map(stop=>[stop.id,nearest(stop.point)]));
const branches = {vlog:{path:branch,junction:distances.delaware},cave:{path:caveBranch,junction:nearest(cave.junction)},bridge:{path:bridgeBranch,junction:nearest(bridge.junction)},guestbook:{path:bookBranch,junction:distances.delaware}};
for (const destination of [branches.vlog, branches.guestbook]) {
  destination.sharedStem = 'lower-trail';
  destination.sharedLength = nearestPoint(destination.path, [319, 697]);
}
let position=distances.coaching, sidePosition=null, activeBranch=null, frame=0, trip=0;
function place(path,d){const p=path.getPointAtLength(d);player.style.left=`${p.x/600*100}%`;player.style.top=`${p.y/930*100}%`;}
function walk(path,from,to,ticket,done){
  const duration=reduced.matches?0:Math.abs(to-from)/145*1000;
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
    bridge:'M20 12H4m7-7-7 7 7 7',
    guestbook:'M4 5q4-2 8 1 4-3 8-1v14q-4-2-8 1-4-3-8-1ZM12 6v14',
    coaching:'M7 4h10v8l-5 4-5-4ZM9 15l-2 6 5-2 5 2-2-6',
    vlog:'M4 7h11v11H4ZM15 11l6-3v9l-6-3',
    cave:'M8 5 19 12 8 19Z',
    summit:'M6 21V3M6 4q5-3 12 0v9q-7-3-12 0',
    future:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5ZM12 14v3',
    debt:'M12 3 20 12 12 21 4 12ZM12 8v5M12 17v.1',
    completed:'m6 12 4 4 9-9',
    spanish:'M3 4h18v12H9l-5 4v-4H3ZM7 8h10M7 12h7',
    doctorate:'M2 8l10-5 10 5-10 5ZM6 10v7q6 4 12 0v-7M22 8v10'
  };
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const icon=document.createElementNS(svg.namespaceURI,'path');
  icon.setAttribute('d',icons[stop.id]||icons.completed);if(stop.id==='cave')icon.setAttribute('fill','currentColor');svg.append(icon);return svg;
}
function show(stop){
  updatePanel(stop.id, () => renderStop(stop));
}
function renderStop(stop){
  $('stop-state').textContent=stop.state;$('stop-title').textContent=titleCase(stop.title);$('stop-description').textContent=stop.description;
  $('actions').replaceChildren();
  if(stop.id==='bridge')$('actions').append(action(stop.action,'/mountain/playground/'));
  else if(stop.id==='guestbook'){const button=document.createElement('button');button.className='action';button.textContent=stop.action;button.onclick=openGuestbook;$('actions').append(button);}
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
  const arrived=()=>{player.classList.remove('walking');show(stop);$('travel-status').textContent=`Arrived at ${stop.label}. Details are below the map on mobile.`;if(stop.id==='bridge')location.assign('/mountain/playground/?from=mountain');if(stop.id==='guestbook')openGuestbook();if(stop.id==='cave')document.dispatchEvent(new Event('enter-cave'));};
  const destination=branches[stop.id];
  const transfer = branchTransfer(activeBranch, destination, sidePosition);
  if (transfer) {
    const next = () => {
      const segment = transfer.shift();
      if (!segment) { arrived(); return; }
      activeBranch = segment.branch;
      sidePosition = segment.from;
      walk(segment.branch.path, segment.from, segment.to, ticket, next);
    };
    next();
    return;
  }
  const onTrail=()=>walk(trail,position,destination?destination.junction:distances[stop.id],ticket,()=>{
    if(destination){activeBranch=destination;sidePosition=0;walk(destination.path,0,destination.path.getTotalLength(),ticket,arrived);}else arrived();
  });
  if(sidePosition!==null)walk(activeBranch.path,sidePosition,0,ticket,()=>{sidePosition=null;position=activeBranch.junction;activeBranch=null;onTrail();});else onTrail();
}
for(const stop of [...stops,vlog,cave,bridge,guestbook]){
  const point=stop.markerPoint||stop.point;
  const button=document.createElement('button');button.className=`stop ${stop.preview?'preview':''} ${stop.id==='vlog'?'side':''} ${['headcoach','firelands','doctorate','future','vlog'].includes(stop.id)?'flip':''}`;button.dataset.id=stop.id;button.setAttribute('aria-label',`${stop.label}: ${stop.state.toLowerCase()}`);button.setAttribute('aria-pressed','false');
  const disc=document.createElement('span');disc.className='disc';disc.append(markerIcon(stop));
  button.style.setProperty('--x',`${point[0]/600*100}%`);button.style.setProperty('--y',`${point[1]/930*100}%`);
  button.append(disc);
  if(!['cave','guestbook','bridge'].includes(stop.id)){const label=document.createElement('span');label.className='tag';label.textContent=titleCase(stop.label);button.append(label);}
  if(stop.id==='guestbook'){button.classList.add('book-stop');button.setAttribute('aria-haspopup','dialog');}
  button.onclick=()=>visit(stop);$('stops').append(button);
}
place(trail,position);show(stops.find(stop=>stop.id==='coaching'));
const fromPlayground=new URLSearchParams(location.search).get('from')==='playground';
if(fromPlayground)place(bridgeBranch,bridgeBranch.getTotalLength());
const ready=await revealWorld();
if(ready && fromPlayground){
  activeBranch=branches.bridge;sidePosition=bridgeBranch.getTotalLength();
  place(bridgeBranch,sidePosition);visit(stops[0]);
}
