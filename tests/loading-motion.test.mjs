import test from 'node:test';
import assert from 'node:assert/strict';
import {footPose,kneeFor,ballPose,walkingSpeed,cycleSeconds} from '../mountain/loading-motion.mjs';
test('stance foot remains planted while the body advances',()=>{
  const worldX=p=>walkingSpeed*cycleSeconds*p+footPose(p).x;
  assert.ok(Math.abs(worldX(.1)-worldX(.5))<.00001);
  assert.equal(footPose(.3).y,108);
  assert.ok(footPose(.8).y<108);
});
test('knees retain limb lengths throughout the walk and kick',()=>{
  for(let p=0;p<1;p+=.01){
    const hip={x:40,y:74+1.2*Math.cos(p*Math.PI*4)},foot=footPose(p,true),knee=kneeFor(hip,foot);
    assert.ok(Math.abs(Math.hypot(knee.x-hip.x,knee.y-hip.y)-24)<.001);
    assert.ok(Math.abs(Math.hypot(knee.x-foot.x,knee.y-foot.y)-24)<.001);
  }
});
test('front boot contacts the ball before it rolls away',()=>{
  const foot=footPose(.93,true),ball=ballPose(.93);
  assert.ok(foot.x+14>=ball.x-10);
  assert.ok(Math.abs(foot.y-ball.y)<8);
  assert.ok(ballPose(.99).x>ball.x);
});
