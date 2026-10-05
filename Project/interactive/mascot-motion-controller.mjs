const SUPPORTED_POSES = new Set(["idle", "speaking", "instruction", "hint", "celebrate"]);
export const MASCOT_CELEBRATION_DURATION = 1400;
export const MASCOT_CELEBRATION_FRAMES = Object.freeze([
  {offset:0,transform:'translate(0,0) rotate(0deg) scale(1)',easing:'ease-in'},
  {offset:.10,transform:'translate(0,3px) rotate(-2deg) scale(1.035,.96)',easing:'cubic-bezier(.16,.8,.25,1)'},
  {offset:.32,transform:'translate(5px,-30px) rotate(4deg) scale(.98,1.035)',easing:'ease-in'},
  {offset:.51,transform:'translate(2px,0) rotate(-1.5deg) scale(1.04,.96)',easing:'ease-out'},
  {offset:.65,transform:'translate(-1px,-7px) rotate(1deg) scale(.995,1.01)',easing:'ease-in'},
  {offset:.77,transform:'translate(0,0) rotate(-.35deg) scale(1.01,.99)',easing:'ease-out'},
  {offset:.88,transform:'translate(0,-1px) rotate(.15deg) scale(1)',easing:'cubic-bezier(.2,.8,.25,1)'},
  {offset:1,transform:'translate(0,0) rotate(0deg) scale(1)'}
]);

export function normalizeMascotPose(pose) {
  return SUPPORTED_POSES.has(pose) ? pose : "idle";
}

export function createMascotMotionController({
  root,
  character,
  documentTarget = globalThis.document,
  windowTarget = globalThis.window,
  transitionDuration = 360,
  forceMotion = false
} = {}) {
  if (!root || !character) throw new TypeError("Mascot motion requires root and character elements");

  let transitionTimer = 0;
  let celebration=null;
  let manuallyPaused=false;
  let currentPose = normalizeMascotPose(root.dataset.pose);
  const reducedMotionQuery = windowTarget?.matchMedia?.("(prefers-reduced-motion: reduce)");

  root.dataset.pose = currentPose;
  root.dataset.motionRenderer = "image";
  root.classList.toggle("is-motion-forced", Boolean(forceMotion));

  function cancelCelebration(){celebration?.cancel();celebration=null;}
  function syncCelebration(){
    if(!celebration)return;
    if(root.dataset.motion==='reduced'){cancelCelebration();return;}
    if(documentTarget?.hidden || root.classList.contains('is-animation-paused'))celebration.pause();else celebration.play();
  }

  function setPaused(paused) {
    manuallyPaused=Boolean(paused);
    syncDocumentVisibility();
  }

  function syncMotionPreference() {
    root.dataset.motion = forceMotion ? "forced" : (reducedMotionQuery?.matches ? "reduced" : "full");
    syncCelebration();
  }

  function syncDocumentVisibility() {
    root.classList.toggle("is-animation-paused", manuallyPaused || Boolean(documentTarget?.hidden));
    syncCelebration();
  }

  function setPose(pose = "idle", { replay = false } = {}) {
    // A toast/quiz callback must not replace the standing talking pose while
    // its speech bubble remains open. Closing speech removes this class first.
    const nextPose = root.classList.contains("is-speaking") ? "speaking" : normalizeMascotPose(pose);
    if (nextPose === currentPose && !replay) return currentPose;

    root.dataset.previousPose = currentPose;
    root.dataset.pose = nextPose;
    currentPose = nextPose;

    clearTimeout(transitionTimer);
    cancelCelebration();
    character.classList.remove("is-pose-entering");
    if(nextPose==='celebrate' && root.dataset.motion!=='reduced' && character.animate){
      const animation=character.animate(MASCOT_CELEBRATION_FRAMES,{duration:MASCOT_CELEBRATION_DURATION,fill:'none'});
      celebration=animation;syncCelebration();
      animation.finished?.then(()=>{if(celebration===animation)celebration=null;}).catch(()=>{});
      return currentPose;
    }
    if(nextPose === "speaking" || root.classList.contains("has-hybrid-mascot"))return currentPose;
    // Restart only the short entrance beat. The ambient loop remains CSS-driven.
    void character.offsetWidth;
    character.classList.add("is-pose-entering");
    transitionTimer = setTimeout(() => character.classList.remove("is-pose-entering"), transitionDuration);
    return currentPose;
  }

  function reset() {
    root.classList.toggle("is-motion-forced", Boolean(forceMotion));
    setPose("idle");
    setPaused(false);
  }

  function destroy() {
    clearTimeout(transitionTimer);
    cancelCelebration();
    documentTarget?.removeEventListener?.("visibilitychange", syncDocumentVisibility);
    reducedMotionQuery?.removeEventListener?.("change", syncMotionPreference);
    character.classList.remove("is-pose-entering");
  }

  documentTarget?.addEventListener?.("visibilitychange", syncDocumentVisibility);
  reducedMotionQuery?.addEventListener?.("change", syncMotionPreference);
  syncMotionPreference();
  syncDocumentVisibility();

  return Object.freeze({
    get pose() { return currentPose; },
    setPose,
    setPaused,
    reset,
    destroy
  });
}
