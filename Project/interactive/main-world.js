import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
// Keep the runtime shell and its settings schema deployed as one compatible version.
const { mainWorldSetting: setting } = await import(`./main-world-setting.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const runtimeSettingTools = await import(`./runtime-setting-menu.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const guiServiceTools = await import(`./gui-service.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const worldGuiSystemTools = await import(`./world-gui-system.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const clickmeServiceTools = await import(`./clickme-service.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const introServiceTools = await import(`./intro-service.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const operatorSignMasterTools = await import(`./operator-sign-master.js?v=${encodeURIComponent(window.eduCacheVersion)}`);
const { OPERATOR_SIGN_MASTER, operatorSignMasterFor, operatorFullTurnEnd } = operatorSignMasterTools;
const runtimeSettingBaseline = runtimeSettingTools.applyStoredRuntimeSetting(setting);
// ใช้ token เดียวตลอดอายุของ runtime เพื่อไม่ให้ asset เดียวกันถูกดาวน์โหลดซ้ำในหน้าเดียว
// เมื่อ isCache=false การเปิด runtime รอบใหม่จะสร้าง timestamp ใหม่โดยอัตโนมัติ
const forcedRuntimeAssetVersion = sessionStorage.getItem("edu-runtime-force-asset-version");
sessionStorage.removeItem("edu-runtime-force-asset-version");
let runtimeAssetVersion = forcedRuntimeAssetVersion || (setting.isCache === true ? String(setting.assetVersion || "0.0.1") : String(Date.now()));

const $ = (selector) => document.querySelector(selector);
const elements = {
  runtime: $("#runtime"), viewport: $("#world-viewport"), canvas: $("#world-canvas"), debugHud: $("#debug-hud"), lessonUi: $("#lesson-ui"), gizmoLayer: $("#gui-gizmo-layer"), topMessageLayer: $("#gui-top-message-layer"), feedbackLayer: $("#gui-feedback-layer"), choiceDock: $("#gui-choice-dock"), controlDock: $("#gui-control-dock"), busyLayer: $("#gui-busy-layer"), dialogLayer: $("#gui-dialog-layer"), topbar: $("#topbar"),
  webRoot: $("#web-page-root"), title: $("#lesson-title"), taxonomy: $("#lesson-taxonomy"), mode: $("#mode-badge"),
  hint: $("#world-hint"), toast: $("#toast"), modal: $("#modal-layer"), objective: $("#objective-text"),
  lessonQuestion: $("#lesson-question-ui"), lessonQuestionLabel: $("#lesson-question-label"), lessonQuestionText: $("#lesson-question-text"),
  guiAnswer: $("#gui-answer"), guiAnswerLabel: $("#gui-answer-label"), guiAnswerText: $("#gui-answer-text"), guiAnswerIcon: $("#gui-answer-icon"),
  topbarMain: $(".topbar-main"), topbarActions: $(".topbar-actions"),
  entry: $("#entry-screen"), entryTitle: $("#entry-title"), entryCategory: $("#entry-category"), entryWelcome: $("#entry-welcome"), entryStatus: $("#entry-status"), entryProgress: $("#entry-progress-bar"), entryProgressTrack: $("#entry-progress-track"), entryProgressValue: $("#entry-progress-value"),
  celebration: $("#celebration"), celebrationFireworks: $("#celebration-fireworks"), howto: $("#howto-panel"), stepCounter: $("#step-counter"), stepTitle: $("#step-title"),
  stepDescription: $("#step-description"), stepOption: $("#step-option"), quizPanel: $("#quiz-panel"),
  mascot: $("#mascot-guide"), mascotNotice: $("#mascot-notice"), mascotParticles: $("#mascot-particles"), mascotCharacter: $("#mascot-character"), mascotPerchImage: $("#mascot-perch-image"), mascotIdleImage: $("#mascot-idle-image"), mascotSpeakingImage: $("#mascot-speaking-image"), mascotFlyImage: $("#mascot-fly-image"), mascotFlyMidImage: $("#mascot-fly-mid-image"), mascotFlyDownImage: $("#mascot-fly-down-image"),
  consoleState: $("#console-state-icon"), consoleStateImage: $("#console-state-image"), sceneHandCue: $("#scene-hand-cue"),
  quizDots: $("#quiz-dots"), question: $("#question-text")
};

const runtime = {
  sessionId: 0, lesson: null, meta: null, lessonData: null, lessonUrl: null, context: null,
  mode: "student-lab", language: "th", fullScreen: true, preview: false, values: {}, stepIndex: 0, stepNextEnabled: true, quiz: null, toastTimer: 0, typewriterTimers: new Set(), optionCloseTimer: 0, mascotFlightTimer: 0, mascotLandingTimer: 0, mascotSpeechTimer: 0, mascotHintTimer: 0, mascotBlinkTimer: 0, mascotBlinkReleaseTimer: 0, mascotPoseTimer: 0, pendingMascotOption: null, sceneEntered: false, lessonSceneInitialized: false, bgm: null, bgmRequested: false, completed: false, modalReturnFocus: null, lastOpenPayload: null
};

function syncDebugHud() {
  if (!elements.debugHud) return;
  elements.debugHud.hidden = !runtime.preview && setting.debugHUD !== true;
  elements.debugHud.classList.toggle("is-preview", runtime.preview);
  const switchButton = elements.debugHud.querySelector('[data-debug-action="switch-mode"]');
  if (!switchButton) return;
  const nextIsQuiz = runtime.mode !== "student-quiz";
  const label = nextIsQuiz ? "เปิดบทเรียนนี้ในโหมด Quiz" : "เปิดบทเรียนนี้ในโหมด Lab";
  switchButton.title = label;
  switchButton.setAttribute("aria-label", label);
  const icon = switchButton.querySelector("[data-debug-mode-icon]");
  if (icon) icon.src = iconUrl("switch-symbol.svg");
  const current = switchButton.querySelector(".preview-switch-copy small");
  const next = switchButton.querySelector(".preview-switch-copy strong");
  if (current) current.textContent = `โหมดปัจจุบัน · ${nextIsQuiz ? "Lab" : "Quiz"}`;
  if (next) next.textContent = `ไป ${nextIsQuiz ? "Quiz" : "Lab"}`;
}

const setUiVariable = (name, value, unit = "") => { if (value !== undefined && value !== null) document.documentElement.style.setProperty(name, typeof value === "number" ? `${value}${unit}` : String(value)); };
setUiVariable("--popup-width", setting.ui.popup.width); setUiVariable("--popup-max-height", setting.ui.popup.maxHeight); setUiVariable("--popup-bg", setting.ui.popup.background); setUiVariable("--popup-backdrop", setting.ui.popup.backdrop); setUiVariable("--popup-border", setting.ui.popup.borderColor); setUiVariable("--popup-text", setting.ui.popup.textColor); setUiVariable("--popup-radius", setting.ui.popup.radius, "px"); setUiVariable("--popup-blur", setting.ui.popup.blur, "px");
document.documentElement.style.setProperty("--top-message-width", setting.ui.topMessage.width);
document.documentElement.style.setProperty("--top-message-font-size", setting.ui.topMessage.fontSize);
document.documentElement.style.setProperty("--lesson-question-width", setting.ui.questionPanel?.width || "min(620px, calc(100vw - 420px))");
document.documentElement.style.setProperty("--lesson-question-top", setting.ui.questionPanel?.top || "calc(var(--topbar-height) + 14px)");
elements.lessonQuestionLabel.textContent = setting.ui.questionPanel?.label || "โจทย์";
setUiVariable("--topbar-height-desktop", setting.ui.topbar?.height ?? 80, "px"); setUiVariable("--topbar-height-mobile", setting.ui.topbar?.mobileHeight ?? 68, "px"); setUiVariable("--topbar-height-compact", setting.ui.topbar?.compactHeight ?? 58, "px"); setUiVariable("--topbar-background-opacity", Math.min(1, Math.max(0, setting.ui.topbar?.backgroundOpacity ?? .82))); setUiVariable("--topbar-blur", Math.max(0, setting.ui.topbar?.blur ?? 18), "px"); setUiVariable("--topbar-bg-start", setting.ui.topbar?.backgroundStart); setUiVariable("--topbar-bg-middle", setting.ui.topbar?.backgroundMiddle); setUiVariable("--topbar-bg-end", setting.ui.topbar?.backgroundEnd); setUiVariable("--topbar-border", setting.ui.topbar?.borderColor); setUiVariable("--topbar-accent-start", setting.ui.topbar?.accentStart); setUiVariable("--topbar-accent-middle", setting.ui.topbar?.accentMiddle); setUiVariable("--topbar-accent-end", setting.ui.topbar?.accentEnd); setUiVariable("--topbar-title-start", setting.ui.topbar?.titleStart); setUiVariable("--topbar-title-middle", setting.ui.topbar?.titleMiddle); setUiVariable("--topbar-title-end", setting.ui.topbar?.titleEnd); setUiVariable("--topbar-subtitle", setting.ui.topbar?.subtitleColor); setUiVariable("--topbar-button-bg", setting.ui.topbar?.buttonBackground); setUiVariable("--topbar-button-hover", setting.ui.topbar?.buttonHover); setUiVariable("--topbar-button-color", setting.ui.topbar?.buttonColor); setUiVariable("--topbar-button-border", setting.ui.topbar?.buttonBorderColor); setUiVariable("--topbar-felt-bg", setting.ui.topbar?.feltBackground); setUiVariable("--topbar-felt-border", setting.ui.topbar?.feltBorderColor); setUiVariable("--topbar-felt-title", setting.ui.topbar?.feltTitleColor); setUiVariable("--topbar-felt-button-bg", setting.ui.topbar?.feltButtonBackground); setUiVariable("--topbar-felt-button-border", setting.ui.topbar?.feltButtonBorderColor); setUiVariable("--topbar-felt-button-color", setting.ui.topbar?.feltButtonColor);
setUiVariable("--mode-badge-bg-start", setting.ui.modeBadge?.backgroundStart); setUiVariable("--mode-badge-bg-end", setting.ui.modeBadge?.backgroundEnd); setUiVariable("--mode-badge-border", setting.ui.modeBadge?.borderColor); setUiVariable("--mode-badge-text", setting.ui.modeBadge?.textColor); setUiVariable("--mode-badge-radius", setting.ui.modeBadge?.radius, "px"); setUiVariable("--mode-badge-font-size", setting.ui.modeBadge?.fontSize, "px"); setUiVariable("--mode-badge-felt-bg", setting.ui.modeBadge?.feltBackground); setUiVariable("--mode-badge-felt-border", setting.ui.modeBadge?.feltBorderColor); setUiVariable("--mode-badge-felt-text", setting.ui.modeBadge?.feltTextColor);
setUiVariable("--quiz-badge-bg", setting.ui.quizBadge?.background); setUiVariable("--quiz-badge-border", setting.ui.quizBadge?.borderColor); setUiVariable("--quiz-badge-text", setting.ui.quizBadge?.textColor); setUiVariable("--quiz-badge-radius", setting.ui.quizBadge?.radius, "px"); setUiVariable("--quiz-badge-top-gap", setting.ui.quizBadge?.topGap, "px"); setUiVariable("--quiz-badge-left", setting.ui.quizBadge?.left, "px");
setUiVariable("--camera-controls-bg", setting.ui.cameraControls?.background); setUiVariable("--camera-controls-border", setting.ui.cameraControls?.borderColor); setUiVariable("--camera-controls-button-bg", setting.ui.cameraControls?.buttonBackground); setUiVariable("--camera-controls-button-color", setting.ui.cameraControls?.buttonColor); setUiVariable("--camera-controls-reset-bg", setting.ui.cameraControls?.resetBackground); setUiVariable("--camera-controls-radius", setting.ui.cameraControls?.radius, "px"); setUiVariable("--camera-controls-button-radius", setting.ui.cameraControls?.buttonRadius, "px"); setUiVariable("--camera-controls-right", setting.ui.cameraControls?.right, "px"); setUiVariable("--camera-controls-bottom", setting.ui.cameraControls?.bottom, "px"); setUiVariable("--camera-controls-felt-bg", setting.ui.cameraControls?.feltBackground); setUiVariable("--camera-controls-felt-border", setting.ui.cameraControls?.feltBorderColor); setUiVariable("--camera-controls-felt-button-bg", setting.ui.cameraControls?.feltButtonBackground);
setUiVariable("--world-hint-bg", setting.ui.worldHint?.background); setUiVariable("--world-hint-border", setting.ui.worldHint?.borderColor); setUiVariable("--world-hint-text", setting.ui.worldHint?.textColor); setUiVariable("--world-hint-radius", setting.ui.worldHint?.radius, "px"); setUiVariable("--world-hint-left", setting.ui.worldHint?.left, "px"); setUiVariable("--world-hint-bottom", setting.ui.worldHint?.bottom, "px"); setUiVariable("--world-hint-max-width", setting.ui.worldHint?.maxWidth); setUiVariable("--world-hint-font-size", setting.ui.worldHint?.fontSize, "px");
document.documentElement.dataset.uiTheme = setting.ui.theme || "default";
function runtimeAssetUrl(path, base = import.meta.url) { const url = new URL(path, base); url.searchParams.set("assetVersion", runtimeAssetVersion); return url.href; }
function introContentUrl(path) { const url = new URL(path, runtime.lessonUrl || import.meta.url); if (url.origin === location.origin) url.searchParams.set("assetVersion", runtimeAssetVersion); return url.href; }
async function loadLessonAssetLibrary() {
  try {
    const response = await fetch(runtimeAssetUrl("./assets/library/catalog.json"));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const catalog = await response.json();
    return Object.freeze({ version: String(catalog.version || "1.0.0"), assets: Object.freeze(catalog.assets || {}) });
  } catch (error) {
    console.warn("main-world: โหลด Lesson Asset Library ไม่สำเร็จ", error);
    return Object.freeze({ version: "unavailable", assets: Object.freeze({}) });
  }
}
const lessonAssetLibrary = await loadLessonAssetLibrary();
const entryBackgroundUrl = runtimeAssetUrl(setting.entry.loadingImagePath || setting.entry.imagePath);
document.documentElement.style.setProperty("--entry-image", `url("${entryBackgroundUrl}")`);
function preloadImageUrl(url) { return new Promise(resolve => { if (!url) { resolve(); return; } const image = new Image(), done = async () => { try { await image.decode?.(); } catch { } resolve(); }; image.addEventListener("load", done, { once: true }); image.addEventListener("error", resolve, { once: true }); image.src = url; }); }
const lessonTextureCache = new Map();
function lessonTextureRecord(path, base = runtime.lessonUrl || import.meta.url) {
  const url = runtimeAssetUrl(path, base), cached = lessonTextureCache.get(url);
  if (cached) return cached;
  let resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => { resolveReady = resolve; rejectReady = reject; });
  const texture = new THREE.TextureLoader().load(url, loaded => {
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    loaded.needsUpdate = true;
    resolveReady(loaded);
  }, undefined, error => rejectReady(new Error(`LESSON_TEXTURE_LOAD_FAILED: โหลดภาพ ${path} ไม่สำเร็จ (${error?.message || "unknown"})`)));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const record = Object.freeze({ url, texture, ready });
  lessonTextureCache.set(url, record);
  return record;
}
async function preloadLessonTextures(paths = [], base = runtime.lessonUrl || import.meta.url) {
  const uniquePaths = [...new Set((Array.isArray(paths) ? paths : [paths]).filter(Boolean))];
  const results = await Promise.allSettled(uniquePaths.map(path => lessonTextureRecord(path, base).ready));
  results.forEach((result, index) => { if (result.status === "rejected") console.warn(`main-world: preload ภาพบทเรียนไม่สำเร็จ ${uniquePaths[index]}`, result.reason); });
  return Object.freeze({ loaded: results.filter(result => result.status === "fulfilled").length, failed: results.filter(result => result.status === "rejected").length, total: results.length });
}
function waitForImageElement(image) { return new Promise(resolve => { if (!image?.src || image.complete) { resolve(); return; } image.addEventListener("load", resolve, { once: true }); image.addEventListener("error", resolve, { once: true }); }); }
function iconUrl(name) { return runtimeAssetUrl(`./assets/icon/${name}`); }
function iconMarkup(name, className = "") { return `<img class="${escapeHtml(className)}" src="${iconUrl(name)}" alt="" />`; }
for (const icon of document.querySelectorAll("[data-icon]")) icon.src = iconUrl(icon.dataset.icon);
for (const asset of document.querySelectorAll("[data-runtime-asset]")) asset.src = runtimeAssetUrl(asset.dataset.runtimeAsset);
const mascotSetting = setting.mascot || {};
const activeMascotKey = "dinosaur";
const mascotProfile = mascotSetting;
const mascotAssets = mascotSetting.assets || {};
const mascotCharacter = mascotSetting.character || mascotSetting.position || {};
const mascotSpeech = mascotSetting.speech || {};
const mascotNoticeBubble = mascotSetting.noticeBubble || mascotSetting.bubble || {};
const mascotBehavior = mascotSetting.behavior || "stationary";
elements.mascot.dataset.character = activeMascotKey;
elements.mascot.dataset.behavior = mascotBehavior;
elements.mascot.dataset.pose = "idle";
elements.mascot.classList.toggle("is-stationary", mascotBehavior === "stationary");
if (mascotAssets.idle) { elements.mascotPerchImage.src = runtimeAssetUrl(mascotAssets.perch); elements.mascotIdleImage.src = runtimeAssetUrl(mascotAssets.idle); elements.mascotSpeakingImage.src = runtimeAssetUrl(mascotAssets.speaking || mascotAssets.instruction || mascotAssets.idle); elements.mascotFlyImage.src = runtimeAssetUrl(mascotAssets.instruction || mascotAssets.flyUp || mascotAssets.fly || mascotAssets.idle); elements.mascotFlyMidImage.src = runtimeAssetUrl(mascotAssets.hint || mascotAssets.flyMid || mascotAssets.fly || mascotAssets.idle); elements.mascotFlyDownImage.src = runtimeAssetUrl(mascotAssets.celebrate || mascotAssets.greeting || mascotAssets.flyDown || mascotAssets.fly || mascotAssets.idle); }
// หน้า HTML จะยังเป็นสีขาวจน CSS และภาพที่มองเห็นใน Loading Card พร้อมวาด
window.eduRuntimeFirstFrameReady = Promise.race([
  Promise.allSettled([preloadImageUrl(entryBackgroundUrl), ...[...elements.entry.querySelectorAll("img")].map(waitForImageElement)]),
  new Promise(resolve => setTimeout(resolve, 2500))
]);
const mascotParticleSetting = mascotSetting.particles || {};
if (mascotParticleSetting.enabled !== false) { for (let index = 0; index < (mascotParticleSetting.count || 10); index++) { const particle = document.createElement("i"), size = THREE.MathUtils.lerp(...(mascotParticleSetting.size || [4, 9]), decorSeed(index, 2)), duration = THREE.MathUtils.lerp(...(mascotParticleSetting.duration || [1800, 3200]), decorSeed(index, 3)); particle.style.setProperty("--particle-x", `${(decorSeed(index, 4) - .5) * (mascotParticleSetting.spreadX || 150)}px`); particle.style.setProperty("--particle-y", `${(decorSeed(index, 5) - .5) * (mascotParticleSetting.spreadY || 180)}px`); particle.style.setProperty("--particle-size", `${size}px`); particle.style.setProperty("--particle-color", (mascotParticleSetting.colors || ["#ffffff"])[index % (mascotParticleSetting.colors?.length || 1)]); particle.style.setProperty("--particle-duration", `${duration}ms`); particle.style.setProperty("--particle-delay", `${-decorSeed(index, 6) * duration}ms`); elements.mascotParticles.append(particle); } }
const mascotCssValues = { "--mascot-width": [mascotCharacter.desktop?.width, "px"], "--mascot-left": [mascotCharacter.desktop?.x ?? mascotCharacter.desktop?.left, "px"], "--mascot-perch-bottom": [mascotCharacter.desktop?.idleY ?? mascotCharacter.desktop?.perchBottom, "px"], "--mascot-speaking-bottom": [mascotCharacter.desktop?.speakingY ?? mascotCharacter.desktop?.speakingBottom, "px"], "--mascot-width-mobile": [mascotCharacter.mobile?.width, "px"], "--mascot-left-mobile": [mascotCharacter.mobile?.x ?? mascotCharacter.mobile?.left, "px"], "--mascot-perch-bottom-mobile": [mascotCharacter.mobile?.idleY ?? mascotCharacter.mobile?.perchBottom, "px"], "--mascot-speaking-bottom-mobile": [mascotCharacter.mobile?.speakingY ?? mascotCharacter.mobile?.speakingBottom, "px"], "--mascot-speech-left": [mascotSpeech.desktop?.x ?? mascotSpeech.position?.desktop?.x, "px"], "--mascot-speech-bottom": [mascotSpeech.desktop?.y ?? mascotSpeech.position?.desktop?.y, "px"], "--mascot-speech-width": [mascotSpeech.desktop?.width ?? mascotSpeech.width, "px"], "--mascot-speech-max-width": [mascotSpeech.desktop?.maxWidth, "px"], "--mascot-speech-left-mobile": [mascotSpeech.mobile?.x ?? mascotSpeech.position?.mobile?.x, "px"], "--mascot-speech-bottom-mobile": [mascotSpeech.mobile?.y ?? mascotSpeech.position?.mobile?.y, "px"], "--mascot-speech-width-mobile": [mascotSpeech.mobile?.width ?? mascotSpeech.mobileWidth, "px"], "--mascot-speech-max-width-mobile": [mascotSpeech.mobile?.maxWidth, "px"], "--mascot-notice-left": [mascotNoticeBubble.desktop?.x ?? mascotNoticeBubble.position?.desktop?.x, "px"], "--mascot-notice-bottom": [mascotNoticeBubble.desktop?.y ?? mascotNoticeBubble.position?.desktop?.y, "px"], "--mascot-notice-size": [mascotNoticeBubble.desktop?.size, "px"], "--mascot-notice-left-mobile": [mascotNoticeBubble.mobile?.x ?? mascotNoticeBubble.position?.mobile?.x, "px"], "--mascot-notice-bottom-mobile": [mascotNoticeBubble.mobile?.y ?? mascotNoticeBubble.position?.mobile?.y, "px"], "--mascot-notice-size-mobile": [mascotNoticeBubble.mobile?.size, "px"], "--mascot-fly-in-duration": [mascotSetting.animation?.flyInDuration, "ms"], "--mascot-fly-out-duration": [mascotSetting.animation?.flyOutDuration, "ms"], "--mascot-land-duration": [mascotSetting.animation?.landingDuration, "ms"], "--mascot-flap-duration": [mascotSetting.animation?.flapDuration, "ms"], "--mascot-hover-flap-duration": [mascotSetting.animation?.hoverFlapDuration, "ms"], "--mascot-hover-bob-duration": [mascotSetting.animation?.hoverBobDuration, "ms"] };
for (const [name, [value, unit]] of Object.entries(mascotCssValues)) if (value != null) document.documentElement.style.setProperty(name, typeof value === "number" ? `${value}${unit}` : value);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function decorSeed(index, salt = 0) { const value = Math.sin((index + 1) * 18.231 + (salt + 1) * 41.719) * 18273.327; return value - Math.floor(value); }
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
const postToHost = (type, payload = {}) => window.parent.postMessage({ channel: "edu-widget", type, payload }, window.location.origin);
// THREE.Color ไม่รองรับ #RRGGBBAA โดยตรง จึงแยก alpha ออกก่อนส่งให้ material
function threeColor(value, fallback = "#ffffff") { const text = String(value || fallback).trim(), long = text.match(/^#([\da-f]{6})([\da-f]{2})$/i), short = text.match(/^#([\da-f]{3})([\da-f])$/i); if (long) return { color: `#${long[1]}`, alpha: parseInt(long[2], 16) / 255 }; if (short) { const rgb = [...short[1]].map(char => char + char).join(""); return { color: `#${rgb}`, alpha: parseInt(short[2] + short[2], 16) / 255 }; } return { color: text, alpha: 1 }; }
const elementTypewriters = new Map();
function clearTypewriters() { for (const timer of runtime.typewriterTimers) clearInterval(timer); runtime.typewriterTimers.clear(); elementTypewriters.clear(); }
function typeText(element, value, speed = setting.ui.animation.typewriterSpeed) { const previous = elementTypewriters.get(element); if (previous) { clearInterval(previous); runtime.typewriterTimers.delete(previous); } const message = String(value || ""); element.textContent = ""; if (!message) { elementTypewriters.delete(element); return; } let index = 0; const timer = setInterval(() => { element.textContent = message.slice(0, ++index); if (index >= message.length) { clearInterval(timer); runtime.typewriterTimers.delete(timer); elementTypewriters.delete(element); } }, speed); elementTypewriters.set(element, timer); runtime.typewriterTimers.add(timer); }

function showToast(message, kind = "success") {
  clearTimeout(runtime.toastTimer);
  // API เดิมชื่อ toast เพื่อให้บทเรียนเก่ายังทำงาน แต่แสดงข้อความค้างใน Main Console
  // ผู้เรียนจึงอ่านต่อได้หลังปิด Mascot และไม่มีกล่องชั่วคราวซ้อนกลางฉาก
  elements.toast.className = "toast";
  guiService.console.feedback(message, { tone: kind });
  if (kind === "success" && mascotBehavior === "stationary") {
    setMascotPose("celebrate");
    clearTimeout(runtime.mascotPoseTimer);
    runtime.mascotPoseTimer = setTimeout(() => setMascotPose("idle"), 1400);
  }
}
function setLessonQuestion(message = "") {
  if (String(message || "").trim()) guiService.question.show(message); else guiService.question.hide();
}
let questionFitFrame = 0, questionFitWidth = 0;
function usesFittedQuestionUi() {
  return elements.runtime.classList.contains("runtime-ui-revised");
}
function syncQuestionPanelBounds() {
  const panel = elements.lessonQuestion;
  const compact = matchMedia("(max-width:760px),(orientation:portrait)").matches;
  if (!elements.runtime.classList.contains("runtime-ui-revised") || compact) {
    panel.style.removeProperty("--runtime-question-left");
    panel.style.removeProperty("--runtime-question-width");
    return;
  }
  const viewportRect = elements.viewport.getBoundingClientRect();
  const mainRect = elements.topbarMain.getBoundingClientRect();
  const actionsRect = elements.topbarActions.getBoundingClientRect();
  const safeGap = 12;
  const leftEdge = Math.max(0, mainRect.right - viewportRect.left) + safeGap;
  const rightEdge = Math.max(0, viewportRect.right - actionsRect.left) + safeGap;
  const availableWidth = Math.max(240, viewportRect.width - leftEdge - rightEdge);
  const panelWidth = Math.min(880, availableWidth);
  const panelLeft = leftEdge + availableWidth / 2;
  panel.style.setProperty("--runtime-question-left", `${panelLeft}px`);
  panel.style.setProperty("--runtime-question-width", `${panelWidth}px`);
}
function questionNeedsMultipleLines() {
  const text = elements.lessonQuestionText;
  if (!text.clientWidth || !text.textContent.trim()) return false;
  const style = getComputedStyle(text), probe = document.createElement("span");
  probe.textContent = text.textContent;
  Object.assign(probe.style, {
    position: "absolute", visibility: "hidden", pointerEvents: "none",
    inset: "auto", width: `${text.clientWidth}px`, height: "auto",
    minHeight: "0", maxHeight: "none", boxSizing: style.boxSizing,
    padding: style.padding, border: "0", margin: "0", display: "block",
    whiteSpace: "normal", overflow: "visible", overflowWrap: "break-word",
    fontFamily: style.fontFamily, fontSize: style.fontSize,
    fontWeight: style.fontWeight, fontStyle: style.fontStyle,
    letterSpacing: style.letterSpacing, lineHeight: style.lineHeight,
    textAlign: style.textAlign
  });
  elements.lessonQuestion.append(probe);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.3;
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const contentHeight = Math.max(0, probe.scrollHeight - padding);
  probe.remove();
  return contentHeight > lineHeight * 1.45;
}
function fitLessonQuestion() {
  const text = elements.lessonQuestionText;
  if (!usesFittedQuestionUi()) return;
  if (!text.getClientRects().length || !text.textContent.trim()) {
    elements.lessonQuestion.classList.remove("is-multiline-question");
    return;
  }
  text.style.removeProperty("font-size");
  text.scrollLeft = 0;
  text.classList.remove("is-marquee");
  text.classList.toggle("is-long", Array.from(text.textContent.trim()).length > 58);
  elements.lessonQuestion.classList.toggle("is-multiline-question", questionNeedsMultipleLines());
  const style = getComputedStyle(text), base = parseFloat(style.fontSize);
  const minimum = matchMedia("(max-width:760px),(orientation:portrait)").matches ? 13 : 14;
  let size = base;
  while ((text.scrollHeight > text.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1) && size > minimum) {
    size -= .5;
    text.style.fontSize = `${size}px`;
  }
}
function scheduleQuestionFit() {
  cancelAnimationFrame(questionFitFrame);
  questionFitFrame = requestAnimationFrame(() => { syncQuestionPanelBounds(); fitLessonQuestion(); });
}
new MutationObserver(scheduleQuestionFit).observe(elements.lessonQuestionText, { childList:true, characterData:true, subtree:true });
const questionLayoutObserver = new ResizeObserver(entries => {
  const width = entries.find(entry => entry.target === elements.lessonQuestion)?.contentRect.width;
  if (width === undefined || width !== questionFitWidth) {
    if (width !== undefined) questionFitWidth = width;
    scheduleQuestionFit();
  }
});
[elements.lessonQuestion, elements.topbarMain, elements.topbarActions, elements.viewport].forEach(element => questionLayoutObserver.observe(element));
document.fonts.ready.then(scheduleQuestionFit);
document.fonts.addEventListener("loadingdone", scheduleQuestionFit);

function showModal(content, { closeLabel = "ปิด", primaryLabel = "", onPrimary = null, dismissible = true } = {}) {
  runtime.modalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.modal.innerHTML = `<article class="modal-card">${content}<div class="modal-actions">${dismissible ? `<button data-modal-close>${escapeHtml(closeLabel)}</button>` : ""}${primaryLabel ? `<button class="primary" data-modal-primary>${escapeHtml(primaryLabel)}</button>` : ""}</div></article>`;
  elements.modal.hidden = false;
  elements.modal.querySelector("[data-modal-close]")?.addEventListener("click", closeModal);
  elements.modal.querySelector("[data-modal-primary]")?.addEventListener("click", () => onPrimary?.());
  requestAnimationFrame(() => elements.modal.querySelector("[data-modal-primary],[data-modal-close],button")?.focus({ preventScroll: true }));
}
function closeModal() { elements.modal.hidden = true; elements.modal.replaceChildren(); runtime.modalReturnFocus?.focus?.(); runtime.modalReturnFocus = null; }
elements.modal.addEventListener("click", event => {
  if (event.target === elements.modal && elements.modal.querySelector("[data-modal-close]")) closeModal();
});
window.addEventListener("keydown", event => { if (elements.modal.hidden) return; const focusable = [...elements.modal.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')]; if (event.key === "Escape" && elements.modal.querySelector("[data-modal-close]")) { event.preventDefault(); closeModal(); return; } if (event.key !== "Tab" || focusable.length < 2) return; const first = focusable[0], last = focusable.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } });

function setEntryCategory(category) {
  if (elements.entryCategory) elements.entryCategory.textContent = String(category || "บทเรียนคณิตศาสตร์").trim();
}
function entryUnitTitle(lessonData = {}) {
  return displayText(lessonData.subcategory) || displayText(lessonData.category) || "บทเรียนคณิตศาสตร์";
}
function beginEntry(title, category) {
  window.eduHideRuntimeFailure?.();
  runtime.entryStartedAt = performance.now();
  runtime.entryProgressReadyAt = runtime.entryStartedAt + 1380;
  clearTimeout(runtime.entryProgressTimer);
  runtime.entryProgressTimer = 0;
  elements.entry.classList.remove("is-leaving");
  elements.entryTitle.textContent = title || "กำลังเตรียมพื้นที่เรียนรู้";
  setEntryCategory(category);
  elements.entryWelcome.replaceChildren();
  elements.entryStatus.textContent = "กำลังเชื่อมต่อบทเรียน…";
  elements.entryProgress.style.width = "8%";
  elements.entryProgressTrack?.style.setProperty("--entry-progress", "8%");
  elements.entryProgressValue.textContent = "8%";
}
function updateEntry(progress, status, messages) {
  const safeProgress = Math.round(clamp(progress, 0, 100));
  const renderProgress = () => {
    elements.entryProgress.style.width = `${safeProgress}%`;
    elements.entryProgressTrack?.style.setProperty("--entry-progress", `${safeProgress}%`);
    elements.entryProgressValue.textContent = `${safeProgress}%`;
  };
  const waitForIntro = Math.max(0, (runtime.entryProgressReadyAt || 0) - performance.now());
  clearTimeout(runtime.entryProgressTimer);
  if (waitForIntro > 0) runtime.entryProgressTimer = window.setTimeout(renderProgress, waitForIntro);
  else renderProgress();
  elements.entryStatus.textContent = status;
  if (messages) elements.entryWelcome.innerHTML = messages.slice(0, 2).map(message => { const short = String(message).length > 58 ? `${String(message).slice(0, 55)}…` : message; return `<p>${escapeHtml(short)}</p>`; }).join("");
}
async function finishEntry() {
  updateEntry(100, "พร้อมแล้ว เริ่มเรียนรู้กันเลย!");
  const elapsed = performance.now() - runtime.entryStartedAt;
  if (elapsed < setting.entry.minDuration) await new Promise(resolve => setTimeout(resolve, setting.entry.minDuration - elapsed));
  audio.play("startLesson"); audio.startBgm();
  elements.entry.classList.add("is-leaving");
  await new Promise(resolve => setTimeout(resolve, setting.entry.exitDuration));
}

// ---------- Audio: preload once and reuse instead of creating a new Audio element on every click ----------
const audio = {
  muted: false,
  activeClips: new Set(),
  activeContexts: new Set(),
  clips: new Map(),
  async preload(preset) {
    this.stopBgm(); this.clips.clear();
    const entries = Object.entries(setting.audio.sfx).filter(([, path]) => path);
    await Promise.all(entries.map(([name, path]) => new Promise((resolve) => {
      const element = new Audio(runtimeAssetUrl(path)); element.preload = "auto"; element.volume = setting.audio.sfxVolume;
      this.clips.set(name, element);
      const done = () => { clearTimeout(timer); element.removeEventListener("canplaythrough", done); element.removeEventListener("error", done); resolve(); };
      const timer = setTimeout(done, 1800); element.addEventListener("canplaythrough", done, { once: true }); element.addEventListener("error", done, { once: true }); element.load();
    })));
    runtime.bgmPath = preset?.bgm || setting.audio.bgmPath || "";
  },
  synth(name) {
    if (this.muted || !setting.audio.enabled || !setting.audio.useSynthFallback) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return;
    const context = new AudioContext(); this.activeContexts.add(context); const oscillator = context.createOscillator(); const gain = context.createGain(); const now = context.currentTime;
    const map = { onClick: [420, 620], onDrag: [310, 350], onDrop: [300, 180], onUiBtnClick: [520, 620], success: [620, 880], fail: [220, 150], nextQuest: [480, 720], startLesson: [360, 660], completeLesson: [520, 960] };
    const [from, to] = map[name] || map.onUiBtnClick; oscillator.type = name === "fail" ? "sawtooth" : "sine"; oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + .14);
    gain.gain.setValueAtTime(setting.audio.sfxVolume, now); gain.gain.exponentialRampToValueAtTime(.001, now + .18); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(now + .18); oscillator.addEventListener("ended", () => { this.activeContexts.delete(context); if (context.state !== "closed") context.close().catch(() => {}); }, { once: true });
  },
  play(name) {
    if (this.muted || !setting.audio.enabled) return; const clip = this.clips.get(name);
    if (!clip) return this.synth(name); const instance = clip.cloneNode();
    instance.volume = Math.min(1, setting.audio.sfxVolume * (setting.audio.eventVolume?.[name] ?? 1));
    this.activeClips.add(instance);
    instance.addEventListener("ended", () => this.activeClips.delete(instance), { once:true });
    instance.play().catch(() => { this.activeClips.delete(instance); this.synth(name); });
  },
  ensureBgm() { if (runtime.bgm || !runtime.bgmPath) return runtime.bgm; runtime.bgm = new Audio(runtimeAssetUrl(runtime.bgmPath)); runtime.bgm.loop = true; runtime.bgm.volume = setting.audio.bgmVolume; runtime.bgm.preload = "metadata"; return runtime.bgm; },
  async tryBgm() { if (this.muted || !setting.audio.enabled) return; const bgm = this.ensureBgm(); if (!bgm) return; try { await bgm.play(); elements.runtime.dataset.bgmState = "playing"; } catch { elements.runtime.dataset.bgmState = "blocked"; } },
  startBgm() { runtime.bgmRequested = true; },
  unlockBgm() { if (runtime.bgmRequested && (!runtime.bgm || runtime.bgm.paused)) this.tryBgm(); },
  stopBgm() { runtime.bgmRequested = false; runtime.bgmPath = ""; runtime.bgm?.pause(); runtime.bgm = null; elements.runtime.dataset.bgmState = "idle"; }
};
function syncAudioButtons() {
  const label = audio.muted ? "เปิดเสียง" : "ปิดเสียง";
  const marks = audio.muted ? '<path d="m16 9 5 6m0-6-5 6"/>' : '<path d="M16 9a5 5 0 0 1 0 6m3-9a9 9 0 0 1 0 12"/>';
  const icon = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9h4l5-4v14l-5-4H3z"/>${marks}</svg>`;
  const button = $("#toggle-audio");
  button.innerHTML = icon; button.setAttribute("aria-label", label); button.title = label; button.setAttribute("aria-pressed", String(audio.muted));
  $("[data-audio-icon]").innerHTML = icon; $("[data-audio-label]").textContent = label;
  $("[data-lab-action='toggle-audio']").setAttribute("aria-pressed", String(audio.muted));
}
$("#toggle-audio").addEventListener("click", () => {
  audio.muted = !audio.muted;
  if (audio.muted) {
    runtime.bgm?.pause();
    for (const clip of audio.activeClips) clip.pause();
    audio.activeClips.clear();
    for (const context of audio.activeContexts) if (context.state !== "closed") context.close().catch(() => {});
    audio.activeContexts.clear();
  } else audio.unlockBgm();
  syncAudioButtons();
});
syncAudioButtons();
window.addEventListener("pointerdown", () => audio.unlockBgm(), { capture: true });
window.addEventListener("keydown", () => audio.unlockBgm(), { capture: true });

// ---------- Shared Three.js world ----------
const constrainedDevice = setting.renderer.adaptiveQuality !== false && (matchMedia("(max-width: 760px)").matches || (navigator.hardwareConcurrency || 8) <= 4);
const renderer = new THREE.WebGLRenderer({ canvas: elements.canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
const shadowSetting = setting.shadow || {}, shadowTypes = { basic: THREE.BasicShadowMap, pcf: THREE.PCFShadowMap, pcfsoft: THREE.PCFSoftShadowMap };
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, constrainedDevice ? (setting.renderer.mobilePixelRatio || 1.35) : setting.renderer.maxPixelRatio)); renderer.shadowMap.enabled = shadowSetting.enabled !== false; renderer.shadowMap.type = shadowTypes[String(shadowSetting.type || "pcfsoft").toLowerCase()] || THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = shadowSetting.autoUpdate !== false; renderer.outputColorSpace = THREE.SRGBColorSpace; const toneMappings = { none: THREE.NoToneMapping, linear: THREE.LinearToneMapping, reinhard: THREE.ReinhardToneMapping, cineon: THREE.CineonToneMapping, aces: THREE.ACESFilmicToneMapping, agx: THREE.AgXToneMapping, neutral: THREE.NeutralToneMapping }; renderer.toneMapping = toneMappings[setting.renderer.toneMapping] ?? THREE.NeutralToneMapping ?? THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = setting.renderer.exposure;
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(setting.camera.fov, 1, .1, 100); const cameraTarget = new THREE.Vector3(...setting.camera.target);
let cameraConfig = { ...setting.camera, target: [...setting.camera.target] };
let defaultCamera = { yaw: THREE.MathUtils.degToRad(cameraConfig.startYaw), pitch: THREE.MathUtils.degToRad(cameraConfig.startPitch), distance: cameraConfig.startDistance }; const cameraState = { ...defaultCamera };
let rimLight = null;
function updateCameraFog() { const fog = scene.fog, config = setting.camera.fogZoom, base = fog?.userData?.zoomBase; if (!fog || !config?.enabled || !base) return; const distanceDelta = cameraState.distance - (cameraConfig.startDistance ?? setting.camera.startDistance), nearOffset = clamp(config.baseNearOffset + distanceDelta * config.nearChangePerUnit, config.minNearOffset, config.maxNearOffset), farOffset = clamp(config.baseFarOffset + distanceDelta * config.farChangePerUnit, config.minFarOffset, config.maxFarOffset); fog.near = Math.max(.1, base.near + nearOffset); fog.far = Math.max(fog.near + 1, base.far + farOffset); }
function updateRimLight() { if (!rimLight) return; const direction = camera.position.clone().sub(cameraTarget); direction.y = 0; if (direction.lengthSq() < .001) direction.set(0, 0, 1); direction.normalize(); rimLight.position.copy(cameraTarget).addScaledVector(direction, -(setting.lighting?.rimDistance ?? 18)); rimLight.position.y = cameraTarget.y + (setting.lighting?.rimHeight ?? 10); rimLight.target.position.copy(cameraTarget); rimLight.target.updateMatrixWorld(); }
function updateCamera() { const horizontal = Math.cos(cameraState.pitch) * cameraState.distance; camera.position.set(cameraTarget.x + Math.sin(cameraState.yaw) * horizontal, cameraTarget.y + Math.sin(cameraState.pitch) * cameraState.distance, cameraTarget.z + Math.cos(cameraState.yaw) * horizontal); camera.lookAt(cameraTarget); updateCameraFog(); updateRimLight(); markSceneActive(); }
function isPortraitViewport() { return elements.viewport.clientWidth / elements.viewport.clientHeight < .82; }
function cameraMaxDistance() { return cameraConfig.maxDistance * (isPortraitViewport() ? (cameraConfig.mobileMaxDistanceScale || setting.camera.mobileMaxDistanceScale || 1.5) : 1); }
let cameraFocusFrame = null;
function cancelCameraFocus() { if (cameraFocusFrame !== null) cancelAnimationFrame(cameraFocusFrame); cameraFocusFrame = null; }
function resetCamera() { cancelCameraFocus(); cameraTarget.set(...cameraConfig.target); Object.assign(cameraState, defaultCamera); if (isPortraitViewport()) cameraState.distance = Math.min(defaultCamera.distance * (cameraConfig.mobileDistanceScale || setting.camera.mobileDistanceScale || 1.9), cameraMaxDistance()); updateCamera(); }
function configureCamera(overrides = {}) { cameraConfig = { ...setting.camera, ...overrides, target: [...(overrides.target || setting.camera.target)] }; camera.fov = cameraConfig.fov; camera.updateProjectionMatrix(); cameraTarget.set(...cameraConfig.target); defaultCamera = { yaw: THREE.MathUtils.degToRad(cameraConfig.startYaw), pitch: THREE.MathUtils.degToRad(cameraConfig.startPitch), distance: cameraConfig.startDistance }; resetCamera(); }

// Ease toward an authored face without changing the learner's zoom, FOV, or camera limits.
function focusCamera({ position, normal } = {}) {
  if (![position, normal].every(v => Array.isArray(v) && v.length === 3 && v.every(Number.isFinite)) || Math.hypot(...normal) < .001) throw new Error("CAMERA_FOCUS_INVALID: position and nonzero normal are required");
  cancelCameraFocus();
  const [x, y, z] = normal;
  const fromYaw = cameraState.yaw, fromPitch = cameraState.pitch, fromTarget = cameraTarget.clone();
  const yaw = Math.hypot(x, z) > .001 ? Math.atan2(x, z) : fromYaw;
  const yawDelta = Math.atan2(Math.sin(yaw - fromYaw), Math.cos(yaw - fromYaw));
  const pitch = clamp(Math.atan2(y, Math.hypot(x, z)), THREE.MathUtils.degToRad(cameraConfig.minPitch), THREE.MathUtils.degToRad(cameraConfig.maxPitch));
  const target = new THREE.Vector3(...position), started = performance.now();
  const move = now => {
    const progress = clamp((now - started) / 700, 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    cameraState.yaw = fromYaw + yawDelta * eased;
    cameraState.pitch = fromPitch + (pitch - fromPitch) * eased;
    cameraTarget.lerpVectors(fromTarget, target, eased);
    updateCamera();
    cameraFocusFrame = progress < 1 ? requestAnimationFrame(move) : null;
  };
  cameraFocusFrame = requestAnimationFrame(move);
}

const guiService = guiServiceTools.createGuiService({
  setting,
  elements: {
    viewport: elements.viewport, gizmoLayer: elements.gizmoLayer, topMessageLayer: elements.topMessageLayer, feedbackLayer: elements.feedbackLayer, choiceDock: elements.choiceDock, controlDock: elements.controlDock, busyLayer: elements.busyLayer, dialogLayer: elements.dialogLayer, topbar: elements.topbar,
    question: elements.lessonQuestion, questionLabel: elements.lessonQuestionLabel, questionText: elements.lessonQuestionText,
    guiAnswer: elements.guiAnswer, guiAnswerLabel: elements.guiAnswerLabel, guiAnswerText: elements.guiAnswerText, guiAnswerIcon: elements.guiAnswerIcon,
    labConsole: elements.howto, quizConsole: elements.quizPanel, objective: elements.objective,
    consoleTitle: elements.stepTitle, consoleMessage: elements.stepDescription, quizMessage: elements.question, consoleIcon: elements.consoleStateImage
  },
  camera, iconUrl, resolveAsset: path => runtimeAssetUrl(path, runtime.lessonUrl || import.meta.url), objectiveAction, animateConsole, typeText, getMode: () => runtime.mode, onChoiceShow: () => showStepOption(null), onHintShow: option => queueStepOption(option), onHintHide: () => queueStepOption(null), playUiSound: uiSound
});
const introService = introServiceTools.createIntroService({
  mount: document.body,
  lockTarget: elements.runtime,
  resolveUrl: introContentUrl,
  playUiSound: uiSound
});

const lighting = setting.lighting || {}, hemisphereLight = new THREE.HemisphereLight(lighting.skyColor || "#e8f8ff", lighting.groundColor || "#c8d8c7", lighting.hemisphere ?? 1.15); scene.add(hemisphereLight); if ((lighting.ambient ?? 0) > 0) scene.add(new THREE.AmbientLight(lighting.ambientColor || "#dcecff", lighting.ambient)); const keyLight = new THREE.DirectionalLight(0xffffff, lighting.key ?? 1.35); keyLight.position.fromArray(shadowSetting.lightPosition || [-6, 19, 7]); keyLight.castShadow = renderer.shadowMap.enabled; const compactShadowViewport = matchMedia("(max-width: 760px)").matches, requestedShadowMapSize = compactShadowViewport ? (shadowSetting.mobileMapSize || 1024) : (shadowSetting.desktopMapSize || 2048), shadowMapSize = Math.min(requestedShadowMapSize, renderer.capabilities.maxTextureSize); keyLight.shadow.mapSize.set(shadowMapSize, shadowMapSize); keyLight.shadow.intensity = shadowSetting.intensity ?? .52; keyLight.shadow.radius = shadowSetting.radius ?? 2; keyLight.shadow.bias = shadowSetting.bias ?? -.00015; keyLight.shadow.normalBias = shadowSetting.normalBias ?? .018; Object.assign(keyLight.shadow.camera, shadowSetting.camera || { left: -12.5, right: 12.5, top: 10.5, bottom: -10.5, near: 2, far: 32 }); keyLight.shadow.camera.updateProjectionMatrix(); scene.add(keyLight); const fillLight = new THREE.DirectionalLight(lighting.fillColor || "#c8c5ff", lighting.fill ?? .42); fillLight.position.set(8, 7, -7); scene.add(fillLight); rimLight = new THREE.DirectionalLight(lighting.rimColor || "#fff0c7", lighting.rim ?? .55); scene.add(rimLight, rimLight.target); updateRimLight(); const mintLight = new THREE.PointLight(0x6de2c1, lighting.mint ?? .14, 30, 2); mintLight.position.set(7, 7, 8); scene.add(mintLight); const peachLight = new THREE.PointLight(0xffb384, lighting.peach ?? .12, 25, 2); peachLight.position.set(-8, 5, -5); scene.add(peachLight);

function makePattern(kind, repeat = [2, 2]) { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 256; const c = canvas.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, 256, 256); c.fillStyle = kind === "ground" ? "rgba(65,143,151,.055)" : "rgba(255,255,255,.42)"; for (let y = 16; y < 256; y += kind === "ground" ? 32 : 54)for (let x = 16; x < 256; x += kind === "ground" ? 32 : 54) { c.beginPath(); c.arc(x, y, kind === "ground" ? 3 : 8, 0, Math.PI * 2); c.fill(); } const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.colorSpace = THREE.SRGBColorSpace; return t; }
const objectPattern = makePattern("object", setting.object.textureRepeat);
function material(color, map = objectPattern) { const surface = setting.object.surface, colorValue = new THREE.Color(color), emissive = colorValue.clone().multiplyScalar(.18); return new THREE.MeshPhysicalMaterial({ color: colorValue, map, roughness: surface.roughness, metalness: .015, clearcoat: surface.clearcoat, clearcoatRoughness: surface.clearcoatRoughness, sheen: surface.sheen, sheenRoughness: surface.sheenRoughness, sheenColor: new THREE.Color(0xffffff), emissive, emissiveIntensity: surface.emissiveIntensity }); }
function makeIslandTexture(config) { const canvas = document.createElement("canvas"); canvas.width = canvas.height = 768; const c = canvas.getContext("2d"); c.fillStyle = config.topColor; c.fillRect(0, 0, 768, 768); c.globalAlpha = config.textureOpacity; for (let index = 0; index < 92; index++) { const x = (index * 137 + 53) % 768, y = (index * 83 + 97) % 768, r = 4 + (index % 5) * 1.7; c.fillStyle = index % 3 === 0 ? config.textureStarColor : config.textureDotColor; if (index % 7 === 0) { c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.fillRect(-r, -r, r * 2, r * 2); c.restore(); } else { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); } } c.globalAlpha = config.textureOpacity * .58; c.strokeStyle = config.textureDotColor; c.lineWidth = 4; for (let index = 0; index < 18; index++) { const x = (index * 211 + 80) % 768, y = (index * 149 + 44) % 768; c.beginPath(); c.arc(x, y, 16 + (index % 3) * 6, .2, Math.PI * 1.18); c.stroke(); } c.globalAlpha = 1; const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return texture; }
function loadIslandTexture(path, repeat = [1, 1]) { if (!path) return null; const texture = new THREE.TextureLoader().load(runtimeAssetUrl(path), loaded => { loaded.colorSpace = THREE.SRGBColorSpace; loaded.wrapS = loaded.wrapT = THREE.RepeatWrapping; loaded.repeat.set(...repeat); loaded.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); loaded.needsUpdate = true; }); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(...repeat); return texture; }
const islandPlantMaterials = [], islandPlantObjects = [], islandClouds = [];
function plantRandom(index, salt = 0) { const value = Math.sin((index + 2) * 17.173 + (salt + 1) * 61.719) * 18473.927; return value - Math.floor(value); }
function loadIslandPlantAsset(entry) {
  return new Promise(resolve => {
    const texture = entry.texture ? new THREE.TextureLoader().load(runtimeAssetUrl(entry.texture), loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      loaded.needsUpdate = true;
    }) : null;
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    const finish = object => {
      stripImportedSceneControls(object);
      object.traverse(child => {
        if (!child.isMesh) return;
        if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
        child.material = new THREE.MeshStandardMaterial({ map: texture, color: "#ffffff", roughness: .78, metalness: 0 });
        child.castShadow = Boolean(shadowSetting.decorationCast);
        child.receiveShadow = shadowSetting.decorationReceive !== false;
      });
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
      object.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
      object.updateMatrixWorld(true);
      resolve({ object, height: Math.max(size.y, .001), entry });
    };
    const fail = error => { console.warn(`main-world: โหลดโมเดลพืชไม่สำเร็จ ${entry.path}`, error); resolve(null); };
    const manager = new THREE.LoadingManager();
    if (entry.texture) manager.setURLModifier(requestUrl => /\.(?:png|jpe?g|webp)(?:\?|$)/i.test(decodeURIComponent(requestUrl)) ? runtimeAssetUrl(entry.texture) : requestUrl);
    import("three/addons/loaders/FBXLoader.js").then(({ FBXLoader }) => new FBXLoader(manager).load(runtimeAssetUrl(entry.path), finish, undefined, fail)).catch(fail);
  });
}
function createImportedIslandPlants(style, placements, modelKey) {
  const entries = style[modelKey]?.filter(entry => entry?.path) || [], randomSalt = modelKey === "flowerModels" ? 25 : 23;
  if (!entries.length || !placements.length) return;
  Promise.all(entries.map(loadIslandPlantAsset)).then(results => {
    const assets = results.filter(Boolean);
    if (!assets.length) return;
    for (const placement of placements) {
      const asset = assets[placement.index % assets.length], [minHeight, maxHeight] = asset.entry.height || [.26, .4], targetHeight = THREE.MathUtils.lerp(minHeight, maxHeight, plantRandom(placement.index, randomSalt));
      const object = new THREE.Group(), model = asset.object.clone(true);
      model.scale.setScalar(targetHeight / asset.height);
      object.add(model);
      object.position.set(placement.x, placement.y, placement.z);
      object.rotation.y = placement.rotationY;
      const faceFront = modelKey === "flowerModels" && asset.entry.faceFront !== false,
        facingOffset = THREE.MathUtils.degToRad(asset.entry.facingOffset || 0) + (plantRandom(placement.index, randomSalt + 2) - .5) * .36;
      if (faceFront) object.rotation.y = THREE.MathUtils.degToRad(cameraConfig.startYaw) + facingOffset;
      object.userData.islandPlantMotion = {
        baseX: 0,
        baseZ: 0,
        phase: plantRandom(placement.index, randomSalt + 1) * Math.PI * 2,
        speed: Math.max(.1, (style.swaySpeed || .0018) * 1000),
        amount: Math.max(0, style.swayAmount || .08)
      };
      islandPlantObjects.push(object);
      scene.add(object);
    }
    markSceneActive();
  });
}
function createIslandDecorations(config, surface = null) {
  const style = config.decorations;
  if (!style?.enabled) return;
  const placement = surface ? config.model?.decorationPlacement : null,
    followSurface = Boolean(surface && placement?.followSurface !== false),
    grassColors = style.grassColors || ["#65c879"], flowerColors = style.flowerColors || ["#ff9fbe"],
    geometries = { grass: new THREE.ConeGeometry(.105, 1, 4), stem: new THREE.CylinderGeometry(.025, .035, 1, 5), petal: new THREE.SphereGeometry(.105, 6, 4), center: new THREE.SphereGeometry(.075, 8, 5) },
    [offsetX, offsetZ] = style.offsetXZ || [0, 0], modelOffset = surface ? (config.model?.position || [0, 0, 0]) : [0, 0, 0],
    raycaster = followSurface ? new THREE.Raycaster() : null, rayDirection = new THREE.Vector3(0, -1, 0),
    rayHeight = placement?.rayHeight ?? 30, heightOffset = placement?.heightOffset ?? 0,
    fallbackSurfaceY = (config.model?.autoFit?.surfaceY ?? 0) + (modelOffset[1] ?? 0), buckets = new Map(), grassPlacements = [], flowerPlacements = [],
    root = new THREE.Object3D(), local = new THREE.Object3D(), matrix = new THREE.Matrix4();
  const add = (kind, color, rootMatrix, position, rotation, scale) => {
    const key = `${kind}:${color}`; let bucket = buckets.get(key);
    if (!bucket) { bucket = { kind, color, matrices: [] }; buckets.set(key, bucket); }
    local.position.set(...position); local.rotation.set(...rotation); local.scale.set(...scale); local.updateMatrix();
    bucket.matrices.push(matrix.clone().multiplyMatrices(rootMatrix, local.matrix));
  };
  if (surface) surface.updateMatrixWorld(true);
  for (let index = 0, total = style.grassCount + style.flowerCount; index < total; index++) {
    const flower = index >= style.grassCount, typeIndex = flower ? index - style.grassCount : index, typeCount = flower ? style.flowerCount : style.grassCount,
      angle = typeIndex / Math.max(1, typeCount) * Math.PI * 2 + (plantRandom(index, 1) - .5) * .42,
      radius = THREE.MathUtils.lerp(style.innerRadius, style.outerRadius, plantRandom(index, 2)),
      height = style.maxHeight * (flower ? .82 : .46) * (0.72 + plantRandom(index, 3) * .28),
      x = Math.cos(angle) * radius + offsetX + (modelOffset[0] ?? 0), z = Math.sin(angle) * radius + offsetZ + (modelOffset[2] ?? 0);
    let surfaceY = surface ? fallbackSurfaceY : 0, hit = null,
      baseY = flower ? (style.flowerBaseY ?? -.14) - height * (style.flowerSinkRatio ?? 0) : (style.grassBaseY ?? .025);
    if (followSurface) { raycaster.set(new THREE.Vector3(x, rayHeight, z), rayDirection); hit = raycaster.intersectObject(surface, true)[0]; const sink = flower ? height * (placement.flowerSinkRatio ?? 0) : 0; surfaceY = hit?.point.y ?? fallbackSurfaceY; baseY = surfaceY + heightOffset - sink; }
    root.position.set(x, baseY, z); root.rotation.set(0, -angle + (plantRandom(index, 4) - .5) * 1.4, 0); root.scale.set(1, 1, 1); root.updateMatrix();
    if (flower) {
      if (style.flowerModels?.length) flowerPlacements.push({ index, x, y: baseY, z, rotationY: root.rotation.y });
      else {
        const headScale = .72 + plantRandom(index, 5) * .25;
        add("stem", grassColors[index % grassColors.length], root.matrix, [0, height / 2, 0], [0, 0, 0], [1, height, 1]);
        for (let petal = 0; petal < 5; petal++) { const petalAngle = petal / 5 * Math.PI * 2; add("petal", flowerColors[index % flowerColors.length], root.matrix, [Math.cos(petalAngle) * .115 * headScale, height, Math.sin(petalAngle) * .115 * headScale], [0, -petalAngle, 0], [.78 * headScale, .42 * headScale, 1.2 * headScale]); }
        add("center", "#ffd45c", root.matrix, [0, height, 0], [0, 0, 0], [headScale, headScale, headScale]);
      }
    } else if (style.grassModels?.length) grassPlacements.push({ index, x, y: baseY, z, rotationY: root.rotation.y });
    else for (let blade = 0; blade < 3; blade++)add("grass", grassColors[index % grassColors.length], root.matrix, [(blade - 1) * .09, height * .42, 0], [0, 0, (blade - 1) * -.28], [.7, height * (.72 + blade * .14), .48]);
  }
  for (const bucket of buckets.values()) {
    const material = new THREE.MeshStandardMaterial({ color: bucket.color, roughness: bucket.kind === "petal" ? .55 : .76, metalness: 0, flatShading: true });
    const time = { value: 0 }; material.userData.plantTime = time; material.onBeforeCompile = shader => { shader.uniforms.plantTime = time; shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nuniform float plantTime;").replace("#include <begin_vertex>", `vec3 transformed = vec3(position);\n#ifdef USE_INSTANCING\nfloat plantPhase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.53;\ntransformed.x+=sin(plantTime*${Math.max(.1, (style.swaySpeed || .0018) * 1000).toFixed(4)}+plantPhase)*${Math.max(0, style.swayAmount || .08).toFixed(4)}*max(position.y,0.0);\n#endif`); }; material.customProgramCacheKey = () => "island-instanced-sway-v1"; islandPlantMaterials.push(material);
    const mesh = new THREE.InstancedMesh(geometries[bucket.kind], material, bucket.matrices.length); bucket.matrices.forEach((value, index) => mesh.setMatrixAt(index, value)); mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = Boolean(shadowSetting.decorationCast); mesh.receiveShadow = shadowSetting.decorationReceive !== false; mesh.computeBoundingSphere(); scene.add(mesh);
  }
  createImportedIslandPlants(style, grassPlacements, "grassModels");
  createImportedIslandPlants(style, flowerPlacements, "flowerModels");
}
function createIslandCloudBase(config) { const style = config.cloudBase; if (!style?.enabled) return; const [near, far] = style.radius, [low, high] = style.y, [minScale, maxScale] = style.scale, colors = style.colors || ["#ffffff"]; for (let index = 0; index < style.count; index++) { const angle = index / style.count * Math.PI * 2 + (plantRandom(index, 12) - .5) * .34, radius = THREE.MathUtils.lerp(near, far, plantRandom(index, 13)), cloud = makeSoftCloud(colors[index % colors.length]), scale = THREE.MathUtils.lerp(minScale, maxScale, plantRandom(index, 14)); cloud.position.set(Math.cos(angle) * radius, THREE.MathUtils.lerp(low, high, plantRandom(index, 15)), Math.sin(angle) * radius); cloud.scale.setScalar(scale); cloud.rotation.y = -angle; cloud.traverse(mesh => { if (mesh.material) { mesh.material = mesh.material.clone(); mesh.material.transparent = true; mesh.material.opacity = style.opacity; mesh.material.depthWrite = false; } }); cloud.userData.islandCloud = { baseY: cloud.position.y, phase: plantRandom(index, 16) * Math.PI * 2, speed: style.floatSpeed * (.7 + plantRandom(index, 17) * .55), amount: style.floatAmount * (.7 + plantRandom(index, 18) * .5) }; islandClouds.push(cloud); scene.add(cloud); } }
// ไฟล์ FBX/GLTF จากโปรแกรม 3D อาจพก Light และ Camera มาด้วยโดยไม่ตั้งใจ
// Main world เป็นเจ้าของไฟและกล้องทั้งหมด จึงตัด scene controls จาก asset ก่อนนำเข้าฉากเสมอ
function stripImportedSceneControls(root) {
  const importedControls = [];
  root?.traverse?.(child => {
    if (child !== root && (child.isLight || child.isCamera)) importedControls.push(child);
  });
  for (const child of importedControls) {
    child.shadow?.map?.dispose?.();
    child.removeFromParent();
  }
  if (root?.userData) root.userData.removedImportedSceneControls = importedControls.length;
  return root;
}
function createWorldIsland() {
  const config = setting.ground.island;
  if (!config?.enabled) return;
  const castGroundShadow = Boolean(shadowSetting.islandCast);
  const receiveGroundShadow = shadowSetting.islandReceive !== false;
  const grassTexture = loadIslandTexture(config.topTexturePath, config.topTextureRepeat) || makeIslandTexture(config);
  const soilTexture = loadIslandTexture(config.sideTexturePath, config.sideTextureRepeat);
  const height = config.height;
  const edgeHeight = clamp(config.straightEdgeHeight ?? .65, .08, height - .08);
  const curveSegments = Math.max(2, Math.round(config.curveSegments ?? 7));
  const grassRadius = config.radius - clamp(config.grassEdgeInset ?? .1, .02, .3);
  const profile = [new THREE.Vector2(config.radius, 0), new THREE.Vector2(config.radius, -edgeHeight)];
  for (let index = 1; index <= curveSegments; index++) {
    const progress = index / curveSegments;
    const eased = progress * progress * (3 - 2 * progress);
    profile.push(new THREE.Vector2(THREE.MathUtils.lerp(config.radius, config.bottomRadius, eased), -edgeHeight - (height - edgeHeight) * progress));
  }
  profile.reverse();
  const geometry = new THREE.LatheGeometry(profile, 128);
  const side = new THREE.MeshPhysicalMaterial({ color: config.sideColor, map: soilTexture, bumpMap: soilTexture, bumpScale: .028, roughness: .7, metalness: 0, clearcoat: .1, clearcoatRoughness: .45, side: THREE.DoubleSide });
  const island = new THREE.Mesh(geometry, side);
  island.castShadow = castGroundShadow;
  island.receiveShadow = receiveGroundShadow;
  scene.add(island);
  const edgeMaterial = new THREE.MeshPhysicalMaterial({ color: config.edgeColor || config.bottomColor, roughness: .78, metalness: 0, clearcoat: .06 });
  const edgeTop = new THREE.Mesh(new THREE.RingGeometry(grassRadius, config.radius, 128), edgeMaterial);
  edgeTop.rotation.x = -Math.PI / 2;
  edgeTop.position.y = .004;
  edgeTop.castShadow = castGroundShadow;
  edgeTop.receiveShadow = receiveGroundShadow;
  scene.add(edgeTop);
  const grassMaterial = new THREE.MeshPhysicalMaterial({ color: config.topTint || "#ffffff", map: grassTexture, bumpMap: grassTexture, bumpScale: .026, roughness: .78, metalness: 0, clearcoat: .08, clearcoatRoughness: .5 });
  const grassCap = new THREE.Mesh(new THREE.CircleGeometry(grassRadius, 128), grassMaterial);
  grassCap.rotation.x = -Math.PI / 2;
  grassCap.position.y = .008;
  grassCap.castShadow = castGroundShadow;
  grassCap.receiveShadow = receiveGroundShadow;
  scene.add(grassCap);
  const quiet = config.quietZone;
  if (quiet?.enabled) {
    const quietSurface = new THREE.Mesh(new THREE.CircleGeometry(quiet.radius, 96), new THREE.MeshPhysicalMaterial({ color: quiet.color, transparent: true, opacity: quiet.opacity, roughness: .9, metalness: 0, depthWrite: false }));
    quietSurface.rotation.x = -Math.PI / 2;
    quietSurface.position.y = .014;
    quietSurface.castShadow = castGroundShadow;
    quietSurface.receiveShadow = receiveGroundShadow;
    scene.add(quietSurface);
  }
  const bottomCap = new THREE.Mesh(new THREE.CircleGeometry(config.bottomRadius, 128), new THREE.MeshPhysicalMaterial({ color: config.bottomColor, roughness: .82, metalness: 0 }));
  bottomCap.rotation.x = Math.PI / 2;
  bottomCap.position.y = -height;
  bottomCap.castShadow = castGroundShadow;
  bottomCap.receiveShadow = receiveGroundShadow;
  scene.add(bottomCap);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(grassRadius - .04, .03, 8, 128), new THREE.MeshPhysicalMaterial({ color: config.rimColor, roughness: .58, clearcoat: .18, clearcoatRoughness: .34 }));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = .012;
  rim.castShadow = castGroundShadow;
  rim.receiveShadow = receiveGroundShadow;
  scene.add(rim);
  createIslandDecorations(config);
  createIslandCloudBase(config);
}
// เก็บตัวสร้างเกาะ Procedural เดิมไว้เป็น fallback และใช้เมื่อ model.enabled=false
const createProceduralWorldIsland = createWorldIsland;
createWorldIsland = function () {
  const config = setting.ground.island, model = config?.model;
  if (!config?.enabled) return;
  if (!model?.enabled || !model.path) { createProceduralWorldIsland(); return; }
  const textureLoader = new THREE.TextureLoader(), loadModelMap = (path, color = false) => {
    if (!path) return null;
    const texture = textureLoader.load(runtimeAssetUrl(path));
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }, maps = {
    color: loadModelMap(model.baseColorTexturePath, true),
    normal: loadModelMap(model.normalTexturePath),
    roughness: model.useRoughnessMap ? loadModelMap(model.roughnessTexturePath) : null,
    metalness: model.useMetalnessMap ? loadModelMap(model.metalnessTexturePath) : null
  }, applyModel = (island) => {
    stripImportedSceneControls(island);
    island.name = "world-island-model";
    const importedScale = island.scale.clone(), userScale = new THREE.Vector3().fromArray(model.scale || [1, 1, 1]);
    island.position.set(0, 0, 0);
    island.rotation.set(...(model.rotation || [0, 0, 0]).map(THREE.MathUtils.degToRad));
    island.scale.copy(importedScale);
    island.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = Boolean(shadowSetting.islandCast);
      object.receiveShadow = shadowSetting.islandReceive !== false;
      if (!object.geometry.attributes.normal) object.geometry.computeVertexNormals();
      const sources = Array.isArray(object.material) ? object.material : [object.material], materials = sources.map(source => {
        const MaterialClass = model.materialType === "physical" ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial,
          options = {
            name: source?.name || "main-island-standard",
            color: model.materialColor || "#ffffff",
            map: maps.color,
            normalMap: maps.normal,
            normalScale: new THREE.Vector2(model.normalScale ?? 1, model.normalScale ?? 1),
            roughnessMap: maps.roughness,
            roughness: model.roughness ?? 1,
            metalnessMap: model.useMetalnessMap ? maps.metalness : null,
            metalness: model.metalness ?? 0,
            envMapIntensity: model.envMapIntensity ?? 0,
            transparent: source?.transparent ?? false,
            opacity: source?.opacity ?? 1,
            side: source?.side ?? THREE.FrontSide
          };
        if (MaterialClass === THREE.MeshPhysicalMaterial) Object.assign(options, { clearcoat: model.clearcoat ?? 0, clearcoatRoughness: model.clearcoatRoughness ?? .8 });
        const material = new MaterialClass(options),
          colorRetentionNear = clamp(model.textureColorRetentionNear ?? model.textureColorRetention ?? 0, 0, 1),
          colorRetentionFar = clamp(model.textureColorRetentionFar ?? model.textureColorRetention ?? 0, 0, 1),
          colorFadeNear = Math.max(0, model.textureColorFadeNear ?? 8),
          colorFadeFar = Math.max(colorFadeNear + .01, model.textureColorFadeFar ?? 26);
        if (maps.color && (colorRetentionNear > 0 || colorRetentionFar > 0)) {
          material.onBeforeCompile = shader => {
            shader.uniforms.islandTextureColorRetentionNear = { value: colorRetentionNear };
            shader.uniforms.islandTextureColorRetentionFar = { value: colorRetentionFar };
            shader.uniforms.islandTextureColorFadeNear = { value: colorFadeNear };
            shader.uniforms.islandTextureColorFadeFar = { value: colorFadeFar };
            shader.fragmentShader = shader.fragmentShader
              .replace("void main() {", "uniform float islandTextureColorRetentionNear;\nuniform float islandTextureColorRetentionFar;\nuniform float islandTextureColorFadeNear;\nuniform float islandTextureColorFadeFar;\nvoid main() {")
              .replace("#include <opaque_fragment>", "float islandViewDistance = length(vViewPosition);\nfloat islandDistanceMix = smoothstep(islandTextureColorFadeNear, islandTextureColorFadeFar, islandViewDistance);\nfloat islandColorRetention = mix(islandTextureColorRetentionNear, islandTextureColorRetentionFar, islandDistanceMix);\noutgoingLight = mix(outgoingLight, diffuseColor.rgb, islandColorRetention);\n#include <opaque_fragment>");
          };
          material.customProgramCacheKey = () => `island-standard-distance-${colorRetentionNear}-${colorRetentionFar}-${colorFadeNear}-${colorFadeFar}`;
        }
        return material;
      });
      object.material = Array.isArray(object.material) ? materials : materials[0];
    });
    island.updateMatrixWorld(true);
    const autoFit = model.autoFit;
    if (autoFit?.enabled) {
      let bounds = new THREE.Box3().setFromObject(island), size = bounds.getSize(new THREE.Vector3());
      const sourceDiameter = Math.max(size.x, size.z), targetDiameter = autoFit.targetDiameter || config.radius * 2;
      if (sourceDiameter > 0) island.scale.multiplyScalar(targetDiameter / sourceDiameter);
      // คูณค่าที่ผู้ใช้กำหนดหลัง auto-fit เพื่อไม่ให้ระบบหักล้าง scale กลับเป็นขนาดเดิม
      island.scale.multiply(userScale);
      island.updateMatrixWorld(true);
      bounds = new THREE.Box3().setFromObject(island);
      const center = bounds.getCenter(new THREE.Vector3()), offset = model.position || [0, 0, 0];
      island.position.x += offset[0] - center.x;
      island.position.z += offset[2] - center.z;
      island.position.y += (autoFit.surfaceY ?? 0) + offset[1] - bounds.max.y;
    } else {
      island.scale.multiply(userScale);
      island.position.fromArray(model.position || [0, 0, 0]);
    }
    island.updateMatrixWorld(true);
    scene.add(island);
    createIslandDecorations(config, island);
    createIslandCloudBase(config);
  }, onLoadError = error => {
    console.warn(`main-world: โหลดโมเดลเกาะไม่สำเร็จ ${model.path}`, error);
    createProceduralWorldIsland();
  }, extension = model.path.split("?")[0].split(".").pop().toLowerCase();
  if (extension === "fbx") {
    import("three/addons/loaders/FBXLoader.js").then(({ FBXLoader }) => {
      const manager = new THREE.LoadingManager();
      manager.setURLModifier(url => {
        const filename = decodeURIComponent(url).toLowerCase();
        if (filename.includes("normal") && model.normalTexturePath) return runtimeAssetUrl(model.normalTexturePath);
        if (filename.includes("roughness") && model.useRoughnessMap && model.roughnessTexturePath) return runtimeAssetUrl(model.roughnessTexturePath);
        if (filename.includes("metallic") && model.useMetalnessMap && model.metalnessTexturePath) return runtimeAssetUrl(model.metalnessTexturePath);
        if (/\.(?:png|jpe?g|webp)(?:\?|$)/i.test(filename) && model.baseColorTexturePath) return runtimeAssetUrl(model.baseColorTexturePath);
        return url;
      });
      new FBXLoader(manager).load(runtimeAssetUrl(model.path), applyModel, undefined, onLoadError);
    }).catch(onLoadError);
  } else {
    import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => {
      new GLTFLoader().load(runtimeAssetUrl(model.path), gltf => applyModel(gltf.scene), undefined, onLoadError);
    }).catch(onLoadError);
  }
};
let gridLines = null, gridRing = null;
function createCircularGrid() {
  const radius = setting.ground.radius, step = setting.ground.gridSize, island = setting.ground.island, model = island?.model,
    useModel = Boolean(island?.enabled && model?.enabled && model?.path), gridHeight = useModel ? (model.gridHeight ?? .018) : .018,
    points = [], gridStyle = threeColor(setting.ground.gridColor), ringStyle = threeColor(setting.ground.ringColor);
  for (let offset = -radius; offset <= radius + .001; offset += step) {
    const extent = Math.sqrt(Math.max(0, radius * radius - offset * offset));
    points.push(-extent, gridHeight, offset, extent, gridHeight, offset, offset, gridHeight, -extent, offset, gridHeight, extent);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  gridLines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: gridStyle.color, transparent: true, opacity: setting.ground.gridOpacity * gridStyle.alpha, toneMapped: false, fog: false }));
  scene.add(gridLines);
  const ringPoints = [];
  for (let index = 0; index <= 96; index++) {
    const angle = index / 96 * Math.PI * 2;
    ringPoints.push(new THREE.Vector3(Math.cos(angle) * radius, gridHeight + .004, Math.sin(angle) * radius));
  }
  gridRing = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPoints), new THREE.LineBasicMaterial({ color: ringStyle.color, transparent: true, opacity: .48 * ringStyle.alpha, toneMapped: false, fog: false }));
  scene.add(gridRing);
}
createWorldIsland();
createCircularGrid();
const skyboxGroup = new THREE.Group(), distantDecorGroup = new THREE.Group(), atmosphereGroup = new THREE.Group(), lessonGroup = new THREE.Group(), effectGroup = new THREE.Group(); scene.add(skyboxGroup, distantDecorGroup, atmosphereGroup, lessonGroup, effectGroup);
const worldGuiSystem = worldGuiSystemTools.createWorldGuiSystem({
  THREE,
  viewport: elements.viewport,
  camera,
  setting,
  getGround: () => {
    const model = setting.ground.island?.model;
    return { radius: setting.ground.radius, gridSize: setting.ground.gridSize, height: setting.ground.island?.enabled && model?.enabled && model?.path ? (model.gridHeight ?? .018) : .018 };
  },
  getObjects: () => lessonGroup.children,
  markSceneActive
});
const clickme = clickmeServiceTools.createClickmeService({
  THREE, viewport: elements.viewport, camera, setting,
  isActionPhase: () => {
    if (!runtime.lesson || runtime.completed) return false;
    if (runtime.mode === "student-quiz") return Boolean(runtime.quiz?.acceptingAnswers);
    const steps = runtime.meta?.howto || [];
    if (!steps.length) return true;
    return steps[runtime.stepIndex]?.type === "freestyle" || runtime.stepIndex === steps.length - 1;
  },
  isGuideActive: () => Boolean(dragCue),
  isReturning: object => animations.get(object)?.kind === "return",
  getHovered: () => hovered
});
function toggleDebugArea(force) { return worldGuiSystem.debug.toggle(force); }
function decorRandom(index, salt = 0) { const value = Math.sin((index + 1) * 12.9898 + (salt + 1) * 78.233) * 43758.5453; return value - Math.floor(value); }
function createMathSymbolDecor(entry) {
  const group = new THREE.Group(), color = new THREE.Color(entry.color || "#ff8a65"), material = new THREE.MeshPhysicalMaterial({ color, emissive: color.clone().multiplyScalar(.08), emissiveIntensity: .32, roughness: .3, metalness: .03, clearcoat: .72, clearcoatRoughness: .16, fog: entry.fog !== false, transparent: false, opacity: 1 });
  const addBar = (length, rotation = 0, y = 0) => { const bar = new THREE.Mesh(new RoundedBoxGeometry(length, .48, .5, 6, .17), material); bar.rotation.z = rotation; bar.position.y = y; group.add(bar); };
  const addDot = y => { const dot = new THREE.Mesh(new THREE.SphereGeometry(.29, 24, 16), material); dot.scale.z = .86; dot.position.y = y; group.add(dot); };
  if (entry.symbol === "minus") addBar(1.9);
  else if (entry.symbol === "multiply") { addBar(1.9, Math.PI / 4); addBar(1.9, -Math.PI / 4); }
  else if (entry.symbol === "divide") { addBar(1.75); addDot(.76); addDot(-.76); }
  else { addBar(1.9); addBar(1.9, Math.PI / 2); }
  group.traverse(child => { if (child.isMesh) { child.castShadow = Boolean(shadowSetting.distantCast); child.receiveShadow = Boolean(shadowSetting.distantReceive); } });
  group.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(group), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
  group.position.sub(center);
  return { object: group, size: Math.max(size.x, size.y, size.z) || 1, entry };
}
function loadDistantDecorAsset(entry, config) {
  return new Promise(resolve => {
    const texture = entry.texture ? new THREE.TextureLoader().load(runtimeAssetUrl(entry.texture), loaded => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      loaded.needsUpdate = true;
    }) : null;
    if (texture) texture.colorSpace = THREE.SRGBColorSpace;
    const opacity = clamp(entry.opacity ?? config.opacity ?? 1, 0, 1);
    const finish = object => {
      stripImportedSceneControls(object);
      object.traverse(child => {
        if (!child.isMesh) return;
        if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
        child.castShadow = Boolean(shadowSetting.distantCast);
        child.receiveShadow = Boolean(shadowSetting.distantReceive);
        child.material = new THREE.MeshStandardMaterial({ map: texture, color: entry.color || "#ffffff", roughness: config.roughness ?? .72, metalness: 0, fog: config.fog !== false, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
      });
      object.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(object);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      object.position.sub(center);
      object.updateMatrixWorld(true);
      resolve({ object, size: Math.max(size.x, size.y, size.z) || 1, entry });
    };
    const fail = error => {
      console.warn(`main-world: โหลด distant decor ไม่สำเร็จ ${entry.path}`, error);
      resolve(null);
    };
    const url = runtimeAssetUrl(entry.path);
    if (/\.gl(?:b|tf)(?:\?|$)/i.test(entry.path)) {
      import("three/addons/loaders/GLTFLoader.js")
        .then(({ GLTFLoader }) => new GLTFLoader().load(url, gltf => finish(gltf.scene), undefined, fail))
        .catch(fail);
    } else {
      import("three/addons/loaders/FBXLoader.js").then(({ FBXLoader }) => {
        const manager = new THREE.LoadingManager();
        if (entry.texture) manager.setURLModifier(requestUrl => /\.(?:png|jpe?g|webp)(?:\?|$)/i.test(decodeURIComponent(requestUrl)) ? runtimeAssetUrl(entry.texture) : requestUrl);
        new FBXLoader(manager).load(url, finish, undefined, fail);
      }).catch(fail);
    }
  });
}
function createDistantDecor() { const config = setting.distantDecor, models = config?.models?.filter(entry => entry?.path || entry?.type === "mathSymbol"); if (!config?.enabled || !models?.length) return; Promise.all(models.map(entry => entry.type === "mathSymbol" ? Promise.resolve(createMathSymbolDecor(entry)) : loadDistantDecorAsset(entry, config))).then(assets => { const available = assets.filter(Boolean), total = Math.max(0, Math.round(config.count ?? available.length)); if (!available.length) return; for (let index = 0; index < total; index++) { const asset = available[index % available.length], entry = asset.entry, [near, far] = entry.radius || config.radius, [low, high] = entry.height || [0, 0], [minScale, maxScale] = entry.scale || [1, 1], angle = Number.isFinite(entry.angle) ? THREE.MathUtils.degToRad(entry.angle) : index / total * Math.PI * 2 + (decorRandom(index, 1) - .5) * .72, radius = THREE.MathUtils.lerp(near, far, decorRandom(index, 2)), height = THREE.MathUtils.lerp(low, high, decorRandom(index, 3)), targetSize = THREE.MathUtils.lerp(minScale, maxScale, decorRandom(index, 4)), sourceObject = asset.object.clone(true), hasCustomSpin = Number.isFinite(entry.spinSpeed), object = hasCustomSpin ? new THREE.Group() : sourceObject, canRotate = entry.rotate !== false; if (hasCustomSpin) object.add(sourceObject); object.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius); object.scale.setScalar(targetSize / asset.size); if (entry.faceCenter) { object.lookAt(0, height, 0); object.rotateY(THREE.MathUtils.degToRad(entry.facingOffset ?? 180)); } else if (canRotate) object.rotation.set((decorRandom(index, 11) - .5) * .5, decorRandom(index, 12) * Math.PI * 2, (decorRandom(index, 13) - .5) * .42); object.userData.distantMotion = { basePosition: object.position.clone(), baseRotation: object.rotation.clone(), phase: decorRandom(index, 5) * Math.PI * 2, floatSpeed: config.floatSpeed * (.72 + decorRandom(index, 6) * .72), floatAmount: config.floatAmount * (.65 + decorRandom(index, 7) * .7), driftAmount: config.driftAmount * (.45 + decorRandom(index, 8) * .8), spinAxis: entry.spinAxis || "y", spinSpeed: hasCustomSpin ? entry.spinSpeed : canRotate ? config.spinSpeed * (decorRandom(index, 9) > .5 ? 1 : -1) * (.6 + decorRandom(index, 10)) : 0, startedAt: performance.now() }; distantDecorGroup.add(object); } }); }
function createDistantClouds() { const config = setting.distantClouds, entries = (config?.models?.length ? config.models : [config?.model]).filter(entry => entry?.path); if (!config?.enabled || !entries.length) return; Promise.all(entries.map(entry => loadDistantDecorAsset(entry, config))).then(assets => { const available = assets.filter(Boolean); if (!available.length) return; const total = Math.max(0, Math.round(config.count ?? 0)), [near, far] = config.radius, [low, high] = config.height, [minScale, maxScale] = config.scale, [minOrbit, maxOrbit] = config.orbitSpeed || [.000006, .000014], colors = config.colors?.length ? config.colors : ["#ffffff"]; for (let index = 0; index < total; index++) { const asset = available[Math.floor(decorRandom(index, 31) * available.length)], angle = index / Math.max(1, total) * Math.PI * 2 + (decorRandom(index, 21) - .5) * .7, radius = THREE.MathUtils.lerp(near, far, decorRandom(index, 22)), height = THREE.MathUtils.lerp(low, high, decorRandom(index, 23)), targetSize = THREE.MathUtils.lerp(minScale, maxScale, decorRandom(index, 24)), distanceRatio = clamp((radius - near) / Math.max(far - near, .001), 0, 1), sizeRatio = clamp((targetSize - minScale) / Math.max(maxScale - minScale, .001), 0, 1), fadeStrength = sizeRatio * (1 - distanceRatio), cloudOpacity = THREE.MathUtils.lerp(1, config.largeNearOpacity ?? .84, fadeStrength), cloud = asset.object.clone(true), tint = new THREE.Color(colors[index % colors.length]), direction = decorRandom(index, 25) > .5 ? 1 : -1, orbitSpeed = THREE.MathUtils.lerp(minOrbit, maxOrbit, decorRandom(index, 26)) * direction; cloud.traverse(child => { if (!child.isMesh) return; child.material = child.material.clone(); child.material.color.multiply(tint); child.material.opacity = cloudOpacity; child.material.transparent = cloudOpacity < 1; child.material.depthWrite = cloudOpacity >= 1; child.material.needsUpdate = true; }); cloud.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius); cloud.scale.setScalar(targetSize / asset.size); cloud.lookAt(0, height, 0); cloud.userData.distantMotion = { basePosition: cloud.position.clone(), baseRotation: cloud.rotation.clone(), baseY: height, phase: decorRandom(index, 27) * Math.PI * 2, floatSpeed: config.floatSpeed * (.72 + decorRandom(index, 28) * .72), floatAmount: config.floatAmount * (.65 + decorRandom(index, 29) * .7), driftAmount: config.radialDrift * (.55 + decorRandom(index, 30) * .75), orbitAngle: angle, orbitRadius: radius, orbitSpeed, startedAt: performance.now() }; distantDecorGroup.add(cloud); } }); }
createDistantDecor();
createDistantClouds();
const interactive = [], uiDisplays = [], worldCallouts = new Set(), activeGuidelines = new Set(), targetFocusEffects = new Set(), animations = new Map(), commitFlashes = new Map(); let hovered = null, hoveredDisplay = null, selected = null, atmospherePoints = null, fallingLeafSystem = null, backgroundVersion = 0, spawnSequence = 0;
let lastSceneActivity = performance.now(), lastRenderedAt = 0, lastDistantUpdateAt = 0, lastFrameAt = performance.now();
function markSceneActive() { lastSceneActivity = performance.now(); }

// Highlight กลางใช้ Bounding Box รวม จึงไม่สร้างเส้นซ้อนภายใน Procedural/Composite Asset
const highlightSetting = setting.object.highlight || {}, highlightRoot = new THREE.Group(), highlightRing = new THREE.Group(), floatingMarker = new THREE.Group();
const solidWhiteHighlightTexture = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); solidWhiteHighlightTexture.colorSpace = THREE.SRGBColorSpace; solidWhiteHighlightTexture.needsUpdate = true;
const ringDiscMaterial = new THREE.MeshBasicMaterial({ color: highlightSetting.hover?.ringColor || "#ffffff", transparent: true, opacity: .055, depthWrite: false, depthTest: true, toneMapped: false }), ringDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 64), ringDiscMaterial); ringDisc.rotation.x = -Math.PI / 2;
const ringHaloMaterial = new THREE.MeshBasicMaterial({ color: highlightSetting.hover?.ringColor || "#ffffff", transparent: true, opacity: .52, depthWrite: false, depthTest: true, toneMapped: false }), ringHalo = new THREE.Mesh(new THREE.TorusGeometry(1, highlightSetting.ring?.thickness || .045, 8, 64), ringHaloMaterial); ringHalo.rotation.x = Math.PI / 2; highlightRing.add(ringDisc, ringHalo);
const markerSize = highlightSetting.marker?.size || 1, markerGem = new THREE.Group(), markerGeometry = new THREE.OctahedronGeometry(1, 0), markerEdgeMaterial = new THREE.MeshPhysicalMaterial({ color: highlightSetting.marker?.edgeColor || "#5369dc", roughness: .22, metalness: .06, clearcoat: .9, clearcoatRoughness: .1, depthTest: true }), markerCrystalMaterial = new THREE.MeshPhysicalMaterial({ color: highlightSetting.marker?.color || "#63d9ff", emissive: new THREE.Color(highlightSetting.marker?.color || "#63d9ff").multiplyScalar(.16), emissiveIntensity: .5, roughness: .12, metalness: .02, clearcoat: 1, clearcoatRoughness: .06, depthTest: true }), markerCoreMaterial = new THREE.MeshPhysicalMaterial({ color: highlightSetting.marker?.secondaryColor || "#effcff", emissive: highlightSetting.marker?.secondaryColor || "#effcff", emissiveIntensity: .72, roughness: .08, clearcoat: 1, depthTest: true });
const markerEdge = new THREE.Mesh(markerGeometry, markerEdgeMaterial), markerCrystal = new THREE.Mesh(markerGeometry, markerCrystalMaterial), markerCore = new THREE.Mesh(markerGeometry, markerCoreMaterial); markerEdge.scale.set(.43, .59, .43); markerCrystal.scale.set(.355, .505, .355); markerCore.scale.set(.13, .22, .13); markerGem.scale.setScalar(markerSize); markerGem.add(markerEdge, markerCrystal, markerCore);
const markerSparkleMaterial = new THREE.MeshBasicMaterial({ color: highlightSetting.marker?.sparkleColor || "#ffffff", transparent: true, opacity: .92, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending, toneMapped: false }), markerSparkles = [0, 1, 2].map(index => { const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(.058 - index * .006, 0), markerSparkleMaterial); sparkle.userData.phase = index * Math.PI * 2 / 3; floatingMarker.add(sparkle); return sparkle; }), topRingSetting = highlightSetting.marker?.topRing || {}, markerTopRing = new THREE.Group(), topRingOuter = new THREE.Mesh(new THREE.TorusGeometry(topRingSetting.size ?? .34, (topRingSetting.thickness ?? .035) * 1.65, 10, 48), new THREE.MeshPhysicalMaterial({ color: topRingSetting.edgeColor || "#72dfff", emissive: topRingSetting.edgeColor || "#72dfff", emissiveIntensity: .28, roughness: .18, clearcoat: 1, depthTest: true })), topRingInner = new THREE.Mesh(new THREE.TorusGeometry((topRingSetting.size ?? .34) * .96, topRingSetting.thickness ?? .035, 10, 48), new THREE.MeshPhysicalMaterial({ color: topRingSetting.color || "#ffffff", emissive: topRingSetting.color || "#ffffff", emissiveIntensity: .58, roughness: .12, clearcoat: 1, depthTest: true })); topRingOuter.rotation.x = topRingInner.rotation.x = Math.PI / 2; markerTopRing.add(topRingOuter, topRingInner); markerTopRing.visible = topRingSetting.enabled !== false; floatingMarker.add(markerTopRing, markerGem);
for (const part of [markerEdge, markerCrystal, markerCore]) { part.castShadow = Boolean(shadowSetting.markerCast); part.receiveShadow = Boolean(shadowSetting.markerReceive); }
const markerDownAxis = new THREE.Vector3(0, -1, 0), markerTargetPoint = new THREE.Vector3(), markerDirection = new THREE.Vector3();
function selectionMarkerMaterial(name = "") { const marker = highlightSetting.marker || {}, role = name.toLowerCase(), isCore = role.includes("core") || role.includes("inner"), color = role.includes("edge") || role.includes("border") ? marker.edgeColor : isCore ? marker.secondaryColor : role.includes("spark") || role.includes("star") ? marker.sparkleColor : marker.color; return new THREE.MeshPhysicalMaterial({ color: color || "#63d9ff", emissive: new THREE.Color(color || "#63d9ff").multiplyScalar(isCore ? .28 : .12), emissiveIntensity: isCore ? .72 : .42, roughness: .14, metalness: .02, clearcoat: 1, clearcoatRoughness: .07, depthTest: true }); }
function applySelectionMarkerModel(object) { stripImportedSceneControls(object); const marker = highlightSetting.marker || {}, offset = marker.modelOffset || [0, 0, 0], rotation = marker.modelRotation || [0, 0, 0]; object.traverse(child => { if (!child.isMesh) return; if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals(); const oldMaterials = Array.isArray(child.material) ? child.material : [child.material]; for (const oldMaterial of oldMaterials) { oldMaterial?.map?.dispose?.(); oldMaterial?.dispose?.(); } child.material = selectionMarkerMaterial(child.name); child.castShadow = Boolean(shadowSetting.markerCast); child.receiveShadow = Boolean(shadowSetting.markerReceive); }); object.updateMatrixWorld(true); const bounds = new THREE.Box3().setFromObject(object), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3()), largest = Math.max(size.x, size.y, size.z) || 1, normalized = new THREE.Group(); object.position.sub(center); normalized.add(object); normalized.scale.setScalar(1 / largest); normalized.position.fromArray(offset); normalized.rotation.set(...rotation.map(value => THREE.MathUtils.degToRad(value || 0))); for (const child of [...markerGem.children]) { markerGem.remove(child); disposeObject(child); } markerGem.add(normalized); markSceneActive(); }
function loadSelectionMarkerModel() { const path = highlightSetting.marker?.path; if (!path) return; const url = runtimeAssetUrl(path), fail = error => console.warn(`main-world: โหลด Selection Marker ไม่สำเร็จ จึงใช้เพชร Procedural สำรอง (${path})`, error); if (/\.fbx(?:\?|$)/i.test(path)) import("three/addons/loaders/FBXLoader.js").then(({ FBXLoader }) => new FBXLoader().load(url, applySelectionMarkerModel, undefined, fail)).catch(fail); else import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader().load(url, gltf => applySelectionMarkerModel(gltf.scene), undefined, fail)).catch(fail); }
loadSelectionMarkerModel();
highlightRoot.add(highlightRing, floatingMarker); highlightRoot.visible = false; highlightRoot.userData.hoverBounds = new THREE.Box3(); highlightRoot.userData.selectedBounds = new THREE.Box3(); scene.add(highlightRoot);
function forEachObjectMaterial(object, callback) { if (!object) return; object.traverse?.(child => { if (child.userData?.isLessonDecoration) return; const materials = Array.isArray(child.material) ? child.material : [child.material]; for (const value of materials) if (value?.color) callback(value, child); }); }
function rememberHighlightSurface(value) { const surface = value.userData ||= {}; surface.baseHighlightColor ??= value.color.clone(); surface.baseHighlightEmissive ??= value.emissive?.clone?.(); surface.baseHighlightEmissiveIntensity ??= value.emissiveIntensity ?? 0; if (!Object.prototype.hasOwnProperty.call(surface, "baseHighlightEmissiveMap")) surface.baseHighlightEmissiveMap = value.emissiveMap ?? null; return surface; }
function setHighlightEmissiveMap(value, map) { if (!("emissiveMap" in value) || value.emissiveMap === map) return; const mapPresenceChanged = Boolean(value.emissiveMap) !== Boolean(map); value.emissiveMap = map; if (mapPresenceChanged) value.needsUpdate = true; }
function restoreObjectSurface(object) { forEachObjectMaterial(object, value => { const surface = value.userData || {}; if (surface.baseHighlightColor) value.color.copy(surface.baseHighlightColor); if (value.emissive && surface.baseHighlightEmissive) value.emissive.copy(surface.baseHighlightEmissive); if ("emissiveIntensity" in value && surface.baseHighlightEmissiveIntensity != null) value.emissiveIntensity = surface.baseHighlightEmissiveIntensity; if (Object.prototype.hasOwnProperty.call(surface, "baseHighlightEmissiveMap")) setHighlightEmissiveMap(value, surface.baseHighlightEmissiveMap); }); }
function applyObjectHighlight(object, state = "none") { if (!object) return; restoreObjectSurface(object); if (state === "none" || highlightSetting.enabled === false) return; const style = highlightSetting[state]; if (!style) return; const tint = new THREE.Color(style.tint || "#ffffff"), strength = clamp(style.strength ?? .12, 0, 1); forEachObjectMaterial(object, value => { const surface = rememberHighlightSurface(value), textured = Boolean(value.map); value.color.copy(surface.baseHighlightColor).lerp(tint, strength); if (value.emissive && surface.baseHighlightEmissive) { if (textured) setHighlightEmissiveMap(value, solidWhiteHighlightTexture); value.emissive.copy(surface.baseHighlightEmissive).lerp(tint, Math.min(.55, strength * 1.8)); value.emissiveIntensity = surface.baseHighlightEmissiveIntensity + (textured ? (style.texturedEmissiveStrength ?? style.emissiveStrength ?? 0) : (style.emissiveStrength ?? 0)); } }); }
function isActionableCallout(object) { return Boolean(object?.userData?.worldCallout?.actionable); }
function usesSelectionFeedback(object) { return Boolean(object && object.userData?.selectionFeedback !== false && !isActionableCallout(object)); }
function usesInteractiveHoverFeedback(object) { return Boolean(object && (object.userData?.draggable || object.userData?.clickable) && !isActionableCallout(object) && object.userData?.interactionStyle !== "world-gui"); }
function setWorldCalloutHovered(object, value) { const callout = object?.userData?.worldCallout; if (!callout?.actionable || callout.hovered === value) return; callout.hovered = value; elements.canvas.classList.toggle("is-hovering-callout", value); markSceneActive(); }
function currentHighlightObject() { const object = selected || hovered; return usesSelectionFeedback(object) ? object : null; }
function updateHighlightStyle() {
  const hoverObject = usesInteractiveHoverFeedback(hovered) ? hovered : null;
  const selectedObject = usesSelectionFeedback(selected) ? selected : null;
  highlightRoot.visible = Boolean((hoverObject || selectedObject) && highlightSetting.enabled !== false);
  elements.canvas.classList.toggle("is-hovering-object", Boolean(hoverObject));
  const style = highlightSetting.hover || {};
  const opacity = style.ringOpacity ?? .6;
  ringDiscMaterial.color.set(style.ringColor || "#ffffff");
  ringHaloMaterial.color.copy(ringDiscMaterial.color);
  ringHaloMaterial.opacity = opacity;
  ringDiscMaterial.opacity = opacity * .065;
  highlightRing.visible = Boolean(highlightRoot.visible && hoverObject && highlightSetting.ring?.enabled !== false && opacity > 0);
  floatingMarker.visible = Boolean(highlightRoot.visible && selectedObject && highlightSetting.marker?.enabled !== false);
}
function updateHighlightBounds(now = performance.now()) {
  if (!highlightRoot.visible) return;
  const hoverObject = usesInteractiveHoverFeedback(hovered) ? hovered : null;
  const selectedObject = usesSelectionFeedback(selected) ? selected : null;
  const ring = highlightSetting.ring || {};
  if (hoverObject && highlightRing.visible) {
    const boundsRoot = hoverObject.userData.visualRoot || hoverObject;
    const box = highlightRoot.userData.hoverBounds.setFromObject(boundsRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const padding = ring.padding ?? .3;
    const minRadius = ring.minRadius ?? .58;
    const pulse = 1 + Math.sin(now * (ring.pulseSpeed ?? .0022)) * (ring.pulseAmount ?? .025);
    highlightRing.position.set(center.x, box.min.y + (ring.heightOffset ?? .055), center.z);
    highlightRing.scale.setScalar(Math.max(minRadius, Math.min(.82, Math.min(size.x, size.z) * .5 + padding)) * pulse);
  }
  if (!selectedObject || !floatingMarker.visible) return;
  const markerBoundsRoot = selectedObject.userData.visualRoot || selectedObject;
  const markerBox = highlightRoot.userData.selectedBounds.setFromObject(markerBoundsRoot);
  const markerCenter = markerBox.getCenter(new THREE.Vector3());
  const marker = highlightSetting.marker || {};
  const bob = Math.sin(now * (marker.bobSpeed ?? .0024)) * (marker.bobHeight ?? .08);
  const markerPulse = 1 + Math.sin(now * (marker.pulseSpeed ?? .0028)) * (marker.pulseAmount ?? .035);
  floatingMarker.position.set(markerCenter.x, markerBox.max.y + (marker.height ?? .68) + bob, markerCenter.z);
  markerTargetPoint.set(markerCenter.x, markerBox.max.y, markerCenter.z);
  markerDirection.subVectors(markerTargetPoint, floatingMarker.position).normalize();
  floatingMarker.quaternion.setFromUnitVectors(markerDownAxis, markerDirection);
  floatingMarker.scale.setScalar(markerPulse);
  markerGem.rotation.y = now * (marker.spinSpeed ?? .00075);
  markerGem.rotation.x = 0;
  const counterMotion = topRingSetting.counterMotion ?? 2;
  markerTopRing.position.y = (topRingSetting.height ?? .58) - bob * (1 + counterMotion);
  markerTopRing.scale.setScalar(1 - Math.sin(now * (marker.pulseSpeed ?? .0028)) * .035);
  for (const sparkle of markerSparkles) {
    const angle = now * (marker.sparkleSpeed ?? .0018) + sparkle.userData.phase;
    const radius = .52 * markerSize;
    sparkle.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.35) * .2 * markerSize, Math.sin(angle) * radius);
    sparkle.rotation.set(angle * .7, angle, angle * .45);
    sparkle.scale.setScalar(.72 + Math.sin(angle * 2.2) * .26);
  }
}
function setSelected(object) {
  if (selected === object) return;
  const previous = selected;
  selected = object;
  if (previous) applyObjectHighlight(previous, previous === hovered ? "hover" : "none");
  if (object) applyObjectHighlight(object, object === hovered ? "hover" : "none");
  updateHighlightStyle();
  updateHighlightBounds();
  markSceneActive();
}
function setHovered(object) {
  if (hovered === object) return;
  const previous = hovered;
  hovered = object;
  previous?.userData?.onHover?.(false);
  object?.userData?.onHover?.(true);
  if (isActionableCallout(previous)) setWorldCalloutHovered(previous, false);
  else if (previous) applyObjectHighlight(previous, "none");
  if (isActionableCallout(object)) setWorldCalloutHovered(object, true);
  else if (usesInteractiveHoverFeedback(object)) applyObjectHighlight(object, "hover");
  updateHighlightStyle();
  updateHighlightBounds();
  markSceneActive();
}
function disposeObject(object) { object.traverse(child => { child.userData?.domElement?.remove?.(); child.userData?.worldUiTexture?.dispose?.(); if (!child.userData?.sharedLibraryGeometry) child.geometry?.dispose?.(); if (Array.isArray(child.material)) child.material.forEach(m => m.dispose?.()); else child.material?.dispose?.(); }); }
function setDisplayHovered(object) { if (hoveredDisplay === object) return; if (hoveredDisplay?.material) hoveredDisplay.material.opacity = hoveredDisplay.userData.idleOpacity; hoveredDisplay = object; if (object?.material) object.material.opacity = object.userData.hoverOpacity; }
function clearWorld() { cancelCameraFocus(); setHovered(null); setDisplayHovered(null); setSelected(null); hideDragCue(); removeDragGuideline(); animations.clear(); commitFlashes.clear(); activeGuidelines.clear(); targetFocusEffects.clear(); worldCallouts.clear(); worldGuiSystem.clearAll(); clickme.clearAll(); spawnSequence = 0; runtime.sceneEntered = false; runtime.lessonSceneInitialized = false; for (const child of [...lessonGroup.children]) { lessonGroup.remove(child); disposeObject(child); } interactive.length = 0; uiDisplays.length = 0; while (effectGroup.children.length) { const child = effectGroup.children.pop(); disposeObject(child); } markSceneActive(); }

function startCommitFlash(object) { const config = setting.object.commit; if (!config?.enabled || !object) return; restoreObjectSurface(object); const materials = []; forEachObjectMaterial(object, material => { if (!material.transparent) materials.push(material); }); if (!materials.length) return; commitFlashes.set(object, { start: performance.now(), duration: config.duration || 780, flashes: config.flashes || 3, color: new THREE.Color(config.color || "#ffffff"), materials: [...new Set(materials)].map(material => ({ material, baseColor: material.color.clone(), emissive: material.emissive?.clone(), emissiveIntensity: material.emissiveIntensity })) }); }

function syncInteractive(object) { const enabled = Boolean(object.userData.draggable || object.userData.clickable), index = interactive.indexOf(object); if (enabled && index < 0) interactive.push(object); if (!enabled && index >= 0) { interactive.splice(index, 1); if (hovered === object) setHovered(null); if (selected === object) setSelected(null); } }
function makeHandle(mesh) { const changed = () => markSceneActive(); const cancelAnimation = () => { const previous = animations.get(mesh); if (previous?.kind === "spawn" || previous?.kind === "drop") { mesh.scale.setScalar(1); if (previous.baseY != null) mesh.position.y = previous.baseY; } animations.delete(mesh); }; const clearHighlight = () => { if (hovered === mesh) setHovered(null); if (selected === mesh) setSelected(null); }; const handle = { object3D: mesh, setPosition(x, y, z) { cancelAnimation(); mesh.position.set(x, y, z); mesh.userData.groundY = y; changed(); }, setRotation(x = 0, y = 0, z = 0) { mesh.rotation.set(THREE.MathUtils.degToRad(x), THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(z)); changed(); }, setScale(x = 1, y = x, z = x) { const visual = mesh.userData.visualRoot || mesh; visual.scale.set(x, y, z); changed(); }, animateTo(x, y, z, { duration = 620, delay = 0, arcHeight = .7 } = {}) { cancelAnimation(); animations.set(mesh, { kind: "move", start: performance.now() + delay, duration, from: mesh.position.clone(), to: new THREE.Vector3(x, y, z), arcHeight }); mesh.userData.groundY = y; markSceneActive(); }, stopAnimation() { cancelAnimation(); changed(); }, playCommit(options = {}) { startCommitFlash(mesh); if (options.spark !== false) screenSpark(mesh); markSceneActive(); }, setHighlighted(value) { applyObjectHighlight(mesh, value ? "hover" : "none"); changed(); }, setColor(color) { forEachObjectMaterial(mesh, value => { value.color.set(color); rememberHighlightSurface(value).baseHighlightColor.copy(value.color); }); markSceneActive(); }, setWash(color = "#ffffff", amount = 0) { forEachObjectMaterial(mesh, value => setMaterialWash(value, color, amount)); markSceneActive(); }, setOpacity(opacity = 1) { const alpha = clamp(Number(opacity) || 0, 0, 1); forEachObjectMaterial(mesh, value => { value.opacity = alpha; value.transparent = alpha < .999; value.depthWrite = alpha >= .72; value.needsUpdate = true; }); markSceneActive(); }, setVisible(value) { mesh.visible = value; if (!value) clearHighlight(); changed(); }, setDraggable(value) { mesh.userData.draggable = Boolean(value); syncInteractive(mesh); }, setClickable(value) { mesh.userData.clickable = Boolean(value); syncInteractive(mesh); }, setHitArea(size = null, offset = [0, 0, 0]) { setInteractionHitArea(mesh, size, offset); markSceneActive(); }, setDragFromCenter(value) { mesh.userData.dragFromCenter = Boolean(value); }, remove() { clearHighlight(); commitFlashes.delete(mesh); activeGuidelines.delete(mesh); mesh.parent?.remove(mesh); const index = interactive.indexOf(mesh); if (index >= 0) interactive.splice(index, 1); disposeObject(mesh); changed(); } }; mesh.userData.lessonHandle = handle; return Object.freeze(handle); }
function spawnAnimation(object, start = performance.now()) { return { kind: "spawn", start, duration: object.userData.spawnDuration || setting.object.spawn.duration, baseY: object.position.y, height: object.userData.spawnFloatHeight || 0, scaleOvershoot: object.userData.spawnScaleOvershoot !== false }; }
function queueSpawn(object, enabled = true) { if (!enabled || !setting.object.spawn.enabled) return; object.userData.spawnable = true; object.scale.setScalar(.001); if (runtime.sceneEntered) animations.set(object, spawnAnimation(object)); }
function playWorldEntrance() { let index = 0; lessonGroup.traverse(object => { if (!object.userData.spawnable) return; animations.delete(object); if (object.visible === false) { object.scale.setScalar(1); return; } object.scale.setScalar(.001); animations.set(object, spawnAnimation(object, performance.now() + index++ * setting.object.spawn.stagger)); }); }
function updateGuideline(line) { const from = line.userData.fromObject ? line.userData.fromObject.getWorldPosition(new THREE.Vector3()) : line.userData.guideFrom.clone(), to = line.userData.guideTo, middle = new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + 2.3, (from.z + to.z) / 2), curve = new THREE.QuadraticBezierCurve3(from, middle, to), points = curve.getPoints(40), direction = points.at(-1).clone().sub(points.at(-2)).normalize(); line.geometry.setFromPoints(points); line.computeLineDistances(); line.userData.arrow.position.copy(to).addScaledVector(direction, -line.userData.arrowOffset); line.userData.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction); }
function createGuideline({ from = [0, .2, 0], fromObject = null, to = [0, .2, 0], color = setting.interaction.guideline.color, parent = lessonGroup } = {}) { const style = threeColor(color), guide = setting.interaction.guideline, arrowLength = guide.arrowLength ?? .52, geometry = new THREE.BufferGeometry(), line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: style.color, dashSize: guide.dashSize, gapSize: guide.gapSize, transparent: true, opacity: .92 * style.alpha, depthTest: false, toneMapped: false, fog: false })), arrow = new THREE.Mesh(new THREE.ConeGeometry(guide.arrowSize ?? .22, arrowLength, 14), new THREE.MeshBasicMaterial({ color: style.color, transparent: true, opacity: .98 * style.alpha, depthTest: false, depthWrite: false, toneMapped: false, fog: false })); arrow.renderOrder = 951; Object.assign(line.userData, { flowingGuideline: true, fromObject, guideFrom: new THREE.Vector3(...from), guideTo: new THREE.Vector3(...to), arrow, arrowOffset: arrowLength * .46 }); line.add(arrow); line.renderOrder = 950; updateGuideline(line); parent.add(line); activeGuidelines.add(line); return line; }
function createLineRender({ name = "line-render", from = [0, .24, 0], to = [1, .24, 0], points = null, closed = false, color = "#4f7fe8", opacity = .9, occludedOpacity = .14, dashed = false, arrow = true, parent = lessonGroup } = {}) {
  const path = points == null ? [from, to] : points;
  if (!Array.isArray(path) || path.length < 2 || path.some(p => !Array.isArray(p) || p.length !== 3 || p.some(v => !Number.isFinite(v)))) throw new Error("LINE_RENDER_INVALID: points must contain at least two finite xyz positions");
  const vertices = path.map(p => new THREE.Vector3(...p));
  if (closed && vertices[0].distanceTo(vertices.at(-1)) > .001) vertices.push(vertices[0].clone());
  const end = vertices.at(-1), start = vertices.at(-2), direction = end.clone().sub(start), length = direction.length();
  if (length < .001) throw new Error("LINE_RENDER_INVALID: consecutive endpoints must differ");
  direction.normalize();
  const style = threeColor(color), guide = setting.interaction.guideline;
  const materialOptions = { color: style.color, transparent: true, opacity: clamp(opacity, 0, 1) * style.alpha, depthTest: true, depthWrite: false, toneMapped: false, fog: false };
  const lineMaterial = dashed
    ? new THREE.LineDashedMaterial({ ...materialOptions, dashSize: guide.dashSize, gapSize: guide.gapSize })
    : new THREE.LineBasicMaterial(materialOptions);
  const group = new THREE.Group(), lineGeometry = new THREE.BufferGeometry().setFromPoints(vertices), line = new THREE.Line(lineGeometry, lineMaterial);
  line.renderOrder = 48;
  line.raycast = () => { };
  if (dashed) line.computeLineDistances();
  group.name = name;
  group.add(line);
  if (occludedOpacity > 0) {
    const ghostOptions = { ...materialOptions, opacity: clamp(occludedOpacity, 0, 1) * style.alpha, depthTest: false };
    const ghostMaterial = dashed
      ? new THREE.LineDashedMaterial({ ...ghostOptions, dashSize: guide.dashSize, gapSize: guide.gapSize })
      : new THREE.LineBasicMaterial(ghostOptions);
    const ghost = new THREE.Line(lineGeometry.clone(), ghostMaterial);
    ghost.renderOrder = 47;
    ghost.raycast = () => { };
    if (dashed) ghost.computeLineDistances();
    group.add(ghost);
  }
  if (arrow) {
    const arrowLength = Math.min(guide.arrowLength ?? .52, length * .28), arrowMesh = new THREE.Mesh(
      new THREE.ConeGeometry(guide.arrowSize ?? .22, arrowLength, 14),
      new THREE.MeshBasicMaterial({ ...materialOptions, opacity: Math.min(1, materialOptions.opacity + .04) })
    );
    arrowMesh.position.copy(end).addScaledVector(direction, -arrowLength * .46);
    arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    arrowMesh.renderOrder = 49;
    arrowMesh.raycast = () => { };
    group.add(arrowMesh);
    if (occludedOpacity > 0) {
      const ghostArrow = arrowMesh.clone();
      ghostArrow.material = arrowMesh.material.clone();
      ghostArrow.material.depthTest = false;
      ghostArrow.material.opacity = clamp(occludedOpacity, 0, 1) * style.alpha;
      ghostArrow.renderOrder = 47;
      group.add(ghostArrow);
    }
  }
  parent.add(group);
  return group;
}
let dragGuideline = null, dragCue = null, dragCueResumeTimer = 0;
function removeDragGuideline() { if (!dragGuideline) return; activeGuidelines.delete(dragGuideline); effectGroup.remove(dragGuideline); disposeObject(dragGuideline); dragGuideline = null; }
function pauseDragCue() { clearTimeout(dragCueResumeTimer); elements.sceneHandCue.classList.add("is-camera-moving"); }
function resumeDragCue(delay = 240) { clearTimeout(dragCueResumeTimer); if (!dragCue) return; dragCueResumeTimer = setTimeout(() => { if (dragCue) elements.sceneHandCue.classList.remove("is-camera-moving"); }, delay); }
function hideDragCue() { clearTimeout(dragCueResumeTimer); dragCue = null; elements.sceneHandCue.classList.remove("is-camera-moving"); elements.sceneHandCue.hidden = true; }
function showDragCue(object, to) { if (!object) return; clearTimeout(dragCueResumeTimer); dragCue = { object, to: new THREE.Vector3(...to), startedAt: performance.now() }; elements.sceneHandCue.classList.remove("is-camera-moving"); elements.sceneHandCue.hidden = false; }
function setOperatorAppearance(group, state) { const valid = state === "valid", style = setting.lessonGraphics.operatorBase; group.userData.operatorState = state; group.userData.operatorBase.material.color.set(valid ? style.validBase : style.neutralBase); group.userData.operatorEdge.material.color.set(valid ? style.validEdge : style.neutralEdge); for (const part of group.userData.operatorParts) { part.material.color.set(valid ? "#26aa72" : "#6049c7"); part.material.emissive.set(valid ? "#0e5a3a" : "#25186f"); } }
function pulseOperator(group) { cancelAnimationFrame(group.userData.operatorPulseFrame); const start = performance.now(), duration = 760, baseY = group.position.y; const tick = now => { if (!group.parent) return; const progress = clamp((now - start) / duration, 0, 1), fade = 1 - progress, pop = Math.sin(progress * Math.PI), bounce = Math.abs(Math.sin(progress * Math.PI * 2.4)) * fade; group.scale.setScalar(1 + pop * .2 + bounce * .055); group.position.y = baseY + bounce * .3; group.rotation.z = Math.sin(progress * Math.PI * 4) * fade * .055; if (progress < 1) group.userData.operatorPulseFrame = requestAnimationFrame(tick); else { group.scale.setScalar(1); group.position.y = baseY; group.rotation.z = 0; group.userData.operatorPulseFrame = 0; } }; group.userData.operatorPulseFrame = requestAnimationFrame(tick); }
function createOperatorPart(length = 1.16) { const geometry = new RoundedBoxGeometry(length, .3, .34, 6, .11), part = new THREE.Mesh(geometry, new THREE.MeshPhysicalMaterial({ color: "#6049c7", roughness: .25, metalness: .03, clearcoat: .9, clearcoatRoughness: .1, emissive: "#25186f", emissiveIntensity: .14 })); part.position.y = .48; part.castShadow = Boolean(shadowSetting.lessonCast); part.receiveShadow = shadowSetting.lessonReceive !== false; return part; }
function createOperatorDot() { const dot = new THREE.Mesh(new THREE.SphereGeometry(.17, 18, 12), new THREE.MeshPhysicalMaterial({ color: "#6049c7", roughness: .25, metalness: .03, clearcoat: .9, clearcoatRoughness: .1, emissive: "#25186f", emissiveIntensity: .14 })); dot.position.y = .48; dot.castShadow = Boolean(shadowSetting.lessonCast); dot.receiveShadow = shadowSetting.lessonReceive !== false; return dot; }
const SUPPORTED_OPERATOR_SIGNS = Object.freeze(["<", ">", "=", "≠", "!=", "<=", ">=", "≤", "≥", "+", "-", "−", "×", "x", "X", "÷"]);
function createOperatorParts(text) {
  text = text === "!=" ? "≠" : text === "<=" ? "≤" : text === ">=" ? "≥" : text;
  if (text === "=") { const top = createOperatorPart(1.28), bottom = createOperatorPart(1.28); top.position.z = -.29; bottom.position.z = .29; return [top, bottom]; }
  if (text === "≠" || text === "!=") { const top = createOperatorPart(1.28), bottom = createOperatorPart(1.28), slash = createOperatorPart(1.72); top.position.z = -.29; bottom.position.z = .29; slash.rotation.y = -.72; return [top, bottom, slash]; }
  if (text === "-" || text === "−") return [createOperatorPart(1.36)];
  if (text === "+") { const horizontal = createOperatorPart(1.36), vertical = createOperatorPart(1.36); vertical.rotation.y = Math.PI / 2; return [horizontal, vertical]; }
  if (text === "×" || text === "x" || text === "X") { const first = createOperatorPart(1.34), second = createOperatorPart(1.34); first.rotation.y = Math.PI / 4; second.rotation.y = -Math.PI / 4; return [first, second]; }
  if (text === "÷") { const bar = createOperatorPart(1.25), front = createOperatorDot(), back = createOperatorDot(); front.position.z = -.48; back.position.z = .48; return [bar, front, back]; }
  const pointsRight = text === ">" || text === "≥", upper = createOperatorPart(), lower = createOperatorPart();
  upper.position.set(pointsRight ? .08 : -.08, .48, -.32); lower.position.set(pointsRight ? .08 : -.08, .48, .32); upper.rotation.y = pointsRight ? -.62 : .62; lower.rotation.y = pointsRight ? .62 : -.62;
  if (text !== "≤" && text !== "≥") return [upper, lower];
  const equalsBar = createOperatorPart(1.42); equalsBar.position.z = .82; return [upper, lower, equalsBar];
}
function roundedZonePoints(width, depth, radius = .45, segments = 5) { const points = [], corners = [[width / 2 - radius, depth / 2 - radius, 0, Math.PI / 2], [-width / 2 + radius, depth / 2 - radius, Math.PI / 2, Math.PI], [-width / 2 + radius, -depth / 2 + radius, Math.PI, Math.PI * 1.5], [width / 2 - radius, -depth / 2 + radius, Math.PI * 1.5, Math.PI * 2]]; for (const [cx, cz, start, end] of corners) for (let index = 0; index <= segments; index++) { const angle = THREE.MathUtils.lerp(start, end, index / segments); points.push(new THREE.Vector3(cx + Math.cos(angle) * radius, 0, cz + Math.sin(angle) * radius)); } points.push(points[0].clone()); return points; }
const proceduralSurfaceTextureCache = new Map();
function proceduralPatternTexture(kind, colors = []) {
  const palette = [colors[0] || "#ffb7c4", colors[1] || "#d8647a", colors[2] || "#fffaf0"], key = `${kind}|${palette.join("|")}`;
  if (proceduralSurfaceTextureCache.has(key)) return proceduralSurfaceTextureCache.get(key);
  const canvas = document.createElement("canvas"), context = canvas.getContext("2d"); canvas.width = canvas.height = 64;
  context.fillStyle = palette[0]; context.fillRect(0, 0, 64, 64);
  if (kind === "cute-base") {
    context.fillStyle = palette[2];
    [[16, 16], [48, 48]].forEach(([x, y]) => { context.beginPath(); context.arc(x, y, 6, 0, Math.PI * 2); context.fill(); });
    context.fillStyle = palette[1];
    [[48, 16], [16, 48]].forEach(([x, y]) => { context.beginPath(); context.arc(x, y, 3.5, 0, Math.PI * 2); context.fill(); });
  } else {
    context.strokeStyle = palette[1]; context.globalAlpha = .48; context.lineWidth = 3; context.strokeRect(1.5, 1.5, 61, 61); context.globalAlpha = 1;
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); texture.needsUpdate = true; proceduralSurfaceTextureCache.set(key, texture); return texture;
}
function lessonMaterial(options = {}) { const color = options.color || "#ffffff", surface = setting.object.surface, opacity = clamp(options.opacity ?? 1, 0, 1), baseParameters = { color, transparent: opacity < 1, opacity, depthWrite: options.depthWrite ?? opacity >= .98 }, parameters = { ...baseParameters, roughness: options.roughness ?? surface.roughness, metalness: options.metalness ?? .015, emissive: options.emissive || new THREE.Color(color).multiplyScalar(.12), emissiveIntensity: options.emissiveIntensity ?? surface.emissiveIntensity }; if (options.clearcoat != null) { parameters.clearcoat = options.clearcoat; parameters.clearcoatRoughness = options.clearcoatRoughness ?? .2; } const result = options.unlit ? new THREE.MeshBasicMaterial({ ...baseParameters, toneMapped: false }) : options.clearcoat != null ? new THREE.MeshPhysicalMaterial(parameters) : new THREE.MeshStandardMaterial(parameters); if (options.pattern === "simple-grid" || options.pattern === "cute-base") { const pattern = proceduralPatternTexture(options.pattern, options.patternColors), repeat = Array.isArray(options.patternRepeat) ? options.patternRepeat : null; result.map = repeat ? pattern.clone() : pattern; if (repeat) { result.map.wrapS = result.map.wrapT = THREE.RepeatWrapping; result.map.repeat.set(Math.max(.01, Number(repeat[0]) || 1), Math.max(.01, Number(repeat[1]) || 1)); result.map.needsUpdate = true; } } else if (options.texture) result.map = lessonTextureRecord(options.texture).texture; return result; }
const SUPPORTED_PRIMITIVE_SHAPES = Object.freeze([
  "box", "rounded-box", "sharp-box", "sphere", "hemisphere", "cylinder", "half-cylinder", "quarter-cylinder",
  "cone", "pyramid", "prism", "frustum", "capsule", "sector", "sector-flat", "ring-sector", "ring-sector-flat",
  "tube", "torus", "torus-knot", "circle", "plane", "arrow-flat", "ring", "star", "heart", "cross", "wedge",
  "tetrahedron", "octahedron", "dodecahedron", "icosahedron", "diamond",
  "polygon", "polygon-flat", "polyhedron", "lathe", "spline-tube",
  "cube", "cuboid", "rectangle", "rectangle-flat", "triangle", "semicircle", "semi-cylinder", "quarter-circle",
  "pie", "pie-slice", "annular-sector", "arc", "disc", "donut", "extrude-polygon", "custom-polyhedron", "path-tube"
]);
const PRIMITIVE_SHAPE_ALIASES = Object.freeze({
  cube: "sharp-box", cuboid: "sharp-box", rectangle: "sharp-box", "rectangle-flat": "plane", triangle: "wedge",
  semicircle: "half-cylinder", "semi-cylinder": "half-cylinder", "quarter-circle": "quarter-cylinder",
  pie: "sector", "pie-slice": "sector", "annular-sector": "ring-sector", arc: "ring-sector", disc: "circle",
  donut: "torus", "extrude-polygon": "polygon", "custom-polyhedron": "polyhedron", "path-tube": "spline-tube"
});
function proceduralNumber(value, fallback, min, max) { const numeric = Number(value); return clamp(Number.isFinite(numeric) ? numeric : fallback, min, max); }
function proceduralInteger(value, fallback, min, max) { return Math.round(proceduralNumber(value, fallback, min, max)); }
function normalizedPrimitiveShape(value = "box") { const normalized = String(value || "box").trim().toLowerCase().replace(/[_\s]+/g, "-"); return PRIMITIVE_SHAPE_ALIASES[normalized] || normalized; }
function extrudedLessonShape(shape, curveSegments = 16) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 1, steps: 1, curveSegments, bevelEnabled: false });
  geometry.translate(0, 0, -.5);
  geometry.rotateX(-Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}
function sectorShape(startAngle, angle, innerRadius = 0) {
  const outerRadius = .5, endAngle = startAngle + angle, shape = new THREE.Shape();
  if (angle >= Math.PI * 2 - .0001) {
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    if (innerRadius > 0) { const hole = new THREE.Path(); hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true); shape.holes.push(hole); }
    return shape;
  }
  shape.moveTo(Math.cos(startAngle) * outerRadius, Math.sin(startAngle) * outerRadius);
  shape.absarc(0, 0, outerRadius, startAngle, endAngle, false);
  if (innerRadius > 0) {
    shape.lineTo(Math.cos(endAngle) * innerRadius, Math.sin(endAngle) * innerRadius);
    shape.absarc(0, 0, innerRadius, endAngle, startAngle, true);
  } else shape.lineTo(0, 0);
  shape.closePath();
  return shape;
}
function polygonShape(vertices) { const shape = new THREE.Shape(); vertices.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y)); shape.closePath(); return shape; }
function starShape(points, innerRadius = .23) { const vertices = []; for (let index = 0; index < points * 2; index++) { const radius = index % 2 ? innerRadius : .5, angle = -Math.PI / 2 + index * Math.PI / points; vertices.push([Math.cos(angle) * radius, Math.sin(angle) * radius]); } return polygonShape(vertices); }
function heartShape() { const shape = new THREE.Shape(); shape.moveTo(0, -.45); shape.bezierCurveTo(-.58, -.08, -.56, .34, -.25, .4); shape.bezierCurveTo(-.08, .44, 0, .31, 0, .2); shape.bezierCurveTo(0, .31, .08, .44, .25, .4); shape.bezierCurveTo(.56, .34, .58, -.08, 0, -.45); shape.closePath(); return shape; }
function proceduralPointList(value, dimensions, fallback, minimum, label) {
  const source = value == null ? fallback : value;
  if (!Array.isArray(source) || source.length < minimum) throw new Error(`LESSON_GEOMETRY_${label}_INVALID: ต้องมีอย่างน้อย ${minimum} จุด`);
  return source.map((point, index) => {
    if (!Array.isArray(point) || point.length < dimensions) throw new Error(`LESSON_GEOMETRY_${label}_INVALID: จุดที่ ${index + 1} ต้องมี ${dimensions} ค่า`);
    const tuple = point.slice(0, dimensions).map(Number);
    if (tuple.some(number => !Number.isFinite(number))) throw new Error(`LESSON_GEOMETRY_${label}_INVALID: จุดที่ ${index + 1} มีค่าที่ไม่ใช่ตัวเลข`);
    return tuple;
  });
}
function normalizePointAxes(points, dimensions, enabled = true) {
  if (!enabled) return points.map(point => [...point]);
  const min = Array(dimensions).fill(Infinity), max = Array(dimensions).fill(-Infinity);
  for (const point of points) for (let axis = 0; axis < dimensions; axis++) { min[axis] = Math.min(min[axis], point[axis]); max[axis] = Math.max(max[axis], point[axis]); }
  return points.map(point => point.map((value, axis) => { const span = max[axis] - min[axis]; return span > 1e-7 ? (value - (min[axis] + max[axis]) * .5) / span : 0; }));
}
function customPolygonShape(options = {}) {
  const fallback = [[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]], outerRaw = proceduralPointList(options.vertices, 2, fallback, 3, "VERTICES"), normalize = options.normalize !== false;
  const min = [Infinity, Infinity], max = [-Infinity, -Infinity];
  for (const point of outerRaw) for (let axis = 0; axis < 2; axis++) { min[axis] = Math.min(min[axis], point[axis]); max[axis] = Math.max(max[axis], point[axis]); }
  const transform = point => point.map((value, axis) => { if (!normalize) return value; const span = max[axis] - min[axis]; return span > 1e-7 ? (value - (min[axis] + max[axis]) * .5) / span : 0; });
  const shape = polygonShape(outerRaw.map(transform));
  for (const holeValue of Array.isArray(options.holes) ? options.holes : []) {
    const holePoints = proceduralPointList(holeValue, 2, null, 3, "HOLES").map(transform), hole = new THREE.Path();
    holePoints.forEach(([x, y], index) => index ? hole.lineTo(x, y) : hole.moveTo(x, y)); hole.closePath(); shape.holes.push(hole);
  }
  return shape;
}
function orientFlatGeometry(geometry, orientation = "front") {
  const value = String(orientation || "front").toLowerCase();
  if (value === "ground" || value === "xz" || value === "horizontal") geometry.rotateX(-Math.PI / 2);
  else if (value === "side" || value === "yz") geometry.rotateY(Math.PI / 2);
  return geometry;
}
function customPolyhedronGeometry(options = {}) {
  const defaultVertices = [[.5, .5, .5], [-.5, -.5, .5], [-.5, .5, -.5], [.5, -.5, -.5]], vertices = normalizePointAxes(proceduralPointList(options.vertices, 3, defaultVertices, 4, "VERTICES"), 3, options.normalize !== false);
  let indices = options.indices;
  if (!Array.isArray(indices) && Array.isArray(options.faces)) indices = options.faces.flatMap(face => { if (!Array.isArray(face) || face.length < 3) return []; const result = []; for (let index = 1; index < face.length - 1; index++) result.push(face[0], face[index], face[index + 1]); return result; });
  if (!Array.isArray(indices)) indices = [0, 2, 1, 0, 1, 3, 0, 3, 2, 1, 2, 3];
  indices = indices.map(Number);
  if (!indices.length || indices.length % 3 || indices.some(index => !Number.isInteger(index) || index < 0 || index >= vertices.length)) throw new Error("LESSON_GEOMETRY_FACES_INVALID: indices ต้องเป็นชุดสามเหลี่ยมที่อ้างถึง vertices ที่มีอยู่");
  const positions = []; for (const index of indices) positions.push(...vertices[index]);
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals(); geometry.computeBoundingSphere(); return geometry;
}
function latheGeometry(options = {}, segments = 32) {
  const fallback = [[0, -.5], [.38, -.48], [.5, -.2], [.42, .35], [.18, .5], [0, .5]], raw = proceduralPointList(options.profile, 2, fallback, 2, "PROFILE");
  const maxRadius = Math.max(...raw.map(point => Math.abs(point[0])), 1e-7), minY = Math.min(...raw.map(point => point[1])), maxY = Math.max(...raw.map(point => point[1])), height = Math.max(maxY - minY, 1e-7), normalize = options.normalize !== false;
  const points = raw.map(([radius, y]) => new THREE.Vector2(normalize ? Math.abs(radius) / maxRadius * .5 : Math.abs(radius), normalize ? (y - (minY + maxY) * .5) / height : y));
  return new THREE.LatheGeometry(points, segments, THREE.MathUtils.degToRad(proceduralNumber(options.startAngle, 0, -360, 360)), THREE.MathUtils.degToRad(proceduralNumber(options.angle, 360, 1, 360)));
}
function splineTubeGeometry(options = {}, segments = 32, tubeRatio = .16) {
  const fallback = [[-.5, 0, 0], [-.2, .18, .1], [.2, -.12, -.1], [.5, 0, 0]], points = normalizePointAxes(proceduralPointList(options.path, 3, fallback, 2, "PATH"), 3, options.normalize !== false).map(point => new THREE.Vector3(...point));
  const curve = new THREE.CatmullRomCurve3(points, Boolean(options.closed), options.curveType || "centripetal", proceduralNumber(options.tension, .5, 0, 1));
  return new THREE.TubeGeometry(curve, Math.max(8, segments), proceduralNumber(options.tube, tubeRatio, .01, .45) * .5, proceduralInteger(options.radialSegments, 8, 3, 32), Boolean(options.closed));
}
function primitiveGeometry(shape = "box", definition = {}) {
  const normalized = normalizedPrimitiveShape(shape), geometryOptions = { ...definition, ...(definition.geometry || {}) }, segments = proceduralInteger(geometryOptions.segments, 32, 6, 96), sides = proceduralInteger(geometryOptions.sides, normalized === "pyramid" ? 4 : 6, 3, 32), points = proceduralInteger(geometryOptions.points, 5, 3, 16), startAngle = THREE.MathUtils.degToRad(proceduralNumber(geometryOptions.startAngle, 0, -360, 360)), requestedAngle = proceduralNumber(geometryOptions.angle, 90, 1, 360), angle = THREE.MathUtils.degToRad(requestedAngle), innerRatio = proceduralNumber(geometryOptions.innerRadius, .56, .04, .94), tubeRatio = proceduralNumber(geometryOptions.tube, .16, .03, .45), openEnded = Boolean(geometryOptions.openEnded);
  switch (normalized) {
    case "box": case "rounded-box": return new RoundedBoxGeometry(1, 1, 1, 6, proceduralNumber(geometryOptions.radius, .14, .01, .24));
    case "sharp-box": return new THREE.BoxGeometry(1, 1, 1);
    case "sphere": return new THREE.SphereGeometry(.5, segments, Math.max(6, Math.round(segments * .66)));
    case "hemisphere": return new THREE.SphereGeometry(.5, segments, Math.max(6, Math.round(segments * .5)), 0, Math.PI * 2, 0, Math.PI / 2);
    case "cylinder": return new THREE.CylinderGeometry(.5, .5, 1, segments, 1, openEnded);
    case "half-cylinder": return extrudedLessonShape(sectorShape(startAngle, Math.PI), segments);
    case "quarter-cylinder": return extrudedLessonShape(sectorShape(startAngle, Math.PI / 2), segments);
    case "cone": return new THREE.ConeGeometry(.5, 1, segments, 1, openEnded);
    case "pyramid": return new THREE.ConeGeometry(.5, 1, sides, 1, openEnded);
    case "prism": return new THREE.CylinderGeometry(.5, .5, 1, sides, 1, openEnded);
    case "frustum": return new THREE.CylinderGeometry(.5 * proceduralNumber(geometryOptions.topRadius, .62, 0, 1), .5 * proceduralNumber(geometryOptions.bottomRadius, 1, .01, 1), 1, sides, 1, openEnded);
    case "capsule": return new THREE.CapsuleGeometry(.3, .4, Math.max(4, Math.round(segments / 4)), Math.max(8, Math.round(segments / 2)));
    case "sector": return extrudedLessonShape(sectorShape(startAngle, angle), segments);
    case "sector-flat": return orientFlatGeometry(new THREE.ShapeGeometry(sectorShape(startAngle, angle), segments), geometryOptions.orientation);
    case "ring-sector": return extrudedLessonShape(sectorShape(startAngle, angle, innerRatio * .5), segments);
    case "ring-sector-flat": return orientFlatGeometry(new THREE.ShapeGeometry(sectorShape(startAngle, angle, innerRatio * .5), segments), geometryOptions.orientation);
    case "tube": return extrudedLessonShape(sectorShape(0, Math.PI * 2, innerRatio * .5), segments);
    case "torus": return new THREE.TorusGeometry(.5 - tubeRatio * .5, tubeRatio * .5, Math.max(6, Math.round(segments / 3)), segments);
    case "torus-knot": return new THREE.TorusKnotGeometry(.36, tubeRatio * .25, Math.max(48, segments * 2), Math.max(6, Math.round(segments / 3)), proceduralInteger(geometryOptions.p, 2, 1, 8), proceduralInteger(geometryOptions.q, 3, 1, 12));
    case "circle": return orientFlatGeometry(new THREE.CircleGeometry(.5, segments), geometryOptions.orientation);
    case "plane": return orientFlatGeometry(new THREE.PlaneGeometry(1, 1), geometryOptions.orientation);
    case "arrow-flat": return orientFlatGeometry(new THREE.ShapeGeometry(polygonShape([[-.12, -.6], [.12, -.6], [.12, .18], [.34, .18], [0, .64], [-.34, .18], [-.12, .18]]), segments), geometryOptions.orientation);
    case "ring": return orientFlatGeometry(new THREE.RingGeometry(innerRatio * .5, .5, segments), geometryOptions.orientation);
    case "star": return extrudedLessonShape(starShape(points, proceduralNumber(geometryOptions.innerRadius, .46, .12, .9) * .5), segments);
    case "heart": return extrudedLessonShape(heartShape(), segments);
    case "cross": return extrudedLessonShape(polygonShape([[-.16, -.5], [.16, -.5], [.16, -.16], [.5, -.16], [.5, .16], [.16, .16], [.16, .5], [-.16, .5], [-.16, .16], [-.5, .16], [-.5, -.16], [-.16, -.16]]), segments);
    case "wedge": return extrudedLessonShape(polygonShape([[-.5, -.5], [.5, -.5], [-.5, .5]]), segments);
    case "tetrahedron": return new THREE.TetrahedronGeometry(.5);
    case "octahedron": case "diamond": return new THREE.OctahedronGeometry(.5);
    case "dodecahedron": return new THREE.DodecahedronGeometry(.5);
    case "icosahedron": return new THREE.IcosahedronGeometry(.5);
    case "polygon": return extrudedLessonShape(customPolygonShape(geometryOptions), segments);
    case "polygon-flat": return orientFlatGeometry(new THREE.ShapeGeometry(customPolygonShape(geometryOptions), segments), geometryOptions.orientation);
    case "polyhedron": return customPolyhedronGeometry(geometryOptions);
    case "lathe": return latheGeometry(geometryOptions, segments);
    case "spline-tube": return splineTubeGeometry(geometryOptions, segments, tubeRatio);
    default: throw new Error(`LESSON_PRIMITIVE_UNSUPPORTED: addPrimitive ไม่รองรับรูปทรง ${shape}`);
  }
}
function createPrimitivePart(definition = {}) { const shape = normalizedPrimitiveShape(definition.shape || "box"), materialDefinition = definition.material || {}, geometry = primitiveGeometry(shape, definition), mesh = new THREE.Mesh(geometry, lessonMaterial({ ...materialDefinition, color: definition.color || materialDefinition.color })), size = definition.size || [1, 1, 1], scaleValues = [size[0] ?? 1, size[1] ?? size[0] ?? 1, size[2] ?? size[0] ?? 1], rotation = definition.rotation || [0, 0, 0], opaqueSolid = !["plane", "arrow-flat", "circle", "ring", "sector-flat", "ring-sector-flat", "polygon-flat"].includes(shape) && (materialDefinition.opacity ?? 1) >= .98 && materialDefinition.depthWrite !== false; if (materialDefinition.pattern && mesh.material.map) { const explicitRepeat = Array.isArray(materialDefinition.patternRepeat) ? materialDefinition.patternRepeat : null; mesh.material.map = mesh.material.map.clone(); if (explicitRepeat) mesh.material.map.repeat.set(Math.max(.01, Number(explicitRepeat[0]) || 1), Math.max(.01, Number(explicitRepeat[1]) || 1)); else { const cell = Math.max(.25, Number(materialDefinition.patternCell) || (materialDefinition.pattern === "cute-base" ? 1.2 : .8)), patternSize = materialDefinition.patternSize || [size[0], size[2] ?? size[1]], width = Math.max(cell, Math.abs(Number(patternSize[0]) || 1)), depth = Math.max(cell, Math.abs(Number(patternSize[1]) || 1)); mesh.material.map.repeat.set(width / cell, depth / cell); } mesh.material.map.needsUpdate = true; } mesh.position.fromArray(definition.position || [0, 0, 0]); mesh.rotation.set(...rotation.map(THREE.MathUtils.degToRad)); mesh.scale.set(...scaleValues); mesh.castShadow = Boolean(shadowSetting.lessonCast && opaqueSolid); mesh.receiveShadow = shadowSetting.lessonReceive !== false; return mesh; }
function prepareLessonVisual(root, interactionRoot) { root.traverse(child => { if (!child.userData.isLessonDecoration) child.userData.interactionRoot = interactionRoot; }); forEachObjectMaterial(root, value => rememberHighlightSurface(value)); }
function setInteractionHitArea(root, size = null, offset = [0, 0, 0]) { const previous = root.userData.interactionHitArea; if (previous) { root.remove(previous); previous.geometry?.dispose?.(); previous.material?.dispose?.(); root.userData.interactionHitArea = null; } if (!Array.isArray(size) || size.length < 3 || size.some(value => Number(value) <= 0)) return; const hitArea = new THREE.Mesh(new THREE.BoxGeometry(...size.map(Number)), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })); hitArea.name = `${root.name || "lesson-object"}-hit-area`; hitArea.position.fromArray(offset); Object.assign(hitArea.userData, { isLessonDecoration: true, interactionRoot: root }); root.add(hitArea); root.userData.interactionHitArea = hitArea; }
function configureLessonObject(root, visual, options = {}) { const position = options.position || [0, 0, 0], rotation = options.rotation || [0, 0, 0], scale = options.scale ?? 1, scaleValues = Array.isArray(scale) ? scale : [scale, scale, scale]; root.name = options.name || root.name || "lesson-object"; root.position.fromArray(position); root.rotation.set(...rotation.map(THREE.MathUtils.degToRad)); visual.scale.multiply(new THREE.Vector3(...scaleValues)); Object.assign(root.userData, { visualRoot: visual, draggable: Boolean(options.draggable), clickable: Boolean(options.clickable || options.onClick), tapToClick: Boolean(options.tapToClick), tapClickTolerance: Number.isFinite(options.tapClickTolerance) ? Math.max(1, options.tapClickTolerance) : 7, selectionFeedback: options.selectionFeedback !== false, commitFeedback: options.commitFeedback !== false, dragAxis: options.dragAxis || setting.interaction.defaultDragAxis, dragLiftHeight: options.dragLiftHeight, dragFromCenter: Boolean(options.dragFromCenter), hoverMessage: options.hoverMessage || "", guideTarget: options.guideTarget || null, onHover: typeof options.onHover === "function" ? options.onHover : null, onDrag: options.onDrag || null, onDrop: options.onDrop || null, onClick: options.onClick || null, objectiveAction: options.objectiveAction, groundY: position[1], spawnFloatHeight: Math.max(0, Number(options.spawnFloatHeight) || 0), spawnScaleOvershoot: options.spawnScaleOvershoot !== false, spawnDuration: options.spawnDuration == null ? null : Math.max(1, Number(options.spawnDuration) || 1), debugTargetSize: options.targetSize, debugAreaHidden: options.debugAreaHidden === true }); prepareLessonVisual(visual, root); setInteractionHitArea(root, options.hitArea, options.hitAreaOffset); lessonGroup.add(root); queueSpawn(root, options.spawn !== false); const handle = makeHandle(root); syncInteractive(root); return handle; }
function addPrimitive(options = {}) { const root = new THREE.Group(), visual = new THREE.Group(), mesh = createPrimitivePart(options); visual.add(mesh); root.add(visual); return configureLessonObject(root, visual, options); }
function addGroup(options = {}) { const root = new THREE.Group(), visual = new THREE.Group(); for (const definition of options.parts || options.children || []) visual.add(createPrimitivePart(definition)); root.add(visual); return configureLessonObject(root, visual, options); }
function libraryAsset(id) { const definition = lessonAssetLibrary.assets[id]; if (!definition) throw new Error(`LESSON_ASSET_NOT_FOUND: ไม่พบ Asset ID ${id}`); return definition; }
const libraryModelTemplates = new Map(), libraryPreparedModelTemplates = new Map();
function makeTextCanvas(text, options = {}) { const canvas = document.createElement("canvas"), width = options.canvasWidth || 768, height = options.canvasHeight || 320; canvas.width = width; canvas.height = height; const context = canvas.getContext("2d"), fontSize = options.fontSize || 190; context.clearRect(0, 0, width, height); if (options.background) { context.fillStyle = options.background; context.beginPath(); context.roundRect(16, 16, width - 32, height - 32, options.radius || 64); context.fill(); } context.font = `${options.fontWeight || 900} ${fontSize}px ${options.fontFamily || "system-ui"}`; context.fillStyle = options.color || "#3a315f"; context.textAlign = "center"; context.textBaseline = "middle"; context.fillText(String(text), width / 2, height / 2 + (options.baselineOffset || 0)); const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture; }
function addText3D(options = {}) { const root = new THREE.Group(), visual = new THREE.Group(), texture = makeTextCanvas(options.text ?? "", options), sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: options.depthTest !== false, toneMapped: false })), size = options.size || [3.6, 1.5]; sprite.scale.set(size[0], size[1], 1); sprite.userData.textTexture = texture; visual.add(sprite); root.add(visual); return configureLessonObject(root, visual, options); }
const sevenSegmentMasks = Object.freeze([
  [1, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 0, 0], [1, 1, 0, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1], [0, 1, 1, 0, 0, 1, 1],
  [1, 0, 1, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1, 1], [1, 1, 1, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 0, 1, 1]
]);
function configureWorldDisplay(root, visual, options = {}) {
  const compact = matchMedia("(max-width: 760px), (orientation: portrait)").matches || isPortraitViewport(), position = compact && Array.isArray(options.compactPosition) ? options.compactPosition : (options.position || [0, .2, 0]), rotation = options.rotation || [0, 0, 0], requestedScale = compact && options.compactScale != null ? options.compactScale : (options.scale ?? 1), mobileMultiplier = compact && options.compactScale == null ? (options.mobileScale ?? 1) : 1, scale = Array.isArray(requestedScale) ? requestedScale.map(value => value * mobileMultiplier) : requestedScale * mobileMultiplier, scaleValues = Array.isArray(scale) ? scale : [scale, scale, scale];
  root.name = options.name || "world-display"; root.position.fromArray(position); root.rotation.set(...rotation.map(THREE.MathUtils.degToRad)); visual.scale.set(...scaleValues); Object.assign(root.userData, { visualRoot: visual, draggable: false, clickable: false, groundY: position[1], worldDisplay: true }); root.add(visual); lessonGroup.add(root); queueSpawn(root); return makeHandle(root);
}
function addWorldCounter(options = {}) {
  const config = setting.ui.worldCounter || {};
  const digits = clamp(Math.round(options.digits ?? 2), 1, config.maxDigits ?? 6);
  const decimalPlaces = clamp(Math.round(options.decimalPlaces ?? 0), 0, 3);
  const spacing = options.digitSpacing ?? config.digitSpacing ?? .76;
  const pointSpacing = decimalPlaces ? spacing * .48 : 0;
  const digitWidth = config.digitWidth ?? .58, digitDepth = config.digitDepth ?? .82;
  const paddingX = config.paddingX ?? .42, paddingZ = config.paddingZ ?? .28;
  // Build the longer plate at its final dimensions; scaling would stretch its rounded corners.
  const slotCount = digits + decimalPlaces;
  const width = Math.max(1.1, slotCount * spacing + pointSpacing + paddingX * 2);
  const depth = digitDepth + paddingZ * 2, baseHeight = config.baseHeight ?? .16;
  const faceHeight = config.faceHeight ?? .08, root = new THREE.Group(), visual = new THREE.Group(), segments = [];
  const base = new THREE.Mesh(new RoundedBoxGeometry(width, baseHeight, depth, 6, Math.min(.16, depth * .12)), lessonMaterial({ color: options.edgeColor || config.edgeColor || "#527a48", roughness: config.roughness ?? .62, clearcoat: config.clearcoat ?? .22 })), middle = new THREE.Mesh(new RoundedBoxGeometry(width * .95, faceHeight, depth * .9, 6, Math.min(.14, depth * .1)), lessonMaterial({ color: options.baseColor || config.baseColor || "#6b9b55", roughness: config.roughness ?? .62, clearcoat: config.clearcoat ?? .22 })), face = new THREE.Mesh(new RoundedBoxGeometry(width * .86, faceHeight, depth * .78, 6, Math.min(.12, depth * .09)), lessonMaterial({ color: options.faceColor || config.faceColor || "#f3f1cf", roughness: .72 }));
  base.position.y = baseHeight / 2; middle.position.y = baseHeight + faceHeight / 2; face.position.y = baseHeight + faceHeight * 1.5;
  for (const part of [base, middle, face]) { part.castShadow = Boolean(shadowSetting.lessonCast); part.receiveShadow = shadowSetting.lessonReceive !== false; }
  visual.add(base, middle, face);
  const segmentColor = options.digitColor || config.digitColor || "#315d35", segmentY = baseHeight + faceHeight * 2 + (config.segmentHeight ?? .08) * .52, horizontalLength = digitWidth * .72, verticalLength = digitDepth * .39, segmentThickness = config.segmentThickness ?? .095, segmentHeight = config.segmentHeight ?? .08;
  for (let digitIndex = 0; digitIndex < slotCount; digitIndex++) {
    const digit = new THREE.Group(), x = (digitIndex - (slotCount - 1) / 2) * spacing + (decimalPlaces && digitIndex >= digits ? pointSpacing / 2 : decimalPlaces ? -pointSpacing / 2 : 0), horizontal = z => createPrimitivePart({ shape: "box", position: [0, segmentY, z], size: [horizontalLength, segmentHeight, segmentThickness], color: segmentColor, material: { roughness: .4, emissive: options.digitEmissive || config.digitEmissive || "#173a1f", emissiveIntensity: config.digitEmissiveIntensity ?? .16 } }), vertical = (offsetX, z) => createPrimitivePart({ shape: "box", position: [offsetX, segmentY, z], size: [segmentThickness, segmentHeight, verticalLength], color: segmentColor, material: { roughness: .4, emissive: options.digitEmissive || config.digitEmissive || "#173a1f", emissiveIntensity: config.digitEmissiveIntensity ?? .16 } });
    digit.position.x = x; const digitSegments = [horizontal(-digitDepth * .45), vertical(digitWidth * .4, -digitDepth * .23), vertical(digitWidth * .4, digitDepth * .23), horizontal(digitDepth * .45), vertical(-digitWidth * .4, digitDepth * .23), vertical(-digitWidth * .4, -digitDepth * .23), horizontal(0)]; digit.add(...digitSegments); visual.add(digit); segments.push({ group: digit, parts: digitSegments });
  }
  let decimalPoint = null;
  if (decimalPlaces) {
    decimalPoint = createPrimitivePart({ shape: "sphere", size: [.16, segmentHeight * 1.2, .16],
      position: [0, segmentY, digitDepth * .4], color: segmentColor,
      material: { roughness: .4, emissive: options.digitEmissive || config.digitEmissive || "#173a1f", emissiveIntensity: config.digitEmissiveIntensity ?? .16 } });
    visual.add(decimalPoint);
  }
  const baseHandle = configureWorldDisplay(root, visual, { mobileScale: config.mobileScale ?? 1, ...options, name: options.name || "world-counter" }); let value = 0;
  const renderValue = next => {
    const upper = decimalPlaces ? 10 ** digits - 10 ** -decimalPlaces : 10 ** digits - 1;
    value = clamp(Math.round((Number(next) || 0) * 10 ** decimalPlaces) / 10 ** decimalPlaces, 0, upper);
    const fixed = decimalPlaces ? value.toFixed(decimalPlaces) : String(value);
    const [integer, fraction = ""] = fixed.split(".");
    const text = `${options.leadingZero ? integer.padStart(digits, "0") : integer}${fraction}`;
    const firstVisible = slotCount - text.length;
    segments.forEach((digit, index) => {
      const visible = index >= firstVisible;
      digit.group.visible = visible;
      if (!visible) return;
      const numeric = Number(text[index - firstVisible]);
      digit.parts.forEach((part, partIndex) => { part.visible = Boolean(sevenSegmentMasks[numeric]?.[partIndex]); });
    });
    const offset = -firstVisible * spacing / 2;
    segments.forEach(digit => { digit.group.position.x = digit.group.userData.baseX + offset; });
    if (decimalPoint) {
      const before = segments[slotCount - decimalPlaces - 1].group.position.x;
      const after = segments[slotCount - decimalPlaces].group.position.x;
      decimalPoint.position.x = (before + after) / 2;
    }
    markSceneActive();
    return value;
  };
  segments.forEach(digit => { digit.group.userData.baseX = digit.group.position.x; });
  const handle = Object.freeze({ ...baseHandle, setValue: renderValue, getValue: () => value, digits }); renderValue(options.value ?? 0); root.userData.lessonHandle = handle; return handle;
}
function wrapWorldGuiText(context, text, maxWidth, maxLines) {
  const lines = [];
  let truncated = false;
  const paragraphs = String(text ?? "").split(/\r?\n/);
  for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
    const characters = Array.from(paragraphs[paragraphIndex]);
    let line = "";
    for (let characterIndex = 0; characterIndex < characters.length; characterIndex++) {
      const character = characters[characterIndex];
      const candidate = line + character;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line.trim());
        line = character.trimStart();
        if (lines.length >= maxLines) {
          truncated = characterIndex < characters.length - 1 || paragraphIndex < paragraphs.length - 1;
          break;
        }
      } else {
        line = candidate;
      }
    }
    if (lines.length >= maxLines) break;
    if (line || !characters.length) lines.push(line.trim());
    if (lines.length >= maxLines && paragraphIndex < paragraphs.length - 1) truncated = true;
  }
  if (lines.length > maxLines) {
    lines.length = maxLines;
    truncated = true;
  }
  return { lines, truncated };
}

function worldGuiTargetPosition(target) {
  if (Array.isArray(target) && target.length >= 3) return new THREE.Vector3(...target.map(Number));
  const object = target?.object3D || target;
  if (!object?.isObject3D) return null;
  object.updateWorldMatrix?.(true, false);
  return object.getWorldPosition(new THREE.Vector3());
}

function positionWorldGuiFromTarget(position, target, distance, direction = null) {
  const requestedPosition = Array.isArray(position) ? [...position] : [0, .2, 0];
  const targetPosition = worldGuiTargetPosition(target);
  const requestedDistance = Number(distance);
  if (!targetPosition || !Number.isFinite(requestedDistance)) return requestedPosition;

  const radial = Array.isArray(direction)
    ? new THREE.Vector3(Number(direction[0]) || 0, 0, Number(direction.length >= 3 ? direction[2] : direction[1]) || 0)
    : new THREE.Vector3(Number(requestedPosition[0]) - targetPosition.x, 0, Number(requestedPosition[2]) - targetPosition.z);
  if (radial.lengthSq() < .000001) radial.set(0, 0, 1);
  radial.normalize().multiplyScalar(Math.max(0, requestedDistance));
  return [targetPosition.x + radial.x, Number(requestedPosition[1]) || 0, targetPosition.z + radial.z];
}

// รายละเอียดการวาดเป็นหน้าที่ของ Runtime ไม่ควรทำให้ไฟล์ Setting สำหรับผู้ใช้รก
// ค่าใน setting.ui.worldGui จะ override เฉพาะตัวเลือกที่ต้องปรับบ่อยเท่านั้น
const worldGuiRenderDefaults = Object.freeze({
  borderOpacity: 1,
  accentEnabled: false,
  accentColor: "#ffffff",
  accentOpacity: .46,
  panelInset: 24,
  panelRadius: 999,
  borderWidth: 14,
  borderShadowColor: "rgba(13,28,34,.58)",
  borderShadowBlur: 5,
  borderShadowOffsetX: 0,
  borderShadowOffsetY: 1,
  canvasHeight: 512,
  minCanvasWidth: 768,
  maxCanvasWidth: 2048,
  minCanvasHeight: 256,
  maxCanvasHeight: 1024,
  referenceCanvasHeight: 320,
  minFontSize: 84,
  fontWeight: 800,
  fontFamily: '"Noto Sans Thai", "Leelawadee UI", Tahoma, system-ui, sans-serif',
  lineHeight: 1.22,
  maxLines: 2,
  textPadding: 52,
  textPaddingY: 48,
  strokeColor: "rgba(25,42,48,.9)",
  strokeWidth: 3.8,
  shadowColor: "rgba(13,28,34,.72)",
  shadowBlur: 6,
  shadowOffsetX: 0,
  shadowOffsetY: 2,
  lift: .04,
  surfaceTilt: 0,
  mobileScale: 1.48
});

function worldGuiSettingPosition(value) {
  if (Array.isArray(value)) return value;
  const numberOr = (candidate, fallback) => Number.isFinite(Number(candidate)) ? Number(candidate) : fallback;
  return [
    numberOr(value?.x, 0),
    numberOr(value?.y, .18),
    numberOr(value?.z, 5.85)
  ];
}

function addWorldGui(options = {}) {
  const worldGuiSetting = setting.ui.worldGui || {};
  const config = { ...worldGuiRenderDefaults, ...worldGuiSetting, ...(worldGuiSetting.normal || {}) };
  const actionable = Boolean(options.insight || options.onClick);
  const actionStyle = {
    textColor: "#ffffff", fontSize: 150,
    backgroundColor: "#000000", backgroundOpacity: .35, hoverBackgroundColor: "#000000", hoverBackgroundOpacity: .5,
    borderColor: "#ffffff", hoverBorderColor: "#ffffff", borderWidth: 18,
    iconSize: 96, iconInset: 18, iconBackground: "#000000", hoverIconBackground: "#000000", iconColor: "#ffffff",
    iconBorderColor: "#ffffff", iconBorderWidth: 5, iconText: "i",
    ...(config.actionable || {})
  };
  const size = options.size || config.size || [3.6, .95];
  const width = Math.max(.8, Number(size[0]) || 3.4);
  const height = Math.max(.5, Number(size[1]) || .9);
  const aspect = width / height;
  const minCanvasWidth = config.minCanvasWidth ?? 768;
  const maxCanvasWidth = config.maxCanvasWidth ?? 2048;
  const minCanvasHeight = config.minCanvasHeight ?? 256;
  const maxCanvasHeight = config.maxCanvasHeight ?? 1024;
  const preferredPixelsPerUnit = options.canvasWidth != null
    ? Number(options.canvasWidth) / width
    : Number(options.canvasHeight ?? config.canvasHeight ?? 512) / height;
  const minimumPixelsPerUnit = Math.max(minCanvasWidth / width, minCanvasHeight / height);
  const maximumPixelsPerUnit = Math.min(maxCanvasWidth / width, maxCanvasHeight / height);
  const pixelsPerUnit = maximumPixelsPerUnit >= minimumPixelsPerUnit
    ? clamp(preferredPixelsPerUnit, minimumPixelsPerUnit, maximumPixelsPerUnit)
    : maximumPixelsPerUnit;
  const canvasWidth = Math.max(1, Math.round(width * pixelsPerUnit));
  const canvasHeight = Math.max(1, Math.round(canvasWidth / aspect));
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  // worldGui is a real world-space surface. It must keep its authored position
  // and rotation instead of billboarding toward the camera.
  const label = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    fog: true
  }));
  const surfaceTilt = Number(options.surfaceTilt ?? config.surfaceTilt ?? 0);
  label.rotation.x = THREE.MathUtils.degToRad(-90 + surfaceTilt);
  label.position.y = options.lift ?? config.lift ?? .08;
  label.userData.worldUiTexture = texture;
  label.raycast = () => { };

  const root = new THREE.Group();
  const visual = new THREE.Group();
  visual.add(label);
  const displayOptions = {
    ...options,
    position: options.position || worldGuiSettingPosition(config.position),
    // ใช้ตำแหน่งเดียวกันทุกขนาดจอ ป้องกันแก้ Desktop แล้ว Mobile ขยับคนละจุด
    compactPosition: options.compactPosition || null
  };
  const targetDistance = options.distance ?? options.distanceFromTarget;
  if (options.target != null && targetDistance != null) {
    displayOptions.position = positionWorldGuiFromTarget(displayOptions.position, options.target, targetDistance, options.directionFromTarget);
    if (Array.isArray(options.compactPosition)) {
      displayOptions.compactPosition = positionWorldGuiFromTarget(options.compactPosition, options.target, targetDistance, options.directionFromTarget);
    }
  }
  const baseHandle = configureWorldDisplay(root, visual, {
    mobileScale: config.mobileScale ?? 1,
    ...displayOptions,
    name: options.name || "world-gui"
  });
  let text = "", hoveredAction = false, handle = null;

  const renderText = next => {
    text = String(next ?? "");
    const context = canvas.getContext("2d");
    const referenceHeight = config.referenceCanvasHeight ?? 320;
    const fontScale = canvasHeight / referenceHeight;
    const requestedFontSize = (options.fontSize ?? (actionable ? actionStyle.fontSize : config.fontSize) ?? 56) * fontScale;
    const minimumFontSize = (options.minFontSize ?? config.minFontSize ?? 82) * fontScale;
    const fontWeight = options.fontWeight ?? config.fontWeight ?? 700;
    const fontFamily = options.fontFamily || config.fontFamily || '"Noto Sans Thai", "Leelawadee UI", Tahoma, system-ui, sans-serif';
    const paddingX = (options.textPadding ?? config.textPadding ?? 56) * fontScale;
    const paddingY = (options.textPaddingY ?? config.textPaddingY ?? 46) * fontScale;
    const maxLines = clamp(Math.round(options.maxLines ?? config.maxLines ?? 2), 1, 5);
    const lineHeightRatio = options.lineHeight ?? config.lineHeight ?? 1.22;
    const panelInset = (options.panelInset ?? config.panelInset ?? 18) * fontScale;
    const panelRadius = (options.panelRadius ?? config.panelRadius ?? 42) * fontScale;
    const normalBorderWidth = options.borderWidth ?? config.borderWidth ?? 2;
    const borderWidth = (actionable ? Math.max(normalBorderWidth, options.actionBorderWidth ?? actionStyle.borderWidth) : normalBorderWidth) * fontScale;
    const actionIconSize = actionable ? Math.min(canvasHeight * .5, (options.actionIconSize ?? actionStyle.iconSize) * fontScale) : 0;
    const actionReserve = actionable ? actionIconSize + paddingX * .62 : 0;
    const availableWidth = Math.max(1, canvasWidth - paddingX * 2 - actionReserve);
    const availableHeight = Math.max(1, canvasHeight - paddingY * 2);
    const textCenterX = canvasWidth / 2 - actionReserve * .22;

    context.clearRect(0, 0, canvasWidth, canvasHeight);
    const baseBackgroundOpacity = options.backgroundOpacity ?? config.backgroundOpacity ?? config.faceOpacity ?? 0;
    const backgroundOpacity = clamp(actionable
      ? (hoveredAction ? (options.actionHoverBackgroundOpacity ?? actionStyle.hoverBackgroundOpacity) : (options.actionBackgroundOpacity ?? actionStyle.backgroundOpacity))
      : baseBackgroundOpacity, 0, 1);
    const borderOpacity = clamp(actionable ? 1 : (options.borderOpacity ?? config.borderOpacity ?? config.baseOpacity ?? .72), 0, 1);
    context.save();
    context.beginPath();
    context.roundRect(panelInset, panelInset, canvasWidth - panelInset * 2, canvasHeight - panelInset * 2, panelRadius);
    if (backgroundOpacity > 0) {
      context.globalAlpha = backgroundOpacity;
      context.fillStyle = actionable
        ? (hoveredAction
          ? (options.actionHoverBackgroundColor || actionStyle.hoverBackgroundColor)
          : (options.actionBackgroundColor || actionStyle.backgroundColor))
        : (options.backgroundColor || config.backgroundColor || config.faceColor || "#ffffff");
      context.fill();
    }
    if (borderOpacity > 0 && borderWidth > 0) {
      context.globalAlpha = borderOpacity;
      context.strokeStyle = actionable
        ? (hoveredAction ? (options.actionHoverBorderColor || actionStyle.hoverBorderColor) : (options.actionBorderColor || actionStyle.borderColor))
        : (options.borderColor || config.borderColor || config.baseColor || "#ffffff");
      context.lineWidth = borderWidth;
      context.shadowColor = options.borderShadowColor || config.borderShadowColor || "rgba(13,28,34,.58)";
      context.shadowBlur = (options.borderShadowBlur ?? config.borderShadowBlur ?? 5) * fontScale;
      context.shadowOffsetX = (options.borderShadowOffsetX ?? config.borderShadowOffsetX ?? 0) * fontScale;
      context.shadowOffsetY = (options.borderShadowOffsetY ?? config.borderShadowOffsetY ?? 1) * fontScale;
      context.stroke();
    }
    context.restore();

    if (options.accentEnabled ?? config.accentEnabled) {
      context.save();
      context.globalAlpha = config.accentOpacity ?? .46;
      context.fillStyle = options.accentColor || config.accentColor || "#6f8b78";
      context.beginPath();
      context.roundRect(panelInset * 1.55, canvasHeight * .28, Math.max(5 * fontScale, canvasWidth * .006), canvasHeight * .44, 999);
      context.fill();
      context.restore();
    }

    let fontSize = requestedFontSize;
    let layout = { lines: [text], truncated: false };
    while (fontSize >= minimumFontSize) {
      context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      layout = wrapWorldGuiText(context, text, availableWidth, maxLines);
      const lineHeight = fontSize * lineHeightRatio;
      const textHeight = fontSize + Math.max(0, layout.lines.length - 1) * lineHeight;
      if (!layout.truncated && textHeight <= availableHeight) break;
      fontSize -= 4 * fontScale;
    }

    context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    if (layout.truncated && layout.lines.length) {
      let last = layout.lines.at(-1);
      while (last && context.measureText(`${last}…`).width > availableWidth) last = last.slice(0, -1);
      layout.lines[layout.lines.length - 1] = `${last.trimEnd()}…`;
    }
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    const lineHeight = fontSize * lineHeightRatio;
    const startY = canvasHeight / 2 - (layout.lines.length - 1) * lineHeight / 2;
    const textStrokeWidth = (options.strokeWidth ?? options.textStrokeWidth ?? config.strokeWidth ?? config.textStrokeWidth ?? 2) * fontScale;
    context.strokeStyle = options.strokeColor || options.textStrokeColor || config.strokeColor || config.textStrokeColor || "rgba(255,255,255,.72)";
    context.lineWidth = textStrokeWidth;
    context.fillStyle = actionable
      ? (options.actionTextColor || options.color || actionStyle.textColor)
      : (options.color || options.fontColor || options.textColor || config.fontColor || config.textColor || "#294238");
    context.shadowColor = options.shadowColor || options.textShadowColor || config.shadowColor || config.textShadowColor || "rgba(255,255,255,.62)";
    context.shadowBlur = (options.shadowBlur ?? options.textShadowBlur ?? config.shadowBlur ?? config.textShadowBlur ?? 2) * fontScale;
    context.shadowOffsetX = (options.shadowOffsetX ?? options.textShadowOffsetX ?? config.shadowOffsetX ?? config.textShadowOffsetX ?? 0) * fontScale;
    context.shadowOffsetY = (options.shadowOffsetY ?? options.textShadowOffsetY ?? config.shadowOffsetY ?? config.textShadowOffsetY ?? 1) * fontScale;
    layout.lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      if (textStrokeWidth > 0) context.strokeText(line, textCenterX, y);
      context.fillText(line, textCenterX, y);
    });

    if (actionable) {
      const iconInset = (options.actionIconInset ?? actionStyle.iconInset) * fontScale;
      const iconX = canvasWidth - panelInset - actionIconSize * .72 - iconInset;
      const iconY = canvasHeight / 2;
      context.save();
      context.beginPath();
      context.arc(iconX, iconY, actionIconSize * .46, 0, Math.PI * 2);
      context.fillStyle = hoveredAction ? (options.actionHoverIconBackground || actionStyle.hoverIconBackground) : (options.actionIconBackground || actionStyle.iconBackground);
      context.fill();
      context.lineWidth = Math.max(3, (options.actionIconBorderWidth ?? actionStyle.iconBorderWidth) * fontScale);
      context.strokeStyle = options.actionIconBorderColor || actionStyle.iconBorderColor;
      context.stroke();
      context.fillStyle = options.actionIconColor || actionStyle.iconColor;
      context.font = `900 ${actionIconSize * .62}px ${fontFamily}`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.shadowColor = "transparent";
      context.fillText(options.actionIconText || actionStyle.iconText, iconX, iconY + actionIconSize * .025);
      context.restore();
    }

    texture.needsUpdate = true;
    markSceneActive();
    return text;
  };

  const activate = sourceEvent => {
    const payload = { handle, object: root, sourceEvent };
    const definition = typeof options.insight === "function" ? options.insight(payload) : options.insight;
    if (definition) guiService.insight.show(typeof definition === "string" ? { message: definition } : definition);
    options.onClick?.(payload);
  };
  if (actionable) {
    Object.assign(root.userData, {
      clickable: true,
      selectionFeedback: false,
      interactionStyle: "world-gui",
      objectiveAction: options.objectiveAction ?? false,
      hoverMessage: options.hoverMessage || "กดเพื่อดูรายละเอียด",
      onClick: activate,
      onHover: value => {
        hoveredAction = Boolean(value);
        elements.canvas.classList.toggle("is-hovering-world-gui", hoveredAction);
        renderText(text);
        options.onHover?.({ hovered: hoveredAction, handle, object: root });
      }
    });
    setInteractionHitArea(root, options.hitArea || [width, .34, height], options.hitAreaOffset || [0, .12, 0]);
    syncInteractive(root);
  }
  handle = Object.freeze({ ...baseHandle, setText: renderText, getText: () => text });
  renderText(options.text ?? "");
  root.userData.lessonHandle = handle;
  return handle;
}
function addWorldLabel(options = {}) {
  return addWorldGui({
    name: options.name || "world-label",
    size: [3.4, .72],
    fontSize: 112,
    minFontSize: 84,
    maxLines: 2,
    fontWeight: 700,
    color: "#ffffff",
    backgroundOpacity: 0,
    borderOpacity: 0,
    borderWidth: 0,
    accentEnabled: false,
    strokeWidth: 0,
    shadowColor: "rgba(0,0,0,.72)",
    shadowBlur: 4,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    ...options
  });
}
async function loadCustomModel(path, options = {}) { if (!path) throw new Error("LESSON_ASSET_PATH_REQUIRED: world.addModel ต้องมี path"); const base = options.baseUrl || runtime.lessonUrl || import.meta.url, url = runtimeAssetUrl(path, base); if (new URL(url).origin !== location.origin) throw new Error("LESSON_ASSET_ORIGIN_ERROR: รองรับเฉพาะโมเดลที่อยู่ origin เดียวกัน"); return new Promise((resolve, reject) => { const finish = object => resolve(object), fail = error => reject(new Error(`LESSON_ASSET_LOAD_FAILED: โหลดโมเดล ${path} ไม่สำเร็จ (${error?.message || "unknown"})`)), extension = new URL(url).pathname.split(".").pop().toLowerCase(); if (extension === "glb" || extension === "gltf") import("three/addons/loaders/GLTFLoader.js").then(({ GLTFLoader }) => new GLTFLoader().load(url, gltf => finish(gltf.scene), undefined, fail)).catch(fail); else if (extension === "fbx") import("three/addons/loaders/FBXLoader.js").then(({ FBXLoader }) => new FBXLoader().load(url, finish, undefined, fail)).catch(fail); else fail(new Error("รองรับเฉพาะ .glb, .gltf และ .fbx")); }); }
function enableMaterialWash(value) {
  if (!value || value._lessonWashEnabled) return value;
  value._lessonWashEnabled = true;
  const previousCompile = value.onBeforeCompile, previousCacheKey = value.customProgramCacheKey.bind(value);
  const state = { color: new THREE.Color("#ffffff"), amount: 0, shader: null };
  value.userData.lessonWash = state;
  value.onBeforeCompile = (shader, activeRenderer) => {
    previousCompile.call(value, shader, activeRenderer);
    shader.uniforms.lessonWashColor = { value: state.color };
    shader.uniforms.lessonWashAmount = { value: state.amount };
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform vec3 lessonWashColor;\nuniform float lessonWashAmount;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", "#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, lessonWashColor, lessonWashAmount);");
    state.shader = shader;
  };
  value.customProgramCacheKey = () => `${previousCacheKey()}|lesson-wash-v1`;
  value.needsUpdate = true;
  return value;
}
function setMaterialWash(value, color, amount) {
  enableMaterialWash(value);
  const state = value.userData.lessonWash;
  state.color.set(color);
  state.amount = clamp(Number(amount) || 0, 0, 1);
  if (state.shader) {
    state.shader.uniforms.lessonWashColor.value.copy(state.color);
    state.shader.uniforms.lessonWashAmount.value = state.amount;
  }
}
function platformImportedMaterial(source, options = {}) {
  const textureEnabled = options.textureEnabled !== false;
  const map = textureEnabled ? source?.map || null : null;
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }
  // Texture ต้องคูณด้วยสีขาวเสมอ มิฉะนั้นค่า DiffuseColor #cccccc ที่มากับ FBX จะทำให้สีมืดลง
  const color = options.color || (map ? "#ffffff" : source?.color || "#ffffff"), value = material(color, map);
  value.name = source?.name || "platform-imported-material";
  value.opacity = clamp(options.opacity ?? source?.opacity ?? 1, 0, 1);
  value.transparent = Boolean(source?.transparent || value.opacity < 1);
  value.depthWrite = options.depthWrite ?? source?.depthWrite ?? value.opacity >= .98;
  value.alphaTest = source?.alphaTest ?? 0;
  value.alphaMap = textureEnabled ? source?.alphaMap || null : null;
  value.side = source?.side ?? THREE.FrontSide;
  value.visible = source?.visible !== false;
  // โมเดลจากโปรแกรม 3D บางไฟล์มี vertex color สีเทาติดมาด้วย ซึ่งจะคูณ Base Color ให้มืดซ้ำ
  value.vertexColors = options.vertexColors === true;
  if (map) {
    // Base Color ที่อบแสงมาแล้วต้องมี self-light เล็กน้อย จึงจะสว่างเท่ากับ asset procedural
    // ยังเป็น MeshPhysicalMaterial ตัวเดียวกันและยังรับแสง/เงา realtime ตามปกติ
    value.emissive.set("#ffffff");
    value.emissiveMap = map;
    value.emissiveIntensity = options.textureLight ?? setting.object.surface.importedTextureLight ?? .32;
  }
  if (options.roughness != null) value.roughness = options.roughness;
  if (options.metalness != null) value.metalness = options.metalness;
  return enableMaterialWash(value);
}
function prepareModelObject(object, options = {}) {
  stripImportedSceneControls(object);
  object.traverse(child => {
    if (!child.isMesh) return;
    child.geometry = child.geometry.clone();
    if (!child.geometry.attributes.normal) child.geometry.computeVertexNormals();
    const materials = Array.isArray(child.material) ? child.material : [child.material], opaqueCaster = child.visible !== false && materials.some(source => source?.visible !== false && (source?.opacity ?? 1) >= .98 && source?.transparent !== true);
    child.castShadow = Boolean(shadowSetting.lessonCast && opaqueCaster);
    child.receiveShadow = shadowSetting.lessonReceive !== false && opaqueCaster;
    child.material = materials.map(source => platformImportedMaterial(source, options));
    if (child.material.length === 1) child.material = child.material[0];
  });
  object.updateMatrixWorld(true);
  if (options.normalize !== false) {
    const bounds = new THREE.Box3().setFromObject(object), center = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3()), largest = Math.max(size.x, size.y, size.z) || 1, targetSize = options.targetSize || 3, factor = targetSize / largest;
    object.scale.multiplyScalar(factor);
    object.position.set(-center.x * factor, -bounds.min.y * factor, -center.z * factor);
  }
  return object;
}
function wrapModelObject(object, options = {}) {
  const root = new THREE.Group(), visual = new THREE.Group();
  visual.add(object); root.add(visual);
  return configureLessonObject(root, visual, options);
}
function configureModelObject(object, options = {}) { return wrapModelObject(prepareModelObject(object, options), options); }
async function addModel(options = {}) { return configureModelObject(await loadCustomModel(options.path, options), options); }
function libraryModelTemplate(id, definition) { if (!libraryModelTemplates.has(id)) libraryModelTemplates.set(id, loadCustomModel(definition.path, { baseUrl: import.meta.url })); return libraryModelTemplates.get(id); }
function preparedLibraryKey(id, options = {}) { return JSON.stringify([id, options.normalize !== false, options.textureEnabled !== false, options.color || "", options.opacity ?? "", options.roughness ?? "", options.metalness ?? "", options.textureLight ?? "", options.vertexColors === true]); }
function preparedLibraryModel(id, definition, options = {}) {
  const normalizedOptions = { ...options, normalize: options.normalize ?? definition.normalize, targetSize: 1 };
  const key = preparedLibraryKey(id, normalizedOptions);
  if (!libraryPreparedModelTemplates.has(key)) {
    const prepared = libraryModelTemplate(id, definition).then(template => prepareModelObject(template.clone(true), normalizedOptions));
    libraryPreparedModelTemplates.set(key, prepared);
  }
  return libraryPreparedModelTemplates.get(key);
}
function clonePreparedLibraryModel(template) {
  const object = template.clone(true);
  object.traverse(child => {
    if (!child.isMesh) return;
    child.userData.sharedLibraryGeometry = true;
    child.material = Array.isArray(child.material) ? child.material.map(value => enableMaterialWash(value.clone())) : enableMaterialWash(child.material?.clone?.() || child.material);
  });
  return object;
}
async function warmPreparedLibraryModels(templates) {
  if (!templates.length) return templates;
  const staging = new THREE.Group();
  for (const template of templates) {
    if (!template?.isObject3D) continue;
    const object = clonePreparedLibraryModel(template);
    object.traverse(child => { child.frustumCulled = false; });
    staging.add(object);
  }
  if (!staging.children.length) return templates;
  staging.position.y = -1000;
  scene.add(staging);
  try {
    if (typeof renderer.compileAsync === "function") await renderer.compileAsync(scene, camera);
    else renderer.compile(scene, camera);
    const textures = new Set();
    staging.traverse(child => {
      if (!child.isMesh) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const value of materials) for (const key of ["map", "emissiveMap", "normalMap", "roughnessMap", "metalnessMap", "alphaMap"]) if (value?.[key]?.isTexture) textures.add(value[key]);
    });
    for (const texture of textures) renderer.initTexture(texture);
  } finally {
    scene.remove(staging);
    disposeObject(staging);
  }
  return templates;
}
function sizePreparedLibraryModel(object, targetSize, normalize) {
  if (normalize === false) return object;
  object.scale.multiplyScalar(targetSize);
  object.position.multiplyScalar(targetSize);
  return object;
}
function preloadLibraryObjects(entries = []) {
  const pending = new Map();
  for (const entry of entries) {
    const options = typeof entry === "string" ? { asset: entry } : { ...entry };
    const id = options.asset || options.id, definition = libraryAsset(id);
    if (definition.type === "prefab") { pending.set(`prefab:${id}`, Promise.resolve(definition)); continue; }
    if (definition.type !== "model") throw new Error(`LESSON_ASSET_TYPE_UNSUPPORTED: Asset ${id} ไม่รองรับ type ${definition.type}`);
    const resolved = { ...options, normalize: options.normalize ?? definition.normalize };
    pending.set(preparedLibraryKey(id, resolved), preparedLibraryModel(id, definition, resolved));
  }
  return Promise.all(pending.values()).then(warmPreparedLibraryModels);
}
function addLibraryObject(options = {}) {
  const id = options.asset || options.id, definition = libraryAsset(id), baseScale = options.scale ?? definition.defaultScale ?? 1, common = { ...options, name: options.name || id, scale: baseScale };
  if (definition.type === "prefab") { const parts = (definition.parts || []).map(part => options.color ? { ...part, color: options.color } : part); return addGroup({ ...common, parts }); }
  if (definition.type === "model") {
    const normalize = options.normalize ?? definition.normalize, targetSize = options.targetSize ?? definition.targetSize ?? 3;
    return preparedLibraryModel(id, definition, { ...options, normalize }).then(template => wrapModelObject(sizePreparedLibraryModel(clonePreparedLibraryModel(template), targetSize, normalize), { ...common, targetSize, normalize }));
  }
  throw new Error(`LESSON_ASSET_TYPE_UNSUPPORTED: Asset ${id} ไม่รองรับ type ${definition.type}`);
}
function addObject(options = {}) { const type = options.type || options.source?.type || "primitive", source = options.source || {}; if (type === "library") return addLibraryObject({ ...options, asset: options.asset || source.asset }); if (type === "model") return addModel({ ...options, path: options.path || source.path }); if (type === "label") return addWorldLabel(options); if (type === "text" || type === "text3d") return addText3D(options); if (type === "group" || type === "prefab") return addGroup(options); return addPrimitive({ ...options, shape: options.shape || source.shape, geometry: options.geometry || source.geometry }); }
function recolorOperatorMasterObject(object, color) {
  if (!object) return;
  forEachObjectMaterial(object, value => {
    value.color.set(color);
    rememberHighlightSurface(value).baseHighlightColor.copy(value.color);
  });
}
function applyOperatorMasterAppearance(group, valid) {
  const master = group.userData.operatorMaster;
  if (!master) return setOperatorAppearance(group, valid ? "valid" : "neutral");
  setOperatorAppearance(group, valid ? "valid" : "neutral");
  const color = valid ? OPERATOR_SIGN_MASTER.completeColor : master.config.color;
  if (!valid) group.userData.operatorEdge.material.color.set(color);
  for (const part of group.userData.operatorParts) {
    part.material.color.set(color);
    part.material.emissive.set(valid ? "#0e5a3a" : color);
    part.material.emissiveIntensity = valid ? .14 : .06;
  }
  recolorOperatorMasterObject(master.model, color);
  markSceneActive();
}
function animateOperatorMasterState(group, valid) {
  const master = group.userData.operatorMaster;
  if (!master) return;
  const startRotation = master.pivot?.rotation.x ?? master.flipAngle;
  const endRotation = operatorFullTurnEnd(startRotation, master.restRotation);
  if (!master.pivot) { applyOperatorMasterAppearance(group, valid); return; }
  master.flipAngle = endRotation;
  const version = ++master.motionVersion, startedAt = performance.now(), startY = master.pivot.position.y, startScale = master.pivot.scale.x, animation = OPERATOR_SIGN_MASTER.animation;
  let appearanceChanged = false;
  const frame = now => {
    if (version !== master.motionVersion || !group.parent) return;
    const progress = clamp((now - startedAt) / animation.duration, 0, 1), eased = .5 - Math.cos(progress * Math.PI) / 2, bounce = Math.sin(progress * Math.PI);
    master.pivot.position.y = THREE.MathUtils.lerp(startY, master.baseY, eased) + bounce * animation.bounceHeight;
    master.pivot.scale.setScalar(THREE.MathUtils.lerp(startScale, 1, eased) - bounce * animation.scaleDip);
    master.pivot.rotation.x = THREE.MathUtils.lerp(startRotation, endRotation, eased);
    if (!appearanceChanged && progress >= .5) { appearanceChanged = true; applyOperatorMasterAppearance(group, valid); }
    markSceneActive();
    if (progress < 1) { requestAnimationFrame(frame); return; }
    master.pivot.position.y = master.baseY;
    master.pivot.scale.setScalar(1);
    master.pivot.rotation.x = endRotation;
    if (master.targetValid === valid) applyOperatorMasterAppearance(group, valid);
  };
  requestAnimationFrame(frame);
}
function installOperatorSignMaster(group, visual, symbol, parts, text, referenceSize) {
  const config = operatorSignMasterFor(text);
  if (!config) return null;
  const restRotation = THREE.MathUtils.degToRad(config.restFlip || 0);
  const master = { config, model: null, pivot: null, baseY: 0, targetValid: false, motionVersion: 0, restRotation, flipAngle: restRotation };
  group.userData.operatorMaster = master;
  applyOperatorMasterAppearance(group, false);
  const modelDefinitions = config.models || [{ asset: config.asset, rotation: config.rotation, mirrorX: config.mirrorX }];
  Promise.all(modelDefinitions.map(component => {
    const definition = libraryAsset(component.asset), normalize = definition.normalize !== false;
    return preparedLibraryModel(component.asset, definition, { normalize, color: config.color, textureEnabled: false }).then(template => ({ component, template }));
  })).then(preparedParts => {
    if (!group.parent) return;
    const pivot = new THREE.Group(), model = new THREE.Group();
    pivot.name = `operator-master-${text}`;
    model.name = `${pivot.name}-model`;
    for (const { component, template } of preparedParts) {
      const frame = new THREE.Group(), piece = clonePreparedLibraryModel(template), rotation = component.rotation || [0, 0, 0], position = component.position || [0, 0, 0], scale = component.scale || [1, 1, 1];
      piece.rotation.set(...rotation.map(THREE.MathUtils.degToRad));
      piece.scale.multiply(new THREE.Vector3(...scale));
      frame.position.set(...position);
      frame.rotation.y = THREE.MathUtils.degToRad(component.yaw || 0);
      if (component.mirrorX) frame.scale.x = -1;
      frame.add(piece);
      model.add(frame);
    }
    const displayScale = config.displayScale || [1, 1, 1];
    model.scale.set(...displayScale).multiplyScalar(referenceSize * (config.size || 1));
    pivot.add(model);
    pivot.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model), center = bounds.getCenter(new THREE.Vector3());
    model.position.sub(center);
    pivot.updateMatrixWorld(true);
    const centeredBounds = new THREE.Box3().setFromObject(model), height = centeredBounds.getSize(new THREE.Vector3()).y;
    master.baseY = .53 + height * .5;
    pivot.position.y = master.baseY;
    master.model = model;
    master.pivot = pivot;
    visual.add(pivot);
    for (const part of parts) part.visible = false;
    pivot.rotation.x = master.flipAngle;
    applyOperatorMasterAppearance(group, master.targetValid);
  }).catch(error => {
    console.warn(`main-world: โหลด master เครื่องหมาย ${text} ไม่สำเร็จ จึงใช้ procedural สำรอง`, error);
    for (const part of parts) part.visible = true;
    applyOperatorMasterAppearance(group, master.targetValid);
  });
  return master;
}
function addConnector({ name = "connector", from = [0, 0, 0], to = [0, 0, 1], color = "#65758b", thickness = .075, opacity = .72, depthTest = true, renderOrder = 0 } = {}) {
  const start = new THREE.Vector3(...from), end = new THREE.Vector3(...to), direction = end.clone().sub(start), length = direction.length();
  if (length <= .0001) return addGroup({ name, position: from, parts: [] });
  const root = new THREE.Group(), visual = new THREE.Group();
  const connector = new THREE.Mesh(
    new THREE.CylinderGeometry(thickness, thickness, length, 12),
    new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: depthTest && opacity >= .98, depthTest, fog: false, toneMapped: false })
  );
  connector.position.y = length * .5;
  connector.castShadow = false;
  connector.receiveShadow = false;
  connector.renderOrder = Number(renderOrder) || 0;
  visual.add(connector);
  root.add(visual);
  const handle = configureLessonObject(root, visual, { name, position: from });
  // เก็บแนวเส้นไว้ใน visual เพื่อแยก quaternion ของ from → to ออกจาก transform ที่ root ใช้กับ interaction
  visual.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return handle;
}
const world = Object.freeze({
  clear() { guiService.clearScope("scene", "step", "question"); clearWorld(); },
  capabilities: Object.freeze({ version: "3.4.0", objects: Object.freeze(["primitive", "group", "text3d", "label", "library", "model", "zone", "callout", "connector", "worldCounter", "worldGui", "guideline", "lineRender"]), primitiveShapes: Object.freeze(SUPPORTED_PRIMITIVE_SHAPES), interactions: Object.freeze(["drag", "click", "custom-hit-area", "actionable-callout", "actionable-world-gui"]), modelFormats: Object.freeze(["glb", "gltf", "fbx"]) }),
  assets: Object.freeze({ version: lessonAssetLibrary.version, list() { return Object.entries(lessonAssetLibrary.assets).map(([id, value]) => ({ id, name: value.name || id, type: value.type, tags: [...(value.tags || [])] })); }, get(id) { const value = libraryAsset(id); return JSON.parse(JSON.stringify({ id, ...value })); }, preloadImages(paths = []) { return preloadLessonTextures(paths, runtime.lessonUrl || import.meta.url); }, preloadLibraryObjects }),
  addObject,
  addPrimitive,
  addGroup,
  addConnector,
  addText3D,
  addWorldCounter,
  addWorldGui,
  addLabel: addWorldLabel,
  label: addWorldLabel,
  lable: addWorldLabel,
  addLibraryObject,
  addModel,
  addBox({ name = "box", size = [2.4, 1.8, 2.4], position = [0, .9, 0], color = "#ff9fbe", draggable = false, dragAxis = setting.interaction.defaultDragAxis, hoverMessage = "", guideTarget = null, onDrag = null, onDrop = null } = {}) { const [w, h, d] = size, geometry = new RoundedBoxGeometry(w, h, d, 8, Math.min(w, h, d) * .16), mesh = new THREE.Mesh(geometry, material(color)); mesh.name = name; mesh.position.set(...position); mesh.castShadow = Boolean(shadowSetting.lessonCast); mesh.receiveShadow = shadowSetting.lessonReceive !== false; Object.assign(mesh.userData, { draggable, visualRoot: mesh, dragAxis, hoverMessage, guideTarget, onDrag, onDrop, groundY: position[1], baseColor: mesh.material.color.clone(), size }); lessonGroup.add(mesh); queueSpawn(mesh); syncInteractive(mesh); return makeHandle(mesh); },
  addZone({ name = "zone", size = [5, .18, 5], position = [0, .1, 0], color = "#bcebcf", opacity = .82 } = {}) {
    const style = setting.lessonGraphics.zone;
    const [width, height, depth] = size;
    const group = new THREE.Group();
    const floor = new THREE.Mesh(
      new RoundedBoxGeometry(width, Math.min(height, .14), depth, 8, .2),
      new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: Math.min(opacity, style.floorOpacity), roughness: .58, metalness: 0, clearcoat: .25, clearcoatRoughness: .36, depthWrite: false })
    );
    // Zone เป็นพื้น UI โปร่งใส ไม่ใช่วัตถุทึบ จึงรับเงาอย่างเดียวและห้ามทอดเงาสี่เหลี่ยม
    floor.castShadow = false;
    // พื้นเกาะเป็น receiver หลักเพียงชั้นเดียว ป้องกันเงาถูก blend ซ้ำบน Zone โปร่งใส
    floor.receiveShadow = false;
    floor.position.y = 0;
    const borderColor = style.borderColor || new THREE.Color(color).offsetHSL(0, .08, -.18);
    const border = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(roundedZonePoints(width - .12, depth - .12, Math.min(.55, width * .12, depth * .12), 7)),
      new THREE.LineDashedMaterial({ color: borderColor, transparent: true, opacity: style.borderOpacity, dashSize: style.dashSize, gapSize: style.gapSize, depthWrite: false, toneMapped: false, fog: false })
    );
    border.position.y = height / 2 + .035;
    border.computeLineDistances();
    border.renderOrder = 12;
    const markerMaterial = new THREE.MeshBasicMaterial({ color: style.cornerMarkerColor, transparent: true, opacity: .9, toneMapped: false });
    const markerPositions = [[width / 2 - .38, depth / 2 - .38], [-width / 2 + .38, depth / 2 - .38], [-width / 2 + .38, -depth / 2 + .38], [width / 2 - .38, -depth / 2 + .38]];
    group.add(floor, border);
    for (const [x, z] of markerPositions) {
      const marker = new THREE.Mesh(new THREE.CylinderGeometry(.105, .105, .055, 12), markerMaterial);
      marker.position.set(x, height / 2 + .045, z);
      marker.castShadow = false;
      marker.receiveShadow = false;
      group.add(marker);
    }
    group.name = name;
    group.position.set(...position);
    lessonGroup.add(group);
    return makeHandle(group);
  },
  addCallout({ text = "", position = [0, 4, 0], compactPosition = null, anchor = [0, .2, 0], color = setting.ui.worldCallout.fontColor, lineColor = setting.ui.worldCallout.lineColor, scale = [3.05, .86], compactScale = null, insight = null, onClick = null, objectiveAction: calloutObjectiveAction = false } = {}) {
    const style = setting.ui.worldCallout, compact = matchMedia("(max-width: 760px), (orientation: portrait)").matches || isPortraitViewport(), usesCompactScale = compact && Array.isArray(compactScale), calloutPosition = compact && Array.isArray(compactPosition) ? compactPosition : position, calloutScale = usesCompactScale ? compactScale : scale, actionable = Boolean(insight || onClick), group = new THREE.Group(), rawText = String(text).trim(), layout = compact ? (style.mobile || {}) : (style.desktop || {}), widthReference = usesCompactScale ? 2.45 : 3.05, heightReference = usesCompactScale ? .92 : .86, guiWidth = Math.max(72, Math.round((layout.width ?? (compact ? 138 : 136)) * calloutScale[0] / widthReference)), guiHeight = Math.max(30, Math.round((layout.height ?? 40) * calloutScale[1] / heightReference));
    const leaderEnd = new THREE.Vector3(...calloutPosition); leaderEnd.y -= calloutScale[1] * .46; const leaderMaterial = new THREE.LineBasicMaterial({ color: lineColor, transparent: true, opacity: style.lineOpacity, depthWrite: false, depthTest: true, fog: false }), leader = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...anchor), new THREE.Vector3(anchor[0], leaderEnd.y, anchor[2]), leaderEnd]), leaderMaterial), ringMaterial = new THREE.MeshBasicMaterial({ color: style.targetColor || lineColor, transparent: true, opacity: style.lineOpacity, depthWrite: false, fog: false }), ring = new THREE.Mesh(new THREE.TorusGeometry(.24, .045, 8, 28), ringMaterial); ring.rotation.x = Math.PI / 2; ring.position.set(...anchor); leader.raycast = ring.raycast = () => { };
    const dom = document.createElement(actionable ? "button" : "div"); dom.className = `world-callout-gui${actionable ? " is-actionable" : ""}`; if (actionable) dom.type = "button"; dom.title = rawText; dom.style.color = color; dom.style.background = `linear-gradient(135deg,${style.backgroundStart},${style.backgroundEnd})`; dom.style.opacity = String(style.backgroundOpacity ?? .94); dom.style.setProperty("--world-callout-width", `${guiWidth}px`); dom.style.setProperty("--world-callout-min-height", `${guiHeight}px`); dom.style.setProperty("--world-callout-font-size", `${layout.fontSize ?? (compact ? 11 : 12)}px`); dom.style.setProperty("--world-callout-hover-scale", String(style.actionHoverScale ?? 1.035)); dom.style.setProperty("--world-callout-icon-size", `${style.actionIconSize ?? 18}px`); dom.style.setProperty("--world-callout-icon-font-size", `${style.actionIconFontSize ?? 12}px`); dom.style.setProperty("--world-callout-icon-opacity", String(style.actionIconOpacity ?? .96)); dom.style.setProperty("--world-callout-icon-bg-start", style.actionIconBackgroundStart || "rgba(255,255,255,.08)"); dom.style.setProperty("--world-callout-icon-bg-end", style.actionIconBackgroundEnd || "rgba(255,255,255,.16)"); dom.style.setProperty("--world-callout-icon-border", style.actionIconBorderColor || "rgba(255,255,255,.92)"); dom.style.setProperty("--world-callout-icon-color", style.actionIconColor || "#ffffff"); dom.style.setProperty("--world-callout-icon-hover-bg-start", style.actionIconHoverBackgroundStart || "rgba(255,183,77,.16)"); dom.style.setProperty("--world-callout-icon-hover-bg-end", style.actionIconHoverBackgroundEnd || "rgba(255,139,43,.28)"); dom.style.setProperty("--world-callout-icon-hover-border", style.actionIconHoverBorderColor || "#ffbd66"); dom.style.setProperty("--world-callout-icon-hover-color", style.actionIconHoverColor || "#ff9b38"); dom.style.setProperty("--world-callout-icon-hover-scale", String(style.actionIconHoverScale ?? 1.14)); dom.style.setProperty("--world-callout-icon-bob", `${style.actionIconBobHeight ?? 1}px`); dom.style.setProperty("--world-callout-icon-duration", `${style.actionIconBobDuration ?? 2200}ms`); if (actionable) { const label = document.createElement("span"), icon = document.createElement("i"); label.textContent = rawText; icon.textContent = "i"; icon.setAttribute("aria-hidden", "true"); dom.append(label, icon); } else dom.textContent = rawText; dom.hidden = true; elements.viewport.append(dom); group.userData.domElement = dom;
    group.add(leader, ring); lessonGroup.add(group);
    let handle = null;
    const activate = event => { const payload = { handle, object: group, sourceEvent: event }; const definition = typeof insight === "function" ? insight(payload) : insight; if (definition) guiService.insight.show(typeof definition === "string" ? { message: definition } : definition); onClick?.(payload); };
    const callout = { group, leaderMaterial, ringMaterial, dom, actionable, hovered: false, hoverAmount: 0, phase: Math.random() * Math.PI * 2, desiredPosition: new THREE.Vector3(...calloutPosition) };
    Object.assign(group.userData, { clickable: false, draggable: false, interactionStyle: "callout", objectiveAction: calloutObjectiveAction, worldCallout: callout, onClick: actionable ? activate : null });
    const baseHandle = makeHandle(group);
    const writeText = next => {
      const value = String(next ?? "").trim();
      dom.title = value;
      const label = actionable ? dom.querySelector("span") : dom;
      if (label) label.textContent = value;
      markSceneActive();
      return value;
    };
    handle = Object.freeze({
      ...baseHandle,
      setText(next) { writeText(next); return handle; },
      remove() { worldCallouts.delete(callout); dom.remove(); baseHandle.remove(); }
    });
    group.userData.lessonHandle = handle;
    worldCallouts.add(callout);
    if (actionable) { dom.addEventListener("pointerenter", () => setWorldCalloutHovered(group, true)); dom.addEventListener("pointerleave", () => setWorldCalloutHovered(group, false)); dom.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); if (calloutObjectiveAction) objectiveAction(); uiSound(); activate(event); }); }
    return handle;
  },
  addLabel(options = {}) { return this.addCallout({ ...options, anchor: options.anchor || [options.position?.[0] || 0, .2, options.position?.[2] || 0] }); },
  addOperatorSign({ text = "=", position = [0, .2, -1], scale = [2.45, 2.45], clickable = false, onClick = null, hoverMessage = "", objectiveAction: operatorObjectiveAction = true, selectionFeedback = true } = {}) {
    if (!SUPPORTED_OPERATOR_SIGNS.includes(text)) throw new Error(`LESSON_OPERATOR_UNSUPPORTED: addOperatorSign ไม่รองรับเครื่องหมาย ${text}`);
    // Build once at the reference size, then scale the entire visual, including bar spacing.
    // Scaling individual meshes alone leaves =, ÷ and comparison offsets unscaled.
    const referenceSize = 2.45, requestedSize = Number(Array.isArray(scale) ? scale[0] : scale);
    const visualScale = Number.isFinite(requestedSize) && requestedSize > 0 ? requestedSize / referenceSize : 1;
    const style = setting.lessonGraphics.operatorBase, group = new THREE.Group(), visual = new THREE.Group();
    const radius = referenceSize * .58;
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.04, radius * 1.1, .18, 10), new THREE.MeshPhysicalMaterial({ color: style.neutralEdge, roughness: .42, clearcoat: .48, clearcoatRoughness: .24 }));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.04, .3, 10), new THREE.MeshPhysicalMaterial({ color: style.neutralBase, roughness: .4, metalness: 0, clearcoat: .62, clearcoatRoughness: .18 }));
    const topPlate = new THREE.Mesh(new THREE.CylinderGeometry(radius * .84, radius * .88, .085, 10), new THREE.MeshPhysicalMaterial({ color: style.topColor, roughness: .32, clearcoat: .72, clearcoatRoughness: .14 }));
    const parts = createOperatorParts(text), symbol = new THREE.Group();
    for (const part of parts) { part.scale.set(radius, Math.min(1.08, .82 + radius * .16), radius); symbol.add(part); }
    // Keep even asymmetric signs (≤ / ≥) centred inside the top plate with a safe margin.
    symbol.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(symbol), center = bounds.getCenter(new THREE.Vector3());
    let extent = 0;
    for (const part of parts) {
      const vertices = part.geometry.attributes.position, vertex = new THREE.Vector3();
      for (let index = 0; index < vertices.count; index++) {
        vertex.fromBufferAttribute(vertices, index).applyMatrix4(part.matrixWorld);
        extent = Math.max(extent, Math.hypot(vertex.x - center.x, vertex.z - center.z));
      }
    }
    const fit = Math.min(1, radius * .78 / Math.max(extent, .001));
    for (const part of parts) { part.position.x = (part.position.x - center.x) * fit; part.position.z = (part.position.z - center.z) * fit; part.scale.x *= fit; part.scale.z *= fit; }
    edge.position.y = .09; base.position.y = .28; topPlate.position.y = .475;
    for (const part of [edge, base, topPlate]) { part.castShadow = Boolean(shadowSetting.lessonCast); part.receiveShadow = shadowSetting.lessonReceive !== false; }
    const heightScale = clamp(Number(style.heightScale) || 1, .2, 1);
    visual.add(edge, base, topPlate, symbol); visual.scale.set(visualScale, visualScale * heightScale, visualScale);
    group.position.set(...position); group.add(visual);
    Object.assign(group.userData, { visualRoot: visual, operatorBase: base, operatorEdge: edge, operatorParts: parts, onClick, hoverMessage, objectiveAction: operatorObjectiveAction, selectionFeedback });
    lessonGroup.add(group); setOperatorAppearance(group, "neutral");
    const operatorMaster = installOperatorSignMaster(group, visual, symbol, parts, text, referenceSize);
    queueSpawn(group);
    const baseHandle = makeHandle(group);
    group.userData.clickable = Boolean(clickable || typeof onClick === "function");
    if (typeof syncInteractive === "function") syncInteractive(group);
    return Object.freeze({ ...baseHandle, pulse() { pulseOperator(group); }, setState(valid) { const nextValid = Boolean(valid); if (operatorMaster) { if (operatorMaster.targetValid === nextValid) return; operatorMaster.targetValid = nextValid; animateOperatorMasterState(group, nextValid); return; } const next = nextValid ? "valid" : "neutral", changed = group.userData.operatorState !== next; setOperatorAppearance(group, next); if (changed && nextValid) pulseOperator(group); } });
  },
  addGuideline(options = {}) { return makeHandle(createGuideline(options)); },
  addLineRender(options = {}) { return makeHandle(createLineRender(options)); },
  addTargetFocus({ position = [0, .32, 0], radius = setting.interaction.targetFocus.radius, color = null, opacity = null, animate = true, rotateSpeed = null, pulseScale = null, opacityPulse = null } = {}) {
    const config = setting.interaction.targetFocus, style = threeColor(color || config.color || "#ffffff"), dashSize = config.dashSize ?? .38, gapSize = config.gapSize ?? .22, count = Math.max(12, Math.round(Math.PI * 2 * radius / (dashSize + gapSize))), dashHeight = config.dashHeight ?? .055, dashWidth = config.dashWidth ?? .105, geometry = new RoundedBoxGeometry(dashSize, dashHeight, dashWidth, 3, Math.min(dashHeight, dashWidth) * .42), baseOpacity = (opacity ?? config.opacity ?? .54) * style.alpha, material = new THREE.MeshBasicMaterial({ color: style.color, transparent: true, opacity: baseOpacity, depthWrite: false, depthTest: true, toneMapped: false, fog: true }), ring = new THREE.InstancedMesh(geometry, material, count), dummy = new THREE.Object3D(), group = new THREE.Group();
    for (let index = 0; index < count; index++) { const angle = index / count * Math.PI * 2; dummy.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius); dummy.rotation.set(0, -angle - Math.PI / 2, 0); dummy.updateMatrix(); ring.setMatrixAt(index, dummy.matrix); }
    ring.instanceMatrix.needsUpdate = true; ring.frustumCulled = false; group.position.set(...position); group.add(ring); lessonGroup.add(group); if (animate !== false) targetFocusEffects.add({ group, material, baseOpacity, phase: Math.random() * Math.PI * 2, rotateSpeed, pulseScale, opacityPulse }); return makeHandle(group);
  },
  showDragCue(handle, to) { showDragCue(handle?.object3D || handle, to); }, hideDragCue,
  playEntrance: playWorldEntrance, getObject(name) { return lessonGroup.getObjectByName(name); }, camera: Object.freeze({ reset: resetCamera, configure: configureCamera, focus: focusCamera })
});

function clearGroup(group) { for (const child of [...group.children]) { group.remove(child); if (group === skyboxGroup) child.traverse(item => { if (Array.isArray(item.material)) item.material.forEach(material => material.map?.dispose?.()); else item.material?.map?.dispose?.(); }); disposeObject(child); } }
function loadSkyboxPanorama(path, { radius, height, y, opacity, rotationY = 0 }) { if (!path) return; const version = backgroundVersion; new THREE.TextureLoader().load(runtimeAssetUrl(path), texture => { if (version !== backgroundVersion) { texture.dispose(); return; } texture.colorSpace = THREE.SRGBColorSpace; texture.wrapS = THREE.RepeatWrapping; texture.wrapT = THREE.ClampToEdgeWrapping; const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 96, 1, true), new THREE.MeshBasicMaterial({ map: texture, transparent: opacity < 1, opacity, side: THREE.BackSide, depthWrite: false, fog: false })); mesh.position.y = y; mesh.rotation.y = THREE.MathUtils.degToRad(rotationY); mesh.renderOrder = -20; skyboxGroup.add(mesh); }, undefined, () => console.warn(`main-world: โหลด skybox panorama ไม่สำเร็จ ${path}`)); }
function loadSkyboxFloor(config) { if (!config?.enabled || !config.texturePath) return; const version = backgroundVersion; new THREE.TextureLoader().load(runtimeAssetUrl(config.texturePath), texture => { if (version !== backgroundVersion) { texture.dispose(); return; } texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); const fadeStart = clamp(config.edgeFadeStart ?? .58, 0, .98), fadeEnd = clamp(config.edgeFadeEnd ?? .98, fadeStart + .01, 1), fogStrength = clamp(config.fogStrength ?? .25, 0, 1), material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: config.opacity ?? .7, depthWrite: false, fog: true, side: THREE.DoubleSide }); material.onBeforeCompile = shader => { shader.uniforms.floorFadeStart = { value: fadeStart }; shader.uniforms.floorFadeEnd = { value: fadeEnd }; shader.uniforms.floorFogStrength = { value: fogStrength }; shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>\n#ifdef USE_MAP\n  float floorRadius = length(vMapUv - vec2(0.5)) * 2.0;\n  diffuseColor.a *= 1.0 - smoothstep(floorFadeStart, floorFadeEnd, floorRadius);\n#endif`).replace("#include <fog_fragment>", `#ifdef USE_FOG\n  float floorFogFactor = smoothstep(fogNear, fogFar, vFogDepth) * floorFogStrength;\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, floorFogFactor);\n#endif`).replace("void main() {", "uniform float floorFadeStart;\nuniform float floorFadeEnd;\nuniform float floorFogStrength;\nvoid main() {"); }; material.customProgramCacheKey = () => `skybox-floor-fade-${fadeStart}-${fadeEnd}-fog-${fogStrength}`; const floor = new THREE.Mesh(new THREE.CircleGeometry(config.radius || 58, 96), material); floor.rotation.x = -Math.PI / 2; floor.rotation.z = THREE.MathUtils.degToRad(config.rotationY || 0); floor.position.y = config.y ?? -14; floor.renderOrder = -19; skyboxGroup.add(floor); }, undefined, () => console.warn(`main-world: โหลด texture พื้นล่าง skybox ไม่สำเร็จ ${config.texturePath}`)); }
function setBackground(name = "green") { const preset = setting.backgroundPresets[name] || setting.backgroundPresets.green, colors = preset.colors, mobileFog = isPortraitViewport() ? preset.mobileFog : null, fogColor = mobileFog?.color || preset.fog, fogNear = mobileFog?.near ?? preset.fogNear ?? 30, fogFar = mobileFog?.far ?? preset.fogFar ?? 68; elements.viewport.style.background = `linear-gradient(${colors[0]} 0%,${colors[1]} 52%,${colors[2]} 100%)`; scene.fog = new THREE.Fog(fogColor, fogNear, fogFar); scene.fog.userData = { zoomBase: { near: fogNear, far: fogFar } }; updateCameraFog(); backgroundVersion += 1; clearGroup(skyboxGroup); loadSkyboxPanorama(preset.panorama, setting.skyboxLayout.panorama); loadSkyboxFloor({ ...setting.skyboxLayout.floor, ...(preset.floor || {}) }); const gridStyle = threeColor(setting.ground.gridColor), ringStyle = threeColor(setting.ground.ringColor), opacity = setting.ground.gridOpacity; gridLines.material.color.set(gridStyle.color); gridLines.material.opacity = opacity * gridStyle.alpha; gridRing.material.color.set(ringStyle.color); gridRing.material.opacity = Math.min(1, opacity + .12) * ringStyle.alpha; createAtmosphere(preset); createLeafParticles(preset); markSceneActive(); return preset; }
function createAtmosphere(preset) { clearGroup(atmosphereGroup); atmospherePoints = null; fallingLeafSystem = null; const types = preset.particles || []; if (!setting.vfx.particles || !types.length) return; const config = setting.vfx.environment, count = config.count, palette = preset.particleColors?.length ? preset.particleColors : ["#ffffff"], windPalette = preset.windColors?.length ? preset.windColors : ["#ffffff", "#66bce9"], positions = new Float32Array(count * 3), colors = new Float32Array(count * 3); for (let index = 0; index < count; index++) { positions[index * 3] = (Math.random() - .5) * 34; positions[index * 3 + 1] = Math.random() * 13 + .35; positions[index * 3 + 2] = (Math.random() - .5) * 28; const color = new THREE.Color(palette[index % palette.length]); colors.set(color.toArray(), index * 3); } const dotCanvas = document.createElement("canvas"); dotCanvas.width = dotCanvas.height = 64; const dotContext = dotCanvas.getContext("2d"), dotGradient = dotContext.createRadialGradient(32, 32, 2, 32, 32, 30); dotGradient.addColorStop(0, "rgba(255,255,255,1)"); dotGradient.addColorStop(.55, "rgba(255,255,255,.9)"); dotGradient.addColorStop(1, "rgba(255,255,255,0)"); dotContext.fillStyle = dotGradient; dotContext.fillRect(0, 0, 64, 64); const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3)); geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3)); atmospherePoints = new THREE.Points(geometry, new THREE.PointsMaterial({ size: config.size * 1.4, map: new THREE.CanvasTexture(dotCanvas), vertexColors: true, transparent: true, opacity: config.opacity, alphaTest: .03, depthWrite: false, fog: false })); atmosphereGroup.add(atmospherePoints); if (types.includes("wind")) { for (let index = 0; index < config.windTrails; index++) { const length = 1.5 + Math.random() * 2.4, curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-length, 0, 0), new THREE.Vector3(0, .3 + Math.random() * .45, .25), new THREE.Vector3(length, 0, 0)), line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(18)), new THREE.LineBasicMaterial({ color: windPalette[index % windPalette.length], transparent: true, opacity: .58 + Math.random() * .24, depthWrite: false, fog: false })); line.position.set((Math.random() - .5) * 30, 2 + Math.random() * 9, (Math.random() - .5) * 24); line.userData.windTrail = { speed: .008 + Math.random() * .012 }; atmosphereGroup.add(line); } } }
function createLeafParticles(preset) {
  const types = preset.particles || [];
  if (!setting.vfx.particles || !types.includes("leaves")) return;
  const config = setting.vfx.environment, palette = preset.leafColors?.length ? preset.leafColors : ["#82d68d", "#b7e77b", "#72d7c1"], count = Math.max(0, Math.round((config.leafCount || 20) * (constrainedDevice ? .55 : 1))), groups = palette.map(() => []);
  for (let index = 0; index < count; index++) {
    const size = THREE.MathUtils.lerp(config.leafSize?.[0] ?? .12, config.leafSize?.[1] ?? .23, Math.random());
    groups[index % palette.length].push({ position: new THREE.Vector3((Math.random() - .5) * 29, 1 + Math.random() * 11, (Math.random() - .5) * 23), rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI), size, fall: THREE.MathUtils.lerp(config.leafFallSpeed?.[0] ?? .0012, config.leafFallSpeed?.[1] ?? .0024, Math.random()), drift: THREE.MathUtils.lerp(config.leafDrift?.[0] ?? .002, config.leafDrift?.[1] ?? .0055, Math.random()) * (Math.random() > .5 ? 1 : -1), phase: Math.random() * Math.PI * 2 });
  }
  const systems = [];
  groups.forEach((motions, colorIndex) => {
    if (!motions.length) return;
    const geometry = new THREE.CircleGeometry(1, 5), material = new THREE.MeshBasicMaterial({ color: palette[colorIndex], side: THREE.DoubleSide, transparent: true, opacity: .78, depthWrite: false, fog: true }), mesh = new THREE.InstancedMesh(geometry, material, motions.length), dummy = new THREE.Object3D();
    motions.forEach((motion, index) => { dummy.position.copy(motion.position); dummy.rotation.copy(motion.rotation); dummy.scale.set(motion.size, motion.size * 1.65, motion.size); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix); });
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.instanceMatrix.needsUpdate = true; mesh.renderOrder = 8; mesh.frustumCulled = false; atmosphereGroup.add(mesh); systems.push({ mesh, motions, dummy });
  });
  fallingLeafSystem = { groups: systems };
}
function screenSpark(object) { if (!setting.vfx.dropSpark || !object) return; const config = setting.vfx.drop, point = object.getWorldPosition(new THREE.Vector3()).project(camera), rect = elements.viewport.getBoundingClientRect(), x = (point.x * .5 + .5) * rect.width, y = (-point.y * .5 + .5) * rect.height, colors = ["#7857ff", "#ffcf4a", "#62d5ad", "#ffffff"]; for (let index = 0; index < config.particleCount; index++) { const spark = document.createElement("i"); spark.className = "spark"; spark.style.left = `${x}px`; spark.style.top = `${y}px`; spark.style.width = spark.style.height = `${config.particleSize * (.65 + Math.random() * .7)}px`; spark.style.background = colors[index % colors.length]; spark.style.boxShadow = `0 0 14px ${colors[index % colors.length]}`; spark.style.setProperty("--x", `${(Math.random() - .5) * config.spread}px`); spark.style.setProperty("--y", `${(Math.random() - .78) * config.spread}px`); elements.viewport.append(spark); setTimeout(() => spark.remove(), 700); } }
function celebrate() { if (!setting.vfx.celebration) return; elements.celebration.replaceChildren(); const config = setting.vfx.celebrationEffect || {}, colors = config.colors || ["#ff7e9d", "#ffd75e", "#71dbac", "#7fc8ff", "#9b8cf2"], duration = config.duration || 6800, fireworkLayer = document.createElement("div"), confettiLayer = document.createElement("div"); fireworkLayer.className = "firework-layer"; confettiLayer.className = "confetti-layer"; for (let fireworkIndex = 0; fireworkIndex < (config.fireworkCount || 6); fireworkIndex++) { const firework = document.createElement("div"), burst = document.createElement("span"), trail = document.createElement("i"), particleCount = config.fireworkParticles || 16; firework.className = "firework"; burst.className = "firework-burst"; trail.className = "firework-trail"; firework.style.left = `${12 + decorSeed(fireworkIndex, 31) * 76}%`; firework.style.top = `${12 + decorSeed(fireworkIndex, 32) * 43}%`; firework.style.setProperty("--firework-delay", `${-(decorSeed(fireworkIndex, 33) * (config.fireworkLoop || 2200))}ms`); firework.style.setProperty("--firework-loop", `${config.fireworkLoop || 2200}ms`); firework.style.setProperty("--firework-color", colors[fireworkIndex % colors.length]); for (let particleIndex = 0; particleIndex < particleCount; particleIndex++) { const spark = document.createElement("b"), angle = particleIndex / particleCount * Math.PI * 2, distance = 44 + decorSeed(particleIndex, fireworkIndex + 38) * 44, color = colors[(fireworkIndex + particleIndex) % colors.length]; spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`); spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`); spark.style.setProperty("--spark-angle", `${angle}rad`); spark.style.setProperty("--spark-color", color); spark.style.animationDelay = `calc(var(--firework-delay) + ${decorSeed(particleIndex, 46) * 120}ms)`; burst.append(spark); } firework.append(trail, burst); fireworkLayer.append(firework); } const count = matchMedia("(max-width: 760px), (orientation: portrait)").matches ? 48 : 78; for (let i = 0; i < count; i++) { const part = document.createElement("i"), color = colors[i % colors.length]; part.className = "confetti"; part.style.left = `${Math.random() * 100}%`; part.style.background = part.style.color = color; part.style.setProperty("--duration", `${1.8 + Math.random() * 1.7}s`); part.style.setProperty("--drift", `${(Math.random() - .5) * 220}px`); part.style.animationDelay = `${Math.random() * .65}s`; confettiLayer.append(part); } elements.celebration.append(fireworkLayer, confettiLayer); setTimeout(() => elements.celebration.replaceChildren(), duration); }

// แยกพลุไปไว้ใต้ modal (z-index 95) ส่วนริบบอนยังอยู่หน้าสุด (z-index 180)
const celebrateCombined = celebrate;
celebrate = () => { elements.celebrationFireworks.replaceChildren(); celebrateCombined(); const fireworkLayer = elements.celebration.querySelector(".firework-layer"); if (fireworkLayer) elements.celebrationFireworks.append(fireworkLayer); setTimeout(() => elements.celebrationFireworks.replaceChildren(), setting.vfx.celebrationEffect?.duration || 6800); };

// ---------- Pointer, drag-axis and orbit controls ----------
const raycaster = new THREE.Raycaster(), pointerNdc = new THREE.Vector2(), dragPoint = new THREE.Vector3(), dragOffset = new THREE.Vector3(), pointers = new Map(); let dragged = null, dragPointerId = null, orbit = null, dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function rayFrom(event) { const rect = elements.canvas.getBoundingClientRect(); pointerNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1); raycaster.setFromCamera(pointerNdc, camera); }
function interactiveHit() {
  const resolved = [];
  for (const hit of raycaster.intersectObjects(interactive, true)) {
    let root = hit.object.userData?.interactionRoot || hit.object;
    while (root && root !== lessonGroup && !interactive.includes(root)) root = root.parent;
    if (root && interactive.includes(root)) resolved.push({ ...hit, object: root, visual: hit.object });
  }
  // WorldCallout เป็น GUI ที่วาดทับฉาก จึงต้องรับ pointer ก่อนวัตถุ 3D ที่อาจอยู่ด้านหน้าในเชิงระยะกล้อง
  return resolved.find(hit => isActionableCallout(hit.object)) || resolved[0] || null;
}
function snapshot() { const points = [...pointers.values()]; return { yaw: cameraState.yaw, pitch: cameraState.pitch, distance: cameraState.distance, points, pinch: points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0 }; }
elements.canvas.addEventListener("pointerdown", event => {
  if (elements.runtime.classList.contains("web-page-mode")) return;
  cancelCameraFocus();
  rayFrom(event);
  const target = interactiveHit()?.object;
  if (target?.userData.draggable) clickme.suspendFor(target);
  else if (target?.userData.clickable) clickme.completeFor(target);
}, { capture: true });
elements.canvas.addEventListener("pointerdown", event => { if (elements.runtime.classList.contains("web-page-mode")) return; event.preventDefault(); elements.canvas.setPointerCapture(event.pointerId); rayFrom(event); const hit = interactiveHit(); if (hit?.object.userData.draggable) { if (hit.object.userData.objectiveAction !== false) objectiveAction(); dragged = hit.object; dragPointerId = event.pointerId; dragged.userData.dragOrigin = dragged.position.clone(); dragged.userData.dragStartClient = { x: event.clientX, y: event.clientY }; hideDragCue(); setSelected(dragged); setHovered(dragged); audio.play("onClick"); if (dragged.userData.guideTarget) dragGuideline = createGuideline({ fromObject: dragged, to: dragged.userData.guideTarget, parent: effectGroup }); const axis = dragged.userData.dragAxis; if (axis === "xy") dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), dragged.position); else dragPlane.set(new THREE.Vector3(0, 1, 0), 0); if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) { if (dragged.userData.dragFromCenter) dragOffset.set(0, 0, 0); else dragOffset.copy(dragged.position).sub(dragPoint); } dragged.position.y += dragged.userData.dragLiftHeight ?? setting.object.motion.liftHeight; elements.canvas.classList.add("is-dragging-object"); return; } if (hit?.object.userData.clickable) { if (hit.object.userData.objectiveAction !== false) objectiveAction(); if (isActionableCallout(hit.object) || hit.object.userData.selectionFeedback === false) { setSelected(null); setHovered(hit.object); } else { setSelected(hit.object); setHovered(hit.object); } audio.play("onClick"); hit.object.userData.onClick?.({ handle: hit.object.userData.lessonHandle, object: hit.object, hitPoint: { x: hit.point.x, y: hit.point.y, z: hit.point.z } }); return; } guiService.worldOption.dismiss(); pauseDragCue(); setSelected(null); setHovered(null); pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); orbit = snapshot(); });
elements.canvas.addEventListener("pointermove", event => { if (!dragged && pointers.size === 0) { rayFrom(event); setHovered(interactiveHit()?.object || null); setDisplayHovered(raycaster.intersectObjects(uiDisplays, false)[0]?.object || null); } if (dragged && event.pointerId === dragPointerId) { rayFrom(event); setDisplayHovered(null); if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) { const next = dragPoint.clone().add(dragOffset), axis = dragged.userData.dragAxis || "xz", limit = setting.ground.radius - setting.interaction.dragPadding; if (axis.includes("x")) dragged.position.x = clamp(next.x, -limit, limit); if (axis.includes("y")) dragged.position.y = clamp(next.y, .2, 9); if (axis.includes("z")) dragged.position.z = clamp(next.z, -limit, limit); dragged.userData.onDrag?.({ x: dragged.position.x, y: dragged.position.y, z: dragged.position.z }); } return; } if (!pointers.has(event.pointerId) || !orbit) return; pointers.set(event.pointerId, { x: event.clientX, y: event.clientY }); const points = [...pointers.values()]; if (points.length === 1) { cameraState.yaw = orbit.yaw - (points[0].x - orbit.points[0].x) * setting.interaction.rotateSpeed; cameraState.pitch = clamp(orbit.pitch + (points[0].y - orbit.points[0].y) * setting.interaction.tiltSpeed, THREE.MathUtils.degToRad(cameraConfig.minPitch), THREE.MathUtils.degToRad(cameraConfig.maxPitch)); } else if (points.length === 2 && orbit.pinch > 0) { const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); cameraState.distance = clamp(orbit.distance * orbit.pinch / Math.max(distance, 1), cameraConfig.minDistance, cameraMaxDistance()); } updateCamera(); });
function endPointer(event) {
  if (event.pointerId === dragPointerId) {
    const object = dragged, origin = object.userData.dragOrigin.clone(), dropPosition = object.position.clone(), animationBeforeDrop = animations.get(object);
    const dragStart = object.userData.dragStartClient;
    const dragDistance = dragStart ? Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) : Infinity;
    if (object.userData.tapToClick && dragDistance < object.userData.tapClickTolerance) {
      object.position.copy(origin);
      object.userData.onClick?.({ handle: object.userData.lessonHandle, object, hitPoint: { x: object.position.x, y: object.position.y, z: object.position.z } });
      clickme.completeFor(object);
      removeDragGuideline();
      setHovered(null);
      dragged = null; dragPointerId = null; elements.canvas.classList.remove("is-dragging-object");
      return;
    }
    const result = object.userData.onDrop?.({ x: object.position.x, y: object.position.y, z: object.position.z }, makeHandle(object));
    const accepted = result !== false && result?.accepted !== false, committed = accepted && (result?.commit ?? true), animationAfterDrop = animations.get(object);
    const lessonHandledPlacement = !object.position.equals(dropPosition) || animationAfterDrop !== animationBeforeDrop;
    audio.play("onDrop");
    removeDragGuideline();
    if (accepted) {
      if (!lessonHandledPlacement) {
        const baseY = object.userData.groundY;
        object.position.y = baseY + setting.object.motion.dropBounceHeight;
        animations.set(object, { kind: "drop", start: performance.now(), duration: setting.object.motion.settleDuration, baseY, height: setting.object.motion.dropBounceHeight, strength: setting.object.motion.dropSquash });
      }
      if (committed && object.userData.commitFeedback !== false) { startCommitFlash(object); screenSpark(object); }
    } else {
      animations.set(object, { kind: "return", start: performance.now(), duration: setting.object.motion.returnDuration, from: object.position.clone(), to: origin });
    }
    clickme.finishFor(object, { completed: committed });
    // การลากไม่ควรทิ้งสถานะ Hover ไว้หลังปล่อย วัตถุจึงคืนสีปกติเมื่อ
    // Commit Flash จบ และจะขาวอีกครั้งเมื่อมี pointermove กลับมาชี้จริง ๆ เท่านั้น
    setHovered(null);
    dragged = null; dragPointerId = null; elements.canvas.classList.remove("is-dragging-object");
  }
  pointers.delete(event.pointerId); orbit = pointers.size ? snapshot() : null; if (!pointers.size) resumeDragCue();
}
elements.canvas.addEventListener("pointerup", endPointer); elements.canvas.addEventListener("pointercancel", endPointer); elements.canvas.addEventListener("pointerleave", () => { if (!dragged) { setHovered(null); setDisplayHovered(null); } }); elements.canvas.addEventListener("wheel", event => { event.preventDefault(); cancelCameraFocus(); pauseDragCue(); cameraState.distance = clamp(cameraState.distance + event.deltaY * setting.interaction.wheelZoomSpeed, cameraConfig.minDistance, cameraMaxDistance()); updateCamera(); resumeDragCue(180); }, { passive: false });

let lastUiSoundAt = 0;
const mobileRenderMedia = matchMedia("(max-width: 760px), (orientation: portrait)");
function uiSound() { const now = performance.now(); if (now - lastUiSoundAt < 70) return; lastUiSoundAt = now; audio.play("onUiBtnClick"); }
let pressedButton = null;
function releasePressedButton() {
  pressedButton?.classList.remove("is-ui-pressed");
  pressedButton = null;
}
document.addEventListener("pointerdown", event => {
  const button = event.target.closest("button");
  if (!button || button.disabled || button.classList.contains("lab-menu-backdrop") || event.button !== 0) return;
  releasePressedButton();
  pressedButton = button;
  button.classList.add("is-ui-pressed");
}, { capture: true });
document.addEventListener("pointerup", releasePressedButton, { capture: true });
document.addEventListener("pointercancel", releasePressedButton, { capture: true });
document.addEventListener("keydown", event => {
  if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
  const button = event.target.closest?.("button");
  if (!button || button.disabled || button.classList.contains("lab-menu-backdrop")) return;
  releasePressedButton();
  pressedButton = button;
  button.classList.add("is-ui-pressed");
}, { capture: true });
document.addEventListener("keyup", event => {
  if (event.key === "Enter" || event.key === " ") releasePressedButton();
}, { capture: true });
window.addEventListener("blur", releasePressedButton);
document.addEventListener("click", event => { const button = event.target.closest("button"); if (button && !button.disabled) uiSound(); }, { capture: true });
function cameraButtonAction(callback) { cancelCameraFocus(); pauseDragCue(); callback(); resumeDragCue(180); }
$("#reset-view").addEventListener("click", () => { uiSound(); cameraButtonAction(resetCamera); }); $("#zoom-in").addEventListener("click", () => { uiSound(); cameraButtonAction(() => { cameraState.distance = clamp(cameraState.distance - 1.5, cameraConfig.minDistance, cameraConfig.maxDistance); updateCamera(); }); }); $("#zoom-out").addEventListener("click", () => { uiSound(); cameraButtonAction(() => { cameraState.distance = clamp(cameraState.distance + 1.5, cameraConfig.minDistance, cameraConfig.maxDistance); updateCamera(); }); }); $("#rotate-left").addEventListener("click", () => { uiSound(); cameraButtonAction(() => { cameraState.yaw -= THREE.MathUtils.degToRad(15); updateCamera(); }); }); $("#rotate-right").addEventListener("click", () => { uiSound(); cameraButtonAction(() => { cameraState.yaw += THREE.MathUtils.degToRad(15); updateCamera(); }); });

function syncConsoleDockHeight() { const panel = !elements.howto.hidden ? elements.howto : !elements.quizPanel.hidden ? elements.quizPanel : null, height = panel?.getBoundingClientRect().height || 0; document.documentElement.style.setProperty("--gui-console-current-height", `${Math.ceil(height || ((mobileRenderMedia.matches ? setting.ui.console?.mobile?.minHeight : setting.ui.console?.desktop?.minHeight) || 112))}px`); }
function resize() { const width = Math.max(1, elements.viewport.clientWidth), height = Math.max(1, elements.viewport.clientHeight); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); syncConsoleDockHeight(); guiService.update(); } new ResizeObserver(resize).observe(elements.viewport); const consoleResizeObserver = new ResizeObserver(syncConsoleDockHeight); consoleResizeObserver.observe(elements.howto); consoleResizeObserver.observe(elements.quizPanel); resize(); resetCamera();
function updateWorldCallouts(now = performance.now()) {
  camera.updateMatrixWorld();
  for (const callout of worldCallouts) {
    if (!callout.group.parent) { worldCallouts.delete(callout); continue; }
    const { group, dom, desiredPosition } = callout, style = setting.ui.worldCallout;
    dom.hidden = !group.visible;
    if (group.visible) {
      const worldPosition = group.localToWorld(desiredPosition.clone()), viewPosition = worldPosition.clone().applyMatrix4(camera.matrixWorldInverse), projected = worldPosition.clone().project(camera);
      if (viewPosition.z >= -.01 || projected.z < -1 || projected.z > 1) dom.hidden = true;
      else {
        const width = Math.max(1, elements.viewport.clientWidth), height = Math.max(1, elements.viewport.clientHeight), margin = 12, halfWidth = dom.offsetWidth / 2, halfHeight = dom.offsetHeight / 2, screenX = clamp((projected.x * .5 + .5) * width, margin + halfWidth, width - margin - halfWidth), screenY = clamp((-projected.y * .5 + .5) * height, margin + halfHeight, height - margin - halfHeight);
        dom.style.left = `${screenX}px`; dom.style.top = `${screenY}px`; dom.classList.toggle("is-hovered", callout.hovered);
      }
    }
    if (callout.actionable) {
      const target = callout.hovered ? 1 : 0;
      callout.hoverAmount = THREE.MathUtils.lerp(callout.hoverAmount, target, callout.hovered ? .2 : .12);
      callout.leaderMaterial.opacity = Math.min(1, style.lineOpacity + callout.hoverAmount * .08);
      callout.ringMaterial.opacity = Math.min(1, style.lineOpacity + callout.hoverAmount * .08);
    }
  }
}
renderer.setAnimationLoop(now => {
  if (document.hidden) return;
  const mobileIdleDelay = Math.max(0, setting.renderer.mobileIdleDelay ?? 12000);
  const mobileIdle = mobileRenderMedia.matches && animations.size === 0 && commitFlashes.size === 0 && !dragged && pointers.size === 0 && now - lastSceneActivity >= mobileIdleDelay;
  // Desktop ไม่ลด render rate; Mobile ลดเฉพาะเมื่อไม่มี interaction ต่อเนื่องตามเวลาที่ตั้งไว้
  const minimumFrameInterval = mobileIdle ? 1000 / Math.max(1, setting.renderer.mobileIdleFps || 45) : 0;
  if (now - lastRenderedAt < minimumFrameInterval) return;
  const delta = Math.min(50, Math.max(1, now - lastFrameAt)); lastFrameAt = now; lastRenderedAt = now;
  for (const [object, a] of animations) {
    const progress = clamp((now - a.start) / a.duration, 0, 1);
    if (a.kind === "return") { const eased = 1 - Math.pow(1 - progress, 3); object.position.lerpVectors(a.from, a.to, eased); }
    else if (a.kind === "move") { const eased = progress < .5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2; object.position.lerpVectors(a.from, a.to, eased); object.position.y += Math.sin(progress * Math.PI) * a.arcHeight; }
    else if (a.kind === "drop") { const fade = 1 - progress, bounce = Math.abs(Math.sin(progress * Math.PI * 2.5)) * fade; object.position.y = a.baseY + bounce * a.height; const squash = Math.sin(progress * Math.PI * 3) * fade * a.strength; object.scale.set(1 + squash * .65, 1 - squash, 1 + squash * .65); }
    else if (a.kind === "spawn") { const c1 = setting.object.spawn.overshoot, c3 = c1 + 1, t = progress - 1, scaleEase = a.scaleOvershoot ? 1 + c3 * t * t * t + c1 * t * t : 1 - Math.pow(1 - progress, 3), floatEase = progress * progress * (3 - 2 * progress); object.scale.setScalar(Math.max(.001, scaleEase)); object.position.y = a.baseY + (1 - floatEase) * a.height; }
    if (progress >= 1) { if (a.to) object.position.copy(a.to); if (a.baseY != null) object.position.y = a.baseY; object.scale.setScalar(1); animations.delete(object); }
  }
  if (highlightRoot.visible) updateHighlightBounds(now);
  if (worldCallouts.size) updateWorldCallouts(now);
  // update() จะคืนค่าทันทีเมื่อไม่มี Gizmo จึงไม่สร้าง snapshot object ในทุกเฟรม
  guiService.update();
  for (const effect of targetFocusEffects) { if (!effect.group.parent) { targetFocusEffects.delete(effect); continue; } const config = setting.interaction.targetFocus, wave = Math.sin(now * (config.pulseSpeed ?? .00105) + effect.phase), pulse = 1 + wave * (effect.pulseScale ?? config.pulseScale ?? .024); effect.group.rotation.y = now * (effect.rotateSpeed ?? config.rotateSpeed ?? .00012) + effect.phase; effect.group.scale.setScalar(pulse); effect.material.opacity = effect.baseOpacity * (1 - wave * (effect.opacityPulse ?? config.opacityPulse ?? .08)); }
  for (const [object, flash] of commitFlashes) { const progress = clamp((now - flash.start) / flash.duration, 0, 1), mix = Math.pow(Math.sin(progress * Math.PI * flash.flashes), 2); for (const item of flash.materials) { item.material.color.copy(item.baseColor).lerp(flash.color, mix); if (item.material.emissive) { item.material.emissive.copy(item.emissive || item.baseColor).lerp(flash.color, mix); item.material.emissiveIntensity = THREE.MathUtils.lerp(item.emissiveIntensity ?? 0, setting.object.commit.emissiveIntensity ?? .62, mix); } } if (progress >= 1) { commitFlashes.delete(object); restoreObjectSurface(object); applyObjectHighlight(object, object === hovered ? "hover" : "none"); } }
  for (const material of islandPlantMaterials) if (material.userData.plantTime) material.userData.plantTime.value = now * .001;
  for (const object of islandPlantObjects) { const motion = object.userData.islandPlantMotion; if (!motion) continue; const wave = Math.sin(now * .001 * motion.speed + motion.phase); object.rotation.x = motion.baseX + wave * motion.amount * .42; object.rotation.z = motion.baseZ + wave * motion.amount; }
  for (const cloud of islandClouds) { const motion = cloud.userData.islandCloud; cloud.position.y = motion.baseY + Math.sin(now * motion.speed + motion.phase) * motion.amount; }
  for (const line of activeGuidelines) { if (!line.parent) { activeGuidelines.delete(line); continue; } if (line.userData.fromObject) updateGuideline(line); if ("dashOffset" in line.material) line.material.dashOffset -= setting.interaction.guideline.flowSpeed * (delta / 16.67); }
  if (dragCue) { const cycle = ((now - dragCue.startedAt) % 1800) / 1800, eased = .5 - .5 * Math.cos(cycle * Math.PI * 2), point = dragCue.object.getWorldPosition(new THREE.Vector3()).lerp(dragCue.to, eased).project(camera), rect = elements.viewport.getBoundingClientRect(); elements.sceneHandCue.style.left = `${(point.x * .5 + .5) * rect.width}px`; elements.sceneHandCue.style.top = `${(-point.y * .5 + .5) * rect.height}px`; }
  const distantInterval = 1000 / Math.max(1, setting.renderer.distantAnimationFps || 15);
  if (now - lastDistantUpdateAt >= distantInterval) { lastDistantUpdateAt = now; for (const object of distantDecorGroup.children) { const motion = object.userData.distantMotion; if (!motion) continue; const wave = Math.sin(now * motion.floatSpeed + motion.phase), drift = Math.cos(now * motion.floatSpeed * .63 + motion.phase); if (motion.orbitSpeed) { const elapsed = now - motion.startedAt, angle = motion.orbitAngle + elapsed * motion.orbitSpeed, radius = motion.orbitRadius + drift * motion.driftAmount; object.position.set(Math.cos(angle) * radius, motion.baseY + wave * motion.floatAmount, Math.sin(angle) * radius); object.lookAt(0, object.position.y, 0); } else { object.position.set(motion.basePosition.x + drift * motion.driftAmount, motion.basePosition.y + wave * motion.floatAmount, motion.basePosition.z + wave * motion.driftAmount * .35); if (motion.spinSpeed) { const spin = (now - motion.startedAt) * motion.spinSpeed; object.rotation.copy(motion.baseRotation); if (motion.spinAxis === "x") object.rotateX(spin); else if (motion.spinAxis === "z") object.rotateZ(spin); else object.rotateY(spin); } } } }
  if (fallingLeafSystem) for (const { mesh, motions, dummy } of fallingLeafSystem.groups) { for (let index = 0; index < motions.length; index++) { const motion = motions[index]; motion.position.y -= motion.fall * delta; motion.position.x += motion.drift * delta + Math.sin(now * .0016 + motion.phase) * .003 * delta; motion.position.z += Math.cos(now * .0011 + motion.phase) * .0015 * delta; motion.rotation.x += .0018 * delta; motion.rotation.y += .0025 * delta; motion.rotation.z += .0012 * delta; if (motion.position.y < .18) motion.position.set((Math.random() - .5) * 29, 9 + Math.random() * 4, (Math.random() - .5) * 23); dummy.position.copy(motion.position); dummy.rotation.copy(motion.rotation); dummy.scale.set(motion.size, motion.size * 1.65, motion.size); dummy.updateMatrix(); mesh.setMatrixAt(index, dummy.matrix); } mesh.instanceMatrix.needsUpdate = true; }
  if (atmospherePoints) { atmospherePoints.rotation.y += .0006 * (delta / 16.67); atmospherePoints.position.y = Math.sin(now * .0007) * .18; }
  for (const object of atmosphereGroup.children) if (object.userData.windTrail) { object.position.x += object.userData.windTrail.speed * delta * .48; if (object.position.x > 18) object.position.x = -18; }
  worldGuiSystem.update(now);
  clickme.update();
  if (!elements.runtime.classList.contains("web-page-mode")) renderer.render(scene, camera);
});

// ---------- Lesson schema, UI and lifecycle ----------
const displayText = value => typeof value === "string" ? value.trim() : "";
function normalizeMeta(raw, lessonData) { const meta = { ...raw }; meta.worldType = meta.worldType || "3d-world-space"; meta.lessonId = meta.lessonId || lessonData.Id; meta.title = displayText(meta.title); meta.category = displayText(meta.category); meta.subcategory = displayText(meta.subcategory); meta.background = "green"; meta.description = meta.description || lessonData.description || lessonData.desc || ""; meta.keyResult = meta.keyResult || ""; meta.welcomeMessage = Array.isArray(meta.welcomeMessage) ? meta.welcomeMessage : []; meta.howto = Array.isArray(meta.howto) ? [...meta.howto].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)) : []; meta.defaultValue = { ...(meta.defaultValue || {}) }; meta.editSchema = Array.isArray(meta.editSchema) ? meta.editSchema : []; meta.quiz = Array.isArray(meta.quiz) ? meta.quiz : []; if (!["3d-world-space", "webPage"].includes(meta.worldType)) throw new Error(`lesson_meta.worldType ไม่รองรับค่า ${meta.worldType}`); if (!meta.lessonId) throw new Error("lesson_meta.lessonId จำเป็นต้องมีค่า"); return meta; }
function resolveLessonDisplayData(lessonData, meta) {
  const preferMeta = setting.overrideTitleName === true;
  const pick = (platformValue, lessonValue) => preferMeta
    ? displayText(lessonValue) || displayText(platformValue)
    : displayText(platformValue) || displayText(lessonValue);
  return {
    ...lessonData,
    title: pick(displayText(lessonData.title) || displayText(lessonData.name), meta.title) || "บทเรียน Interactive",
    category: pick(lessonData.category, meta.category),
    subcategory: pick(lessonData.subcategory, meta.subcategory)
  };
}
function modeLabel(mode) { return mode === "student-quiz" ? "QUIZ" : mode === "teacher-lab" ? "TEACHER LAB" : "STUDENT LAB"; }
const titleMarqueeAnimations = new WeakMap();
// Keep the objective and step number on one row; only overflowing text moves.
let objectiveMarqueeAnimation;
let objectiveMarqueeFrame;
function scheduleObjectiveMarquee() {
  cancelAnimationFrame(objectiveMarqueeFrame);
  objectiveMarqueeFrame = requestAnimationFrame(() => {
    objectiveMarqueeAnimation?.cancel();
    objectiveMarqueeAnimation = null;
    const viewport = elements.objective.parentElement;
    const distance = Math.ceil(elements.objective.scrollWidth - viewport.clientWidth);
    if (!viewport.clientWidth || distance <= 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const travel = Math.max(3000, distance / 28 * 1000);
    const duration = travel + 4000;
    objectiveMarqueeAnimation = elements.objective.animate([
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(0)", offset: 2000 / duration },
      { transform: `translateX(-${distance}px)`, offset: (2000 + travel) / duration },
      { transform: `translateX(-${distance}px)`, offset: 1 }
    ], { duration, iterations: Infinity, easing: "linear" });
  });
}
new MutationObserver(scheduleObjectiveMarquee).observe(elements.objective, { childList: true, characterData: true, subtree: true });
new ResizeObserver(scheduleObjectiveMarquee).observe(elements.objective.parentElement);
document.fonts?.ready?.then(scheduleObjectiveMarquee);
document.fonts?.addEventListener("loadingdone", scheduleObjectiveMarquee);
function refreshTitleMarquee(element) {
  const viewport = element?.parentElement;
  if (!viewport) return;
  titleMarqueeAnimations.get(element)?.animation?.cancel();
  titleMarqueeAnimations.delete(element);
  element.style.removeProperty("--title-marquee-distance");
  element.style.removeProperty("--title-marquee-duration");
  element.style.transform = "translateX(0)";
  const textRange = document.createRange();
  textRange.selectNodeContents(element);
  const measuredTextWidth = textRange.getBoundingClientRect().width;
  textRange.detach?.();
  const elementRect = element.getBoundingClientRect();
  const viewportRect = viewport.getBoundingClientRect();
  const leadingOffset = Math.max(0, elementRect.left - viewportRect.left);
  const availableWidth = Math.max(1, viewport.clientWidth - leadingOffset);
  const textWidth = Math.max(measuredTextWidth, element.scrollWidth);
  const distance = Math.ceil(Math.max(0, textWidth - availableWidth));
  if (distance <= 2) return;
  const initialPauseDuration = 2500;
  const repeatPauseDuration = 2000;
  const travelDuration = Math.max(3500, Math.min(12000, distance / 28 * 1000));
  const state = {};
  const firstAnimation = element.animate([
    { transform: "translateX(0)" },
    { transform: `translateX(-${distance}px)` }
  ], {
    delay: initialPauseDuration,
    duration: travelDuration,
    iterations: 1,
    easing: "linear"
  });
  state.animation = firstAnimation;
  titleMarqueeAnimations.set(element, state);
  firstAnimation.finished.then(() => {
    if (titleMarqueeAnimations.get(element) !== state) return;
    const repeatDuration = repeatPauseDuration + travelDuration;
    state.animation = element.animate([
      { transform: "translateX(0)", offset: 0 },
      { transform: "translateX(0)", offset: repeatPauseDuration / repeatDuration },
      { transform: `translateX(-${distance}px)`, offset: 1 }
    ], {
      duration: repeatDuration,
      iterations: Infinity,
      easing: "linear"
    });
  }).catch(() => {});
}
function setTitleMarqueeText(element, value) {
  element.textContent = value;
  requestAnimationFrame(() => refreshTitleMarquee(element));
  document.fonts?.ready?.then(() => refreshTitleMarquee(element));
}
let titleMarqueeResizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(titleMarqueeResizeTimer);
  titleMarqueeResizeTimer = setTimeout(() => {
    refreshTitleMarquee(elements.taxonomy);
    refreshTitleMarquee(elements.title);
  }, 120);
});
if (typeof ResizeObserver === "function") {
  const titleMarqueeObserver = new ResizeObserver(() => {
    refreshTitleMarquee(elements.taxonomy);
    refreshTitleMarquee(elements.title);
  });
  const titleCopy = elements.title?.closest(".title-copy");
  if (titleCopy) titleMarqueeObserver.observe(titleCopy);
}
const labCompactMedia = matchMedia("(max-width: 760px), (orientation: portrait)");
const revisedIconShapes = {
  "back.svg": '<path d="m15 4-8 8 8 8"/>',
  "previous.svg": '<path d="m15 4-8 8 8 8"/>',
  "next.svg": '<path d="m9 4 8 8-8 8"/>',
  "edit.svg": '<path d="m4 16-1 5 5-1L20 8l-4-4Z"/><path d="m13 7 4 4"/>',
  "reset.svg": '<path d="M20 10a8 8 0 1 0-2 8M20 4v6h-6"/>',
  "home.svg": '<path d="m3 11 9-8 9 8M6 9v12h12V9M10 21v-7h4v7"/>',
  "info.svg": '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r=".5"/>',
  "question.svg": '<path d="M7 7a5 5 0 0 1 10 0c0 4-5 4-5 8"/><circle cx="12" cy="20" r=".5"/>',
  "zoom-in.svg": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M10 7v6M7 10h6"/>',
  "zoom-out.svg": '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6"/>',
  "rotate-left.svg": '<path d="M4 10a8 8 0 1 1 3 9M4 4v6h6"/>',
  "rotate-right.svg": '<path d="M20 10a8 8 0 1 0-3 9M20 4v6h-6"/>',
  "hand.svg": '<path d="M8 12V5a2 2 0 0 1 4 0v6-8a2 2 0 0 1 4 0v9-5a2 2 0 0 1 4 0v8c0 5-3 7-7 7-3 0-5-2-7-5l-3-4a2 2 0 0 1 3-2l2 2"/>'
};
function syncRevisedIcons() {
  const revised = elements.runtime.classList.contains("runtime-ui-revised");
  for (const img of elements.runtime.querySelectorAll('.topbar img, .world-controls img, #lab-menu img, .howto-panel>button img, .quiz-panel .console-state-icon img, .gui-control img')) {
    const original = img.dataset.uiOriginalSrc || img.getAttribute("src") || "";
    const name = img.dataset.icon || original.split("/").at(-1)?.split("?")[0];
    if (!revisedIconShapes[name]) continue;
    if (!img.dataset.uiOriginalSrc) img.dataset.uiOriginalSrc = original;
    img.src = revised ? `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#55213f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${revisedIconShapes[name]}</svg>`)}` : original;
  }
}
const labMenuToggle = $("#lab-menu-toggle"), labMenuOverlay = $("#lab-menu-overlay"), labToolsToggle = $("#lab-tools-toggle");
function closeLabMenu(returnFocus = false) {
  labMenuOverlay.hidden = true;
  labMenuToggle.setAttribute("aria-expanded", "false");
  if (returnFocus) labMenuToggle.focus();
}
function syncLabResponsiveUi() {
  syncRevisedIcons();
  const compact = elements.runtime.classList.contains("runtime-ui-revised") && labCompactMedia.matches;
  labMenuToggle.hidden = !compact;
  const hasTools = [...elements.controlDock.children].some(node => node.dataset.controlId !== "runtime-skip-teaching" && !node.hidden && !node.classList.contains("is-leaving"));
  const toolCount = [...elements.controlDock.children]
    .filter(node => node.dataset.controlId !== "runtime-skip-teaching" && !node.hidden && !node.classList.contains("is-leaving"))
    .reduce((count, node) => count + node.querySelectorAll("button:not([hidden])").length, 0);
  elements.runtime.dataset.mobileToolCount = String(toolCount);
  elements.runtime.style.setProperty("--mobile-tool-count", String(Math.max(1, toolCount)));
  labToolsToggle.hidden = !compact;
  labToolsToggle.disabled = !hasTools || elements.runtime.classList.contains("lab-tools-retiring");
  if (!compact || !hasTools || labToolsToggle.disabled) elements.runtime.classList.remove("lab-tools-ready");
  else if (!elements.runtime.classList.contains("lab-tools-ready")) requestAnimationFrame(() => {
    if (!labToolsToggle.disabled && labCompactMedia.matches) elements.runtime.classList.add("lab-tools-ready");
  });
  if (!compact || !hasTools) {
    elements.runtime.classList.remove("lab-tools-open");
    labToolsToggle.setAttribute("aria-expanded", "false");
    labToolsToggle.textContent = "◀";
  }
  if (!compact) closeLabMenu();
}
labMenuToggle.addEventListener("click", () => {
  const open = labMenuOverlay.hidden;
  labMenuOverlay.hidden = !open;
  labMenuToggle.setAttribute("aria-expanded", String(open));
  if (open) $("#lab-menu button:not([hidden])")?.focus();
});
labMenuOverlay.addEventListener("click", event => {
  const action = event.target.closest("[data-lab-action]");
  if (action) {
    if (action.dataset.labAction !== "toggle-audio") closeLabMenu();
    document.getElementById(action.dataset.labAction)?.click();
  }
  else if (event.target.closest(".lab-menu-backdrop")) closeLabMenu(true);
});
labMenuOverlay.addEventListener("keydown", event => {
  if (event.key === "Escape") { event.preventDefault(); closeLabMenu(true); }
  if (event.key === "Tab") {
    const buttons = [...labMenuOverlay.querySelectorAll("button")].filter(button => button.getClientRects().length);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
labToolsToggle.addEventListener("click", () => {
  if (labToolsToggle.disabled) return;
  const open = elements.runtime.classList.toggle("lab-tools-open");
  labToolsToggle.setAttribute("aria-expanded", String(open));
  labToolsToggle.setAttribute("aria-label", open ? "พับเครื่องมือบทเรียน" : "เปิดเครื่องมือบทเรียน");
  labToolsToggle.textContent = open ? "▶" : "◀";
});
labCompactMedia.addEventListener("change", syncLabResponsiveUi);
new MutationObserver(syncLabResponsiveUi).observe(elements.controlDock, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "class"] });
function applyRuntimeUi() {
  elements.runtime.className = `${runtime.mode} ${runtime.meta.worldType === "webPage" ? "web-page-mode" : ""}`;
  elements.runtime.classList.toggle("runtime-ui-revised", runtime.meta.worldType !== "webPage");
  syncLabResponsiveUi();
  scheduleQuestionFit();
  elements.mode.textContent = elements.runtime.classList.contains("runtime-ui-revised") ? (runtime.mode === "student-quiz" ? "QUIZ" : "LAB") : modeLabel(runtime.mode);
  const unitTitle = [runtime.lessonData.category, runtime.lessonData.subcategory]
    .map(displayText)
    .filter(value => value && value !== "คณิตศาสตร์")
    .join(" · ") || runtime.meta.description || "หัวข้อการเรียนรู้";
  setTitleMarqueeText(elements.taxonomy, unitTitle);
  setTitleMarqueeText(elements.title, runtime.lessonData.title);
  elements.hint.textContent = runtime.meta.tooltip || "ลากวัตถุไปยังพื้นที่เป้าหมาย";
  elements.webRoot.hidden = runtime.meta.worldType !== "webPage";
  elements.howto.hidden = runtime.mode === "student-quiz" || !runtime.meta.howto.length;
  elements.quizPanel.hidden = runtime.mode !== "student-quiz";
  elements.mascot.hidden = runtime.meta.worldType === "webPage";
  elements.mascot.classList.toggle("is-disabled", mascotSetting.enabled === false);
  elements.mascot.classList.toggle("is-stationary", mascotBehavior === "stationary");
  elements.mascot.dataset.character = activeMascotKey;
  elements.mascot.dataset.behavior = mascotBehavior;
  setMascotPose("idle");
  scheduleMascotBlink();
  requestAnimationFrame(syncConsoleDockHeight);
}
function lessonPayload(extra = {}) { return { values: { ...runtime.values }, mode: runtime.mode, meta: runtime.meta, ...extra }; }
async function resetLessonScene(extra = {}) {
  runtime.stepNextEnabled = true;
  const retireTools = labCompactMedia.matches && elements.runtime.classList.contains("lab-tools-ready");
  elements.runtime.classList.add("lab-tools-retiring");
  elements.runtime.classList.remove("lab-tools-ready", "lab-tools-open");
  labToolsToggle.disabled = true;
  labToolsToggle.setAttribute("aria-expanded", "false");
  labToolsToggle.setAttribute("aria-label", "เปิดเครื่องมือบทเรียน");
  if (retireTools && !matchMedia("(prefers-reduced-motion: reduce)").matches) await new Promise(resolve => setTimeout(resolve, 240));
  try {
    guiService.clearScope("scene", "step", "question"); setLessonQuestion("");
    const preserveScene = runtime.meta.worldType === "3d-world-space" && runtime.meta.scenePersistence === "lesson" && runtime.lessonSceneInitialized;
    if (runtime.meta.worldType === "3d-world-space" && !preserveScene) world.clear();
    await runtime.lesson.reset?.(lessonPayload(extra));
    if (runtime.meta.worldType === "3d-world-space") runtime.lessonSceneInitialized = true;
    runtime.sceneEntered = false; markSceneActive();
  } finally {
    elements.runtime.classList.remove("lab-tools-retiring");
    syncLabResponsiveUi();
  }
}
function scheduleMascotBlink() { clearTimeout(runtime.mascotBlinkTimer); clearTimeout(runtime.mascotBlinkReleaseTimer); if (elements.mascot.hidden || mascotSetting.enabled === false) return; const [minimum, maximum] = mascotSetting.idle?.blinkInterval || [2800, 5200], delay = minimum + Math.random() * Math.max(0, maximum - minimum); runtime.mascotBlinkTimer = setTimeout(() => { elements.mascotCharacter.classList.add("is-blinking"); runtime.mascotBlinkReleaseTimer = setTimeout(() => { elements.mascotCharacter.classList.remove("is-blinking"); scheduleMascotBlink(); }, mascotSetting.idle?.blinkDuration || 150); }, delay); }
function resetMascotTimers() { clearTimeout(runtime.optionCloseTimer); clearTimeout(runtime.mascotFlightTimer); clearTimeout(runtime.mascotLandingTimer); clearTimeout(runtime.mascotSpeechTimer); clearTimeout(runtime.mascotHintTimer); clearTimeout(runtime.mascotPoseTimer); }
function setMascotPose(pose = "idle") { const nextPose = mascotBehavior === "stationary" ? pose : "idle"; if (elements.mascot.dataset.pose !== nextPose) elements.mascot.dataset.pose = nextPose; }
async function playQuizMascotReaction() {
  if (mascotBehavior !== "stationary" || runtime.mode !== "student-quiz") return;
  const poses = ["celebrate", "instruction", "hint"], previous = elements.mascot.dataset.lastQuizPose || "", choices = poses.filter(pose => pose !== previous), pose = choices[Math.floor(Math.random() * choices.length)] || "celebrate";
  elements.mascot.dataset.lastQuizPose = pose;
  elements.mascot.classList.remove("is-quiz-reacting");
  setMascotPose(pose);
  void elements.mascot.offsetWidth;
  elements.mascot.classList.add("is-quiz-reacting");
  await new Promise(resolve => setTimeout(resolve, 720));
  elements.mascot.classList.remove("is-quiz-reacting");
  setMascotPose("idle");
}
function hideMascotNotice() { elements.mascotNotice.hidden = true; elements.mascot.classList.remove("has-notice"); }
function revealPendingMascotOption() { const option = runtime.pendingMascotOption; if (!option) return; runtime.pendingMascotOption = null; hideMascotNotice(); showStepOption(option); }
function queueStepOption(option) { clearTimeout(runtime.mascotHintTimer); runtime.pendingMascotOption = null; hideMascotNotice(); if (!option) { showStepOption(null); return; } const messaging = mascotSetting.messaging || {}, type = option.type || (runtime.stepIndex === 0 ? messaging.firstMessageType || "instruction" : messaging.defaultType || "hint"), typedOption = { ...option, type }, compact = matchMedia("(max-width: 760px), (orientation: portrait)").matches; if (type === "feedback") { showStepOption(null); showToast(option.message || option.header || "ทำได้ดีมาก", "success"); return; } if (type === "instruction" || compact) { showStepOption(typedOption); return; } showStepOption(null); runtime.pendingMascotOption = typedOption; setMascotPose("hint"); elements.mascotNotice.setAttribute("aria-label", messaging.noticeLabel || "เปิดคำแนะนำใหม่"); elements.mascotNotice.hidden = false; elements.mascot.classList.add("has-notice"); if (type === "hint" && (messaging.hintAutoRevealAfter ?? 10000) > 0) runtime.mascotHintTimer = setTimeout(revealPendingMascotOption, messaging.hintAutoRevealAfter ?? 10000); }
function showStepOption(option) {
  resetMascotTimers(); hideMascotNotice(); elements.stepOption.classList.remove("is-opening", "is-closing");
  const enabled = mascotSetting.enabled !== false, wasSpeaking = elements.mascot.classList.contains("is-speaking"), flyInDuration = mascotSetting.animation?.flyInDuration || 560, messageDelay = Math.min(flyInDuration, mascotSetting.animation?.messageDelay ?? Math.round(flyInDuration * .6)), landingDuration = mascotSetting.animation?.landingDuration || 220;
  if (!option) {
    if (elements.stepOption.hidden && !wasSpeaking) { setMascotPose("idle"); return; }
    elements.stepOption.classList.add("is-closing"); runtime.optionCloseTimer = setTimeout(() => { elements.stepOption.hidden = true; elements.stepOption.replaceChildren(); }, setting.ui.animation.optionDuration * .65);
    if (enabled && wasSpeaking) {
      elements.mascot.classList.remove("is-talking", "is-landing", "is-flying-in");
      if (mascotBehavior === "stationary") { elements.mascot.classList.remove("is-speaking", "is-returning"); setMascotPose("idle"); }
      else { elements.mascot.classList.add("is-returning"); runtime.mascotFlightTimer = setTimeout(() => elements.mascot.classList.remove("is-speaking", "is-returning"), mascotSetting.animation?.flyOutDuration || 520); }
    }
    return;
  }
  const iconName = mascotSetting.messaging?.typeIcons?.[option.type] || "lightbulb.svg", renderSpeech = () => { elements.stepOption.hidden = false; elements.stepOption.innerHTML = `<button class="mascot-collapse" type="button" aria-label="พับคำแนะนำ" title="พับคำแนะนำ">${iconMarkup("collapse.svg")}</button><div class="option-heading">${iconMarkup(iconName)}<div><small>${escapeHtml(mascotProfile.name || mascotSetting.name || "ผู้ช่วยประจำบทเรียน")}</small><h3>${escapeHtml(option.header || "คำแนะนำ")}</h3></div></div><p></p>`; elements.stepOption.querySelector(".mascot-collapse")?.addEventListener("click", () => { uiSound(); showStepOption(null); }); void elements.stepOption.offsetWidth; elements.stepOption.classList.add("is-opening"); typeText(elements.stepOption.querySelector("p"), option.message, mascotSetting.speech?.textSpeed || setting.ui.animation.typewriterSpeed); };
  if (!enabled) { renderSpeech(); return; }
  setMascotPose("speaking");
  elements.mascot.classList.remove("is-returning", "is-landing"); elements.mascot.classList.add("is-speaking");
  if (mascotBehavior === "stationary") { elements.mascot.classList.remove("is-flying-in"); elements.mascot.classList.add("is-talking"); renderSpeech(); return; }
  if (wasSpeaking) { elements.mascot.classList.remove("is-flying-in"); elements.mascot.classList.add("is-talking"); renderSpeech(); return; }
  elements.stepOption.hidden = true; elements.mascot.classList.remove("is-talking"); elements.mascot.classList.add("is-flying-in"); runtime.mascotSpeechTimer = setTimeout(renderSpeech, messageDelay); runtime.mascotFlightTimer = setTimeout(() => { elements.mascot.classList.remove("is-flying-in"); elements.mascot.classList.add("is-landing"); runtime.mascotLandingTimer = setTimeout(() => { elements.mascot.classList.remove("is-landing"); elements.mascot.classList.add("is-talking"); }, landingDuration); }, flyInDuration);
}
function animateConsole() {
  elements.howto.classList.remove("is-updating");
}
function syncLabSkipControl() {
  const id = "runtime-skip-teaching", steps = runtime.meta?.howto || [];
  const shouldShow = runtime.mode !== "student-quiz" && steps.length > 1 && runtime.stepIndex < steps.length - 1 && !steps.slice(runtime.stepIndex).some(step => step.requiresCompletion);
  const existing = guiService.control.get(id);
  if (!shouldShow) { existing?.hide(); return; }
  if (existing) { if (existing.element.hidden || existing.element.classList.contains("is-leaving")) existing.show(); return; }
  guiService.control.show({
    id, scope: "lesson", position: "bottom-right", tone: "info",
    systemRole: "skip-teaching",
    ariaLabel: "ข้ามขั้นตอนการสอน", objectiveAction: false,
    items: [{ id: "skip", label: "ข้ามการสอน", icon: "skip.svg" }],
    onAction: event => {
      if (event.id !== "skip") return;
      const currentSteps = runtime.meta?.howto || [];
      if (currentSteps.length) setStep(currentSteps.length - 1);
    }
  });
}
function setLabNextEnabled(enabled) {
  if (runtime.mode === "student-quiz") return;
  runtime.stepNextEnabled = Boolean(enabled);
  $("#next-step").disabled = !runtime.stepNextEnabled || runtime.stepIndex >= (runtime.meta?.howto.length || 0) - 1;
}
async function setStep(index) {
  const steps = runtime.meta.howto;
  if (!steps.length) return;
  if (index > runtime.stepIndex && (!runtime.stepNextEnabled || steps.slice(runtime.stepIndex + 1, index).some(step => step.requiresCompletion))) return;
  introService.close({ notify: false, reason: "step-change" });
  guiService.clearScope("step");
  clearTypewriters();
  runtime.stepIndex = clamp(index, 0, steps.length - 1);
  const activeStepIndex = runtime.stepIndex, step = steps[activeStepIndex], finalLabStep = activeStepIndex === steps.length - 1, freestyle = step.type === "freestyle" || finalLabStep;
  guiService.control.setLessonPhase(freestyle ? "lab" : "teaching");
  guiService.console.reset();
  elements.howto.classList.toggle("is-freestyle", freestyle);
  elements.consoleState.classList.toggle("is-hand", freestyle);
  elements.consoleStateImage.src = iconUrl(freestyle ? "hand.svg" : "book.svg");
  elements.stepCounter.textContent = `${activeStepIndex + 1} / ${steps.length}`;
  typeText(elements.stepTitle, step.title);
  typeText(elements.stepDescription, step.desc);
  $("#previous-step").disabled = activeStepIndex === 0;
  setLabNextEnabled(!step.requiresCompletion);
  syncLabSkipControl();
  queueStepOption(step.option);
  animateConsole();
  await runtime.lesson.onStep?.(activeStepIndex, step, lessonPayload());
  if (!runtime.sceneEntered) { world.playEntrance(); runtime.sceneEntered = true; }
  if (step.intro?.url || step.intro?.src) {
    const sessionId = runtime.sessionId;
    introService.open({
      ...step.intro,
      source: "step",
      onClose: () => {
        if (runtime.sessionId !== sessionId || runtime.stepIndex !== activeStepIndex) return;
        if (activeStepIndex < steps.length - 1) void setStep(activeStepIndex + 1);
      }
    });
  }
}
function showInformation() { uiSound(); const tags = Array.isArray(runtime.lessonData.tags) ? runtime.lessonData.tags : [], category = [runtime.lessonData.category, runtime.lessonData.subcategory].filter(Boolean).join(" · ") || "บทเรียนเสริมทักษะ"; showModal(`<div class="info-dialog"><header class="modal-hero">${iconMarkup("info-book.svg")}<div><span class="mode-badge">${escapeHtml(modeLabel(runtime.mode))}</span><h2>${escapeHtml(runtime.lessonData.title)}</h2></div></header><div class="info-topic">${iconMarkup("info-book.svg")}<div><h3>เรื่องที่กำลังเรียน</h3><p>${escapeHtml(runtime.meta.description)}</p></div></div><div class="info-topic">${iconMarkup("info-category.svg")}<div><h3>หมวดการเรียนรู้</h3><p>${escapeHtml(category)}</p><div class="tag-list">${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div></div></div><div class="info-topic is-target">${iconMarkup("info-target.svg")}<div><h3>เป้าหมายของบทเรียน</h3><p>${escapeHtml(runtime.meta.keyResult)}</p></div></div></div>`); }
function editorFieldVisible(field, values) { const rule = field.showWhen; if (!rule?.key) return true; const accepted = Array.isArray(rule.values) ? rule.values : [rule.value]; return accepted.some(value => String(value) === String(values[rule.key])); }
function editorFieldMarkup(field) { const key = escapeHtml(field.key), value = runtime.values[field.key] ?? "", range = field.option || [], min = field.min ?? range[0] ?? 0, max = field.max ?? range[1] ?? 100, help = field.help ? `<em class="editor-help">${escapeHtml(field.help)}</em>` : "", primaryClass = field.key === "problemType" ? " is-primary" : ""; if (field.type === "dropdown") { const options = (field.option || []).map(item => { const option = item && typeof item === "object" ? item : { value: item, label: item }; return `<option value="${escapeHtml(option.value)}" ${String(option.value) === String(value) ? "selected" : ""}>${escapeHtml(option.label)}</option>`; }).join(""); return `<label class="editor-field${primaryClass}" data-editor-field="${key}"><span>${escapeHtml(field.name)}</span><select data-edit="${key}">${options}</select>${help}</label>`; } if (field.type === "slider") return `<label class="editor-field is-slider${primaryClass}" data-editor-field="${key}"><span>${escapeHtml(field.name)}</span><output data-range-output="${key}">${escapeHtml(value)}</output><input data-edit="${key}" type="range" value="${escapeHtml(value)}" min="${escapeHtml(min)}" max="${escapeHtml(max)}" step="${escapeHtml(field.step ?? 1)}"><small><i>${escapeHtml(min)}</i><i>${escapeHtml(max)}</i></small>${help}</label>`; return `<label class="editor-field${primaryClass}" data-editor-field="${key}"><span>${escapeHtml(field.name)}</span><input data-edit="${key}" type="number" value="${escapeHtml(value)}" min="${escapeHtml(min)}" max="${escapeHtml(max)}" step="${escapeHtml(field.step ?? 1)}">${help}</label>`; }
async function restartLabAfterEdit() {
  await resetLessonScene();
  const requested = Number(runtime.meta.editRestartStep);
  const index = Number.isInteger(requested) ? clamp(requested, 0, runtime.meta.howto.length - 1) : 0;
  runtime.stepIndex = index;
  await setStep(index);
}
function showEditor() { uiSound(); const fields = runtime.meta.editSchema.map(editorFieldMarkup).join(""); showModal(`<div class="editor-dialog"><header class="editor-hero"><span class="editor-kicker">✦ TEACHER TOOLS</span><h2>สร้างตัวอย่างโจทย์</h2><p>เลือกแบบโจทย์ก่อน ระบบจะแสดงเฉพาะตัวเลขที่ต้องปรับ</p></header><div class="editor-guide"><b>1</b><span>เลือกแบบโจทย์</span><i>→</i><b>2</b><span>ปรับตัวเลข</span><i>→</i><b>3</b><span>กดนำไปใช้</span></div><div class="editor-grid">${fields}</div></div>`, { primaryLabel: "นำโจทย์นี้ไปใช้", onPrimary: async () => { for (const input of elements.modal.querySelectorAll("[data-edit]")) { const schema = runtime.meta.editSchema.find(item => item.key === input.dataset.edit); runtime.values[input.dataset.edit] = schema?.type === "dropdown" ? input.value : Number(input.value); } closeModal(); await restartLabAfterEdit(); if (runtime.meta.editRestartStep == null) showToast("สร้างตัวอย่างโจทย์ใหม่แล้ว", "success"); } }); elements.modal.querySelector(".modal-card")?.classList.add("editor-modal"); const currentEditorValues = () => { const values = { ...runtime.values }; for (const input of elements.modal.querySelectorAll("[data-edit]")) values[input.dataset.edit] = input.tagName === "SELECT" ? input.value : Number(input.value); return values; }; const syncEditorFields = () => { const values = currentEditorValues(); for (const root of elements.modal.querySelectorAll("[data-editor-field]")) { const schema = runtime.meta.editSchema.find(item => item.key === root.dataset.editorField); root.hidden = !editorFieldVisible(schema || {}, values); } }; for (const input of elements.modal.querySelectorAll('input[type="range"][data-edit]')) input.addEventListener("input", () => { const output = elements.modal.querySelector(`[data-range-output="${CSS.escape(input.dataset.edit)}"]`); if (output) output.value = input.value; }); elements.modal.querySelector('select[data-edit="problemType"]')?.addEventListener("change", syncEditorFields); syncEditorFields(); }

function shuffle(items) { const copy = [...items]; for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
function questionValues(question) { const values = { ...runtime.meta.defaultValue }; for (const item of question.data || []) values[item.key] = item.value; return values; }
const quizNextButton = $("#next-question");
function hideQuizNext() { quizNextButton.hidden = runtime.mode !== "student-quiz" || !runtime.quiz || runtime.completed; quizNextButton.classList.remove("is-returning"); quizNextButton.classList.add("is-waiting"); quizNextButton.disabled = true; if (runtime.quiz) runtime.quiz.objectiveActionTaken = false; }
function revealQuizNext() { const wasDisabled = quizNextButton.disabled; quizNextButton.hidden = false; quizNextButton.classList.remove("is-waiting"); quizNextButton.disabled = false; if (wasDisabled) { quizNextButton.classList.remove("is-returning"); void quizNextButton.offsetWidth; quizNextButton.classList.add("is-returning"); } }
function objectiveAction() { clearTimeout(runtime.mascotHintTimer); if (runtime.mode !== "student-quiz" || !runtime.quiz?.acceptingAnswers || runtime.completed) return; if (!runtime.quiz.pendingAnswer || runtime.quiz.pendingAnswer.hasAnswer === false) { hideQuizNext(); return; } runtime.quiz.objectiveActionTaken = true; revealQuizNext(); }
async function showQuestion(index) { const quiz = runtime.quiz; if (index >= quiz.questions.length) return finishQuiz(); quiz.acceptingAnswers = false; guiService.clearScope("question"); hideQuizNext(); clearTypewriters(); quiz.index = index; quiz.pendingAnswer = null; const question = quiz.questions[index]; runtime.values = questionValues(question); typeText(elements.question, question.question); elements.quizDots.innerHTML = quiz.questions.map((_, dot) => `<i class="${dot < index ? "done" : dot === index ? "current" : ""}"></i>`).join(""); $("[data-next-label]").textContent = index === quiz.questions.length - 1 ? "ยืนยันคำตอบ" : "ข้อต่อไป"; quizNextButton.classList.toggle("is-final-question", index === quiz.questions.length - 1); quizNextButton.setAttribute("aria-label", index === quiz.questions.length - 1 ? "ยืนยันคำตอบและดูคะแนน" : "บันทึกคำตอบแล้วไปข้อต่อไป"); elements.quizDots.setAttribute("aria-label", `ข้อ ${index + 1} จาก ${quiz.questions.length}`); if (index) audio.play("nextQuest"); await resetLessonScene({ question, questionIndex: index }); world.playEntrance(); runtime.sceneEntered = true; quiz.acceptingAnswers = true; postToHost("lesson.progress", { current: index + 1, total: quiz.questions.length }); }
function answerQuiz(correct, details = {}) { const quiz = runtime.quiz; if (!quiz?.acceptingAnswers) return false; const question = quiz.questions[quiz.index]; quiz.pendingAnswer = { questionIndex: quiz.index, question: question.question, correct: Boolean(correct), ...details }; objectiveAction(); return true; }
function commitQuizAnswer() { const quiz = runtime.quiz, question = quiz.questions[quiz.index], answer = quiz.pendingAnswer || { questionIndex: quiz.index, question: question.question, correct: false, skipped: true }; quiz.answers.push(answer); if (answer.correct) quiz.score += 1; }
function answerSummary(answer) { if (answer?.skipped) return "ไม่ได้ตอบ"; if (typeof answer?.answerText === "string" && answer.answerText.trim()) return answer.answerText; if (answer?.leftCount != null && answer?.rightCount != null) return `${answer.leftCount} ${answer.operator} ${answer.rightCount}`; return "ยังไม่ได้วางคำตอบ"; }
function finishQuiz() {
  const quiz = runtime.quiz;
  runtime.completed = true;
  const durationMs = Date.now() - quiz.startedAt;
  audio.play("completeLesson");
  celebrate();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor(durationMs % 60000 / 1000);
  const percent = Math.round(quiz.score / quiz.questions.length * 100);
  const summaryAsset = name => runtimeAssetUrl(`./assets/image/${name}`);
  const review = quiz.questions.map((question, index) => {
    const answer = quiz.answers.find(item => item.questionIndex === index);
    const correct = answer?.correct;
    return `<li class="${correct ? "correct" : "wrong"}" style="--result-index:${index}"><em>${index + 1}</em><b>${iconMarkup(correct ? "result-correct.svg" : "result-wrong.svg")}</b><strong>${escapeHtml(question.question)}</strong></li>`;
  }).join("");
  const confetti = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((item, index) => {
    const itemId = String(item).padStart(2, "0");
    return `<img class="result-confetti-item result-confetti-${itemId}" src="${summaryAsset(`summary-confetti-${itemId}.png`)}" alt="" style="--confetti-index:${index}" />`;
  }).join("");
  showModal(`<div class="quiz-result result-polished">
    <div class="result-confetti" aria-hidden="true">${confetti}</div>
    <section class="result-celebration">
      <img class="result-ribbon" src="${summaryAsset("summary-ribbon.png")}" alt="" />
      <img class="result-label" src="${summaryAsset("summary-label.png")}" alt="" />
      <span class="result-kicker">ภารกิจสำเร็จ</span>
      <h2>${percent >= 80 ? "ยอดเยี่ยมมาก!" : "ทำครบแล้ว เก่งมาก!"}</h2>
      <img class="result-dino" src="${summaryAsset("summary-dino.png")}" alt="" />
      <img class="result-shrub" src="${summaryAsset("summary-island-small.png")}" alt="" />
      <div class="result-metrics">
        <div class="result-score"><strong>${quiz.score}</strong><small>/ ${quiz.questions.length}</small></div>
        <div class="result-time"><i>◴</i><span><small>ใช้เวลา</small><strong>${minutes} นาที ${seconds} วินาที</strong></span></div>
      </div>
      <div class="result-score-stars" aria-label="ตอบถูก ${quiz.score} จาก ${quiz.questions.length} ข้อ">${Array.from({ length: quiz.questions.length }, (_, index) => `<i class="${index < quiz.score ? "earned" : ""}"><svg viewBox="0 0 81 77" aria-hidden="true"><path d="M34.583 3.76402C36.5985 -1.2548 43.7033 -1.25479 45.7187 3.76403L52.1957 19.8931C53.0539 22.0303 55.0598 23.4876 57.3576 23.6434L74.6988 24.8193C80.0948 25.1851 82.2903 31.9422 78.1399 35.4099L64.8017 46.554C63.0343 48.0307 62.2682 50.3888 62.8301 52.6223L67.0705 69.478C68.39 74.723 62.642 78.8991 58.0615 76.0234L43.3411 66.7818C41.3906 65.5572 38.9112 65.5572 36.9606 66.7818L22.2402 76.0234C17.6597 78.8991 11.9118 74.723 13.2313 69.478L17.4717 52.6223C18.0336 50.3887 17.2674 48.0307 15.5 46.554L2.16187 35.4099C-1.98851 31.9422 0.207016 25.1851 5.60299 24.8193L22.9441 23.6434C25.242 23.4876 27.2478 22.0303 28.1061 19.8931L34.583 3.76402Z"/></svg></i>`).join("")}</div>
    </section>
    <section class="result-review-panel">
      <h3 class="review-title"><img src="${summaryAsset("summary-note.png")}" alt="" />สรุปผลคะแนน</h3>
      <ol class="review-list">${review}</ol>
    </section>
    <img class="result-island" src="${summaryAsset("summary-island-big.png")}" alt="" aria-hidden="true" />
  </div>`, { dismissible: false, primaryLabel: "ตกลง", onPrimary: () => {
    const result = { score: quiz.score, maxScore: quiz.questions.length, durationMs, answers: quiz.answers };
    postToHost("lesson.complete", { lessonId: runtime.lessonData.Id, lessonVersion: runtime.lesson.version || "1.0.0", status: "completed", ...result });
    postToHost("lesson.closeRequested");
  } });
}
async function beginQuiz() { closeModal(); runtime.completed = false; runtime.quiz = { questions: shuffle(runtime.meta.quiz).slice(0, Math.min(5, runtime.meta.quiz.length)), index: 0, score: 0, answers: [], pendingAnswer: null, acceptingAnswers: false, startedAt: Date.now() }; await showQuestion(0); }
function readyQuiz() { const art = runtimeAssetUrl(setting.entry.quizWelcomeImagePath || setting.entry.loadingImagePath || setting.entry.imagePath); showModal(`<div class="quiz-welcome"><div class="quiz-welcome-art"><img src="${art}" alt="" /><span class="mode-badge">PRE-TEST</span></div><div class="quiz-welcome-copy"><div class="quiz-divider"><span>ภารกิจทดสอบก่อนเรียน</span></div><h2>พร้อมเริ่มภารกิจทดสอบหรือยัง?</h2><p>ลองตอบหรือทำโจทย์อย่างน้อยหนึ่งครั้ง แล้วจึงส่งคำตอบเพื่อไปข้อต่อไป เราจะสรุปคะแนนพร้อมกันเมื่อทำครบ</p><div class="quiz-rules"><div>${iconMarkup("quiz-rule-count.svg")}<b>${Math.min(5, runtime.meta.quiz.length)} ข้อ</b><small>สุ่มจาก ${runtime.meta.quiz.length} ข้อ</small></div><div>${iconMarkup("quiz-rule-try.svg")}<b>ลองก่อนส่ง</b><small>ตอบถูกหรือผิดก็ส่งได้</small></div><div>${iconMarkup("quiz-rule-trophy.svg")}<b>สรุปท้ายเกม</b><small>ดูคะแนนพร้อมกัน</small></div></div></div></div>`, { dismissible: false, primaryLabel: "เริ่มภารกิจ", onPrimary: beginQuiz }); }

const lessonUi = Object.freeze({
  steps: Object.freeze({ setNextEnabled: setLabNextEnabled }),
  question: guiService.question,
  guiAnswer: guiService.guiAnswer,
  console: guiService.console,
  topMessage: guiService.topMessage,
  choice: guiService.choice,
  gizmo: guiService.gizmo,
  worldOption: guiService.worldOption,
  worldGuiSystem,
  clickme,
  feedback: guiService.feedback,
  dialog: guiService.dialog,
  insight: guiService.insight,
  intro: introService,
  control: guiService.control,
  hint: guiService.hint,
  busy: guiService.busy,
  // Compatibility API: บทเรียนเดิมยังทำงาน และภายในส่งต่อไปยัง GUI Service ใหม่
  toast: showToast,
  setObjective(message) { guiService.console.setObjective(message); },
  setQuestion: setLessonQuestion,
  clearQuestion() { setLessonQuestion(""); },
  setProgress(current, total) { postToHost("lesson.progress", { current, total }); }
});
function createContext(root, language) { return Object.freeze({ world, assets: world.assets, capabilities: world.capabilities, ui: lessonUi, audio: Object.freeze({ play: name => audio.play(name) }), root, lessonData: runtime.lessonData, mode: runtime.mode, language, resolveAsset: path => runtimeAssetUrl(path, runtime.lessonUrl), objectiveAction, quiz: Object.freeze({ answer: answerQuiz }), complete(result = {}) { clickme.clearAll(); if (!runtime.completed) { runtime.completed = true; audio.play("completeLesson"); celebrate(); } postToHost("lesson.complete", { lessonId: runtime.lessonData.Id, lessonVersion: runtime.lesson.version || "1.0.0", status: "completed", ...result }); } }); }
async function closeLesson() { runtime.sessionId += 1; runtime.preview = false; runtimeSettingMenu?.setPreviewMode(false); syncDebugHud(); introService.close({ notify: false, reason: "lesson-close" }); try { await runtime.lesson?.dispose?.(); } catch (error) { console.warn(error); } audio.stopBgm(); clearTypewriters(); guiService.clearAll(); resetMascotTimers(); clearTimeout(runtime.mascotBlinkTimer); clearTimeout(runtime.mascotBlinkReleaseTimer); runtime.pendingMascotOption = null; hideMascotNotice(); quizNextButton.hidden = true; quizNextButton.classList.remove("is-returning"); quizNextButton.classList.add("is-waiting"); quizNextButton.disabled = true; runtime.lesson = null; runtime.meta = null; runtime.lessonData = null; runtime.context = null; runtime.quiz = null; runtime.completed = false; clearWorld(); setLessonQuestion(""); elements.lessonUi.replaceChildren(); elements.webRoot.replaceChildren(); elements.webRoot.hidden = true; elements.stepOption.hidden = true; elements.stepOption.replaceChildren(); elements.celebration.replaceChildren(); elements.mascot.hidden = true; elements.mascot.className = "mascot-guide"; elements.mascotCharacter.classList.remove("is-blinking"); closeModal(); configureCamera(); elements.runtime.className = ""; elements.title.textContent = "World Runtime"; elements.taxonomy.textContent = "กำลังรอบทเรียนจาก Platform"; }
const lessonFailureStages = {
  receive: ["การรับไฟล์บทเรียน", "ตรวจว่าไฟล์ HTML ที่เลือกอ่านได้ครบและไม่ว่าง"],
  fetch: ["การโหลดไฟล์บทเรียน", "ตรวจ path, ชื่อไฟล์, ตัวพิมพ์เล็ก–ใหญ่ และ HTTP status"],
  structure: ["การตรวจโครงสร้าง HTML", "ตรวจ script[data-lesson-app], HTML shell และจำนวน lesson definition"],
  execute: ["การรัน JavaScript ของบทเรียน", "ตรวจ syntax, ชื่อฟังก์ชัน ตัวแปร และบรรทัดแรกใน stack trace"],
  register: ["การลงทะเบียนบทเรียน", "ตรวจ PuzzleLesson.define(...) และ lifecycle โดยเฉพาะ mount(context)"],
  metadata: ["การตรวจข้อมูลบทเรียน", "ตรวจ meta, defaultValue, editSchema, howto และ quiz"],
  assets: ["การเตรียมฉากและสื่อ", "ตรวจ background, Asset ID, path ของสื่อ และชนิดไฟล์"],
  mount: ["การเริ่มบทเรียน", "ตรวจ mount(context) และ Public API ที่เรียกขณะเริ่มงาน"],
  reset: ["การสร้างฉากเริ่มต้น", "ตรวจ reset(payload), values, handle และ object ที่สร้างในฉาก"],
  finish: ["การแสดงบทเรียน", "ตรวจ onStep, Quiz setup และ state หลังสร้างฉาก"],
  unknown: ["การเตรียมบทเรียน", "ตรวจข้อความ Error และบรรทัดแรกของ stack trace"]
};
function createLessonFailure(error, stage, lessonData) {
  const rawMessage = String(error?.message || error || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
  const missingHelper = rawMessage.match(/this\.([A-Za-z_$][\w$]*) is not a function/i)?.[1];
  const [defaultTopic, defaultHint] = lessonFailureStages[stage] || lessonFailureStages.unknown;
  const topic = missingHelper ? ` helper ของบทเรียนที่ไม่ได้ประกาศ (${missingHelper})` : defaultTopic;
  const hint = missingHelper
    ? `เพิ่ม method ${missingHelper}() ใน object ที่ส่งให้ PuzzleLesson.define(...) หรือแก้ชื่อที่เรียกให้ตรงกัน; this.${missingHelper}() ไม่ใช่ Public API ของระบบ`
    : defaultHint;
  const stack = String(error?.stack || rawMessage);
  const line = stack.split("\n").find(value => /(?:\.html|lesson|<anonymous>).*:\d+(?::\d+)?/i.test(value));
  const location = line ? `${hint} · ${line.trim()}` : hint;
  const log = [
    "LESSON_LOAD_FAILED",
    `Stage: ${stage} (${topic})`,
    `Lesson: ${lessonData?.path || "unknown"}`,
    `Mode: ${lessonData?.mode || "unknown"}`,
    `Error: ${rawMessage}`,
    ...(missingHelper ? [`Missing lesson helper: ${missingHelper}()`] : []),
    "",
    "Stack:",
    stack,
    "",
    "สิ่งที่ต้องการให้ AI ทำ:",
    "ตรวจและซ่อมไฟล์บทเรียน HTML จาก error นี้ โดยรักษา Public API และคืนไฟล์ฉบับเต็ม"
  ].join("\n");
  return { title: "เปิดบทเรียนไม่สำเร็จ", message: `พบปัญหาเกี่ยวกับ${topic}: ${rawMessage}`, location, log, stage };
}

async function openLesson(payload) {
  const { lessonData, language, lessonHtml } = payload;
  runtime.fullScreen = payload.fullScreen !== false;
  elements.runtime.dataset.fullScreen = String(runtime.fullScreen);
  const sessionId = runtime.sessionId + 1;
  await closeLesson();
  runtime.preview = lessonData.preview === true;
  runtimeSettingMenu?.setPreviewMode(runtime.preview);
  runtime.lastOpenPayload = payload;
  window.eduRuntimeConsoleErrors = [];
  runtime.sessionId = sessionId; runtime.language = language || "th"; beginEntry(lessonData.title, entryUnitTitle(lessonData));
  let failureStage = lessonHtml ? "receive" : "fetch";
  try {
    updateEntry(18, lessonHtml ? "กำลังรับเนื้อหาบทเรียน…" : "กำลังโหลดเนื้อหาบทเรียน…");
    const lessonUrl = new URL(lessonData.path);
    if (lessonUrl.origin !== location.origin) throw new Error("รองรับเฉพาะ lesson ที่อยู่ origin เดียวกัน");
    let html = typeof lessonHtml === "string" ? lessonHtml : "";
    if (!html) {
      const response = await fetch(`${lessonUrl.href}${lessonUrl.search ? "&" : "?"}v=${encodeURIComponent(runtimeAssetVersion)}`);
      if (!response.ok) throw new Error(`ไม่พบไฟล์บทเรียน (${response.status})`);
      html = await response.text();
    }
    failureStage = "structure";
    updateEntry(36, "กำลังตรวจสอบโครงสร้างบทเรียน…");
    const doc = new DOMParser().parseFromString(html, "text/html"), script = doc.querySelector("script[data-lesson-app]");
    if (!script) throw new Error("ไม่พบ script[data-lesson-app] ภายในไฟล์บทเรียน");
    let registered = null; const previous = window.PuzzleLesson;
    window.PuzzleLesson = Object.freeze({ define(app) { if (registered) throw new Error("หนึ่งไฟล์กำหนด lessonApp ได้เพียงหนึ่งตัว"); registered = app; } });
    failureStage = "execute";
    window.eduRuntimeLastError = null;
    try { const executable = document.createElement("script"); executable.textContent = `${script.textContent}\n//# sourceURL=${lessonUrl.href}`; document.head.append(executable); executable.remove(); if (window.eduRuntimeLastError) throw window.eduRuntimeLastError; }
    finally { if (previous === undefined) delete window.PuzzleLesson; else window.PuzzleLesson = previous; }
    failureStage = "register";
    if (!registered?.mount) throw new Error("lessonApp ต้องมี mount(context)");
    failureStage = "metadata";
    runtime.lesson = registered; runtime.lessonUrl = lessonUrl; runtime.mode = lessonData.mode; syncDebugHud(); runtime.meta = normalizeMeta(registered.meta, lessonData); runtime.lessonData = resolveLessonDisplayData(lessonData, runtime.meta); runtime.values = { ...runtime.meta.defaultValue }; runtime.stepIndex = 0; guiService.control.setLessonPhase(runtime.mode === "student-quiz" ? "quiz" : runtime.meta.howto.length ? "teaching" : "lab"); configureCamera(runtime.meta.camera || {}); elements.entryTitle.textContent = runtime.lessonData.title; setEntryCategory(entryUnitTitle(runtime.lessonData));
    updateEntry(55, "กำลังเตรียมสื่อและคำแนะนำ…", runtime.meta.welcomeMessage);
    if (runtime.mode === "student-quiz" && !runtime.meta.quiz.length) throw new Error("บทเรียน Quiz ต้องมีคำถามอย่างน้อย 1 ข้อ");
    failureStage = "assets";
    const preset = setBackground(runtime.meta.background);
    await audio.preload(preset);
    updateEntry(76, "กำลังจัดฉากและระบบเสียง…"); applyRuntimeUi();
    const root = runtime.meta.worldType === "webPage" ? elements.webRoot : document.createElement("div"); root.className = "lesson-html-root";
    for (const child of [...doc.body.children]) if (!child.matches("script")) root.append(document.importNode(child, true));
    if (runtime.meta.worldType !== "webPage") elements.lessonUi.append(root);
    failureStage = "mount";
    runtime.context = createContext(root, language); await runtime.lesson.mount(runtime.context);
    if (sessionId !== runtime.sessionId) return;
    failureStage = "reset";
    await resetLessonScene(); markSceneActive();
    failureStage = "finish";
    updateEntry(92, "ตรวจสอบความพร้อมครั้งสุดท้าย…"); await finishEntry();
    if (runtime.mode === "student-quiz") readyQuiz(); else await setStep(0);
  } catch (error) {
    const failure = createLessonFailure(error, failureStage, lessonData);
    console.error(error); elements.entryTitle.textContent = "เปิดบทเรียนไม่สำเร็จ"; updateEntry(100, error.message); elements.title.textContent = "เปิดบทเรียนไม่สำเร็จ"; elements.taxonomy.textContent = error.message; window.eduShowRuntimeFailure?.(failure); postToHost("lesson.error", failure);
  }
}

window.eduRuntimeRetryHandler = () => {
  const payload = runtime.lastOpenPayload;
  if (!payload) return;
  window.eduHideRuntimeFailure?.();
  openLesson(payload);
};

function bindLessonCloseButton(button) {
  if (!button) return;
  let touchRequestPending = false;
  const requestClose = () => postToHost("lesson.closeRequested");
  button.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" || event.isPrimary === false) return;
    event.preventDefault();
    event.stopPropagation();
    touchRequestPending = true;
    requestClose();
    window.setTimeout(() => { touchRequestPending = false; }, 800);
  }, { passive: false });
  button.addEventListener("click", event => {
    if (touchRequestPending) {
      event.preventDefault();
      event.stopPropagation();
      touchRequestPending = false;
      return;
    }
    requestClose();
  });
}

bindLessonCloseButton($("#close-runtime"));
bindLessonCloseButton($("#entry-close"));
$("#show-information").addEventListener("click", showInformation); $("#edit-lesson").addEventListener("click", showEditor); $("#previous-step").addEventListener("click", () => setStep(runtime.stepIndex - 1)); $("#next-step").addEventListener("click", () => setStep(runtime.stepIndex + 1)); $("#reset-lesson").addEventListener("click", async () => { uiSound(); runtime.values = { ...runtime.meta.defaultValue }; if (runtime.mode === "student-quiz") readyQuiz(); else { await resetLessonScene(); await setStep(0); } }); $("#next-question").addEventListener("click", async () => { if (quizNextButton.disabled || !runtime.quiz?.acceptingAnswers) return; runtime.quiz.acceptingAnswers = false; hideQuizNext(); uiSound(); commitQuizAnswer(); await playQuizMascotReaction(); await showQuestion(runtime.quiz.index + 1); });
elements.mascotNotice.addEventListener("click", () => { uiSound(); revealPendingMascotOption(); });
window.addEventListener("message", event => { if (event.origin !== location.origin || event.source !== window.parent || event.data?.channel !== "edu-widget") return; if (event.data.type === "host.openLesson") openLesson(event.data.payload); if (event.data.type === "host.closeLesson") closeLesson(); if (event.data.type === "host.toggleRuntimeSetting" && !runtime.preview) runtimeSettingMenu?.toggle(); });
postToHost("runtime.ready");
let guiDebugSnapshot = null;
const worldDebugDisplays = new Map();
function captureGuiDebugSnapshot() {
  if (guiDebugSnapshot) return;
  guiDebugSnapshot = {
    question: { hidden: elements.lessonQuestion.hidden, label: elements.lessonQuestionLabel.textContent, text: elements.lessonQuestionText.textContent, tone: elements.lessonQuestion.dataset.tone || "primary" },
    answer: { hidden: elements.guiAnswer?.hidden !== false, ...guiService.guiAnswer.state },
    console: { objective: elements.objective.textContent, title: elements.stepTitle.textContent, message: elements.stepDescription.textContent, quizMessage: elements.question.textContent, labClass: elements.howto.className, quizClass: elements.quizPanel.className, icon: elements.consoleStateImage.src }
  };
}
function clearGuiDebug() {
  guiService.clearScope("debug");
  guiService.guiAnswer.hide();
  worldGuiSystem.clear("debug");
  for (const handle of worldDebugDisplays.values()) handle.remove();
  worldDebugDisplays.clear();
  if (!guiDebugSnapshot) return;
  const snapshot = guiDebugSnapshot;
  if (snapshot.question.hidden) guiService.question.hide(); else guiService.question.show(snapshot.question);
  if (snapshot.answer.hidden) guiService.guiAnswer.hide(); else guiService.guiAnswer.show(snapshot.answer);
  elements.objective.textContent = snapshot.console.objective; elements.stepTitle.textContent = snapshot.console.title; elements.stepDescription.textContent = snapshot.console.message; elements.question.textContent = snapshot.console.quizMessage; elements.howto.className = snapshot.console.labClass; elements.quizPanel.className = snapshot.console.quizClass; elements.consoleStateImage.src = snapshot.console.icon; guiDebugSnapshot = null; syncConsoleDockHeight();
}
function guiLabAction(action, payload) {
  if (action === "clear") { clearGuiDebug(); return { action, cleared: true }; }
  captureGuiDebugSnapshot(); const message = String(payload.text || "ตัวอย่าง GUI Service"), tone = payload.tone || "primary", service = payload.service;
  if (service === "question") guiService.question.show({ label: "GUI LAB", text: message, tone });
  else if (service === "gui-answer") {
    const options = { label: "คำตอบ", text: message };
    if (tone === "success") guiService.guiAnswer.correct(options);
    else if (tone === "error") guiService.guiAnswer.wrong(options);
    else guiService.guiAnswer.show(options);
  }
  else if (service === "console") guiService.console.set({ objective: "GUI Service Debug", title: "Console Preview", message, tone, icon: "book" });
  else if (service === "top-message") {
    const existing = guiService.topMessage.current; if (existing && action === "update") existing.update({ message, tone }); else guiService.topMessage.show({ id: "debug-top-message", scope: "debug", title: "ข้อความด้านบน", message, tone, duration: 0, dismissible: true, icon: "info.svg" });
  }
  else if (service === "choice") {
    const existing = guiService.choice.get("debug-choice");
    if (existing && action === "update") existing.update({ title: message, tone });
    else { existing?.remove(); guiService.choice.show({ id: "debug-choice", scope: "debug", title: message, tone, items: [{ id: "a", label: "ตัวเลือก A" }, { id: "b", label: "ตัวเลือก B" }, { id: "c", label: "ตัวเลือก C" }], objectiveAction: false, onSelect: event => console.info("[GUI Service Lab] choice.select", event) }); }
  } else if (service === "gizmo") {
    const target = selected || interactive[0], existing = guiService.gizmo.get("debug-gizmo");
    if (existing && action === "update") existing.update({ text: message, tone });
    else { existing?.remove(); if (target) guiService.gizmo.attach(target.userData?.lessonHandle || target, { id: "debug-gizmo", scope: "debug", type: "label", text: message, tone, worldOffset: [0, 2, 0] }); else guiService.gizmo.at([0, 2.5, 0], { id: "debug-gizmo", scope: "debug", type: "label", text: message, tone }); }
  } else if (service === "world-gui-system") {
    const target = selected || interactive[0], existing = worldGuiSystem.get("debug-world-gui-system");
    if (existing && action === "update") existing.update({ text: message, tone });
    else { existing?.remove(); if (target) worldGuiSystem.attach(target.userData?.lessonHandle || target, { id: "debug-world-gui-system", scope: "debug", text: message, tone }); else worldGuiSystem.at([0, 2.5, 0], { id: "debug-world-gui-system", scope: "debug", text: message, tone }); }
  } else if (service === "world-counter") {
    let existing = worldDebugDisplays.get(service); const requested = Number.parseInt(message, 10), nextValue = Number.isFinite(requested) ? requested : (existing?.getValue?.() ?? 0) + (action === "update" ? 1 : 0);
    if (existing && action === "update") existing.setValue(nextValue);
    else { existing?.remove(); existing = world.addWorldCounter({ name: "debug-world-counter", position: [0, .28, 2.1], value: nextValue || 12, digits: 3 }); worldDebugDisplays.set(service, existing); }
  } else if (service === "world-gui") {
    let existing = worldDebugDisplays.get(service);
    if (existing && action === "update") existing.setText(message);
    else { existing?.remove(); existing = world.addWorldGui({ name: "debug-world-gui", position: [0, .24, 4.4], text: message, size: [5.2, 1.6] }); worldDebugDisplays.set(service, existing); }
  } else if (service === "feedback") {
    const existing = guiService.feedback.get("debug-feedback"); if (existing && action === "update") existing.update({ message, tone }); else { existing?.remove(); guiService.feedback.show({ id: "debug-feedback", scope: "debug", title: "Feedback", message, tone, duration: 0, dismissible: true, icon: "book.svg" }); }
  } else if (service === "dialog") {
    const existing = guiService.dialog.get("debug-dialog"); if (existing && action === "update") existing.update({ message, tone }); else guiService.dialog.show({ id: "debug-dialog", scope: "debug", title: "Dialog ของบทเรียน", message, tone, primaryLabel: "ตกลง", secondaryLabel: "ยกเลิก", dismissible: true });
  } else if (service === "control-top" || service === "control-middle" || service === "control-bottom") {
    const position = service === "control-top" ? "top-right" : service === "control-bottom" ? "bottom-right" : "middle-right", existing = guiService.control.get("debug-control"), items = [{ id: "play", label: "เล่น", icon: "next.svg" }, { id: "reset", label: "เริ่มใหม่", icon: "home.svg" }]; if (existing && action === "update") existing.update({ items, tone, position, ariaLabel: message }); else { existing?.remove(); guiService.control.show({ id: "debug-control", scope: "debug", items, tone, position, ariaLabel: message, onAction: event => console.info("[GUI Service Lab] control.action", event) }); }
  } else if (service === "hint") {
    const existing = guiService.hint.get("debug-hint"); if (existing && action === "update") existing.update({ title: "คำแนะนำ", message, tone }); else { existing?.remove(); guiService.hint.show({ id: "debug-hint", scope: "debug", title: "คำแนะนำ", message, type: "instruction" }); }
  } else if (service === "busy") {
    const existing = guiService.busy.current; if (existing && action === "update") existing.update({ message, tone, progress: .72 }); else guiService.busy.show({ id: "debug-busy", scope: "debug", title: "กำลังเตรียมกิจกรรม", message, tone, progress: .38 });
  } else throw new Error(`GUI_SERVICE_DEBUG_UNKNOWN: ไม่รู้จัก service ${service}`);
  markSceneActive(); return { action, service, tone, text: message, target: service === "gizmo" ? (selected?.name || interactive[0]?.name || "world [0,2.5,0]") : service.startsWith("world-") ? "world-space" : undefined, active: guiService.counts };
}
const runtimeSettingMenu = runtimeSettingTools.setupRuntimeSettingMenu({
  setting,
  baseline: runtimeSettingBaseline,
  debugEnabled: setting.debugHUD === true,
  getMode: () => runtime.mode,
  onApply: async () => {
    if (runtime.lessonData) runtimeSettingTools.saveRuntimeLessonRestore({ lessonData: structuredClone(runtime.lessonData), language: runtime.language });
    location.reload();
  },
  onRestore: async () => {
    if (runtime.lessonData) runtimeSettingTools.saveRuntimeLessonRestore({ lessonData: structuredClone(runtime.lessonData), language: runtime.language });
    location.reload();
  },
  onRefresh: async () => {
    if (!runtime.lessonData) throw new Error("ยังไม่มีบทเรียนที่เปิดอยู่");
    runtimeSettingTools.saveRuntimeLessonRestore({ lessonData: structuredClone(runtime.lessonData), language: runtime.language });
    sessionStorage.setItem("edu-runtime-force-asset-version", String(Date.now()));
    location.reload();
  },
  onRetest: ({ mode } = {}) => requestRetest(mode),
  onToggleDebugArea: force => toggleDebugArea(force),
  onGuiLabAction: guiLabAction
});
let modeSwitching = false;
async function requestRetest(mode) {
  if (["teacher-lab", "student-quiz"].includes(mode) && (runtime.preview || setting.debugHUD === true)) {
    if (modeSwitching || !runtime.lastOpenPayload?.lessonData || runtime.mode === mode) return;
    modeSwitching = true;
    try {
      const previous = runtime.lastOpenPayload;
      await openLesson({ ...previous, lessonData: { ...previous.lessonData, mode } });
    } finally {
      modeSwitching = false;
    }
    return;
  }
  postToHost("lesson.retestRequested", mode ? { mode } : {});
}
elements.debugHud?.addEventListener("click", event => {
  const button = event.target.closest("[data-debug-action]");
  if (!button) return;
  if (runtime.preview && button.dataset.debugAction !== "switch-mode") return;
  uiSound();
  if (button.dataset.debugAction === "refresh") requestRetest();
  else if (button.dataset.debugAction === "panel") runtimeSettingMenu.toggle();
  else if (button.dataset.debugAction === "switch-mode") requestRetest(runtime.mode === "student-quiz" ? "teacher-lab" : "student-quiz");
});
syncDebugHud();
const restoredRuntimeLesson = runtimeSettingTools.consumeRuntimeLessonRestore();
if (restoredRuntimeLesson) queueMicrotask(() => openLesson(restoredRuntimeLesson));
