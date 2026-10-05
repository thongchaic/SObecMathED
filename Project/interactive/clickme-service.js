// An opt-in visual cue. Lessons decide which individual objects deserve a hand.
export function createClickmeService({ THREE, viewport, camera, setting = {}, isActionPhase = () => false, isGuideActive = () => false, isReturning = () => false, getHovered = () => null } = {}) {
  if (!THREE || !viewport || !camera) throw new Error("CLICKME_SETUP: THREE, viewport and camera are required");

  const layer = document.createElement("div");
  layer.className = "clickme-layer";
  layer.setAttribute("aria-hidden", "true");
  viewport.append(layer);

  const entries = new Set();
  const box = new THREE.Box3();
  const point = new THREE.Vector3();
  const openUrl = new URL("./assets/icon/clickme-chubby-open.webp", import.meta.url).href;
  const gripUrl = new URL("./assets/icon/clickme-chubby-fist.webp", import.meta.url).href;
  const targetObject = target => target?.object3D || target;
  const coarsePointer = () => typeof matchMedia === "function" && matchMedia("(hover: none), (pointer: coarse)").matches;
  const configured = () => setting.ui?.clickme || {};
  const numberInRange = (value, fallback, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  };
  const cssVariable = (entry, name, value) => {
    if (entry.appearance[name] === value) return;
    entry.appearance[name] = value;
    if (entry.element.style.setProperty) entry.element.style.setProperty(name, value);
    else entry.element.style[name] = value;
  };

  function applyAppearance(entry) {
    const config = configured();
    const baseSize = numberInRange(entry.options.size ?? config.size, 40, 1, 256);
    const globalScale = numberInRange(config.scale, 1, 0.1, 5);
    const localScale = numberInRange(entry.options.scale, 1, 0.1, 5);
    const size = `${Math.round(baseSize * globalScale * localScale)}px`;
    if (entry.element.style.width !== size) {
      entry.element.style.width = size;
      entry.element.style.height = size;
    }
    cssVariable(entry, "--clickme-animation-time", `${numberInRange(config.animationTime, 900, 100, 10000)}ms`);
    cssVariable(entry, "--clickme-opacity-transition", `${numberInRange(config.opacityTransitionTime, 150, 0, 2000)}ms`);
  }

  function removeEntry(entry) {
    entries.delete(entry);
    entry.element.remove();
  }

  function attach(target, options = {}) {
    const object = targetObject(target);
    if (!object?.isObject3D) throw new Error("CLICKME_TARGET: attach requires a world object or its handle");
    if (!object.userData?.draggable && !object.userData?.clickable) throw new Error("CLICKME_TARGET: target must be draggable or clickable");
    // Reattaching the same object replaces its cue; never create a stack of hands.
    for (const entry of [...entries]) if (entry.object === object) removeEntry(entry);

    const element = document.createElement("div");
    element.className = "clickme-indicator";
    element.hidden = true;
    for (const [className, source] of [["is-open", openUrl], ["is-grip", gripUrl]]) {
      const image = document.createElement("img");
      image.className = className;
      image.src = source;
      image.alt = "";
      image.draggable = false;
      element.append(image);
    }
    layer.append(element);

    const entry = {
      object, element, options, appearance: {},
      anchor: options.anchor === "top" ? "top" : "bottom",
      offset: Array.isArray(options.offset) ? options.offset : [0, 0, 0],
      completed: false,
      suspended: false
    };
    applyAppearance(entry);
    entries.add(entry);
    return Object.freeze({
      get element() { return element; },
      complete() { entry.completed = true; element.hidden = true; },
      restore() { entry.completed = false; entry.suspended = false; },
      remove() { removeEntry(entry); }
    });
  }

  function suspendFor(target) {
    const object = targetObject(target);
    for (const entry of entries) if (entry.object === object) { entry.suspended = true; entry.element.hidden = true; }
  }

  function restoreFor(target) {
    const object = targetObject(target);
    for (const entry of entries) if (entry.object === object) { entry.completed = false; entry.suspended = false; }
  }

  function completeFor(target) {
    const object = targetObject(target);
    for (const entry of entries) if (entry.object === object) { entry.completed = true; entry.element.hidden = true; }
  }

  function finishFor(target, { completed = false } = {}) {
    if (completed) completeFor(target);
    else restoreFor(target);
  }

  function clearAll() { for (const entry of [...entries]) removeEntry(entry); }

  function update() {
    if (!entries.size) return;
    const active = isActionPhase() && !isGuideActive();
    const rect = viewport.getBoundingClientRect();
    const hovered = getHovered();
    const bright = coarsePointer();
    for (const entry of [...entries]) {
      const { object, element } = entry;
      if (!object.parent) { removeEntry(entry); continue; }
      applyAppearance(entry);
      if (!active || entry.completed || entry.suspended || isReturning(object) || !object.visible || (!object.userData.draggable && !object.userData.clickable) || !rect.width || !rect.height) {
        element.hidden = true;
        continue;
      }
      object.updateWorldMatrix(true, true);
      box.setFromObject(object.userData.visualRoot || object);
      if (box.isEmpty()) object.getWorldPosition(point);
      else { box.getCenter(point); point.y = entry.anchor === "top" ? box.max.y : box.min.y; }
      point.x += Number(entry.offset[0]) || 0;
      point.y += Number(entry.offset[1]) || 0;
      point.z += Number(entry.offset[2]) || 0;
      point.project(camera);
      if (point.z < -1 || point.z > 1 || Math.abs(point.x) > 1.12 || Math.abs(point.y) > 1.12) { element.hidden = true; continue; }
      element.style.left = `${(point.x * .5 + .5) * rect.width}px`;
      element.style.top = `${(-point.y * .5 + .5) * rect.height}px`;
      const config = configured();
      element.style.opacity = String(bright
        ? numberInRange(config.mobileOpacity, 1, 0, 1)
        : hovered === object
          ? numberInRange(config.hoverOpacity, 1, 0, 1)
          : numberInRange(config.unhoverOpacity, 0.4, 0, 1));
      element.hidden = false;
    }
  }

  return Object.freeze({ attach, suspendFor, restoreFor, completeFor, finishFor, clearAll, update });
}
