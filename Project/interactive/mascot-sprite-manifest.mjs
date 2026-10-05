// Coordinates are in the exported 384px frame, independent of CSS/device size.
export const MASCOT_SPRITES = Object.freeze({
  frameSize: 384,
  sheets: {
    actions: { path: './assets/character/dinosaur-student/sprites/actions-v2.webp', columns: 2, rows: 3 }
  },
  clips: {
    // Original intact idle artwork: hands never cycle through the generated gesture.
    idle: { sheet: 'actions', frames: [2], durations: [Infinity], idleMotion: true,
      eyes: {2:[[158,121,21,26,-12],[228,103,15,24,-17]]} },
    // Speech is already conveyed by the bubble. Hold the open-mouth artwork.
    speaking: { sheet: 'actions', frames: [1], durations: [Infinity], eyes: [
      [[176,121,23,26,-10],[243,103,16,24,-12]],
      [[158,121,21,26,-12],[229,103,15,24,-17]]
    ] },
    instruction: { sheet: 'actions', frames: [3], durations: [Infinity], eyes: {3:[[160,123,21,27,-12],[229,105,15,24,-16]]} },
    hint: { sheet: 'actions', frames: [4], durations: [Infinity], eyes: {4:[[174,118,20,27,-18],[243,95,14,23,-22]]} },
    celebrate: { sheet: 'actions', frames: [5], durations: [Infinity], eyes: {5:[[147,112,24,26,-10],[218,92,18,22,-21]]} }
  }
});

export function sampleClip(clip, elapsed = 0) {
  const duration = clip.durations.reduce((a,b)=>a+b,0);
  let time = Math.max(0,elapsed) % duration;
  for(let i=0;i<clip.frames.length;i++) {
    if(time < clip.durations[i]) return { frame:clip.frames[i], remaining:clip.durations[i]-time };
    time -= clip.durations[i];
  }
  return {frame:clip.frames[0],remaining:Infinity};
}
