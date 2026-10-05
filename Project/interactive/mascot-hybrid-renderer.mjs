export const MASCOT_REVISION = 'wink-step-5';
// A query on the parent module does NOT propagate to static imports. Match the
// shell's cache token so a fresh renderer cannot retain an old gesture manifest.
export function mascotDependencyUrl(path, parentUrl = import.meta.url) {
  const url = new URL(path, parentUrl);
  url.searchParams.set('v', new URL(parentUrl).searchParams.get('v') || MASCOT_REVISION);
  return url.href;
}
const [{ MASCOT_SPRITES, sampleClip }, { IDLE_STEP_MS, sampleIdleMotion, idleBand, rasterizeIdleHead }, {BLINK,paintMascotEyelids}, {STEP_GESTURE_MS,sampleWink,paintWinkSparkle}] = await Promise.all([
  import(mascotDependencyUrl('./mascot-sprite-manifest.mjs')),
  import(mascotDependencyUrl('./mascot-idle-motion.mjs')),
  import(mascotDependencyUrl('./mascot-eye-blink.mjs')),
  import(mascotDependencyUrl('./mascot-gestures.mjs'))
]);

const imageCache = new Map();
function loadImage(url) {
  if(!imageCache.has(url)) {
    const promise = new Promise((resolve,reject)=>{
      const image = new Image();
      image.onload=()=>resolve(image);
      image.onerror=()=>reject(new Error(`Mascot sprite failed: ${url}`));
      image.src=url;
    });
    imageCache.set(url,promise);
    promise.catch(()=>imageCache.delete(url));
  }
  return imageCache.get(url);
}

export function createHybridMascotRenderer({ root, canvas, eyeCanvas, assetUrl = path=>new URL(path,import.meta.url).href,
  blinkInterval = [5000,8000], blinkDuration = 460, onFallback = ()=>{}, manifest = MASCOT_SPRITES,
  subIdleInterval = [18000,30000], subIdleDuration = 1800, random = Math.random,
  load = loadImage, now = ()=>performance.now(), schedule = setTimeout, cancel = clearTimeout,
  documentTarget = document, windowTarget = window, observe = true } = {}) {
  const ctx=canvas.getContext('2d'), eyeCtx=eyeCanvas.getContext('2d');
  if(!ctx || !eyeCtx) throw new Error('Mascot Canvas2D is unavailable');
  canvas.width=canvas.height=eyeCanvas.width=eyeCanvas.height=manifest.frameSize;
  root.dataset.mascotRevision=MASCOT_REVISION;
  let pose='', image=null, timer=null, destroyed=false, manualPause=false, intersecting=true;
  let start=now(), nextBlink=0, blinkingSince=null, lastFrame=-1, lastEyeKey='', forcedFrame=null;
  let baseDraws=0, eyeDraws=0, headDraws=0, wakeups=0, generation=0, forcedEyeClosure=null;
  let lastIdleStep=-1, forcedIdleTime=null;
  let headSource=null,headTarget=null;
  let subIdleSince=null,nextSubIdle=Infinity;
  let stepSince=null;
  let wasActive=false;
  const loadedSheets=new Set();
  const reduced=()=>root.dataset.motion==='reduced';
  const active=()=>!destroyed && !manualPause && intersecting && !documentTarget.hidden && !root.hidden &&
    !root.classList.contains('is-disabled') && !root.classList.contains('is-animation-paused');
  const randomBlink=()=>now()+blinkInterval[0]+random()*(blinkInterval[1]-blinkInterval[0]);
  const resetSubIdle=()=>{subIdleSince=null;nextSubIdle=now()+subIdleInterval[0]+random()*(subIdleInterval[1]-subIdleInterval[0]);root.dataset.idleVariant='rest';};
  const resetStep=()=>{if(stepSince!==null)lastFrame=-1;stepSince=null;root.dataset.gesture='rest';};
  const stop=()=>{if(timer!==null)cancel(timer);timer=null;};

  function drawEyes(eyes, closure, motion) {
    eyeDraws++;
    paintMascotEyelids(eyeCtx,manifest.frameSize,manifest.frameSize,eyes,closure,motion?y=>idleBand(y,motion):null);
  }
  function tick() {
    stop();
    root.dataset.idleRunning=String(active() && !reduced());
    if(!active() || !image) return;
    wakeups++;
    const time=now(), clip=manifest.clips[pose], sheet=manifest.sheets[clip.sheet];
    if(stepSince!==null && (time-stepSince>=STEP_GESTURE_MS || reduced()))resetStep();
    const stepGesture=stepSince!==null;
    if(pose==='idle' && !stepGesture && !reduced() && forcedIdleTime===null && forcedFrame===null){
      if(subIdleSince!==null && time-subIdleSince>=subIdleDuration)resetSubIdle();
      else if(subIdleSince===null && time>=nextSubIdle){subIdleSince=time;root.dataset.idleVariant='sub-idle';}
    }else if(subIdleSince!==null)resetSubIdle();
    const subIdle=subIdleSince!==null;
    const sample=sampleClip(clip,reduced()?0:time-start);
    const frame=forcedFrame ?? (stepGesture?manifest.clips.speaking.frames[0]:sample.frame);
    const headMotion=clip.idleMotion || stepGesture;
    const frameChanged=frame!==lastFrame;
    if(frameChanged) {
      ctx.clearRect(0,0,manifest.frameSize,manifest.frameSize);
      ctx.drawImage(image,frame%sheet.columns*manifest.frameSize,Math.floor(frame/sheet.columns)*manifest.frameSize,
        manifest.frameSize,manifest.frameSize,0,0,manifest.frameSize,manifest.frameSize);
      headSource=headMotion?ctx.getImageData(0,0,manifest.frameSize,201):null;
      if(headSource && !headTarget)headTarget=ctx.createImageData(manifest.frameSize,200);
      lastFrame=frame;baseDraws++;
      root.dataset.spriteFrame=String(frame);
    }
    if(headMotion && !headSource){headSource=ctx.getImageData(0,0,manifest.frameSize,201);headTarget??=ctx.createImageData(manifest.frameSize,200);}
    const moving=Boolean(headMotion && !reduced());
    const idleStep=moving?Math.floor((time-start)/IDLE_STEP_MS):0;
    const wink=subIdle?sampleWink((time-subIdleSince)/subIdleDuration):null;
    const motion=headMotion?sampleIdleMotion(reduced()?0:forcedIdleTime ?? idleStep*IDLE_STEP_MS):null;
    if(wink)motion.tilt+=wink.tilt;
    if(headMotion && (frameChanged || idleStep!==lastIdleStep)) {
      // A single gap-free raster upload; no antialiased slice boundaries.
      // Below y=200 the original arms, hands and feet remain untouched.
      ctx.putImageData(rasterizeIdleHead(headSource,headTarget,motion),0,0);
      lastIdleStep=idleStep;headDraws++;
    }
    if(!reduced() && blinkingSince===null && time>=nextBlink) blinkingSince=time;
    const blinkStep=blinkingSince===null?0:Math.floor((time-blinkingSince)/(blinkDuration/BLINK.length));
    if(blinkStep>=BLINK.length){blinkingSince=null;nextBlink=randomBlink();}
    const closure=forcedEyeClosure ?? (wink?[wink.closure,0]:(reduced() || blinkingSince===null?0:BLINK[blinkStep]));
    const eyes=(stepGesture?manifest.clips.speaking:clip).eyes?.[frame];
    const eyeKey=`${frame}:${closure}:${closure && moving?idleStep:0}:${wink?.sparkle || 0}`;
    if(eyeKey!==lastEyeKey){drawEyes(eyes,closure,motion);if(wink)paintWinkSparkle(eyeCtx,eyes?.[0],motion,idleBand,wink.sparkle);lastEyeKey=eyeKey;}
    root.dataset.winking=String(Boolean(wink?.closure));
    root.dataset.eyeClosure=String(closure);
    if(reduced()) return;
    const eyeDelay=blinkingSince===null?nextBlink-time:blinkDuration/BLINK.length;
    const motionDelay=moving && forcedIdleTime===null?(idleStep+1)*IDLE_STEP_MS-(time-start):Infinity;
    const delay=Math.max(16,Math.min(forcedFrame===null?sample.remaining:Infinity,eyeDelay,motionDelay));
    timer=schedule(tick,delay);
  }
  async function sync() {
    stop();
    root.dataset.idleRunning=String(active() && !reduced());
    if(!active()){resetSubIdle();resetStep();wasActive=false;return;}
    if(!wasActive){resetSubIdle();wasActive=true;}
    if(reduced()){resetSubIdle();resetStep();}
    const requested=manifest.clips[root.dataset.pose]?root.dataset.pose:'idle';
    if(requested!==pose) {
      pose=requested;image=null;start=now();lastFrame=-1;lastEyeKey='';forcedFrame=null;lastIdleStep=-1;
      blinkingSince=null;nextBlink=randomBlink();
      resetSubIdle();
      resetStep();
      // Retain the last complete frame while a new sheet loads; never dissolve anatomy.
      const token=++generation, sheetKey=manifest.clips[pose].sheet, sheet=manifest.sheets[sheetKey];
      try {
        const loaded=await load(assetUrl(sheet.path));
        if(destroyed || token!==generation) return;
        if(loaded.naturalWidth!==sheet.columns*manifest.frameSize || loaded.naturalHeight!==sheet.rows*manifest.frameSize) throw new Error('Invalid mascot atlas dimensions');
        image=loaded;loadedSheets.add(sheetKey);
        root.classList.add('is-sprite-ready');
      } catch(error) {
        if(destroyed || token!==generation)return;
        root.classList.remove('is-sprite-ready');
        onFallback(pose,error);return;
      }
    }
    tick();
  }
  const visibility=()=>{blinkingSince=null;nextBlink=randomBlink();sync();};
  documentTarget.addEventListener('visibilitychange',visibility);
  const observer=observe?new windowTarget.MutationObserver(sync):null;
  observer?.observe(root,{attributes:true,attributeFilter:['data-pose','data-motion','hidden','class']});
  const intersection=observe && windowTarget.IntersectionObserver?new windowTarget.IntersectionObserver(entries=>{
    intersecting=entries[0].isIntersecting;sync();
  }):null;
  // The canvas is display:none until its first sheet is ready. Observe its
  // always-sized character container, otherwise loading deadlocks offscreen.
  intersection?.observe(canvas.parentElement || root);
  root.classList.add('has-hybrid-mascot');
  sync();
  return {
    sync,
    pause(value){manualPause=Boolean(value);if(!manualPause){start=now();nextBlink=randomBlink();}sync();},
    blink(){blinkingSince=now();tick();},
    playSubIdle({progress=0}={}){if(pose!=='idle' || !active() || reduced())return false;resetStep();forcedIdleTime=null;forcedFrame=null;lastIdleStep=-1;subIdleSince=now()-Math.max(0,Math.min(.9,progress))*subIdleDuration;root.dataset.idleVariant='sub-idle';tick();return true;},
    async playStepGesture(){await sync();if(!active() || reduced() || pose==='celebrate')return false;resetSubIdle();forcedIdleTime=null;forcedFrame=null;stepSince=now();lastFrame=-1;root.dataset.gesture='step';tick();return true;},
    setFrame(frame){forcedFrame=Number.isInteger(frame)?frame:null;lastFrame=-1;tick();},
    setEyeClosure(value){forcedEyeClosure=value===null?null:Math.max(0,Math.min(1,value));lastEyeKey='';tick();},
    setIdleTime(value){forcedIdleTime=value;lastIdleStep=-1;lastEyeKey='';tick();},
    stats:()=>({revision:MASCOT_REVISION,pose,frame:lastFrame,subIdle:subIdleSince!==null,baseDraws,headDraws,eyeDraws,wakeups,active:active(),timerActive:timer!==null,loadedSheets:[...loadedSheets],
      decodedBytes:[...loadedSheets].reduce((total,key)=>{const s=manifest.sheets[key];return total+s.columns*s.rows*manifest.frameSize**2*4;},0)}),
    destroy(){destroyed=true;generation++;stop();root.dataset.idleRunning='false';observer?.disconnect();intersection?.disconnect();documentTarget.removeEventListener('visibilitychange',visibility);
      root.classList.remove('has-hybrid-mascot','is-sprite-ready');image=null;headSource=null;headTarget=null;}
  };
}
