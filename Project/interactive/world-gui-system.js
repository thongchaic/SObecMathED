export function createWorldGuiSystem({ THREE, viewport, camera, setting = {}, getGround = () => ({}), getObjects = () => [], markSceneActive = () => {} } = {}) {
  if (!THREE || !viewport || !camera) throw new Error("WORLD_GUI_SYSTEM_SETUP: ต้องระบุ THREE, viewport และ camera");

  const config = setting.ui?.worldGuiSystem || {};
  const layer = document.createElement("div");
  layer.className = "world-gui-system-layer";
  layer.setAttribute("aria-label", "ข้อมูลและเครื่องมือบนฉาก");
  const legend = document.createElement("div");
  legend.className = "world-gui-system-legend";
  legend.hidden = true;
  legend.innerHTML = `<strong>DEBUG AREA</strong><span>พื้นเกาะใช้แกน X / Z</span><span>Y = ความสูง · R = องศา · S = Scale</span><span>กดป้ายโมเดลเพื่อปรับค่า</span>`;
  layer.append(legend);
  const transformEditor = document.createElement("section");
  transformEditor.className = "world-gui-transform-editor";
  transformEditor.hidden = true;
  transformEditor.setAttribute("role", "dialog");
  transformEditor.setAttribute("aria-label", "แก้ไข Transform ของโมเดล");
  transformEditor.innerHTML = `<header><div><small>DEBUG TRANSFORM</small><strong data-transform-name>Model</strong></div><button type="button" data-transform-close aria-label="ปิดเครื่องมือ">×</button></header><div class="world-gui-transform-fields"><fieldset data-transform-group="position"><legend>Position</legend></fieldset><fieldset data-transform-group="rotation"><legend>Rotation <small>องศา</small></legend></fieldset><fieldset data-transform-group="scale"><legend>Scale</legend></fieldset></div><pre data-transform-output></pre><footer><button type="button" data-transform-reset>คืนค่าเดิม</button><button type="button" data-transform-copy>คัดลอกค่า</button></footer><span data-transform-status aria-live="polite"></span>`;
  layer.append(transformEditor);
  viewport.append(layer);

  const entries = new Map();
  const objectDebugLabels = new Map();
  const debugScope = "__world-gui-debug";
  let sequence = 0;
  let debugEnabled = false;
  let lastDebugUpdate = 0;
  let editorObject = null;
  let editorInitial = null;

  const numberText = value => {
    const rounded = Math.abs(Number(value) || 0) < .0005 ? 0 : Math.round(Number(value) * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  };
  const targetObject = target => target?.object3D || target;
  const pointTarget = value => value?.isVector3 ? value.clone() : new THREE.Vector3(...(Array.isArray(value) ? value : [0, 0, 0]));
  const familyName = name => String(name || "").replace(/-\d+(?=-|$)/g, "-#");
  const transformText = (object, familyCount = 1) => {
    const visual = object.userData.visualRoot || object;
    const targetSize = Number(object.userData.debugTargetSize);
    const sizeText = Number.isFinite(targetSize) ? ` · T ${numberText(targetSize)}` : "";
    return `${object.name}${familyCount > 1 ? ` ×${familyCount}` : ""}\nP ${numberText(object.position.x)}, ${numberText(object.position.y)}, ${numberText(object.position.z)}\nR ${numberText(THREE.MathUtils.radToDeg(object.rotation.x))}°, ${numberText(THREE.MathUtils.radToDeg(object.rotation.y))}°, ${numberText(THREE.MathUtils.radToDeg(object.rotation.z))}°\nS ${numberText(visual.scale.x)}, ${numberText(visual.scale.y)}, ${numberText(visual.scale.z)}${sizeText}`;
  };

  const transformAxes = ["x", "y", "z"];
  for (const type of ["position", "rotation", "scale"]) {
    const fieldset = transformEditor.querySelector(`[data-transform-group="${type}"]`);
    const step = type === "rotation" ? 5 : type === "scale" ? .05 : .1;
    const min = type === "scale" ? ` min="0.01"` : "";
    for (const axis of transformAxes) fieldset.insertAdjacentHTML("beforeend", `<label><span>${axis.toUpperCase()}</span><input type="number" inputmode="decimal" step="${step}"${min} data-transform-value="${type}.${axis}" aria-label="${type} ${axis.toUpperCase()}"></label>`);
  }

  function transformSnapshot(object) {
    const visual = object.userData.visualRoot || object;
    return {
      position: transformAxes.map(axis => object.position[axis]),
      rotation: transformAxes.map(axis => THREE.MathUtils.radToDeg(object.rotation[axis])),
      scale: transformAxes.map(axis => visual.scale[axis])
    };
  }
  function transformCode(snapshot) {
    const values = key => snapshot[key].map(value => numberText(value)).join(", ");
    return `position: [${values("position")}],\nrotation: [${values("rotation")}],\nscale: [${values("scale")}]`;
  }
  function syncTransformEditor(syncInputs = true) {
    if (!editorObject?.parent) { closeTransformEditor(); return; }
    const snapshot = transformSnapshot(editorObject);
    transformEditor.querySelector("[data-transform-name]").textContent = editorObject.name || "lesson-object";
    transformEditor.querySelector("[data-transform-output]").textContent = transformCode(snapshot);
    if (syncInputs) for (const [type, values] of Object.entries(snapshot)) values.forEach((value, index) => {
      const input = transformEditor.querySelector(`[data-transform-value="${type}.${transformAxes[index]}"]`);
      if (input) input.value = numberText(value);
    });
  }
  function openTransformEditor(object) {
    if (!object?.isObject3D) return;
    editorObject = object;
    editorInitial = transformSnapshot(object);
    transformEditor.hidden = false;
    transformEditor.querySelector("[data-transform-status]").textContent = "ปรับค่าแล้วดูผลบนฉากได้ทันที";
    for (const handle of objectDebugLabels.values()) handle.element.classList.toggle("is-selected", targetObject(handle.__debugTarget) === object);
    syncTransformEditor();
    markSceneActive();
  }
  function closeTransformEditor() {
    editorObject = null;
    editorInitial = null;
    transformEditor.hidden = true;
    for (const handle of objectDebugLabels.values()) handle.element.classList.remove("is-selected");
  }
  function applyTransformSnapshot(snapshot) {
    if (!editorObject || !snapshot) return;
    const handle = editorObject.userData.lessonHandle;
    if (handle?.setPosition) handle.setPosition(...snapshot.position); else editorObject.position.fromArray(snapshot.position);
    if (handle?.setRotation) handle.setRotation(...snapshot.rotation); else editorObject.rotation.set(...snapshot.rotation.map(THREE.MathUtils.degToRad));
    if (handle?.setScale) handle.setScale(...snapshot.scale); else (editorObject.userData.visualRoot || editorObject).scale.fromArray(snapshot.scale);
    syncDebugObjects(performance.now(), true);
    syncTransformEditor();
    markSceneActive();
  }
  function readTransformEditor() {
    const current = transformSnapshot(editorObject);
    const snapshot = { position: [], rotation: [], scale: [] };
    for (const [type, fallback] of Object.entries(current)) transformAxes.forEach((axis, index) => {
      const input = transformEditor.querySelector(`[data-transform-value="${type}.${axis}"]`);
      const value = Number(input?.value);
      snapshot[type][index] = Number.isFinite(value) ? (type === "scale" ? Math.max(.01, value) : value) : fallback[index];
    });
    return snapshot;
  }

  function render(entry) {
    const { element, options } = entry;
    element.replaceChildren();
    if (options.icon) {
      const file = String(options.icon).endsWith(".svg") ? String(options.icon) : `${options.icon}.svg`;
      const icon = document.createElement("img");
      icon.className = "world-gui-system-icon";
      icon.src = new URL(`./assets/icon/${file}`, import.meta.url).href;
      icon.alt = "";
      const copy = document.createElement("span");
      copy.className = "world-gui-system-copy";
      copy.textContent = String(options.text ?? "");
      element.append(icon, copy);
    } else element.textContent = String(options.text ?? "");
    element.dataset.variant = options.variant || "label";
    element.dataset.tone = options.tone || "info";
    element.dataset.size = options.size || "small";
    element.className = `world-gui-system-label is-${options.variant || "label"}${options.className ? ` ${options.className}` : ""}`;
    element.classList.toggle("has-icon", Boolean(options.icon));
    const actionable = typeof options.onClick === "function";
    element.classList.toggle("is-actionable", actionable);
    if (actionable) { element.tabIndex = 0; element.setAttribute("role", "button"); }
    else { element.removeAttribute("tabindex"); element.removeAttribute("role"); }
  }

  function add(target, options = {}) {
    const id = String(options.id || `world-gui-${++sequence}`);
    entries.get(id)?.handle.remove();
    if (entries.size >= Math.max(1, config.maxVisible ?? 120)) throw new Error(`WORLD_GUI_SYSTEM_LIMIT: แสดงป้ายได้สูงสุด ${config.maxVisible ?? 120} รายการ`);
    const element = document.createElement("div");
    const entry = {
      id,
      target: Array.isArray(target) || target?.isVector3 ? pointTarget(target) : targetObject(target),
      targetType: Array.isArray(target) || target?.isVector3 ? "point" : "object",
      options: { scope: "scene", variant: "label", size: "small", anchor: "top", offset: [0, .16, 0], ...options },
      element,
      visible: options.visible !== false
    };
    layer.append(element);
    element.addEventListener("click", event => { if (typeof entry.options.onClick !== "function") return; event.preventDefault(); event.stopPropagation(); entry.options.onClick({ id, handle: entry.handle, target: entry.target, element }); });
    element.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && typeof entry.options.onClick === "function") { event.preventDefault(); entry.options.onClick({ id, handle: entry.handle, target: entry.target, element }); } });
    render(entry);
    function remove() { if (entries.get(id) !== entry) return; entries.delete(id); element.remove(); markSceneActive(); }
    const handle = Object.freeze({
      id,
      get scope() { return entry.options.scope; },
      get element() { return element; },
      get __debugTarget() { return entry.target; },
      update(next = {}) { Object.assign(entry.options, next); render(entry); markSceneActive(); return this; },
      setText(text) { entry.options.text = text; render(entry); markSceneActive(); return this; },
      setTarget(next) { entry.target = Array.isArray(next) || next?.isVector3 ? pointTarget(next) : targetObject(next); entry.targetType = Array.isArray(next) || next?.isVector3 ? "point" : "object"; markSceneActive(); return this; },
      show() { entry.visible = true; markSceneActive(); return this; },
      hide() { entry.visible = false; element.hidden = true; markSceneActive(); return this; },
      remove
    });
    entry.handle = handle;
    entries.set(id, entry);
    markSceneActive();
    return handle;
  }

  function worldPosition(entry) {
    const offset = pointTarget(entry.options.offset || [0, 0, 0]);
    if (entry.targetType === "point") return entry.target.clone().add(offset);
    const object = targetObject(entry.target);
    if (!object?.isObject3D || !object.parent || !object.visible) return null;
    object.updateWorldMatrix(true, true);
    if (entry.options.anchor === "origin") return object.getWorldPosition(new THREE.Vector3()).add(offset);
    const bounds = new THREE.Box3().setFromObject(object);
    if (bounds.isEmpty()) return object.getWorldPosition(new THREE.Vector3()).add(offset);
    const point = bounds.getCenter(new THREE.Vector3());
    if (entry.options.anchor !== "center") point.y = bounds.max.y;
    return point.add(offset);
  }

  function project(entry) {
    const position = worldPosition(entry);
    if (!entry.visible || !position) { entry.element.hidden = true; return; }
    const view = position.clone().applyMatrix4(camera.matrixWorldInverse);
    const projected = position.clone().project(camera);
    const width = Math.max(1, viewport.clientWidth), height = Math.max(1, viewport.clientHeight);
    const visible = view.z < -.01 && projected.z >= -1 && projected.z <= 1 && projected.x >= -1.08 && projected.x <= 1.08 && projected.y >= -1.08 && projected.y <= 1.08;
    entry.element.hidden = !visible;
    if (!visible) return;
    entry.element.style.left = `${(projected.x * .5 + .5) * width}px`;
    entry.element.style.top = `${(-projected.y * .5 + .5) * height + (Number(entry.options.screenOffsetY) || 0)}px`;
  }

  function clear(...scopes) {
    const selectedScopes = new Set(scopes.flat().filter(Boolean));
    for (const entry of [...entries.values()]) {
      if (entry.options.scope === debugScope) continue;
      if (!selectedScopes.size || selectedScopes.has(entry.options.scope)) entry.handle.remove();
    }
  }

  function clearDebugLabels() {
    closeTransformEditor();
    for (const entry of [...entries.values()]) if (entry.options.scope === debugScope) entry.handle.remove();
    objectDebugLabels.clear();
  }

  function rebuildDebugGrid() {
    clearDebugLabels();
    const ground = getGround() || {};
    const radius = Number(ground.radius) || 14;
    const step = Math.max(.1, Number(ground.gridSize) || 1);
    const height = Number(ground.height) || .018;
    const addCoordinate = (axis, position, text) => add(position, { id: `debug-grid-${axis}-${text}`, scope: debugScope, text, variant: "coordinate", className: `is-${axis}`, anchor: "origin", offset: [0, .04, 0] });
    addCoordinate("origin", [0, height, 0], "X 0 · Z 0");
    for (let index = 1; index * step <= radius + .001; index++) {
      const value = Math.round(index * step * 1000) / 1000;
      for (const sign of [-1, 1]) {
        const offset = value * sign;
        addCoordinate("x", [offset, height, 0], `X ${offset > 0 ? "+" : ""}${numberText(offset)}`);
        addCoordinate("z", [0, height, offset], `Z ${offset > 0 ? "+" : ""}${numberText(offset)}`);
      }
    }
  }

  function syncDebugObjects(now = performance.now(), force = false) {
    if (!debugEnabled || (!force && now - lastDebugUpdate < (config.debugUpdateInterval ?? 66))) return;
    lastDebugUpdate = now;
    const candidates = getObjects().filter(object => object?.isObject3D && object.userData.lessonHandle && object.userData.debugAreaHidden !== true && object.name && object.name !== "lesson-object");
    const families = new Map();
    for (const object of candidates) {
      const family = familyName(object.name);
      if (!families.has(family)) families.set(family, []);
      families.get(family).push(object);
    }
    const visibleObjects = [];
    for (const family of families.values()) visibleObjects.push(...(family.length > 3 ? family.slice(0, 1) : family));
    const active = new Set(visibleObjects);
    for (const object of visibleObjects) {
      const familyCount = families.get(familyName(object.name))?.length || 1;
      let handle = objectDebugLabels.get(object);
      if (!handle) {
        handle = add(object, { id: `debug-object-${++sequence}`, scope: debugScope, variant: "transform", screenOffsetY: -4, offset: [0, .16, 0], onClick: () => openTransformEditor(object) });
        objectDebugLabels.set(object, handle);
      }
      handle.setText(transformText(object, familyCount));
    }
    for (const [object, handle] of objectDebugLabels) if (!active.has(object)) { handle.remove(); objectDebugLabels.delete(object); }
  }

  function setDebugEnabled(value) {
    debugEnabled = Boolean(value);
    legend.hidden = !debugEnabled;
    if (debugEnabled) {
      rebuildDebugGrid();
      syncDebugObjects(performance.now(), true);
    } else clearDebugLabels();
    markSceneActive();
    return debugEnabled;
  }

  function update(now = performance.now()) {
    camera.updateMatrixWorld();
    syncDebugObjects(now);
    for (const entry of entries.values()) project(entry);
    if (editorObject && !editorObject.parent) closeTransformEditor();
  }

  transformEditor.querySelector("[data-transform-close]").addEventListener("click", closeTransformEditor);
  transformEditor.querySelector("[data-transform-reset]").addEventListener("click", () => { applyTransformSnapshot(editorInitial); transformEditor.querySelector("[data-transform-status]").textContent = "คืนค่าตอนเปิดเครื่องมือแล้ว"; });
  transformEditor.querySelector("[data-transform-copy]").addEventListener("click", async () => {
    if (!editorObject) return;
    const output = transformCode(transformSnapshot(editorObject));
    try { await navigator.clipboard.writeText(output); transformEditor.querySelector("[data-transform-status]").textContent = "คัดลอกค่าแล้ว"; }
    catch { transformEditor.querySelector("[data-transform-status]").textContent = "คัดลอกไม่ได้ กรุณาเลือกค่าจากกล่องด้านบน"; }
  });
  transformEditor.addEventListener("input", event => {
    if (!event.target.matches("[data-transform-value]") || !editorObject) return;
    applyTransformSnapshot(readTransformEditor());
    transformEditor.querySelector("[data-transform-status]").textContent = "อัปเดตบนฉากแล้ว";
  });

  const debug = Object.freeze({
    toggle(force) { return setDebugEnabled(typeof force === "boolean" ? force : !debugEnabled); },
    setEnabled: setDebugEnabled,
    get enabled() { return debugEnabled; },
    formatTransform: transformText
  });
  return Object.freeze({
    at(position, options = {}) { return add(position, options); },
    attach(target, options = {}) { return add(target, options); },
    get(id) { return entries.get(String(id))?.handle || null; },
    clear,
    clearAll() { clear(); },
    update,
    debug,
    get counts() { return Object.freeze({ labels: [...entries.values()].filter(entry => entry.options.scope !== debugScope).length, debugLabels: [...entries.values()].filter(entry => entry.options.scope === debugScope).length }); }
  });
}
