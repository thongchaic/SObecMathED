// Deform the ORIGINAL connected artwork, never floating head/mouth cutouts.
// Below the collar the mapping is exactly identity, keeping both hands still.
export const IDLE_ROWS = Object.freeze([0, 150, 170, 188, 200]);
export const IDLE_STEP_MS = 1000 / 12;

export function sampleIdleMotion(elapsed) {
  const phase = Math.max(0, elapsed) / 5200 * Math.PI * 2;
  // Visible at the actual 180–340px display sizes, while the collar remains fixed.
  return { tilt: Math.sin(phase) * .024, nod: Math.sin(phase * 2) * 1.2,
    smile: (1 - Math.cos(phase)) * .75 };
}

export function idleRow(y, motion) {
  if(y>=200)return {x:0,y};
  const neck = Math.max(0, 1 - y / 200);
  const jaw = y <= 150 || y >= 188 ? 0 : y <= 170 ? (y - 150) / 20 : (188 - y) / 18;
  return { x: motion.tilt * Math.max(0, 200 - y), y: y + motion.nod * neck + motion.smile * jaw };
}

// Eyes use precisely the same piecewise-linear mapping as their source pixels.
export function idleBand(y, motion) {
  if(y>=200)return {shear:0,scaleY:1,x:0,y:0};
  const index = IDLE_ROWS.findIndex((bottom, i) => i > 0 && y <= bottom);
  const top = IDLE_ROWS[Math.max(0, index - 1)], bottom = IDLE_ROWS[index < 0 ? IDLE_ROWS.length - 1 : index];
  const a = idleRow(top, motion), b = idleRow(bottom, motion);
  const height = bottom - top || 1;
  return { shear: (b.x - a.x) / height, scaleY: (b.y - a.y) / height,
    x: a.x - (b.x - a.x) / height * top, y: a.y - (b.y - a.y) / height * top };
}

// Inverse-map every destination pixel instead of compositing separately
// antialiased strip edges. Each pixel is written exactly once, including joins.
// Reuse both ImageData buffers; no canvas readback or allocation per tick.
export function rasterizeIdleHead(source, target, motion) {
  const width=source.width, height=source.height, src=source.data, dst=target.data;
  let bandIndex=1;
  for(let y=0;y<target.height;y++) {
    while(bandIndex<IDLE_ROWS.length-1 && y>idleRow(IDLE_ROWS[bandIndex],motion).y)bandIndex++;
    const band=idleBand((IDLE_ROWS[bandIndex-1]+IDLE_ROWS[bandIndex])/2,motion);
    const sourceY=Math.max(0,Math.min(height-1,(y-band.y)/band.scaleY));
    const y0=Math.floor(sourceY),y1=Math.min(height-1,y0+1),fy=sourceY-y0;
    const shift=band.shear*sourceY+band.x;
    for(let x=0;x<width;x++) {
      const i=(y*width+x)*4, sourceX=x-shift, x0=Math.floor(sourceX), x1=Math.min(width-1,x0+1), fx=sourceX-x0;
      if(sourceX<0 || sourceX>width-1){dst[i]=dst[i+1]=dst[i+2]=dst[i+3]=0;continue;}
      const a=(y0*width+x0)*4,b=(y0*width+x1)*4,c=(y1*width+x0)*4,d=(y1*width+x1)*4;
      // Interpolate in premultiplied alpha to avoid dark/bright edge fringes.
      const wa=(1-fx)*(1-fy)*src[a+3],wb=fx*(1-fy)*src[b+3],wc=(1-fx)*fy*src[c+3],wd=fx*fy*src[d+3];
      const alpha=wa+wb+wc+wd;
      dst[i+3]=alpha;
      if(alpha===0){dst[i]=dst[i+1]=dst[i+2]=0;continue;}
      for(let channel=0;channel<3;channel++)dst[i+channel]=(src[a+channel]*wa+src[b+channel]*wb+src[c+channel]*wc+src[d+channel]*wd)/alpha;
    }
  }
  return target;
}
