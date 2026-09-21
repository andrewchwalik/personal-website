import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { hull } from './build-world.mjs';

// The room uses one isometric ground plane, with all furniture raised along z.
const p = ([x,y,z=0]) => [300+(x-y)*.7,300+(x+y)*.4-z];
const poly = (points,fill,extra='') => `<polygon points="${points.map(v=>p(v).map(n=>+n.toFixed(2)).join(',')).join(' ')}" fill="${fill}" ${extra}/>`;
const line = (points,color,width=1,extra='') => `<polyline points="${points.map(v=>p(v).map(n=>+n.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const box = (x,y,w,d,h,colors,base=0) => poly([[x,y,h],[x+w,y,h],[x+w,y+d,h],[x,y+d,h]],colors[0])+poly([[x,y+d,base],[x+w,y+d,base],[x+w,y+d,h],[x,y+d,h]],colors[1])+poly([[x+w,y,base],[x+w,y+d,base],[x+w,y+d,h],[x+w,y,h]],colors[2]);
const shadow = vertices => poly(hull(vertices.map(([x,y,z=0])=>[x+.65*z,y+.18*z])), '#443d31','opacity=".14"');
const oval = (x,y,rx,ry,fill,extra='') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;

export function buildHouse() {
  let planks='';
  for(let i=0;i<320;i+=32) {
    planks+=poly([[i,0,0],[i+32,0,0],[i+32,320,0],[i,320,0]],i%64?'#c49358':'#cc9c60');
    planks+=line([[i,0,0],[i,320,0]],'#aa7a47',1);
    for(let j=(i%64?0:48);j<320;j+=96) planks+=line([[i,j,0],[i+32,j,0]],'#aa7a47',.8);
  }
  let rug='';
  for(let i=0;i<5;i++) rug+=line([[66,122+i*31,1],[258,122+i*31,1]],i%2?'#a45236':'#dfb776',2);
  let tableLegs='';
  for(const [x,y] of [[122,172],[210,172],[122,240],[210,240]]) tableLegs+=box(x,y,7,7,34,['#ac784a','#8d5e3d','#734e35']);
  let bookLines='';
  for(let i=0;i<4;i++) bookLines+=line([[141,188+i*8,41],[164,188+i*8,41]],'#bbaa87',1)+line([[176,190+i*8,41],[201,190+i*8,41]],'#bbaa87',1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><title>Andrew's home base</title><desc>A warm isometric room with a TV, soccer ball, and guestbook. Sunlight falls through a window onto a wooden floor.</desc>
    <defs><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#477770"/><stop offset="1" stop-color="#163e45"/></linearGradient><radialGradient id="ball"><stop offset=".2" stop-color="#fff3cd"/><stop offset="1" stop-color="#cfccad"/></radialGradient></defs>
    <ellipse cx="302" cy="467" rx="231" ry="111" fill="#6c705b" opacity=".09"/>
    ${poly([[0,0,214],[320,0,214],[320,320,0],[0,320,0]],'#487963','opacity="0"')}
    ${poly([[0,0,216],[0,320,216],[0,320,0],[0,0,0]],'#bdd0ad')}
    ${poly([[0,0,216],[320,0,216],[320,0,0],[0,0,0]],'#8fae93')}
    ${poly([[0,320,0],[320,320,0],[320,320,-12],[0,320,-12]],'#90683f')}
    ${poly([[320,0,0],[320,320,0],[320,320,-12],[320,0,-12]],'#71593d')}
    ${planks}
    ${line([[0,320,0],[0,0,0],[320,0,0]],'#5b8069',7)}
    ${line([[0,320,214],[0,0,214],[320,0,214]],'#e0e5bd',5)}
    ${line([[0,320,214],[0,320,0]],'#cedbbb',5)}
    ${line([[320,0,214],[320,0,0]],'#75957d',5)}
    <!-- Window and its light share the left wall's plane. -->
    ${poly([[0,92,174],[0,230,174],[0,230,81],[0,92,81]],'#829a7e','stroke="#73836b" stroke-width="6"')}
    ${poly([[1,96,170],[1,226,170],[1,226,85],[1,96,85]],'#b6e0cc')}
    ${poly([[2,96,108],[2,130,116],[2,164,107],[2,203,122],[2,226,114],[2,226,85],[2,96,85]],'#74af72')}
    ${line([[3,161,172],[3,161,83]],'#f2e5ba',4)}
    ${line([[3,94,130],[3,228,130]],'#f2e5ba',4)}
    ${poly([[0,90,80],[0,232,80],[13,232,80],[13,90,80]],'#eee0ae')}
    ${poly([[5,96,0],[5,225,0],[94,255,0],[94,126,0]],'#ffe6a3','opacity=".22"')}
    ${line([[97,172,0],[12,144,0]],'#c19b64',3,'opacity=".45"')}
    <!-- Open doorway on the left wall; its threshold follows the floor plane. -->
    ${poly([[1,246,105],[1,314,105],[1,314,0],[1,246,0]],'#806444')}
    ${poly([[2,252,98],[2,308,98],[2,308,0],[2,252,0]],'#203f39')}
    ${poly([[3,257,93],[3,305,93],[3,305,3],[3,257,3]],'#314e40')}
    ${line([[4,249,0],[4,249,102],[4,311,102],[4,311,0]],'#dfb879',4)}
    ${poly([[0,249,1],[0,312,1],[12,312,1],[12,249,1]],'#e2c48c')}
    ${poly([[16,252,1],[61,252,1],[61,307,1],[16,307,1]],'#7c9675')}
    ${line([[21,259,2],[55,259,2],[55,300,2],[21,300,2],[21,259,2]],'#b9c69a',1.3)}
    <!-- An inset rug, not an independently rotated rectangle. -->
    ${poly([[62,117,1],[262,117,1],[262,280,1],[62,280,1]],'#bc704b','stroke="#edd095" stroke-width="5"')}${rug}
    ${poly([[74,131,1],[249,131,1],[249,267,1],[74,267,1]],'none','stroke="#edc286" stroke-width="1.5"')}
    <!-- TV cabinet, screen and stand all use the same axes. -->
    ${shadow([[99,5,46],[250,5,46],[250,48,46],[99,48,46]])}
    ${box(99,7,151,43,44,['#c3955c','#ac7c49','#865d3b'])}
    ${line([[171,51,4],[171,51,37]],'#865d3b',1.5)}
    ${line([[153,52,25],[163,52,25]],'#dfbc7e',2)}${line([[182,52,25],[192,52,25]],'#dfbc7e',2)}
    ${box(163,20,32,14,49,['#2f4f49','#25403c','#1e3836'],44)}
    ${poly([[93,13,155],[251,13,155],[251,13,65],[93,13,65]],'#284d48','stroke="#183d3c" stroke-width="6" stroke-linejoin="round"')}
    ${poly([[101,14,147],[243,14,147],[243,14,74],[101,14,74]],'url(#glass)')}
    ${poly([[106,15,143],[137,15,143],[208,15,78],[178,15,78]],'#76a6a0','opacity=".11"')}
    ${poly([[158,16,135],[158,16,100],[189,16,117]],'#f3dfa8')}
    ${oval(460,332,2,2,'#e1b464')}
    <!-- Small shelf and books ground the room in the same warm materials. -->
    ${box(25,4,42,18,10,['#b78652','#926840','#775336'])}
    ${box(28,6,9,14,35,['#e3bb75','#d6ab6c','#b08048'])}${box(39,6,7,14,29,['#bc7360','#aa6656','#804d42'])}${box(48,6,8,14,38,['#7f9c77','#6c8867','#516e53'])}
    <!-- Table, book and pen. -->
    ${shadow([[117,167,37],[224,167,37],[224,251,37],[117,251,37]])}${tableLegs}
    ${box(115,166,111,89,37,['#dcaf73','#bd8b53','#a47446'],33)}
    ${poly([[139,181,39],[169,181,39],[173,184,39],[176,181,39],[206,181,39],[206,225,39],[176,225,39],[172,228,39],[168,225,39],[139,225,39]],'#5a7460','stroke="#48654f" stroke-width="3"')}
    ${poly([[140,180,41],[169,180,41],[172,184,41],[172,226,41],[168,222,41],[140,222,41]],'#fff0c7')}
    ${poly([[173,184,41],[177,180,41],[205,180,41],[205,222,41],[177,222,41],[173,226,41]],'#f4dfb2')}${bookLines}
    ${line([[214,192,39],[214,216,39]],'#526c5c',2.4)}
    ${line([[214,215,39],[214,219,39]],'#e9d3a4',2)}
    <!-- Soccer ball with one upper-left highlight and a ground shadow. -->
    ${oval(393,470,23,10,'#574c33','opacity=".18"')}
    ${oval(384,454,18,18,'url(#ball)')}
    <path d="m379 445 10 1 3 9-8 6-8-7Z" fill="#315849"/><path d="m370 442 5 1 4-4m17 4-3 5m4 18-7-4-2 9m-17-13 6-4m-5 11 4 5" fill="none" stroke="#547563" stroke-width="1.4"/>
    ${oval(376,444,3,2,'#fff8de','opacity=".75"')}
  </svg>`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await writeFile(new URL('../img/home-base.svg', import.meta.url), buildHouse());
  console.log('Built home-base.svg.');
}
