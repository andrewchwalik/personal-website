import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { tree, boulder, cottage, shadowLayer, artLayer, poly, path } from './build-world.mjs';
import { route, sideRoute } from '../mountain/data.mjs';

// Upper-left sunlight, with angular granite faces widening toward the foothills.
function rock(x,y,h,r) {
  const object=boulder(x,y,h,r);
  object.art=object.art.replaceAll('#f3bd59','#c5cccb').replaceAll('#df9a3e','#929fa1').replaceAll('#bd7136','#64767c').replaceAll('#eeb054','#d5dbd6');
  return object;
}

function ridge(top,foot) {
  const palette=['#a3afaf','#87979d','#6d8089','#82949b','#5f737e'];
  return top.slice(0,-1).map((a,i)=>{
    const b=top[i+1], c=foot[i+1], d=foot[i];
    const middle=[(a[0]+b[0]+c[0]+d[0])/4,(a[1]+b[1]+c[1]+d[1])/4];
    return poly([a,b,c,d],palette[i%palette.length])+poly([a,middle,d],i%2?'#96a4a6':'#b1bbbb')+path(`M${a[0]} ${a[1]}L${middle[0]} ${middle[1]} ${d[0]} ${d[1]}`,'none','stroke="#566d78" stroke-width="1" opacity=".28"');
  }).join('');
}

export function buildMountain() {
  // Walking ledges retain the route coordinates; their rock slopes join below them.
  const ledges=[
    {color:'#8fa477',top:[[63,706],[118,661],[205,655],[296,667],[470,666],[539,722],[530,793],[488,820],[429,850],[331,858],[210,839],[119,850],[58,794]],edge:[[58,794],[119,850],[210,839],[331,858],[429,850],[488,820],[530,793]],foot:[[44,831],[116,886],[220,877],[339,893],[453,878],[515,854],[555,821]]},
    {color:'#a1aaa0',top:[[96,568],[190,525],[330,517],[458,530],[501,585],[492,608],[433,615],[345,619],[251,610],[175,618],[101,598]],edge:[[101,598],[175,618],[251,610],[345,619],[433,615],[492,608]],foot:[[81,675],[164,691],[245,682],[348,685],[450,687],[527,668]]},
    {color:'#b0b8b3',top:[[93,420],[169,393],[294,397],[410,388],[471,429],[459,460],[411,475],[340,481],[262,475],[199,479],[145,475],[97,460]],edge:[[97,460],[145,475],[199,479],[262,475],[340,481],[411,475],[459,460]],foot:[[74,541],[137,546],[195,551],[270,552],[352,553],[430,545],[493,531]]},
    {color:'#b8c1bf',top:[[168,285],[234,251],[362,249],[449,271],[473,318],[440,340],[365,344],[303,337],[254,344],[190,340],[144,315]],edge:[[144,315],[190,340],[254,344],[303,337],[365,344],[440,340],[473,318]],foot:[[114,394],[179,404],[244,410],[313,398],[386,409],[450,408],[491,385]]},
    {color:'#c9d0cb',top:[[211,133],[267,98],[333,102],[385,144],[399,160],[363,185],[305,190],[270,181],[230,185],[194,161]],edge:[[194,161],[230,185],[270,181],[305,190],[363,185],[399,160]],foot:[[161,252],[222,255],[278,269],[313,258],[384,264],[432,238]]}
  ];
  const terrain=ledges.map((t,i)=>ridge(t.edge,t.foot)+poly(t.top,t.color)+poly(t.top,'url(#scree)')+(i===0?'<path d="M78 739 118 698 191 723 218 796 153 825 85 792Z M440 722 490 728 512 777 460 808 429 775Z" fill="#809965" opacity=".65"/>':'')).join('');
  const objects=[tree(96,771,43,16),tree(485,796,39,14),tree(506,760,43,15),tree(112,591,29,11),tree(344,598,26,10),rock(191,454,26,20),rock(217,460,14,13),rock(370,455,26,22),rock(350,465,12,11),rock(365,326,33,20),rock(390,328,18,12),rock(189,321,24,16),rock(352,175,16,12),rock(487,702,17,14),cottage(136,793)];
  const stair=(x,y,length,count)=>`<g fill="#c1c6c0" stroke="#77878b" stroke-width="1">${Array.from({length:count},(_,i)=>`<path d="M${x-11} ${y+i*length/count}h22v${length/count}h-22Z"/>`).join('')}</g>`;
  const stadium='<g transform="translate(300 132)"><path d="M-52 0-39-30H38L53 0 39 22H-38Z" fill="#335b4e"/><path d="M-47-3-36-26H35L47-3 35 17H-34Z" fill="#e4d1a0"/><path d="M-35-6-27-19H26L35-6 26 10H-25Z" fill="#709958"/><path d="M-27-16H26L31-5 25 7H-24L-31-5Z M0-16V7" fill="none" stroke="#eef0cf"/><ellipse cx="0" cy="-4" rx="7" ry="4" fill="none" stroke="#eef0cf"/><path d="M-48-8v-20M48-8v-20" stroke="#48665c" stroke-width="3"/><path d="M-55-28h14M41-28h14M-13-46v-27h20l-5 7 5 7H-13" fill="#b4553d" stroke="#f1d399" stroke-width="2"/></g>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 930"><title>The climb</title><desc>A grey granite mountain with jagged ridges, stone steps and a winding trail from green foothills to a football ground at the summit.</desc><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#dae5e3"/><stop offset="1" stop-color="#667f85"/></linearGradient><pattern id="scree" width="47" height="43" patternUnits="userSpaceOnUse"><path d="m8 17 4-2 3 2m17 13 3-3 4 1" stroke="#536b75" opacity=".18" fill="none"/><path d="m25 8 3-1" stroke="#eef0e5" opacity=".45"/></pattern></defs>
  <path d="M0 0h600v930H0Z" fill="url(#sky)"/>
  <path d="M0 470 92 260 159 387 235 185 333 371 457 207 600 413V930H0Z" fill="#718d94" opacity=".24"/>
  <path d="M34 792 73 531 121 391 158 259 226 163 282 55 345 129 406 238 475 382 526 585 576 816 451 914 160 910Z" fill="#607780"/>
  <path d="M34 792 121 391 158 259 226 163 282 55 272 286 205 493 116 837Z" fill="#acb8b9"/>
  <path d="M282 55 345 129 406 238 342 204 315 135Z" fill="#809399"/>
  <path d="M260 93 282 55 309 90 302 102 283 91 274 105Z" fill="#e5e9df"/>
  <path d="M80 559 126 369 155 318 163 471Z" fill="#99a8ac"/>
  <path d="M475 382 502 473 526 585 467 537 449 440Z" fill="#506875"/>
  ${terrain}
  ${path(route,'none','stroke="#7f8b85" stroke-width="27" stroke-linecap="round" stroke-linejoin="round"')}
  ${path(route,'none','stroke="#ddd4b7" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"')}
  ${path(sideRoute,'none','stroke="#d4c39a" stroke-width="13" stroke-linecap="round" stroke-dasharray="3 6"')}
  ${stair(430,615,65,9)}${stair(145,475,65,9)}${stair(440,340,65,9)}${stair(230,185,70,10)}
  ${shadowLayer(objects)}${artLayer(objects)}${stadium}
  <g transform="translate(390 744)"><path d="m-10 9 10-25 11 25M0-16V9" fill="none" stroke="#635741" stroke-width="3"/><rect x="-14" y="-26" width="25" height="16" rx="3" fill="#31564e"/><circle cy="-18" r="5" fill="#9fc1ac"/><path d="m11-22 8-5v17l-8-5" fill="#31564e"/></g>
  <g fill="#edf1e9" opacity=".48"><path d="M-20 286q0-14 20-14 8-25 30-13 21-10 26 11h40q17 0 17 16Z"/><path d="M452 231q0-13 19-13 9-20 24-8 15-7 22 9h44q17 0 17 12Z"/></g></svg>`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await writeFile(new URL('../mountain/world.svg',import.meta.url),buildMountain());
