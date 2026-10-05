export const BLINK = Object.freeze([0,.55,1,.55,0,0,.65,1,.45,0]);

// The same local eyelid painter is used in lessons and the result card.
export function paintMascotEyelids(ctx,width,height,eyes,closure,bandAt=null) {
  ctx.clearRect(0,0,width,height);
  if(!closure)return;
  for(const [index,[x,y,rx,ry,angle]] of (eyes || []).entries()) {
    const eyeClosure=Array.isArray(closure)?closure[index]:closure;
    if(!eyeClosure)continue;
    ctx.save();
    if(bandAt){const b=bandAt(y);ctx.transform(1,0,b.shear,b.scaleY,b.x,b.y);}
    ctx.translate(x,y);ctx.rotate(angle*Math.PI/180);
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.clip();
    const gradient=ctx.createLinearGradient(0,-ry,0,ry);
    gradient.addColorStop(0,'#36b492');gradient.addColorStop(.7,'#79d2b0');gradient.addColorStop(1,'#b7e7c7');
    ctx.fillStyle=gradient;ctx.fillRect(-rx,-ry,2*rx,2*ry*eyeClosure);
    ctx.strokeStyle='rgba(24,101,82,.75)';ctx.lineWidth=1.4;
    const edge=eyeClosure===1?ry*.15:-ry+2*ry*eyeClosure;
    ctx.beginPath();ctx.moveTo(-rx,edge-2);ctx.quadraticCurveTo(0,edge+6,rx,edge-2);ctx.stroke();ctx.restore();
  }
}

// Sparse blink-only scheduler. It never repaints the head artwork.
export function createMascotEyeBlink({root,canvas,eyes,width=320,height=315,interval=[5000,8000],duration=460,
  initialDelay=2600,forceMotion=false,now=()=>performance.now(),random=Math.random,schedule=setTimeout,cancel=clearTimeout,
  documentTarget=document,windowTarget=window,observe=true,visibilityTarget=root}={}) {
  const ctx=canvas.getContext('2d');canvas.width=width;canvas.height=height;
  const preference=windowTarget.matchMedia?.('(prefers-reduced-motion: reduce)');
  let destroyed=false,intersecting=true,timer=null,started=null,next=now()+initialDelay,last=-1,forced=null,cycles=0;
  root.dataset.blinkCycles='0';
  const active=()=>!destroyed && root.isConnected!==false && !root.hidden && !documentTarget.hidden && intersecting && (forceMotion || !preference?.matches);
  const stop=()=>{if(timer!==null)cancel(timer);timer=null;};
  const reset=()=>{started=null;next=now()+interval[0]+random()*(interval[1]-interval[0]);};
  function draw(closure){if(closure===last)return;paintMascotEyelids(ctx,width,height,eyes,closure);root.dataset.eyeClosure=String(closure);last=closure;}
  function tick(){
    stop();if(!active()){draw(0);return;}
    const time=now();if(started===null && time>=next)started=time;
    const step=started===null?0:Math.floor((time-started)/(duration/BLINK.length));
    if(step>=BLINK.length){root.dataset.blinkCycles=String(++cycles);reset();}
    draw(forced??(started===null?0:BLINK[step]));
    timer=schedule(tick,Math.max(16,started===null?next-now():duration/BLINK.length));
  }
  const visibility=()=>{reset();tick();};
  documentTarget.addEventListener('visibilitychange',visibility);preference?.addEventListener?.('change',visibility);
  let observed=false;
  const observer=observe && windowTarget.IntersectionObserver?new windowTarget.IntersectionObserver(entries=>{
    const visible=entries[0].isIntersecting;
    if(observed && visible===intersecting)return;
    intersecting=visible;if(observed)visibility();else{observed=true;tick();}
  }):null;
  observer?.observe(visibilityTarget);tick();
  return {blink(){if(active()){started=now();tick();}},setEyeClosure(value){forced=value;tick();},
    destroy(){destroyed=true;stop();observer?.disconnect();documentTarget.removeEventListener('visibilitychange',visibility);preference?.removeEventListener?.('change',visibility);draw(0);}};
}
