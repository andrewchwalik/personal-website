export const cycleSeconds=1.2;
export const walkingSpeed=36;
// Grounded feet counter the body's forward movement instead of sliding across the floor.
export function footPose(phase,kick=false){
  const p=((phase%1)+1)%1;
  if(p<.6)return {x:54-walkingSpeed*cycleSeconds*p,y:108};
  const t=(p-.6)/.4,back=54-walkingSpeed*cycleSeconds*.6;
  const reach=kick&&t>.65?11*Math.sin((t-.65)/.35*Math.PI):0;
  return {x:back+(54-back)*t+reach,y:108-12*Math.sin(Math.PI*t)};
}
export function kneeFor(hip,foot){
  const dx=foot.x-hip.x,dy=foot.y-hip.y,d=Math.hypot(dx,dy);
  const bend=Math.sqrt(Math.max(0,24*24-d*d/4));
  return {x:(hip.x+foot.x)/2+dy/d*bend,y:(hip.y+foot.y)/2-dx/d*bend};
}
export function ballPose(phase){
  const t=((phase-.93+1)%1);
  return {x:79+23*Math.sin(Math.PI*t),y:104-3*Math.sin(Math.PI*Math.min(t/.22,1))};
}
