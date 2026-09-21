import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

// Ground coordinates are already foreshortened; z is elevation above that plane.
// All cast shadows use the same sun vector, independently of drawing order.
export const SUN = { x: 0.62, y: 0.3 };
export const ROUTE = 'M165 550 C165 510 205 510 235 510 L285 510 Q365 510 365 460 Q365 420 315 420 Q265 420 265 392 Q265 365 290 365 Q415 365 415 310 L415 275 Q415 269 470 269 L470 180';
export const project = ([x, y, z = 0]) => [x, y - z];
export const cast = ([x, y, z = 0]) => [x + SUN.x * z, y + SUN.y * z];
const n = v => Math.round(v * 100) / 100;
const coords = points => points.map(p => p.map(n).join(',')).join(' ');
const poly = (points, fill, extra = '') => `<polygon points="${coords(points)}" fill="${fill}" ${extra}/>`;
const face = (points, fill, extra = '') => poly(points.map(project), fill, extra);
const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (points, color, width = 1, extra = '') => `<polyline points="${coords(points.map(project))}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = '') => `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}" ${extra}/>`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function hull(points) {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = items => {
    const result = [];
    for (const p of items) {
      while (result.length >= 2 && cross(result.at(-2), result.at(-1), p) <= 0) result.pop();
      result.push(p);
    }
    return result.slice(0, -1);
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}
const shadow = points => poly(rounded(hull(points.map(cast)), 3), '#254e3f');

// Sampling rounded corners lets cliff sides and their top share the exact same edge.
export function rounded(points, radius = 12) {
  return points.flatMap((p, i) => {
    const prev = points[(i + points.length - 1) % points.length];
    const next = points[(i + 1) % points.length];
    const a = mix(p, prev, Math.min(0.35, radius / Math.hypot(prev[0] - p[0], prev[1] - p[1])));
    const b = mix(p, next, Math.min(0.35, radius / Math.hypot(next[0] - p[0], next[1] - p[1])));
    return Array.from({ length: 5 }, (_, j) => {
      const t = j / 4;
      return [0, 1].map(k => (1 - t) ** 2 * a[k] + 2 * (1 - t) * t * p[k] + t * t * b[k]);
    });
  });
}

const coast = rounded([[82,560],[56,533],[58,481],[87,439],[81,401],[57,368],[58,322],[91,294],[110,268],[96,218],[103,174],[133,154],[191,149],[234,121],[256,92],[292,84],[325,102],[380,94],[430,65],[486,71],[524,108],[530,164],[509,210],[543,255],[553,290],[543,327],[512,365],[514,405],[539,448],[542,486],[518,514],[488,537],[471,579],[449,605],[405,610],[363,602],[326,609],[287,637],[253,641],[225,628],[199,613],[172,615],[138,625],[104,619],[83,597]], 18);
const plateau = rounded([[308,126],[354,124],[382,134],[426,115],[473,108],[510,135],[514,186],[491,238],[462,244],[431,232],[404,250],[369,266],[331,253],[291,230],[287,188]], 13);
export const TERRAIN = { coast, plateau, islandHeight: 36, plateauHeight: 58 };

function terrainShadow(points, height, color) {
  const offset = points.map(([x,y])=>cast([x,y,height]));
  // Extrude each boundary segment: a convex hull would incorrectly fill the bays.
  return `<g fill="${color}" opacity=".23">${poly(offset,color)}${points.map((a,i)=> {
    const j=(i+1)%points.length;
    return poly([a,points[j],offset[j],offset[i]],color);
  }).join('')}</g>`;
}

function solid(points, height, id, top = '#8fc94e') {
  const sides = points.map((a, i) => {
    const b = points[(i + 1) % points.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    // Only front-facing edges are visible in this orthographic camera.
    if (dx >= 0) return '';
    const length = Math.hypot(dx, dy);
    const light = Math.max(0, -dy / length * 0.75 + dx / length * -0.15);
    const color = light > 0.45 ? '#cd7841' : light > 0.05 ? '#b9653d' : '#9e5038';
    return face([[...a, height], [...b, height], [...b, 0], [...a, 0]], color);
  }).join('');
  const edge = id === 'island' ? '#79b2aa' : '#596f37';
  const outline = poly(points, edge, `stroke="${edge}" stroke-width="${id === 'island' ? 5 : 2}" stroke-linejoin="round"`);
  const topPoints = points.map(([x, y]) => [x, y - height]);
  return `${outline}${sides}<clipPath id="${id}-sides">${poly(points, '#fff')}</clipPath>
    <g clip-path="url(#${id}-sides)">${poly(points, 'url(#cliff-grain)')}</g>
    ${poly(topPoints, '#4e913e', 'stroke="#559540" stroke-width="5" stroke-linejoin="round"')}
    ${poly(topPoints, top)}${poly(topPoints, 'url(#grass)')}`;
}

function hill(x, y, h, r) {
  const body = `M${x-r} ${y-2}V${y-h+r}C${x-r} ${y-h-r*.24} ${x+r} ${y-h-r*.24} ${x+r} ${y-h+r}V${y-2}Q${x} ${y+r*.6} ${x-r} ${y-2}Z`;
  const footprint = [[x-r,y,0],[x+r,y,0],[x-r,y,h-r],[x,y,h],[x+r,y,h-r]];
  return { y, shadow: shadow(footprint), art:
    path(body, '#71b84d') + path(`M${x+2} ${y-h+1}Q${x+r} ${y-h+2} ${x+r} ${y-h+r}V${y-2}Q${x+r*.3} ${y+r*.4} ${x+2} ${y+r*.3}Z`, '#58a34a') +
    path(`M${x-r+4} ${y-h+r+6}V${y-h+r}Q${x-r+4} ${y-h+7} ${x-4} ${y-h+5}`, 'none', 'stroke="#a9d879" stroke-width="3" stroke-linecap="round"') +
    ellipse(x-3,y-h+16,1.25,3.5,'#4e8e42') + ellipse(x+4,y-h+16,1.25,3.5,'#4e8e42') +
    path(`M${x-r-2} ${y}l3-5 2 4m${r*1.5} 1 2-5 2 3`, 'none', 'stroke="#619b3f" stroke-width="1.3"') };
}

function tree(x, y, h = 44, r = 17) {
  const crown = `M${x-r*.86} ${y-h*.28}C${x-r*1.3} ${y-h*.35} ${x-r*1.18} ${y-h*.66} ${x-r*.74} ${y-h*.7}C${x-r*.88} ${y-h*1.02} ${x+r*.45} ${y-h*1.12} ${x+r*.73} ${y-h*.77}C${x+r*1.2} ${y-h*.66} ${x+r*1.22} ${y-h*.38} ${x+r*.86} ${y-h*.29}Q${x} ${y-h*.08} ${x-r*.86} ${y-h*.28}Z`;
  const vertices = [[x-3,y,0],[x+3,y,0],[x-r,y-r*.35,h*.48],[x+r,y-r*.35,h*.48],[x-r*.7,y,h*.8],[x,y,h],[x+r*.7,y,h*.8],[x+r,y+r*.35,h*.45]];
  return { y, shadow: shadow(vertices), art:
    path(`M${x-3} ${y-15}h6V${y+1}h-6Z`, '#a1743d') + path(`M${x+1} ${y-15}h2V${y+1}h-2Z`, '#735334') +
    path(crown,'#3d9755') + path(`M${x+4} ${y-h*.95}C${x+r*.75} ${y-h*.9} ${x+r*.45} ${y-h*.7} ${x+r*.72} ${y-h*.63}Q${x+r*1.2} ${y-h*.36} ${x+r*.63} ${y-h*.27}Q${x} ${y-h*.1} ${x-r*.8} ${y-h*.3}Q${x+r*.15} ${y-h*.27} ${x+4} ${y-h*.95}Z`, '#2e7e4a') +
    path(`M${x-r*.72} ${y-h*.65}q-2-9 5-12m2-3q5-4 10-1`, 'none', 'stroke="#83bd64" stroke-width="2.2" stroke-linecap="round"') };
}

function boulder(x, y, h = 18, r = 14, sea = false) {
  const a=[x-r,y,0], b=[x+2,y+r*.4,0], c=[x+r,y-2,0], d=[x+3,y-r*.6,0];
  const peak=[x-r*.15,y-r*.12,h], left=[x-r*.67,y-r*.22,h*.64], right=[x+r*.4,y-r*.27,h*.78];
  const colors = sea ? ['#92beba','#648f97','#497b8a'] : ['#f3bd59','#df9a3e','#bd7136'];
  return {y, shadow:shadow([a,b,c,d,peak,left,right]), art:
    (sea ? ellipse(x,y+3,r+5,r*.49,'none','stroke="#80b7b1" stroke-width="1.5" opacity=".5"') : '') +
    face([a,left,peak,b],colors[0])+face([b,peak,right,c],colors[1])+face([c,right,d],colors[2])+face([left,peak,right,d],sea?'#79a9ab':'#eeb054') };
}

function cottage(x, y) {
  const v = (a,b,z) => [x+a,y+b,z];
  const roof = [v(-26,1,29),v(0,1,51),v(25,1,29),v(37,-13,29),v(12,-13,51),v(-14,-13,29)];
  return {y, shadow:shadow([...roof,v(-22,0,0),v(23,0,0),v(35,-14,0)]), art:
    face([v(-22,0,0),v(23,0,0),v(23,0,30),v(0,0,48),v(-22,0,30)],'#ecd493') +
    face([v(23,0,0),v(35,-14,0),v(35,-14,30),v(23,0,30)],'#bda164') +
    face([roof[0],roof[1],roof[4],roof[5]],'#e3a649')+face([roof[1],roof[2],roof[3],roof[4]],'#ab713a') +
    line([roof[0],roof[1],roof[4]],'#f5c571',2) +
    [0.25,0.5,0.75].map(t=>line([mix(roof[1],roof[2],t),mix(roof[4],roof[3],t)],'#c18a43',1)).join('') +
    path(`M${x-6} ${y}v-17q6-8 12 0v17Z`,'#745b38') +
    `<circle cx="${x+3}" cy="${y-8}" r="1" fill="#e5c878"/>` +
    face([v(-17,0,15),v(-10,0,15),v(-10,0,24),v(-17,0,24)],'#6e8674','stroke="#c3b277" stroke-width="1.5"') +
    line([v(-13.5,0,15),v(-13.5,0,24)],'#e9d28e',1) +
    face([v(28,-6,15),v(32,-11,15),v(32,-11,24),v(28,-6,24)],'#65735a') +
    line([v(-19,0,3),v(-9,0,3)],'#d1ba7e',1) +
    face([v(-8,0,0),v(9,0,0),v(12,4,0),v(-9,4,0)],'#cbb581') };
}

function goal(x, y) {
  const a=[x-22,y,0], b=[x+22,y,0], c=[x+31,y-12,0], d=[x-13,y-12,0];
  const top = p => [p[0],p[1],25];
  const rearTop = p => [p[0],p[1],22];
  const ta=top(a),tb=top(b),tc=rearTop(c),td=rearTop(d);
  let net = face([d,c,tc,td],'#bfd399','opacity=".12"');
  for(let t=.125;t<1;t+=.125) net += line([mix(d,c,t),mix(td,tc,t)],'#c6ddaf',.65) + line([mix(a,d,t),mix(ta,td,t)],'#c6ddaf',.65);
  for(let t=.2;t<1;t+=.2) net += line([mix(d,td,t),mix(c,tc,t)],'#c6ddaf',.65) + line([mix(a,ta,t),mix(d,td,t)],'#c6ddaf',.65) + line([mix(b,tb,t),mix(c,tc,t)],'#c6ddaf',.65);
  return {y, shadow:line([cast(a),cast(ta),cast(tb),cast(b)],'#254e3f',2.5)+line([cast(ta),cast(td),cast(tc),cast(tb)],'#254e3f',1.5), art:
    net+line([d,td,tc,c],'#bfd1a0',1.8)+line([ta,td],'#d4dfb5',1.7)+line([tb,tc],'#c3cf9c',1.7)+line([a,ta,tb,b],'#fff1cc',2.8)+
    ellipse(x-13,y+11,5,2,'#537f42','opacity=".3"')+ellipse(x-16,y+8,4,4,'#f4e9c2')+path(`m${x-18} ${y+6} 3-1 1 3-3 1z`,'#3e6651') };
}

function camera(x,y) {
  const p=(a,b,z)=>[x+a,y+b,z];
  const tripod=[p(-8,3,0),p(0,0,22),p(8,3,0),p(0,-5,0)];
  return {y, shadow:line(tripod.map(cast),'#254e3f',2.5), art:
    line(tripod,'#776c46',2)+line([p(0,0,22),p(0,-5,0)],'#776c46',1.5)+
    face([p(-8,0,20),p(8,0,20),p(8,0,31),p(-8,0,31)],'#365e56','stroke="#254b47" stroke-width="1"')+
    face([p(-8,0,31),p(8,0,31),p(11,-3,31),p(-5,-3,31)],'#769478')+
    ellipse(x+1,y-25,4,4,'#172f36','stroke="#a5b296" stroke-width="1.5"')+
    path(`M${x-6} ${y-33}h6v2h-6Z`,'#2c5349') };
}

function fence(x,y,length=30) {
  const posts=[0,length];
  return {y, shadow:posts.map(dx=>line([[x+dx,y,0],cast([x+dx,y,13])],'#254e3f',2)).join('')+line([cast([x,y,9]),cast([x+length,y,9])],'#254e3f',2), art:
    line([[x,y,8],[x+length,y,8]],'#c7be8b',3)+posts.map(dx=>line([[x+dx,y,0],[x+dx,y,14]],'#f3dfaf',3)).join('') };
}

const lowerObjects = [
  hill(163,247,61,16),hill(197,230,90,21),hill(218,261,41,12),
  tree(140,333,44,17),tree(114,355,36,15),tree(166,359,38,15),
  tree(89,448,41,16),tree(97,474,35,14),cottage(135,489),
  tree(121,576,38,16),tree(102,594,30,13),
  tree(339,567,43,18),tree(372,550,35,15),tree(365,590,43,18),
  tree(497,473,44,17),tree(481,499,37,15),
  boulder(319,270,17,14),boulder(338,259,24,18),boulder(363,265,16,13),boulder(450,575,14,12),
  goal(451,441),camera(230,350),fence(181,533,27),fence(445,330,29)
];
const upperObjects=[hill(330,112,45,13),hill(497,149,40,12),boulder(429,112,9,8),boulder(445,117,7,7)];
const seaObjects=[boulder(43,259,23,14,true),boulder(36,559,21,13,true),boulder(47,586,15,12,true),boulder(559,568,24,15,true),boulder(544,599,19,13,true),boulder(525,631,14,11,true)];
const shadowLayer = objects => `<g fill="#254e3f" opacity=".22">${objects.map(o=>o.shadow).join('')}</g>`;
const artLayer = objects => objects.slice().sort((a,b)=>a.y-b.y).map(o=>o.art).join('');

function bridge() {
  let deck = '';
  for(let x=229;x<283;x+=6) deck+=`<path d="M${x} 499h5.4v22H${x}Z" fill="${x%12===1?'#c99850':'#b68742'}"/><path d="M${x+1} 501v16" stroke="#d9ad69" stroke-width=".8"/>`;
  const deckShadow=shadow([[226,502,5],[288,502,5],[288,527,5],[226,527,5]]);
  const railShadow=line([cast([227,506,14]),cast([287,506,14])],'#254e3f',2)+line([cast([227,528,14]),cast([287,528,14])],'#254e3f',2);
  return `<g opacity=".22">${deckShadow}${railShadow}</g>
    <path d="M226 520h62v5h-62Z" fill="#775735"/>
    ${deck}<path d="M226 497h62m-62 25h62" stroke="#775735" stroke-width="2.5"/>
    <path d="M227 492v13m60-13v13M227 514v14m60-14v14" stroke="#e8bb72" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M227 494q30 3 60 0m-60 22q30 4 60 0" fill="none" stroke="#e1b16a" stroke-width="2"/>`;
}

function stairs() {
  const steps = 8, topHeight=58, rearY=244, run=3;
  let result='';
  const vertices=[];
  for(let i=0;i<steps;i++) {
    const z=topHeight*(1-i/steps), next=topHeight*(1-(i+1)/steps), y=rearY+i*run;
    vertices.push([457,y,z],[483,y,z],[457,y+run,next],[483,y+run,next]);
    result+=face([[457,y,z],[483,y,z],[483,y+run,z],[457,y+run,z]],'#efda9c');
    result+=face([[457,y+run,z],[483,y+run,z],[483,y+run,next],[457,y+run,next]],i%2?'#bca471':'#c8af78');
    result+=line([[457,y+run,z],[483,y+run,z]],'#f8e7b5',.8);
    result+=face([[483,y,z],[483,y+run,z],[483,y+run,next],[483,y,next]],'#9d8159');
  }
  return `<g opacity=".22">${shadow(vertices)}</g>${result}`;
}

function flowers(x,y) {
  return [[0,0],[8,4],[-5,8]].map(([dx,dy])=>path(`M${x+dx} ${y+dy}v4`,'none','stroke="#519247" stroke-width="1"')+ellipse(x+dx,y+dy-1,2.5,1.8,'#ffe3a0')+ellipse(x+dx,y+dy-1,.9,.8,'#ca9d45')).join('');
}

export function buildWorld() {
  const coastBase=coast.map(([x,y])=>[x,y+36]);
  const plateauTop=plateau.map(([x,y])=>[x,y-58]);
  const river='M218 621Q216 582 233 552Q242 528 235 506L217 474Q203 453 218 442Q235 431 250 444Q260 454 251 473Q253 491 266 519Q282 554 265 589L253 641Z';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700">
  <title>Andrew's adventure island</title><desc>A sunny game world with connected trails, an Irish cottage, a soccer meadow, a filming lookout, a river bridge, and a terraced highland.</desc>
  <style>.water-flow{animation:flow 1.4s linear infinite}.sea-ripple{transform-box:fill-box;transform-origin:center;animation:ripple 3s ease-out infinite}.river-flow{animation:flow 3s linear infinite}@keyframes flow{to{stroke-dashoffset:-36}}@keyframes ripple{from{transform:scale(.75);opacity:.65}to{transform:scale(1.2);opacity:0}}@media(prefers-reduced-motion:reduce){.water-flow,.river-flow,.sea-ripple{animation:none}}</style>
  <defs>
    <linearGradient id="sea" x2="0" y2="1"><stop stop-color="#246879"/><stop offset="1" stop-color="#287c8a"/></linearGradient>
    <linearGradient id="fall" x2="1" y2="0"><stop stop-color="#2c9da8"/><stop offset=".28" stop-color="#83d4c7"/><stop offset=".73" stop-color="#5dbeba"/><stop offset="1" stop-color="#32a3af"/></linearGradient>
    <pattern id="waves" width="32" height="23" patternUnits="userSpaceOnUse"><path d="M2 10q7 9 14 0 7 9 14 0" fill="none" stroke="#9bc9b5" stroke-width="1" opacity=".17"/></pattern>
    <pattern id="grass" width="49" height="43" patternUnits="userSpaceOnUse"><path d="m7 13-1-4m1 4 2-5m22 23-2-4m2 4 2-6m12-24-1-3" stroke="#589b3c" stroke-width="1" opacity=".43" fill="none"/><path d="m21 6 2-2m19 24 1-3" stroke="#c1dd72" stroke-width="1.5" opacity=".6"/></pattern>
    <pattern id="cliff-grain" width="37" height="39" patternUnits="userSpaceOnUse"><ellipse cx="8" cy="13" rx="1.6" ry="3" fill="#743e32" opacity=".12"/><ellipse cx="27" cy="32" rx="1" ry="2.4" fill="#e8a762" opacity=".22"/></pattern>
    <clipPath id="main-ground">${poly(coast,'#fff')}</clipPath>
    <clipPath id="upper-ground">${poly(plateauTop,'#fff')}</clipPath>
    <clipPath id="river">${path(river,'#fff')}</clipPath>
    <clipPath id="fall-clip"><path d="M218 622Q234 635 253 640L256 683Q238 690 215 680Z"/></clipPath>
  </defs>
  <path d="M0 0h600v700H0Z" fill="url(#sea)"/><path d="M0 0h600v700H0Z" fill="url(#waves)"/>
  ${terrainShadow(coastBase,36,'#164e65')}
  ${solid(coastBase,36,'island')}
  <g clip-path="url(#main-ground)">
    <path d="M71 366Q157 331 197 352M317 569Q400 590 485 542" fill="none" stroke="#79b448" stroke-width="51" opacity=".22"/>
    <path d="M93 211Q196 161 225 168M354 442Q423 391 491 437" fill="none" stroke="#a7d65a" stroke-width="33" opacity=".24"/>
    ${terrainShadow(plateau,58,'#376e40')}
  </g>
  ${solid(plateau,58,'plateau','#97cf51')}
  <g clip-path="url(#upper-ground)">
    <path d="M336 112Q374 105 376 139Q378 167 411 167L451 146Q490 132 487 158L470 180" fill="none" stroke="#7fa94b" stroke-width="17" opacity=".5"/>
    <path d="M336 112Q374 105 376 139Q378 167 411 167L451 146Q490 132 487 158L470 180" fill="none" stroke="#ecd087" stroke-width="14"/>
    ${shadowLayer(upperObjects)}
  </g>
  ${path(river,'#24a4b0','stroke="#77b456" stroke-width="3"')}
  <g clip-path="url(#river)"><path d="M214 442Q222 434 240 441L244 476Q265 517 256 557L239 626" stroke="#157e94" stroke-width="6" fill="none" opacity=".18"/><path class="river-flow" d="M232 449Q228 466 238 482M250 538Q253 560 243 579" fill="none" stroke="#a2e1cb" stroke-width="1.5" stroke-dasharray="4 32" opacity=".65"/></g>
  <path d="M208 456v-9m2 9 3-10m-1 16 5-5m39 18 2-10m0 9 3-7M264 581l5-6m-5 6 1-10" fill="none" stroke="#528f48" stroke-width="1.3" stroke-linecap="round"/>
  <path d="${ROUTE}" fill="none" stroke="#73a545" stroke-width="25" stroke-linejoin="round" stroke-linecap="round" opacity=".55"/>
  <path d="${ROUTE}" fill="none" stroke="#f2d58b" stroke-width="21" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M144 490Q155 502 181 516" fill="none" stroke="#f2d58b" stroke-width="11"/>
  <path d="M355 451Q392 446 404 444" fill="none" stroke="#d7cc7b" stroke-width="7" opacity=".7"/>
  ${stairs()}
  ${bridge()}
  <g clip-path="url(#main-ground)">${shadowLayer(lowerObjects)}</g>
  ${flowers(176,482)}${flowers(411,467)}${flowers(304,556)}
  ${artLayer(upperObjects)}${artLayer(lowerObjects)}
  ${shadowLayer(seaObjects)}${artLayer(seaObjects)}
  <ellipse cx="238" cy="686" rx="30" ry="8" fill="#5db5b4" opacity=".5"/>
  <path d="M218 622Q234 635 253 640L256 683Q238 690 215 680Z" fill="url(#fall)"/>
  <path d="M218 622Q234 635 253 640" fill="none" stroke="#a2dfbc" stroke-width="2"/>
  <g clip-path="url(#fall-clip)"><path class="water-flow" d="M221 626v62m7-58v62m8-58v62m8-60v62m7-59v62" fill="none" stroke="#d4efcf" stroke-width="1.7" stroke-dasharray="14 22" opacity=".72"/></g>
  <path d="M214 682q5-8 10 0 5-10 10 2 5-9 11 0 7-9 12-1" fill="none" stroke="#e2f0cc" stroke-width="3.5" stroke-linecap="round"/>
  <ellipse class="sea-ripple" cx="238" cy="687" rx="29" ry="6" fill="none" stroke="#c7e7c5" stroke-width="1.5"/>
  <g fill="#f4f0cc" opacity=".92"><path d="M37 153q-5-6 3-9h16q0-9 11-10 9-1 12 5h14q10 7-1 12H73q-4 6-13 5H41Z"/><path d="M527 359q-7-7 2-10h16q1-7 10-7h12q9 3 7 9 13 6 0 11h-36Z"/></g>
  </svg>`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../img/chapter-world.svg', import.meta.url), buildWorld());
  console.log('Built chapter-world.svg from one terrain and lighting model.');
}
