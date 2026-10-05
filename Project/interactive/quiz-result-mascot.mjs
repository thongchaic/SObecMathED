const blinkUrl=new URL('./mascot-eye-blink.mjs',import.meta.url);
blinkUrl.searchParams.set('v',new URL(import.meta.url).searchParams.get('v') || 'wink-step-5');
const {createMascotEyeBlink}=await import(blinkUrl.href);

// Native coordinates of summary-head-v3.webp (320 × 315), not the lesson atlas.
export const RESULT_MASCOT_EYES=Object.freeze([[91,173,42,43,0],[241,170,42,44,0]]);
export function mountResultMascot(root,options={}){
  if(!root || root.isConnected===false)return null;
  const canvas=root.querySelector('.qr-head-eyes');
  if(!canvas)return null;
  // Observe the stationary window, not the head while its peek transform moves
  // through the clipping boundary. Re-arm every cycle until the modal closes.
  return createMascotEyeBlink({root,canvas,eyes:RESULT_MASCOT_EYES,width:320,height:315,
    visibilityTarget:root.closest?.('.qr-mascot-window') || root,interval:[2800,4200],...options});
}
