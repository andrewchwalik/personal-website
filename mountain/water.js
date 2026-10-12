// These channels follow the painted water, in the artwork's 1024 x 1536 coordinates.
export const channels = [
  {d:'M143 848 Q139 876 138 888 Q135 905 123 915',x:120,y:916,r:15},
  {d:'M109 927 Q114 948 109 968 Q107 981 98 986',x:97,y:988,r:13},
  {d:'M66 1008 Q56 1025 50 1043 L45 1060',x:44,y:1062,r:12},
  {d:'M950 704 Q951 725 956 743 L960 766',x:961,y:766,r:9},
  {d:'M883 856 Q890 877 894 899 L898 923',x:899,y:924,r:10},
  {d:'M939 989 Q950 1007 954 1033 Q958 1056 967 1082',x:969,y:1085,r:13}
];
const svg=document.querySelector('.water-effects');
const ns='http://www.w3.org/2000/svg';
svg.innerHTML='<defs><radialGradient id="water-mist"><stop stop-color="#f0fcff" stop-opacity=".7"/><stop offset="1" stop-color="#f0fcff" stop-opacity="0"/></radialGradient></defs>';
channels.forEach((channel,index)=>{
  for(let layer=0;layer<2;layer++){
    const path=document.createElementNS(ns,'path');path.setAttribute('d',channel.d);
    path.setAttribute('class',layer?'water-flow fine':'water-flow');
    path.style.animationDelay=`${-index*.43-layer*.71}s`;
    if(layer)path.setAttribute('transform','translate(2 0)');svg.append(path);
  }
  const mist=document.createElementNS(ns,'ellipse');mist.setAttribute('cx',channel.x);mist.setAttribute('cy',channel.y);mist.setAttribute('rx',channel.r);mist.setAttribute('ry',channel.r*.5);mist.setAttribute('fill','url(#water-mist)');mist.setAttribute('class','water-mist');mist.style.animationDelay=`${-index*.7}s`;svg.append(mist);
});
let visible=true;
function pause(){
  const paused=!visible||document.hidden||Boolean(document.querySelector('dialog[open]'));
  svg.classList.toggle('paused',paused);
  document.querySelector('.sky-clouds')?.classList.toggle('paused',paused);
}
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;pause();}).observe(svg);
document.addEventListener('visibilitychange',pause);
new MutationObserver(pause).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
