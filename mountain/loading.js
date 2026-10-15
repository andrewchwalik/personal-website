import {footPose,kneeFor,ballPose,cycleSeconds,walkingSpeed} from './loading-motion.mjs';
const runner=document.querySelector('.loader-run');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let frame=0,start=null;
const $=selector=>runner.querySelector(selector);
function pose(phase){
  const bob=1.2*Math.cos(phase*Math.PI*4),hip={x:40,y:74+bob};
  for(const [name,offset] of [['back',.5],['front',0]]){
    const foot=footPose(phase+offset,name==='front'),knee=kneeFor(hip,foot);
    $('.loader-leg-'+name).setAttribute('d',`M${hip.x} ${hip.y} L${knee.x} ${knee.y} L${foot.x} ${foot.y}`);
    $('.loader-boot-'+name).setAttribute('transform',`translate(${foot.x} ${foot.y})`);
  }
  $('.loader-torso').setAttribute('transform',`translate(0 ${bob})`);
  $('.loader-arm').setAttribute('transform',`rotate(${Math.sin(phase*Math.PI*2)*18} 42 49)`);
  const ball=ballPose(phase);
  $('.loader-ball').setAttribute('transform',`translate(${ball.x} ${ball.y})`);
  $('.loader-ball-panels').setAttribute('transform',`rotate(${phase*360})`);
  $('.loader-ball-shadow').setAttribute('cx',ball.x);
}
function tick(now){
  if(!document.documentElement.classList.contains('world-loading')||document.documentElement.classList.contains('world-error'))return;
  if(start===null)start=now;
  const elapsed=(now-start)/1000,phase=(elapsed/cycleSeconds+.15)%1,width=runner.parentElement.clientWidth;
  runner.style.transform=`translateX(${((elapsed*walkingSpeed+140)%(width+140))-120}px)`;
  pose(phase);frame=requestAnimationFrame(tick);
}
function refresh(){cancelAnimationFrame(frame);if(reduced.matches){pose(.15);return;}frame=requestAnimationFrame(tick);}
if(runner){
  refresh();reduced.addEventListener('change',refresh);
  const observer=new MutationObserver(()=>{
    if(!document.documentElement.classList.contains('world-loading')||document.documentElement.classList.contains('world-error')){cancelAnimationFrame(frame);observer.disconnect();}
  });
  observer.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
}
