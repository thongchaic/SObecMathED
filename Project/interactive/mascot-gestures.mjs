// All coordinates share the existing 384px character space. No extra texture.
export const STEP_GESTURE_MS=2200;
export function sampleWink(progress){
  const p=Math.max(0,Math.min(1,progress));
  const envelope=Math.sin(Math.PI*p)**2;
  const closure=p<.22?0:p<.34?(p-.22)/.12:p<.56?1:p<.72?1-(p-.56)/.16:0;
  return {tilt:.023*envelope,closure,sparkle:p>.3 && p<.85?Math.sin((p-.3)/.55*Math.PI):0};
}
export function paintWinkSparkle(ctx,eye,motion,bandAt,amount){
  if(!amount || !eye)return;
  const x=eye[0]-eye[2]-12,y=eye[1]-eye[3]-4,b=bandAt(y,motion);
  ctx.save();ctx.transform(1,0,b.shear,b.scaleY,b.x,b.y);
  ctx.globalAlpha=amount;ctx.translate(x,y);ctx.rotate(-.15+amount*.3);
  const size=4+6*amount;
  ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.25,-size*.25);ctx.lineTo(size,0);
  ctx.lineTo(size*.25,size*.25);ctx.lineTo(0,size);ctx.lineTo(-size*.25,size*.25);
  ctx.lineTo(-size,0);ctx.lineTo(-size*.25,-size*.25);ctx.closePath();
  ctx.fillStyle='#fff3a1';ctx.fill();ctx.strokeStyle='#e4ad42';ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
