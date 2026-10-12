import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { rounded, solid, terrainShadow, tree, boulder, cottage, goal, shadowLayer, artLayer, poly, path } from './build-world.mjs';
import { route, sideRoute } from '../mountain/data.mjs';

export function buildMountain() {
  // Each terrace uses the same projection and sunlight as the existing worlds.
  const terraces = [
    {height:42, color:'#9fbf68', top:[[70,705],[118,661],[205,655],[296,667],[470,666],[535,724],[523,807],[434,846],[331,855],[212,839],[120,847],[63,794]]},
    {height:65, color:'#91b46a', top:[[117,568],[190,525],[330,517],[458,530],[501,585],[490,603],[433,615],[318,615],[216,615],[125,615],[92,598]]},
    {height:65, color:'#88aa69', top:[[101,420],[169,393],[294,397],[410,388],[467,429],[460,460],[411,475],[262,475],[158,475],[105,460]]},
    {height:65, color:'#9bb784', top:[[178,285],[234,251],[362,249],[449,271],[473,318],[443,340],[362,340],[254,340],[168,340],[144,315]]},
    {height:70, color:'#bdc7a4', top:[[231,132],[280,94],[338,105],[385,144],[399,160],[363,185],[280,185],[217,185],[196,160]]},
  ];
  const terraceArt = terraces.map((t,i) => {
    const top=rounded(t.top,18), base=top.map(([x,y])=>[x,y+t.height]);
    return terrainShadow(base,t.height,'#274c48')+solid(base,t.height,`mountain-${i}`,t.color);
  }).join('');
  const objects = [tree(100,762,42,17),tree(477,794,40,15),tree(495,767,46,17),tree(115,590,37,13),tree(344,598,35,12),tree(195,456,32,12),tree(213,444,42,14),boulder(374,451,20,16),boulder(350,460,12,10),tree(366,327,30,10),boulder(193,323,23,15),boulder(352,174,19,12),cottage(136,793)];
  const stair = (x,y,length,count) => `<g fill="#cfb37c" stroke="#9b815c" stroke-width="1">${Array.from({length:count},(_,i)=>`<path d="M${x-11} ${y+i*length/count}h22v${length/count}h-22Z"/>`).join('')}</g>`;
  const stadium = `<g transform="translate(300 132)"><path d="M-52 0-39-30H38L53 0 39 22H-38Z" fill="#335b4e"/><path d="M-47-3-36-26H35L47-3 35 17H-34Z" fill="#e4d1a0"/><path d="M-35-6-27-19H26L35-6 26 10H-25Z" fill="#709958"/><path d="M-27-16H26L31-5 25 7H-24L-31-5Z M0-16V7" fill="none" stroke="#eef0cf" stroke-width="1"/><ellipse cx="0" cy="-4" rx="7" ry="4" fill="none" stroke="#eef0cf"/><path d="M-48-8v-20m96 20v-20" stroke="#48665c" stroke-width="3"/><path d="M-55-28h14m28-18v-27m0 0h20l-5 7 5 7H-13m54 17h14" fill="#b4553d" stroke="#f1d399" stroke-width="2"/></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 930"><title>The climb</title><desc>A terraced mountain with a winding walking trail, base camp, a side-quest filming overlook and a football ground at the summit.</desc><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#acc8b8"/><stop offset="1" stop-color="#355f61"/></linearGradient><pattern id="grass" width="41" height="37" patternUnits="userSpaceOnUse"><path d="m9 15-2-4m2 4 3-5m20 16 2-4" stroke="#59784d" opacity=".24" fill="none"/></pattern><pattern id="cliff-grain" width="25" height="31" patternUnits="userSpaceOnUse"><path d="M7 12v4m12 8v2" stroke="#653e32" opacity=".15"/></pattern></defs><path d="M0 0h600v930H0Z" fill="url(#sky)"/><path d="M0 365 82 253l77 139 81-113 101 103 111-174 148 191v531H0Z" fill="#456b64" opacity=".16"/>${terraceArt}${path(route,'none','stroke="#708957" stroke-width="27" stroke-linecap="round" stroke-linejoin="round"')}${path(route,'none','stroke="#eed39b" stroke-width="21" stroke-linecap="round" stroke-linejoin="round"')}${path(sideRoute,'none','stroke="#dcb76c" stroke-width="13" stroke-linecap="round" stroke-dasharray="3 6"')}${stair(430,615,65,9)}${stair(145,475,65,9)}${stair(440,340,65,9)}${stair(230,185,65,10)}${shadowLayer(objects)}${artLayer(objects)}${stadium}<g transform="translate(390 744)"><path d="m-10 9 10-25 11 25M0-16V9" fill="none" stroke="#635741" stroke-width="3"/><rect x="-14" y="-26" width="25" height="16" rx="3" fill="#31564e"/><circle cy="-18" r="5" fill="#9fc1ac"/><path d="m11-22 8-5v17l-8-5" fill="#31564e"/></g><g fill="#f0f0d7" opacity=".6"><path d="M-20 286q0-14 20-14 8-25 30-13 21-10 26 11h40q17 0 17 16Z"/><path d="M452 231q0-13 19-13 9-20 24-8 15-7 22 9h44q17 0 17 12Z"/></g></svg>`;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await writeFile(new URL('../mountain/world.svg',import.meta.url),buildMountain());
