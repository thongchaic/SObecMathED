import * as THREE from "three";

const VALID_SCOPES = new Set(["lesson", "scene", "step", "question", "debug", "manual"]);
const VALID_TONES = new Set(["default", "primary", "info", "success", "warning", "error"]);
const VALID_GIZMO_TYPES = new Set(["label", "badge", "value", "icon", "image"]);
const VALID_CONTROL_POSITIONS = new Set(["top-right", "middle-right", "bottom-right"]);
const INSIGHT_TAGS = new Set(["p", "strong", "em", "b", "i", "br", "ul", "ol", "li", "div", "section", "span", "code", "small", "mark", "img"]);
const INSIGHT_CLASSES = new Set(["insight-lead", "insight-equation", "insight-steps", "insight-note", "insight-grid", "insight-card", "insight-card-image", "insight-card-name", "insight-arrow", "insight-result", "insight-muted", "insight-diagram"]);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const text = value => String(value ?? "").trim();

function safeCallback(callback, payload, label) {
  if (typeof callback !== "function") return;
  try { return callback(payload); } catch (error) { console.error(`GUI_SERVICE_CALLBACK_ERROR: ${label}`, error); }
}

function normalizeScope(value, defaultScope = "scene") {
  const scope = text(value) || defaultScope;
  if (!VALID_SCOPES.has(scope)) throw new Error(`GUI_SERVICE_SCOPE_INVALID: ไม่รองรับ scope "${scope}"`);
  return scope;
}

function normalizeTone(value) { const tone = text(value) || "default"; return VALID_TONES.has(tone) ? tone : "default"; }
function normalizeItems(items) {
  if (!Array.isArray(items)) throw new Error("GUI_CHOICE_ITEMS_INVALID: items ต้องเป็น Array");
  return items.map((item, index) => typeof item === "object" && item !== null ? { ...item, id: String(item.id ?? item.value ?? index), label: String(item.label ?? item.value ?? item.id ?? index) } : { id: String(item), label: String(item) });
}

function safeInsightFragment(value, resolveAsset) {
  const template = document.createElement("template"), fragment = document.createDocumentFragment();
  template.innerHTML = String(value ?? "");
  const append = (node, parent) => {
    if (node.nodeType === Node.TEXT_NODE) { parent.append(document.createTextNode(node.textContent || "")); return; }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const tag = node.tagName.toLowerCase();
    if (!INSIGHT_TAGS.has(tag)) { for (const child of node.childNodes) append(child, parent); return; }
    const element = document.createElement(tag), classes = [...node.classList].filter(name => INSIGHT_CLASSES.has(name));
    if (classes.length) element.className = classes.join(" ");
    if (tag === "ol" && /^\d+$/.test(node.getAttribute("start") || "")) element.setAttribute("start", node.getAttribute("start"));
    if (tag === "img") {
      // Insight รับเฉพาะภาพ asset ภายในโปรเจกต์ ไม่เปิดช่องให้ lesson ฝัง URL ภายนอก
      const source = String(node.getAttribute("src") || "").trim();
      if (!/^(?:\.\.?\/)*assets\//.test(source)) return;
      element.setAttribute("src", typeof resolveAsset === "function" ? resolveAsset(source) : source);
      element.setAttribute("alt", String(node.getAttribute("alt") || "").slice(0, 120));
      element.setAttribute("loading", "lazy");
      element.setAttribute("draggable", "false");
    }
    for (const child of node.childNodes) append(child, element);
    parent.append(element);
  };
  for (const child of template.content.childNodes) append(child, fragment);
  return fragment;
}

export function createGuiService({ setting, elements, camera, iconUrl, resolveAsset, objectiveAction, animateConsole, typeText, getMode, onChoiceShow, onHintShow, onHintHide, playUiSound }) {
  const scopes = new Map(), choices = new Map(), gizmos = new Map(), worldOptions = new Map(), feedbacks = new Map(), dialogs = new Map(), controls = new Map(), controlEntries = new Map(), hints = new Map(), projected = new THREE.Vector3(), worldPoint = new THREE.Vector3(), viewPoint = new THREE.Vector3();
  let sequence = 0, topMessageHandle = null, questionState = { label: setting.ui?.questionPanel?.label || "โจทย์", text: "", tone: "primary" };
  let lessonControlPhase = "lab";
  const motionDuration = Math.max(80, Number(setting.ui?.animation?.serviceExitDuration ?? 180));
  function showAnimated(element) { clearTimeout(element.__guiMotionTimer); element.hidden = true; element.classList.remove("is-leaving", "is-entering"); void element.offsetWidth; element.classList.add("is-entering"); element.hidden = false; element.__guiMotionTimer = setTimeout(() => element.classList.remove("is-entering"), 360); }
  function hideAnimated(element, after, remove = false) { clearTimeout(element.__guiMotionTimer); element.classList.remove("is-entering"); element.classList.add("is-leaving"); element.__guiMotionTimer = setTimeout(() => { element.classList.remove("is-leaving"); if (remove) element.remove(); else element.hidden = true; after?.(); }, motionDuration); }
  const updateObservedSize = (element, width, height) => { const entry = element.dataset.worldOptionId ? worldOptions.get(element.dataset.worldOptionId) : gizmos.get(element.dataset.gizmoId); if (entry) { entry.width = width || 80; entry.height = height || 32; } };
  // ResizeObserver ใช้ลด layout read ระหว่าง render; fallback นี้รองรับ WebView รุ่นเก่าโดยวัดเพียงครั้งหลังสร้าง/แก้เนื้อหา
  const gizmoSizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(entries => { for (const item of entries) updateObservedSize(item.target, item.contentRect.width, item.contentRect.height); }) : {
    observe(element) { requestAnimationFrame(() => { const bounds = element.getBoundingClientRect(); updateObservedSize(element, bounds.width, bounds.height); }); },
    unobserve() { }
  };

  function scopeSet(scope) { if (!scopes.has(scope)) scopes.set(scope, new Set()); return scopes.get(scope); }
  function register(handle, scope) { scopeSet(scope).add(handle); return handle; }
  function unregister(handle, scope) { const values = scopes.get(scope); values?.delete(handle); if (values && !values.size) scopes.delete(scope); }
  function clearScope(...names) { for (const name of names.flat()) { const values = scopes.get(name); if (!values) continue; for (const handle of [...values]) handle.remove(); scopes.delete(name); } }
  function clearAll() { for (const values of [...scopes.values()]) for (const handle of [...values]) handle.remove(); scopes.clear(); question.hide(); consoleService.reset(); }

  function applySettings() {
    const root = document.documentElement, questionSetting = setting.ui?.questionPanel || {}, consoleSetting = setting.ui?.console || {}, topMessageSetting = setting.ui?.topMessage || {}, choiceSetting = setting.ui?.choice || {}, gizmoSetting = setting.ui?.gizmo || {}, worldOptionSetting = setting.ui?.worldOption || {}, feedbackSetting = setting.ui?.feedback || {}, dialogSetting = setting.ui?.dialog || {}, controlSetting = setting.ui?.control || {}, hintSetting = setting.ui?.hint || {}, busySetting = setting.ui?.busy || {}, desktop = consoleSetting.desktop || {}, mobile = consoleSetting.mobile || {};
    const variables = {
      "--lesson-question-bg": questionSetting.background, "--lesson-question-border": questionSetting.borderColor, "--lesson-question-text": questionSetting.textColor, "--lesson-question-label": questionSetting.labelColor, "--lesson-question-icon-bg": questionSetting.iconBackground, "--lesson-question-radius": questionSetting.radius, "--lesson-question-font-size": questionSetting.fontSize, "--lesson-question-felt-bg": questionSetting.feltBackground, "--lesson-question-felt-border": questionSetting.feltBorderColor, "--lesson-question-felt-icon-bg": questionSetting.feltIconBackground,
      "--gui-console-width": desktop.width, "--gui-console-quiz-width": desktop.quizWidth, "--gui-console-bottom": desktop.bottom, "--gui-console-min-height": desktop.minHeight,
      "--gui-console-width-mobile": mobile.width, "--gui-console-bottom-mobile": mobile.bottom, "--gui-console-min-height-mobile": mobile.minHeight,
      "--gui-console-bg-start": consoleSetting.backgroundStart, "--gui-console-bg-end": consoleSetting.backgroundEnd, "--gui-console-border": consoleSetting.borderColor, "--gui-console-text": consoleSetting.textColor, "--gui-console-objective": consoleSetting.objectiveColor, "--gui-console-radius": consoleSetting.radius, "--gui-console-icon-size": consoleSetting.iconSize,
      "--gui-top-message-width": topMessageSetting.width, "--gui-top-message-bg": topMessageSetting.background, "--gui-top-message-border": topMessageSetting.borderColor, "--gui-top-message-text": topMessageSetting.textColor, "--gui-top-message-radius": topMessageSetting.radius, "--gui-top-message-font-size": topMessageSetting.fontSize,
      "--gui-choice-max-width": choiceSetting.maxWidth, "--gui-choice-gap": choiceSetting.gap, "--gui-choice-bottom-gap": choiceSetting.bottomGap, "--gui-choice-bg": choiceSetting.background, "--gui-choice-border": choiceSetting.borderColor, "--gui-choice-text": choiceSetting.textColor, "--gui-choice-selected": choiceSetting.selectedColor, "--gui-choice-radius": choiceSetting.radius,
      "--gui-choice-item-min-width": choiceSetting.itemMinWidth,
      "--gui-gizmo-bg": gizmoSetting.background, "--gui-gizmo-border": gizmoSetting.borderColor, "--gui-gizmo-text": gizmoSetting.textColor, "--gui-gizmo-radius": gizmoSetting.radius, "--gui-gizmo-font-size": gizmoSetting.fontSize,
      "--gui-world-option-bg": worldOptionSetting.background, "--gui-world-option-border": worldOptionSetting.borderColor, "--gui-world-option-text": worldOptionSetting.textColor, "--gui-world-option-title": worldOptionSetting.titleColor, "--gui-world-option-radius": worldOptionSetting.radius, "--gui-world-option-button-bg": worldOptionSetting.buttonBackground, "--gui-world-option-button-hover": worldOptionSetting.buttonHover,
      "--gui-feedback-bg": feedbackSetting.background, "--gui-feedback-border": feedbackSetting.borderColor, "--gui-feedback-text": feedbackSetting.textColor, "--gui-feedback-radius": feedbackSetting.radius, "--gui-feedback-width": feedbackSetting.maxWidth,
      "--gui-dialog-bg": dialogSetting.background, "--gui-dialog-border": dialogSetting.borderColor, "--gui-dialog-text": dialogSetting.textColor, "--gui-dialog-radius": dialogSetting.radius, "--gui-dialog-width": dialogSetting.maxWidth,
      "--gui-control-bg": controlSetting.background, "--gui-control-border": controlSetting.borderColor, "--gui-control-text": controlSetting.textColor, "--gui-control-radius": controlSetting.radius, "--gui-control-edge": controlSetting.edge, "--gui-control-button-bg": controlSetting.buttonBackground, "--gui-control-button-hover": controlSetting.buttonHover, "--gui-control-button-radius": controlSetting.buttonRadius,
      "--gui-hint-bg-start": hintSetting.backgroundStart, "--gui-hint-bg-end": hintSetting.backgroundEnd, "--gui-hint-border": hintSetting.borderColor, "--gui-hint-text": hintSetting.textColor, "--gui-hint-secondary": hintSetting.secondaryTextColor, "--gui-hint-radius": hintSetting.radius, "--gui-hint-felt-bg": hintSetting.feltBackground, "--gui-hint-felt-border": hintSetting.feltBorderColor,
      "--gui-busy-bg": busySetting.background, "--gui-busy-card-bg": busySetting.cardBackground, "--gui-busy-text": busySetting.textColor, "--gui-busy-radius": busySetting.radius
    };
    for (const [name, value] of Object.entries(variables)) if (value !== undefined && value !== null) root.style.setProperty(name, typeof value === "number" ? `${value}px` : String(value));
  }

  const question = Object.freeze({
    show(options = {}) {
      const value = typeof options === "string" ? { text: options } : options || {}; questionState = { ...questionState, ...value, text: text(value.text ?? value.message ?? questionState.text), label: text(value.label ?? questionState.label) || "โจทย์", tone: normalizeTone(value.tone ?? questionState.tone) };
      elements.questionLabel.textContent = questionState.label;
      elements.questionText.textContent = questionState.text; elements.question.dataset.tone = questionState.tone;
      elements.question.classList.remove("is-updating");
      if (questionState.text) { clearTimeout(elements.question.__guiMotionTimer); elements.question.hidden = false; elements.question.classList.remove("is-leaving"); elements.topMessageLayer?.classList.add("has-question"); void elements.question.offsetWidth; elements.question.classList.add("is-updating"); } else this.hide();
      return this;
    },
    update(options = {}) { return this.show(options); },
    hide() { questionState.text = ""; elements.question.classList.remove("is-updating"); elements.topMessageLayer?.classList.remove("has-question"); if (!elements.question.hidden) hideAnimated(elements.question); return this; },
    remove() { return this.hide(); }
  });

  function setConsoleTone(tone = "default") {
    const normalized = normalizeTone(tone);
    for (const panel of [elements.labConsole, elements.quizConsole]) {
      panel?.classList.remove("is-console-success", "is-console-error", "is-console-warning", "is-console-info", "is-console-primary");
      if (normalized !== "default") panel?.classList.add(`is-console-${normalized}`);
    }
  }
  const consoleService = Object.freeze({
    set(options = {}) {
      const value = typeof options === "string" ? { message: options } : options || {}, quiz = getMode() === "student-quiz";
      if (value.objective !== undefined) elements.objective.textContent = text(value.objective);
      if (value.title !== undefined && !quiz) typeText(elements.consoleTitle, text(value.title));
      if (value.message !== undefined) typeText(quiz ? elements.quizMessage : elements.consoleMessage, text(value.message));
      if (value.icon) { const name = text(value.icon); elements.consoleIcon.src = name.includes("/") ? resolveAsset(name) : iconUrl(name.endsWith(".svg") ? name : `${name}.svg`); }
      if (value.tone || value.state) setConsoleTone(value.tone || value.state);
      animateConsole(); return this;
    },
    update(options = {}) { return this.set(options); },
    feedback(message, { tone = "info" } = {}) { return this.set({ message, tone }); },
    setObjective(message) { elements.objective.textContent = text(message); return this; },
    reset() { setConsoleTone(); return this; }
  });

  function choiceImage(source, isIcon = false) {
    if (!source) return null; const image = document.createElement("img"), value = text(source);
    image.alt = ""; image.addEventListener("error", () => image.remove(), { once: true }); image.src = isIcon && !value.includes("/") ? iconUrl(value.endsWith(".svg") ? value : `${value}.svg`) : resolveAsset(value); return image;
  }
  function createChoice(options = {}) {
    const id = text(options.id) || `choice-${++sequence}`, scope = normalizeScope(options.scope), multiple = options.selection === "multiple", root = document.createElement("section"), title = document.createElement("strong"), itemsRoot = document.createElement("div"), state = { items: normalizeItems(options.items || []), selected: new Set([].concat(options.selected ?? []).map(String)), visible: true }; let removed = false;
    if (choices.has(id)) choices.get(id).remove();
    root.className = "gui-choice"; root.dataset.choiceId = id; root.dataset.layout = text(options.layout) || "auto"; root.dataset.tone = normalizeTone(options.tone || "primary"); root.setAttribute("aria-label", text(options.ariaLabel || options.title) || "ตัวเลือก"); title.className = "gui-choice-title"; itemsRoot.className = "gui-choice-items"; root.append(title, itemsRoot); elements.choiceDock.append(root); elements.choiceDock.hidden = false; onChoiceShow?.();
    function render() {
      root.dataset.layout = text(options.layout) || "auto"; root.dataset.tone = normalizeTone(options.tone || "primary"); root.setAttribute("aria-label", text(options.ariaLabel || options.title) || "ตัวเลือก"); title.textContent = text(options.title); title.hidden = !title.textContent; itemsRoot.replaceChildren();
      for (const item of state.items) { const button = document.createElement("button"); button.type = "button"; button.className = "gui-choice-item"; button.dataset.choiceValue = item.id; button.disabled = Boolean(item.disabled); button.setAttribute("aria-pressed", String(state.selected.has(item.id))); const media = choiceImage(item.icon, true) || choiceImage(item.image); if (media) button.append(media); const label = document.createElement("span"); label.textContent = item.label; button.append(label); button.addEventListener("click", () => { if (button.disabled) return; if (!multiple) state.selected.clear(); if (multiple && state.selected.has(item.id)) state.selected.delete(item.id); else state.selected.add(item.id); for (const child of itemsRoot.children) child.setAttribute("aria-pressed", String(state.selected.has(child.dataset.choiceValue))); if (options.objectiveAction !== false) objectiveAction(); safeCallback(options.onSelect, { id: item.id, value: item.value ?? item.id, item: { ...item }, selected: [...state.selected], handle }, `choice:${id}`); }); itemsRoot.append(button); }
    }
    function remove() { if (removed) return; removed = true; if (choices.get(id) === handle) choices.delete(id); unregister(handle, scope); hideAnimated(root, () => { if (!elements.choiceDock.children.length) elements.choiceDock.hidden = true; }, true); }
    const handle = Object.freeze({
      id, scope,
      update(next = {}) { Object.assign(options, next); if (next.items) state.items = normalizeItems(next.items); if (next.selected !== undefined) state.selected = new Set([].concat(next.selected).map(String)); render(); return this; },
      setItems(items) { state.items = normalizeItems(items); render(); return this; },
      setSelected(value) { state.selected = new Set([].concat(value ?? []).map(String)); render(); return this; },
      setDisabled(value, disabled = true) { const item = state.items.find(entry => entry.id === String(value)); if (item) item.disabled = disabled; render(); return this; },
      show() { state.visible = true; elements.choiceDock.hidden = false; showAnimated(root); onChoiceShow?.(); return this; },
      hide() { state.visible = false; if (!root.hidden) hideAnimated(root); return this; }, remove,
      get value() { return multiple ? [...state.selected] : [...state.selected][0] ?? null; }, get element() { return root; }
    });
    choices.set(id, handle); register(handle, scope); render(); showAnimated(root); return handle;
  }
  const choice = Object.freeze({ show: createChoice, create: createChoice, get(id) { return choices.get(String(id)) || null; }, clear(scope) { if (scope) clearScope(scope); else for (const handle of [...choices.values()]) handle.remove(); } });

  function targetObject(target) { return target?.object3D || target; }
  function renderGizmoContent(root, options) {
    root.replaceChildren(); const type = VALID_GIZMO_TYPES.has(options.type) ? options.type : "label"; root.dataset.type = type; root.dataset.tone = normalizeTone(options.tone || "default"); root.dataset.size = text(options.size || "default");
    const media = choiceImage(options.icon, true) || choiceImage(options.image); if (media) { media.className = "gui-gizmo-media"; root.append(media); }
    if (type !== "icon" && type !== "image") {
      const label = document.createElement("span"), segments = Array.isArray(options.segments) ? options.segments : null;
      label.className = segments?.length ? "gui-gizmo-segments" : "";
      if (segments?.length) for (const segment of segments) { const span = document.createElement("span"); span.textContent = text(segment?.text); if (segment?.color) span.style.color = String(segment.color); if (segment?.role) span.dataset.role = text(segment.role); label.append(span); }
      else label.textContent = text(options.text ?? options.value);
      root.append(label);
    }
    root.setAttribute("aria-label", text(options.ariaLabel || options.text || options.value || (Array.isArray(options.segments) ? options.segments.map(item => text(item?.text)).join("") : type)));
  }
  function createGizmo(target, options = {}) {
    const id = text(options.id) || `gizmo-${++sequence}`, scope = normalizeScope(options.scope), root = document.createElement("div"), leader = document.createElement("i"), entry = { id, target, options: { placement: "top", clamp: true, ...options }, root, leader, visible: true, width: 80, height: 32 };
    if (!gizmos.has(id) && gizmos.size >= Math.max(1, setting.ui?.gizmo?.maxVisible ?? 24)) throw new Error(`GUI_GIZMO_LIMIT: แสดง Gizmo ได้สูงสุด ${setting.ui?.gizmo?.maxVisible ?? 24} รายการพร้อมกัน`);
    if (gizmos.has(id)) gizmos.get(id).handle.remove(); root.className = "gui-gizmo"; leader.className = "gui-gizmo-leader"; leader.hidden = true; root.dataset.gizmoId = id; root.style.zIndex = String(20 + clamp(Number(options.priority) || 0, 0, 50)); elements.gizmoLayer.append(leader, root); gizmoSizeObserver.observe(root); renderGizmoContent(root, entry.options);
    const syncInteraction = () => { const actionable = typeof entry.options.onClick === "function"; root.classList.toggle("is-actionable", actionable); if (actionable) { root.setAttribute("role", "button"); root.tabIndex = 0; } else { root.removeAttribute("role"); root.removeAttribute("tabindex"); } };
    const activate = event => { if (typeof entry.options.onClick !== "function") return; event.preventDefault(); event.stopPropagation(); entry.options.onClick({ handle, target: entry.target, sourceEvent: event }); };
    root.addEventListener("pointerdown", event => { if (typeof entry.options.onClick === "function") event.stopPropagation(); });
    root.addEventListener("click", activate);
    root.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") activate(event); });
    function remove() { if (!gizmos.has(id)) return; gizmoSizeObserver.unobserve(root); leader.remove(); if (gizmos.get(id) === entry) gizmos.delete(id); unregister(handle, scope); hideAnimated(root, null, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(entry.options, next); renderGizmoContent(root, entry.options); syncInteraction(); gizmoSizeObserver.observe(root); return this; }, setTarget(next) { entry.target = next; return this; }, show() { entry.visible = true; showAnimated(root); return this; }, hide() { entry.visible = false; leader.hidden = true; if (!root.hidden) hideAnimated(root); return this; }, remove, get element() { return root; } }); entry.handle = handle; syncInteraction(); gizmos.set(id, entry); register(handle, scope); showAnimated(root); return handle;
  }
  const gizmo = Object.freeze({
    attach(target, options = {}) { if (!target) throw new Error("GUI_GIZMO_TARGET_REQUIRED: attach ต้องมี Object หรือ LessonHandle"); return createGizmo(target, options); },
    at(position, options = {}) { if (!Array.isArray(position) || position.length < 3) throw new Error("GUI_GIZMO_POSITION_INVALID: at ต้องใช้ [x,y,z]"); return createGizmo([...position], options); },
    get(id) { return gizmos.get(String(id))?.handle || null; }, clear(scope) { if (scope) clearScope(scope); else for (const entry of [...gizmos.values()]) entry.handle.remove(); }
  });

  function createWorldOption(target, value = {}) {
    if (!target) throw new Error("GUI_WORLD_OPTION_TARGET_REQUIRED: attach ต้องมี Object หรือ LessonHandle");
    const options = { placement: "right", clamp: true, closeOnSelect: true, dismissible: true, ...value };
    const id = text(options.id) || `world-option-${++sequence}`, scope = normalizeScope(options.scope), root = document.createElement("section"), leader = document.createElement("i"), header = document.createElement("header"), copy = document.createElement("div"), title = document.createElement("strong"), message = document.createElement("p"), close = document.createElement("button"), itemsRoot = document.createElement("div");
    const entry = { id, target, options, items: normalizeItems(options.items || []), root, leader, itemsRoot, visible: options.visible !== false, pendingShow: false, focusAfterShow: false, width: 210, height: 160, removed: false };
    if (worldOptions.has(id)) worldOptions.get(id).handle.remove();
    if (options.multiple !== true) for (const other of [...worldOptions.values()]) other.handle.remove();
    root.className = "gui-world-option"; root.dataset.worldOptionId = id; root.dataset.tone = normalizeTone(options.tone || "primary"); root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "false"); leader.className = "gui-world-option-leader"; leader.hidden = true;
    copy.className = "gui-world-option-copy"; title.className = "gui-world-option-title"; message.className = "gui-world-option-message"; close.className = "gui-world-option-close"; close.type = "button"; close.textContent = "×"; close.setAttribute("aria-label", "ปิดตัวเลือก"); itemsRoot.className = "gui-world-option-items"; copy.append(title, message); header.append(copy, close); root.append(header, itemsRoot); elements.gizmoLayer.append(leader, root); gizmoSizeObserver.observe(root);
    function render() {
      root.dataset.tone = normalizeTone(options.tone || "primary"); title.textContent = text(options.title) || "เลือกคำสั่ง"; message.textContent = text(options.message ?? options.text); message.hidden = !message.textContent; close.hidden = options.dismissible === false; root.setAttribute("aria-label", [title.textContent, message.textContent].filter(Boolean).join(": ")); itemsRoot.replaceChildren();
      for (const item of entry.items) {
        const button = document.createElement("button"); button.type = "button"; button.className = "gui-world-option-item"; button.dataset.optionValue = item.id; button.disabled = Boolean(item.disabled);
        const media = choiceImage(item.icon, true) || choiceImage(item.image); if (media) button.append(media);
        const label = document.createElement("span"); label.textContent = item.label; button.append(label);
        button.addEventListener("pointerdown", event => event.stopPropagation());
        button.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); if (button.disabled) return; playUiSound?.(); if (options.objectiveAction !== false) objectiveAction(); const payload = { id: item.id, value: item.value ?? item.id, item: { ...item }, target: entry.target, handle, sourceEvent: event }; safeCallback(item.onSelect, payload, `worldOption:${id}:${item.id}:item`); safeCallback(options.onSelect, payload, `worldOption:${id}:${item.id}`); if (options.closeOnSelect !== false) handle.hide(); });
        itemsRoot.append(button);
      }
    }
    function show() { if (entry.removed) return handle; if (options.multiple !== true) for (const other of worldOptions.values()) if (other !== entry) other.handle.hide(); entry.visible = true; entry.pendingShow = true; entry.focusAfterShow = options.autoFocus !== false; root.hidden = false; root.classList.add("is-preparing"); leader.hidden = true; return handle; }
    function hide() { entry.visible = false; entry.pendingShow = false; entry.focusAfterShow = false; root.classList.remove("is-preparing"); leader.hidden = true; if (!root.hidden) hideAnimated(root); return handle; }
    function remove() { if (entry.removed) return; entry.removed = true; entry.visible = false; entry.pendingShow = false; entry.focusAfterShow = false; root.classList.remove("is-preparing"); gizmoSizeObserver.unobserve(root); leader.remove(); if (worldOptions.get(id) === entry) worldOptions.delete(id); unregister(handle, scope); hideAnimated(root, null, true); }
    const handle = Object.freeze({
      id, scope,
      update(next = {}) { Object.assign(options, next); if (next.items) entry.items = normalizeItems(next.items); render(); gizmoSizeObserver.observe(root); return this; },
      setItems(items) { entry.items = normalizeItems(items); render(); return this; },
      setDisabled(value, disabled = true) { const item = entry.items.find(option => option.id === String(value)); if (item) item.disabled = disabled; render(); return this; },
      setTarget(next) { if (!next) throw new Error("GUI_WORLD_OPTION_TARGET_REQUIRED: setTarget ต้องมี Object หรือ LessonHandle"); entry.target = next; return this; },
      show, hide, toggle() { return entry.visible ? hide() : show(); }, remove, close: hide,
      get visible() { return entry.visible; }, get element() { return root; }
    });
    entry.handle = handle; close.addEventListener("pointerdown", event => event.stopPropagation()); close.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); playUiSound?.(); hide(); }); root.addEventListener("pointerdown", event => event.stopPropagation()); root.addEventListener("keydown", event => { if (event.key === "Escape" && options.dismissible !== false) { event.stopPropagation(); hide(); } }); worldOptions.set(id, entry); register(handle, scope); render(); if (entry.visible) show(); else root.hidden = true; return handle;
  }
  const worldOption = Object.freeze({
    attach: createWorldOption,
    show(target, options = {}) { return createWorldOption(target, { ...options, visible: true }); },
    get(id) { return worldOptions.get(String(id))?.handle || null; },
    dismiss() { for (const entry of worldOptions.values()) if (entry.visible && entry.options.dismissible !== false) entry.handle.hide(); },
    hide() { for (const entry of worldOptions.values()) entry.handle.hide(); },
    clear(scope) { if (scope) clearScope(scope); else for (const entry of [...worldOptions.values()]) entry.handle.remove(); }
  });

  function normalizeServiceOptions(value, options = {}) { return typeof value === "string" ? { ...options, message: value } : { ...(value || {}) }; }
  function serviceMedia(source, isIcon = false) { const image = choiceImage(source, isIcon); if (image) image.className = "gui-service-icon"; return image; }

  function createTopMessage(value, extra = {}) {
    const options = normalizeServiceOptions(value, extra), id = text(options.id) || "lesson-top-message", scope = normalizeScope(options.scope, "step"), root = document.createElement("article"), copy = document.createElement("div"); let timer = 0, removed = false;
    topMessageHandle?.remove(); root.className = "gui-top-message"; root.dataset.topMessageId = id; root.setAttribute("role", options.tone === "error" ? "alert" : "status"); root.append(copy); elements.topMessageLayer.replaceChildren(root); elements.topMessageLayer.hidden = false; elements.controlDock.classList.add("has-top-message");
    function render() { root.dataset.tone = normalizeTone(options.tone || "info"); copy.replaceChildren(); const media = serviceMedia(options.icon, true); if (media) root.prepend(media); for (const old of [...root.children]) if (old !== copy && old !== media) old.remove(); const title = text(options.title), message = text(options.message ?? options.text); if (title) { const strong = document.createElement("strong"); strong.textContent = title; copy.append(strong); } const paragraph = document.createElement("p"); paragraph.textContent = message; copy.append(paragraph); root.setAttribute("aria-label", [title, message].filter(Boolean).join(": ")); if (options.dismissible) { const close = document.createElement("button"); close.type = "button"; close.className = "gui-top-message-close"; close.setAttribute("aria-label", "ปิดข้อความด้านบน"); close.textContent = "×"; close.addEventListener("click", () => { playUiSound?.(); remove(); }); root.append(close); } clearTimeout(timer); const duration = Number(options.duration ?? setting.ui?.topMessage?.duration ?? 1800); if (duration > 0) timer = setTimeout(remove, duration); }
    function remove() { if (removed) return; removed = true; clearTimeout(timer); if (topMessageHandle === handle) topMessageHandle = null; unregister(handle, scope); hideAnimated(root, () => { if (!topMessageHandle) { elements.topMessageLayer.hidden = true; elements.controlDock.classList.remove("has-top-message"); } }, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); return this; }, show() { if (!removed) { elements.topMessageLayer.hidden = false; elements.controlDock.classList.add("has-top-message"); showAnimated(root); render(); } return this; }, hide() { clearTimeout(timer); if (!root.hidden) hideAnimated(root, () => { if (topMessageHandle === handle) elements.controlDock.classList.remove("has-top-message"); }); return this; }, remove, get element() { return root; } }); topMessageHandle = handle; register(handle, scope); render(); showAnimated(root); return handle;
  }
  const topMessage = Object.freeze({ show: createTopMessage, success(message, options = {}) { return createTopMessage(message, { ...options, tone: "success" }); }, info(message, options = {}) { return createTopMessage(message, { ...options, tone: "info" }); }, warning(message, options = {}) { return createTopMessage(message, { ...options, tone: "warning" }); }, error(message, options = {}) { return createTopMessage(message, { ...options, tone: "error" }); }, get current() { return topMessageHandle; }, hide() { topMessageHandle?.remove(); } });

  function createFeedback(value, extra = {}) {
    const options = normalizeServiceOptions(value, extra), id = text(options.id) || `feedback-${++sequence}`, scope = normalizeScope(options.scope, "step"), root = document.createElement("article"), copy = document.createElement("div"); let timer = 0, removed = false;
    feedbacks.get(id)?.remove(); root.className = "gui-feedback"; root.dataset.feedbackId = id; root.setAttribute("role", options.tone === "error" ? "alert" : "status"); root.append(copy); elements.feedbackLayer.append(root); elements.feedbackLayer.hidden = false;
    function render() { root.dataset.tone = normalizeTone(options.tone || "info"); copy.replaceChildren(); const media = serviceMedia(options.icon, true); if (media) root.prepend(media); for (const old of [...root.children]) if (old !== copy && old !== media) old.remove(); const title = text(options.title), message = text(options.message ?? options.text); if (title) { const strong = document.createElement("strong"); strong.textContent = title; copy.append(strong); } const paragraph = document.createElement("p"); paragraph.textContent = message; copy.append(paragraph); root.setAttribute("aria-label", [title, message].filter(Boolean).join(": ")); if (options.dismissible) { const close = document.createElement("button"); close.type = "button"; close.className = "gui-feedback-close"; close.setAttribute("aria-label", "ปิดข้อความ"); close.textContent = "×"; close.addEventListener("click", () => { playUiSound?.(); remove(); }); root.append(close); } clearTimeout(timer); const duration = Number(options.duration ?? setting.ui?.feedback?.duration ?? 2600); if (duration > 0) timer = setTimeout(remove, duration); }
    function remove() { if (removed) return; removed = true; clearTimeout(timer); if (feedbacks.get(id) === handle) feedbacks.delete(id); unregister(handle, scope); hideAnimated(root, () => { if (!elements.feedbackLayer.children.length) elements.feedbackLayer.hidden = true; }, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); return this; }, show() { if (!removed) { showAnimated(root); render(); } return this; }, hide() { clearTimeout(timer); if (!root.hidden) hideAnimated(root); return this; }, remove, get element() { return root; } }); feedbacks.set(id, handle); register(handle, scope); render(); showAnimated(root); return handle;
  }
  const feedback = Object.freeze({ show: createFeedback, success(message, options = {}) { return createFeedback(message, { ...options, tone: "success" }); }, info(message, options = {}) { return createFeedback(message, { ...options, tone: "info" }); }, warning(message, options = {}) { return createFeedback(message, { ...options, tone: "warning" }); }, error(message, options = {}) { return createFeedback(message, { ...options, tone: "error" }); }, get(id) { return feedbacks.get(String(id)) || null; }, clear(scope) { if (scope) clearScope(scope); else for (const handle of [...feedbacks.values()]) handle.remove(); } });

  function createDialog(value = {}) {
    const options = normalizeServiceOptions(value), id = text(options.id) || `dialog-${++sequence}`, scope = normalizeScope(options.scope, "scene"), card = document.createElement("section"), body = document.createElement("div"), actions = document.createElement("footer"); let removed = false;
    for (const handle of [...dialogs.values()]) handle.remove("replaced"); card.className = "gui-dialog"; card.dataset.dialogId = id; card.dataset.kind = text(options.kind) || "dialog"; card.dataset.tone = normalizeTone(options.tone || "primary"); card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.append(body, actions); elements.dialogLayer.replaceChildren(card); elements.dialogLayer.hidden = false;
    function render() { card.dataset.kind = text(options.kind) || "dialog"; card.dataset.tone = normalizeTone(options.tone || "primary"); body.replaceChildren(); actions.replaceChildren(); const hero = document.createElement("header"), media = serviceMedia(options.icon || "book", true), copy = document.createElement("div"); if (media) hero.append(media); const title = document.createElement("h2"); title.textContent = text(options.title) || "ข้อความจากบทเรียน"; copy.append(title); const message = text(options.message ?? options.text); if (message) { const paragraph = document.createElement("p"); paragraph.textContent = message; copy.append(paragraph); } hero.append(copy); body.append(hero); const richHtml = options.html ?? options.contentHtml; if (text(richHtml)) { const article = document.createElement("article"); article.className = "gui-insight-content"; article.append(safeInsightFragment(richHtml, resolveAsset)); body.append(article); } for (const section of Array.isArray(options.sections) ? options.sections : []) { const article = document.createElement("article"); if (section.title) { const heading = document.createElement("h3"); heading.textContent = String(section.title); article.append(heading); } const paragraph = document.createElement("p"); paragraph.textContent = String(section.message ?? section.text ?? ""); article.append(paragraph); body.append(article); } card.setAttribute("aria-label", [title.textContent, message].filter(Boolean).join(": ")); const secondaryLabel = text(options.secondaryLabel), primaryLabel = text(options.primaryLabel) || "ตกลง"; if (secondaryLabel) { const button = document.createElement("button"); button.type = "button"; button.className = "gui-dialog-secondary"; button.textContent = secondaryLabel; button.addEventListener("click", () => { playUiSound?.(); safeCallback(options.onSecondary, { id, action: "secondary", handle }, `dialog:${id}:secondary`); remove("secondary"); }); actions.append(button); } const primary = document.createElement("button"); primary.type = "button"; primary.className = "gui-dialog-primary"; primary.textContent = primaryLabel; primary.addEventListener("click", () => { playUiSound?.(); safeCallback(options.onPrimary, { id, action: "primary", handle }, `dialog:${id}:primary`); remove("primary"); }); actions.append(primary); queueMicrotask(() => { try { primary.focus({ preventScroll: true }); } catch { primary.focus(); } }); }
    function remove(reason = "close") { if (removed) return; removed = true; if (dialogs.get(id) === handle) dialogs.delete(id); unregister(handle, scope); safeCallback(options.onClose, { id, reason, handle }, `dialog:${id}:close`); hideAnimated(card, () => { if (!elements.dialogLayer.children.length) elements.dialogLayer.hidden = true; }, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); return this; }, close: remove, remove, get element() { return card; } }); card.addEventListener("click", event => event.stopPropagation()); elements.dialogLayer.onclick = event => { if (event.target === elements.dialogLayer && options.dismissible !== false) remove("backdrop"); }; dialogs.set(id, handle); register(handle, scope); render(); showAnimated(card); return handle;
  }
  const dialog = Object.freeze({ show: createDialog, alert(message, options = {}) { return createDialog({ ...options, message }); }, confirm(message, options = {}) { return new Promise(resolve => createDialog({ ...options, message, secondaryLabel: options.secondaryLabel || "ยกเลิก", onPrimary: event => { safeCallback(options.onPrimary, event, "dialog:confirm:primary"); resolve(true); }, onSecondary: event => { safeCallback(options.onSecondary, event, "dialog:confirm:secondary"); resolve(false); }, onClose: event => { safeCallback(options.onClose, event, "dialog:confirm:close"); if (event.reason !== "primary" && event.reason !== "secondary") resolve(false); } })); }, get(id) { return dialogs.get(String(id)) || null; }, closeAll() { for (const handle of [...dialogs.values()]) handle.remove("clear"); } });
  const insight = Object.freeze({
    show(value = {}) { const options = normalizeServiceOptions(value), id = text(options.id) || "lesson-insight", current = dialogs.get(id); if (current?.element?.isConnected) return current; return createDialog({ ...options, id, kind: "insight", icon: options.icon || "lightbulb", title: options.title || "ดูวิธีคิด", primaryLabel: options.primaryLabel || "กลับไปทำโจทย์", dismissible: options.dismissible !== false }); },
    explain(value = {}) { return this.show(value); },
    get(id) { return dialogs.get(String(id)) || null; },
    close() { for (const handle of [...dialogs.values()]) if (handle.element?.dataset.kind === "insight") handle.remove("clear"); }
  });

  function syncControlLayout() {
    const indexes = new Map(); let hasTop = false;
    for (const handle of controls.values()) { const root = handle.element; if (root.hidden) continue; const position = root.dataset.position || "middle-right", index = indexes.get(position) || 0; root.style.setProperty("--gui-control-index", String(index)); indexes.set(position, index + 1); if (position === "top-right") hasTop = true; }
    elements.feedbackLayer.classList.toggle("has-top-control", hasTop);
  }

  function controlAllowed(entry) {
    const isTeachingSkip = entry.options.systemRole === "skip-teaching";
    return lessonControlPhase === "teaching" ? isTeachingSkip : !isTeachingSkip;
  }
  function syncControlVisibility(entry, animate = false) {
    if (!entry || entry.removed) return;
    const visible = entry.requestedVisible && controlAllowed(entry);
    clearTimeout(entry.root.__guiMotionTimer);
    if (visible) {
      if (entry.root.parentElement === elements.controlDock) elements.controlDock.hidden = false;
      if (animate) showAnimated(entry.root);
      else { entry.root.classList.remove("is-leaving", "is-entering"); entry.root.hidden = false; }
    } else {
      entry.root.classList.remove("is-leaving", "is-entering");
      entry.root.hidden = true;
    }
    syncControlLayout();
    elements.controlDock.hidden = ![...controlEntries.values()].some(value => !value.removed && !value.root.hidden && value.root.parentElement === elements.controlDock);
  }
  function setLessonControlPhase(value) {
    const phase = String(value || "lab");
    if (!new Set(["teaching", "lab", "quiz"]).has(phase)) throw new Error(`GUI_CONTROL_PHASE_INVALID: ไม่รองรับ phase "${phase}"`);
    lessonControlPhase = phase;
    for (const entry of controlEntries.values()) syncControlVisibility(entry);
    return lessonControlPhase;
  }

  function createControl(value = {}) {
    const options = normalizeServiceOptions(value), id = text(options.id) || `control-${++sequence}`, scope = normalizeScope(options.scope, "scene"), root = document.createElement("nav"), itemsRoot = document.createElement("div"); let removed = false;
    const entry = { id, options, root, requestedVisible: true, removed: false };
    controls.get(id)?.remove(); root.className = "gui-control"; root.dataset.controlId = id; root.setAttribute("aria-label", text(options.ariaLabel || options.title) || "เครื่องมือบทเรียน"); root.append(itemsRoot); const mobileSkip = options.systemRole === "skip-teaching" && matchMedia("(max-width:760px), (orientation:portrait)").matches, host = mobileSkip ? elements.viewport : elements.controlDock; host.append(root); if (host === elements.controlDock) elements.controlDock.hidden = false;
    function render() { const requested = text(options.position) || "middle-right"; root.dataset.position = VALID_CONTROL_POSITIONS.has(requested) ? requested : "middle-right"; root.dataset.tone = normalizeTone(options.tone || "default"); itemsRoot.replaceChildren(); for (const item of normalizeItems(options.items || [])) { const button = document.createElement("button"); button.type = "button"; button.dataset.controlValue = item.id; button.disabled = Boolean(item.disabled); button.setAttribute("aria-label", item.ariaLabel || item.label); const media = serviceMedia(item.icon, true); if (media) button.append(media); const span = document.createElement("span"); span.textContent = item.label; button.append(span); button.addEventListener("click", () => { if (button.disabled) return; playUiSound?.(); if (options.objectiveAction === true) objectiveAction(); safeCallback(options.onAction, { id: item.id, value: item.value ?? item.id, item: { ...item }, handle }, `control:${id}`); }); itemsRoot.append(button); } syncControlLayout(); }
    function remove() { if (removed) return; removed = true; entry.removed = true; if (controls.get(id) === handle) controls.delete(id); if (controlEntries.get(id) === entry) controlEntries.delete(id); unregister(handle, scope); hideAnimated(root, () => { syncControlLayout(); if (!elements.controlDock.children.length) elements.controlDock.hidden = true; }, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); syncControlVisibility(entry); return this; }, setItems(items) { options.items = items; render(); return this; }, setDisabled(value, disabled = true) { const items = normalizeItems(options.items || []), item = items.find(entry => entry.id === String(value)); if (item) item.disabled = disabled; options.items = items; render(); return this; }, show() { entry.requestedVisible = true; syncControlVisibility(entry, true); return this; }, hide() { entry.requestedVisible = false; syncControlVisibility(entry); return this; }, remove, get element() { return root; } }); controls.set(id, handle); controlEntries.set(id, entry); register(handle, scope); render(); syncControlVisibility(entry, true); return handle;
  }
  const control = Object.freeze({ show: createControl, create: createControl, get(id) { return controls.get(String(id)) || null; }, setLessonPhase: setLessonControlPhase, get lessonPhase() { return lessonControlPhase; }, clear(scope) { if (scope) clearScope(scope); else for (const handle of [...controls.values()]) handle.remove(); } });

  function createHint(value = {}) {
    const options = normalizeServiceOptions(value), id = text(options.id) || "lesson-hint", scope = normalizeScope(options.scope, "step"); let timer = 0, removed = false;
    hints.get(id)?.remove();
    function render() { onHintShow?.({ header: text(options.title ?? options.header) || setting.ui?.hint?.defaultTitle || "คำแนะนำ", message: text(options.message ?? options.text), type: text(options.type) || setting.ui?.hint?.defaultType || "hint" }); clearTimeout(timer); const duration = Number(options.duration ?? setting.ui?.hint?.duration ?? 0); if (duration > 0) timer = setTimeout(remove, duration); }
    function remove() { if (removed) return; removed = true; clearTimeout(timer); hints.delete(id); unregister(handle, scope); onHintHide?.(); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); return this; }, show() { render(); return this; }, hide() { onHintHide?.(); return this; }, remove }); hints.set(id, handle); register(handle, scope); render(); return handle;
  }
  const clearHints = () => { for (const handle of [...hints.values()]) handle.remove(); };
  const hint = Object.freeze({ show: createHint, get(id = "lesson-hint") { return hints.get(String(id)) || null; }, hide: clearHints, clear(scope) { if (scope) clearScope(scope); else clearHints(); } });

  let busyHandle = null;
  function createBusy(value = {}) {
    const options = normalizeServiceOptions(value), id = text(options.id) || "lesson-busy", scope = normalizeScope(options.scope, "scene"), card = document.createElement("section"), copy = document.createElement("div"), progress = document.createElement("progress"); let removed = false;
    busyHandle?.remove(); card.className = "gui-busy"; card.dataset.busyId = id; card.setAttribute("role", "status"); card.append(copy, progress); elements.busyLayer.replaceChildren(card); elements.busyLayer.hidden = false;
    function render() { copy.replaceChildren(); const spinner = document.createElement("i"); spinner.className = "gui-busy-spinner"; const content = document.createElement("div"), title = document.createElement("strong"), message = document.createElement("p"); title.textContent = text(options.title) || "กำลังเตรียมกิจกรรม"; message.textContent = text(options.message ?? options.text) || "โปรดรอสักครู่"; content.append(title, message); copy.append(spinner, content); const value = Number(options.progress), hasProgress = options.progress !== null && options.progress !== undefined && Number.isFinite(value); progress.hidden = !hasProgress; if (hasProgress) { progress.max = 1; progress.value = clamp(value, 0, 1); } card.dataset.tone = normalizeTone(options.tone || "primary"); }
    function remove() { if (removed) return; removed = true; if (busyHandle === handle) busyHandle = null; unregister(handle, scope); hideAnimated(card, () => { if (!busyHandle) elements.busyLayer.hidden = true; }, true); }
    const handle = Object.freeze({ id, scope, update(next = {}) { Object.assign(options, next); render(); return this; }, setProgress(value, message) { options.progress = value; if (message !== undefined) options.message = message; render(); return this; }, hide: remove, remove, get element() { return card; } }); busyHandle = handle; register(handle, scope); render(); showAnimated(card); return handle;
  }
  const busy = Object.freeze({ show: createBusy, get current() { return busyHandle; }, hide() { busyHandle?.remove(); } });

  function updateGizmos() {
    if (!gizmos.size && !worldOptions.size) return; camera.updateMatrixWorld(); const rect = elements.viewport.getBoundingClientRect(), width = Math.max(1, rect.width), height = Math.max(1, rect.height), config = setting.ui?.gizmo || {}, margin = config.safeMargin ?? 14;
    let safeTop = margin, safeBottom = height - margin; for (const element of [elements.topbar, elements.question]) if (element && !element.hidden) { const bounds = element.getBoundingClientRect(); if (bounds.height) safeTop = Math.max(safeTop, bounds.bottom - rect.top + margin); } for (const element of [elements.choiceDock, elements.labConsole, elements.quizConsole]) if (element && !element.hidden) { const bounds = element.getBoundingClientRect(); if (bounds.height) safeBottom = Math.min(safeBottom, bounds.top - rect.top - margin); } if (safeBottom - safeTop < 80) { safeTop = margin; safeBottom = height - margin; }
    for (const entry of gizmos.values()) {
      const { root, leader, options } = entry; if (!entry.visible) { leader.hidden = true; if (!root.classList.contains("is-leaving")) root.hidden = true; continue; } const target = targetObject(entry.target); let valid = true;
      if (Array.isArray(target)) worldPoint.fromArray(target); else if (target?.getWorldPosition) { if (!target.parent) valid = false; target.getWorldPosition(worldPoint); } else valid = false;
      if (!valid) { root.hidden = leader.hidden = true; continue; }
      viewPoint.copy(worldPoint).applyMatrix4(camera.matrixWorldInverse); projected.copy(worldPoint).project(camera); const targetVisible = viewPoint.z < -.01 && projected.z >= -1 && projected.z <= 1, targetX = (projected.x * .5 + .5) * width, targetY = (-projected.y * .5 + .5) * height;
      const offset = options.worldOffset || [0, 0, 0]; worldPoint.x += offset[0] || 0; worldPoint.y += offset[1] || 0; worldPoint.z += offset[2] || 0; viewPoint.copy(worldPoint).applyMatrix4(camera.matrixWorldInverse); projected.copy(worldPoint).project(camera);
      if (viewPoint.z >= -.01 || projected.z < -1 || projected.z > 1) { root.hidden = leader.hidden = true; continue; } root.hidden = false;
      const screenOffset = options.offset || [0, 0], elementWidth = entry.width, elementHeight = entry.height; let x = (projected.x * .5 + .5) * width + (screenOffset[0] || 0), y = (-projected.y * .5 + .5) * height + (screenOffset[1] || 0); const placement = options.placement || "top", gap = options.gap ?? 12;
      if (placement === "top") y -= elementHeight / 2 + gap; else if (placement === "bottom") y += elementHeight / 2 + gap; else if (placement === "left") x -= elementWidth / 2 + gap; else if (placement === "right") x += elementWidth / 2 + gap;
      const rawX = x, rawY = y; if (options.clamp !== false) { x = clamp(x, margin + elementWidth / 2, width - margin - elementWidth / 2); y = clamp(y, safeTop + elementHeight / 2, safeBottom - elementHeight / 2); } root.classList.toggle("is-clamped", Math.abs(rawX - x) > 1 || Math.abs(rawY - y) > 1); root.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-50%)`; root.style.setProperty("--gizmo-depth", String(projected.z));
      const lineOptions = options.leaderLine === true ? {} : options.leaderLine && typeof options.leaderLine === "object" && options.leaderLine.enabled !== false ? options.leaderLine : null;
      if (!lineOptions || !targetVisible) leader.hidden = true;
      else {
        const dx = targetX - x, dy = targetY - y, distance = Math.hypot(dx, dy), halfWidth = elementWidth / 2, halfHeight = elementHeight / 2;
        if (distance < 2) leader.hidden = true;
        else {
          const edgeRatio = Math.min(Math.abs(dx) > .001 ? halfWidth / Math.abs(dx) : Infinity, Math.abs(dy) > .001 ? halfHeight / Math.abs(dy) : Infinity, 1), unitX = dx / distance, unitY = dy / distance, targetInset = Math.max(0, Number(lineOptions.targetInset) || 0), startX = x + dx * edgeRatio, startY = y + dy * edgeRatio, endX = targetX - unitX * targetInset, endY = targetY - unitY * targetInset, lineLength = Math.hypot(endX - startX, endY - startY);
          leader.hidden = lineLength < 2; leader.style.left = `${Math.round(startX)}px`; leader.style.top = `${Math.round(startY)}px`; leader.style.width = `${Math.round(lineLength)}px`; leader.style.height = `${Math.max(1, Number(lineOptions.width) || 2)}px`; leader.style.background = String(lineOptions.color || "var(--gui-gizmo-leader, rgba(58, 71, 91, .72))"); leader.style.transform = `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`;
        }
      }
    }
    for (const entry of worldOptions.values()) {
      const { root, leader, options } = entry; if (!entry.visible) { leader.hidden = true; if (!root.classList.contains("is-leaving")) root.hidden = true; continue; }
      const target = targetObject(entry.target); let valid = true; if (Array.isArray(target)) worldPoint.fromArray(target); else if (target?.getWorldPosition) { if (!target.parent) valid = false; target.getWorldPosition(worldPoint); } else valid = false;
      if (!valid) { root.hidden = leader.hidden = true; continue; }
      const targetPoint = worldPoint.clone(), offset = options.worldOffset || [0, 0, 0]; worldPoint.x += offset[0] || 0; worldPoint.y += offset[1] || 0; worldPoint.z += offset[2] || 0; viewPoint.copy(worldPoint).applyMatrix4(camera.matrixWorldInverse); projected.copy(worldPoint).project(camera);
      if (viewPoint.z >= -.01 || projected.z < -1 || projected.z > 1) { root.hidden = leader.hidden = true; continue; }
      if (entry.pendingShow) { root.hidden = false; root.classList.add("is-preparing"); const measured = root.getBoundingClientRect(); entry.width = measured.width || entry.width; entry.height = measured.height || entry.height; }
      const screenOffset = options.offset || [0, 0], elementWidth = entry.width, elementHeight = entry.height; let x = (projected.x * .5 + .5) * width + (screenOffset[0] || 0), y = (-projected.y * .5 + .5) * height + (screenOffset[1] || 0), placement = options.placement || "right", gap = options.gap ?? 34;
      if (placement === "top") y -= elementHeight / 2 + gap; else if (placement === "bottom") y += elementHeight / 2 + gap; else if (placement === "left") x -= elementWidth / 2 + gap; else x += elementWidth / 2 + gap;
      const rawX = x, rawY = y; if (options.clamp !== false) { x = clamp(x, margin + elementWidth / 2, width - margin - elementWidth / 2); y = clamp(y, safeTop + elementHeight / 2, safeBottom - elementHeight / 2); } root.classList.toggle("is-clamped", Math.abs(rawX - x) > 1 || Math.abs(rawY - y) > 1); root.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) translate(-50%,-50%)`;
      projected.copy(targetPoint).project(camera); const targetX = (projected.x * .5 + .5) * width, targetY = (-projected.y * .5 + .5) * height, dx = targetX - x, dy = targetY - y, distance = Math.hypot(dx, dy), halfWidth = elementWidth / 2, halfHeight = elementHeight / 2;
      if (distance < 8) leader.hidden = true; else { const edgeRatio = Math.min(Math.abs(dx) > .001 ? halfWidth / Math.abs(dx) : Infinity, Math.abs(dy) > .001 ? halfHeight / Math.abs(dy) : Infinity, 1), startX = x + dx * edgeRatio, startY = y + dy * edgeRatio, length = Math.hypot(targetX - startX, targetY - startY); leader.hidden = length < 3; leader.style.left = `${Math.round(startX)}px`; leader.style.top = `${Math.round(startY)}px`; leader.style.width = `${Math.round(length)}px`; leader.style.transform = `rotate(${Math.atan2(targetY - startY, targetX - startX)}rad)`; }
      if (entry.pendingShow) {
        entry.pendingShow = false;
        root.classList.remove("is-preparing");
        showAnimated(root);
        if (entry.focusAfterShow) queueMicrotask(() => { const first = entry.itemsRoot.querySelector("button:not(:disabled)"); try { first?.focus({ preventScroll: true }); } catch { first?.focus(); } });
        entry.focusAfterShow = false;
      } else root.hidden = false;
    }
  }

  applySettings();
  return Object.freeze({ question, console: consoleService, topMessage, choice, gizmo, worldOption, feedback, dialog, insight, control, hint, busy, update: updateGizmos, clearScope, clearAll, applySettings, get counts() { return Object.freeze({ topMessages: topMessageHandle ? 1 : 0, choices: choices.size, gizmos: gizmos.size, worldOptions: worldOptions.size, feedbacks: feedbacks.size, dialogs: dialogs.size, controls: controls.size, hints: hints.size, busy: busyHandle ? 1 : 0 }); } });
}
