const COMPLETE_COLOR = "#26aa72";
const CAPSULE = "symbol/capsule-green-01";
const THIN_CAPSULE = "symbol/capsule-green-02";
const CAPSULE_ROTATION = [0, 90, 270];
const CURVE = "symbol/curve-orange";
const CURVE_ROTATION = [0, 90, 90];
const LESS_OR_EQUAL = "symbol/curve-rod-pink";
const GREATER_OR_EQUAL = "symbol/number-2-blue";

const entries = {
  "+": { asset: "symbol/symbol-cross-pink", color: "#22b8cf", rotation: [90, 0, 0], size: .78 },
  "−": { asset: CAPSULE, color: "#fa5252", rotation: CAPSULE_ROTATION, size: .78, displayScale: [1, .58, 1] },
  "×": { asset: "symbol/symbol-x-blue", color: "#339af0", rotation: [0, 0, -90], size: .7 },
  "÷": { asset: "symbol/symbol-percent-yellow", color: "#fcc419", rotation: [0, 90, 270], size: .78 },
  "=": { asset: THIN_CAPSULE, color: "#845ef7", rotation: CAPSULE_ROTATION, size: .78 },
  ">": { color: "#f76707", size: .78, models: [{ asset: CURVE, rotation: CURVE_ROTATION, mirrorX: true }] },
  "<": { color: "#e64980", size: .78, models: [{ asset: CURVE, rotation: CURVE_ROTATION }] },
  "≥": { asset: GREATER_OR_EQUAL, color: "#c56a1a", rotation: CURVE_ROTATION, mirrorX: true, restFlip: 180, size: .7 },
  "≤": { asset: LESS_OR_EQUAL, color: "#5f3dc4", rotation: CURVE_ROTATION, mirrorX: true, restFlip: 180, size: .7 },
  "≠": { color: "#d9485f", size: .7, models: [
    { asset: THIN_CAPSULE, rotation: CAPSULE_ROTATION },
    { asset: CAPSULE, rotation: CAPSULE_ROTATION, yaw: -55, scale: [1.25, .85, .85] }
  ] }
};

const aliases = Object.freeze({ "-": "−", x: "×", X: "×", ">=": "≥", "<=": "≤", "!=": "≠" });

export const OPERATOR_SIGN_MASTER = Object.freeze({
  version: "1.4.1",
  completeColor: COMPLETE_COLOR,
  animation: Object.freeze({ duration: 680, bounceHeight: .8, scaleDip: .12 }),
  entries: Object.freeze(Object.fromEntries(Object.entries(entries).map(([text, value]) => [text, Object.freeze(value)])))
});

export function operatorSignMasterFor(text) {
  return OPERATOR_SIGN_MASTER.entries[aliases[text] || text] || null;
}

export function operatorFullTurnEnd(startRotation, restRotation = 0) {
  const fullTurn = Math.PI * 2;
  const turnProgress = (startRotation - restRotation) / fullTurn;
  const completedTurns = Math.floor(turnProgress + 1e-6);
  return restRotation + (completedTurns + 1) * fullTurn;
}
