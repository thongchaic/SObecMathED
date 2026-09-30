const SETTING_OVERRIDE_KEY = "edu-runtime-setting-override";
const LESSON_RESTORE_KEY = "edu-runtime-lesson-restore";

const clone = value => JSON.parse(JSON.stringify(value));
const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

function mergeObject(target, source) {
  if (!isObject(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    if (isObject(value)) {
      if (!isObject(target[key])) target[key] = {};
      mergeObject(target[key], value);
    } else target[key] = clone(value);
  }
  return target;
}

function diffObject(current, baseline) {
  if (Array.isArray(current)) return JSON.stringify(current) === JSON.stringify(baseline) ? undefined : clone(current);
  if (isObject(current)) {
    const result = {};
    for (const [key, value] of Object.entries(current)) {
      const difference = diffObject(value, baseline?.[key]);
      if (difference !== undefined) result[key] = difference;
    }
    return Object.keys(result).length ? result : undefined;
  }
  return Object.is(current, baseline) ? undefined : current;
}

function valueAt(root, path) { return path.reduce((value, key) => value?.[key], root); }
function setValueAt(root, path, value) { const key = path.at(-1), parent = valueAt(root, path.slice(0, -1)); parent[key] = value; }
function displayName(key) { return String(key).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " "); }
function pathLabel(path) { return path.join("."); }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]); }

export function applyStoredRuntimeSetting(setting) {
  const baseline = clone(setting);
  try {
    const saved = JSON.parse(sessionStorage.getItem(SETTING_OVERRIDE_KEY) || "null");
    if (saved) mergeObject(setting, saved);
  } catch (error) { console.warn("RuntimeSetting: อ่านค่าทดลองเดิมไม่สำเร็จ", error); }
  return baseline;
}

export function saveRuntimeLessonRestore(payload) {
  if (payload) sessionStorage.setItem(LESSON_RESTORE_KEY, JSON.stringify(payload));
}

export function consumeRuntimeLessonRestore() {
  try {
    const value = JSON.parse(sessionStorage.getItem(LESSON_RESTORE_KEY) || "null");
    sessionStorage.removeItem(LESSON_RESTORE_KEY);
    return value;
  } catch { sessionStorage.removeItem(LESSON_RESTORE_KEY); return null; }
}

export function setupRuntimeSettingMenu({ setting, baseline, getMode, onApply, onRefresh, onRestore, onRetest, onGuiLabAction, onToggleDebugArea, debugEnabled = true }) {
  let draft = clone(setting), jsonDirty = false, previewMode = false;
  const panel = document.createElement("section");
  panel.className = "runtime-setting-panel";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Runtime Setting");
  panel.innerHTML = `
    <header class="runtime-setting-header">
      <div class="runtime-setting-header-copy"><small>DEVELOPER TOOL · F6</small><h2>Runtime Setting</h2><p>ทดลองปรับ mainWorldSetting โดยไม่แก้ไฟล์จริง</p></div>
      <div class="runtime-setting-header-actions">
        <div class="runtime-setting-quick-actions" role="group" aria-label="สลับโหมดและโหลดบทเรียนใหม่">
          <button type="button" data-runtime-mode="teacher-lab" title="เปิดบทเรียนเดิมเป็น Teacher Lab" aria-label="เปิดเป็น Teacher Lab"><img src="${new URL("./assets/icon/book.svg", import.meta.url).href}" alt=""><span>Lab</span></button>
          <button type="button" data-runtime-mode="student-quiz" title="เปิดบทเรียนเดิมเป็น Student Quiz" aria-label="เปิดเป็น Student Quiz"><img src="${new URL("./assets/icon/trophy.svg", import.meta.url).href}" alt=""><span>Quiz</span></button>
          <button type="button" data-runtime-retest title="Refresh ทั้งหน้าและเปิดบทเรียนเดิม (F4)" aria-label="Refresh และเปิดบทเรียนเดิม"><img src="${new URL("./assets/icon/reset.svg", import.meta.url).href}" alt=""><span>Refresh</span></button>
        </div>
        <button class="runtime-setting-close" type="button" aria-label="ปิด Runtime Setting">×</button>
      </div>
    </header>
    <div class="runtime-setting-toolbar">
      <div class="runtime-setting-search-tools">
        <label><span>ค้นหาค่า</span><input type="search" data-setting-search placeholder="เช่น fog, scale, color"></label>
        <div class="runtime-setting-tree-actions" data-tree-actions>
          <button type="button" data-expand-all title="ขยายทั้งหมด" aria-label="ขยาย Setting ทั้งหมด"><img src="${new URL("./assets/icon/expand-all.svg", import.meta.url).href}" alt=""></button>
          <button type="button" data-collapse-all title="พับทั้งหมด" aria-label="พับ Setting ทั้งหมด"><img src="${new URL("./assets/icon/collapse-all.svg", import.meta.url).href}" alt=""></button>
        </div>
      </div>
      <div class="runtime-setting-tabs"><button type="button" class="is-active" data-setting-tab="gui">Settings</button><button type="button" data-setting-tab="json">JSON</button><button type="button" data-setting-tab="service">GUI Service Lab</button></div>
    </div>
    <div class="runtime-setting-content">
      <div class="runtime-setting-gui is-active" data-setting-view="gui" data-setting-gui></div>
      <div class="runtime-setting-json" data-setting-view="json" data-setting-json-view hidden><textarea spellcheck="false" aria-label="mainWorldSetting JSON"></textarea></div>
      <div class="runtime-gui-lab" data-setting-view="service" hidden>
        <header><strong>GUI Service Lab</strong><p>ทดสอบ UI กลางกับบทเรียนปัจจุบัน ค่า Preview จะไม่ถูกบันทึก</p></header>
        <div class="runtime-gui-lab-form">
          <label><span>Service</span><select data-gui-lab-service><option value="question">Question Panel</option><option value="gui-answer">GUI Answer Bar</option><option value="console">Main Console</option><option value="top-message">Top Message</option><option value="choice">Choice Panel</option><option value="gizmo">Gizmo (Object ที่เลือก/ชิ้นแรก)</option><option value="world-gui-system">World GUI System (ป้ายเล็กตามโมเดล)</option><option value="world-counter">World Counter (3D Digits)</option><option value="world-gui">World GUI (ข้อความบนพื้น)</option><option value="feedback">Feedback</option><option value="dialog">Dialog</option><option value="control-top">Control Menu · Top Right</option><option value="control-middle">Control Menu · Middle Right</option><option value="control-bottom">Control Menu · Bottom Right</option><option value="hint">Mascot Hint</option><option value="busy">Busy Overlay</option></select></label>
          <label><span>Tone</span><select data-gui-lab-tone><option value="primary">Primary</option><option value="info">Info</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Error</option></select></label>
          <label class="is-wide"><span>ข้อความทดสอบ</span><input type="text" data-gui-lab-text value="ตัวอย่าง GUI Service จาก Runtime Setting"></label>
        </div>
        <div class="runtime-gui-lab-actions"><button type="button" data-gui-lab-preview>Preview</button><button type="button" data-gui-lab-update>Update</button><button type="button" data-gui-lab-clear>Clear Debug UI</button></div>
        <pre class="runtime-gui-lab-log" data-gui-lab-log>เลือก Service แล้วกด Preview</pre>
      </div>
    </div>
    <div class="runtime-setting-result" data-setting-result hidden>
      <header><strong>Modified values only</strong><button type="button" data-copy-modified>Copy JSON</button></header>
      <pre></pre>
    </div>
    <p class="runtime-setting-status" data-setting-status aria-live="polite"></p>
    <footer class="runtime-setting-actions">
      <button type="button" class="runtime-setting-restore" data-restore-default><img src="${new URL("./assets/icon/restore.svg", import.meta.url).href}" alt="">Restore Default</button>
      <button type="button" data-refresh-lesson>Refresh Lesson + Assets</button>
      <button type="button" data-get-modified>Get Modified</button>
      <button type="button" class="runtime-setting-apply" data-apply-setting>Apply & Rebuild</button>
    </footer>`;
  document.body.append(panel);

  const gui = panel.querySelector("[data-setting-gui]"), jsonView = panel.querySelector("[data-setting-json-view]"), jsonEditor = jsonView.querySelector("textarea"), serviceView = panel.querySelector('[data-setting-view="service"]'), serviceLog = panel.querySelector("[data-gui-lab-log]"), status = panel.querySelector("[data-setting-status]"), result = panel.querySelector("[data-setting-result]"), resultCode = result.querySelector("pre"), search = panel.querySelector("[data-setting-search]"), treeActions = panel.querySelector("[data-tree-actions]");

  function setStatus(message, type = "") { status.textContent = message; status.dataset.type = type; }
  function syncQuickActions() { const mode = getMode?.() || ""; panel.querySelectorAll("[data-runtime-mode]").forEach(button => button.classList.toggle("is-active", button.dataset.runtimeMode === mode || (button.dataset.runtimeMode === "teacher-lab" && mode === "student-lab"))); }
  function syncJson() { jsonEditor.value = JSON.stringify(draft, null, 2); jsonDirty = false; }
  function readJson() {
    if (!jsonDirty) return true;
    try { draft = JSON.parse(jsonEditor.value); jsonDirty = false; setStatus("อ่าน JSON เรียบร้อย", "success"); return true; }
    catch (error) { setStatus(`JSON ไม่ถูกต้อง: ${error.message}`, "error"); return false; }
  }

  function primitiveControl(key, value, path) {
    const label = escapeHtml(displayName(key)), encoded = escapeHtml(JSON.stringify(path)), fullPath = escapeHtml(pathLabel(path));
    if (typeof value === "boolean") return `<label class="runtime-setting-field is-boolean" data-setting-row data-path="${fullPath}"><span>${label}<small>${fullPath}</small></span><input data-setting-path="${encoded}" type="checkbox" ${value ? "checked" : ""}><i></i></label>`;
    if (typeof value === "number") return `<label class="runtime-setting-field" data-setting-row data-path="${fullPath}"><span>${label}<small>${fullPath}</small></span><input data-setting-path="${encoded}" type="number" step="any" value="${value}"></label>`;
    const color = typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
    return `<label class="runtime-setting-field ${color ? "is-color" : ""}" data-setting-row data-path="${fullPath}"><span>${label}<small>${fullPath}</small></span>${color ? `<input data-color-path="${encoded}" type="color" value="${escapeHtml(value)}">` : ""}<input data-setting-path="${encoded}" type="text" value="${escapeHtml(value ?? "")}"></label>`;
  }

  function nodeMarkup(key, value, path, depth = 0) {
    const fullPath = escapeHtml(pathLabel(path));
    if (Array.isArray(value)) return `<label class="runtime-setting-field is-array" data-setting-row data-path="${fullPath}"><span>${escapeHtml(displayName(key))}<small>${fullPath} · Array</small></span><textarea data-setting-path="${escapeHtml(JSON.stringify(path))}" data-value-type="json" spellcheck="false">${escapeHtml(JSON.stringify(value))}</textarea></label>`;
    if (isObject(value)) return `<details class="runtime-setting-group" data-setting-row data-path="${fullPath}" ${depth < 1 ? "open" : ""}><summary><span>${escapeHtml(displayName(key))}</span><small>${fullPath}</small></summary><div>${Object.entries(value).map(([childKey, child]) => nodeMarkup(childKey, child, [...path, childKey], depth + 1)).join("")}</div></details>`;
    return primitiveControl(key, value, path);
  }

  function renderGui() { gui.innerHTML = Object.entries(draft).map(([key, value]) => nodeMarkup(key, value, [key])).join(""); filterRows(); }
  function filterRows() {
    const query = search.value.trim().toLowerCase();
    for (const row of gui.querySelectorAll("[data-setting-row]")) row.classList.toggle("is-filtered", Boolean(query && !row.dataset.path.toLowerCase().includes(query)));
    if (query) for (const details of gui.querySelectorAll("details")) if (details.querySelector("[data-setting-row]:not(.is-filtered)")) details.open = true;
  }

  function updateDraft(input) {
    const path = JSON.parse(input.dataset.settingPath || input.dataset.colorPath), current = valueAt(draft, path); let value;
    try {
      if (input.dataset.valueType === "json") value = JSON.parse(input.value);
      else if (input.type === "checkbox") value = input.checked;
      else if (typeof current === "number") value = Number(input.value);
      else value = input.value;
      setValueAt(draft, path, value); input.closest("[data-setting-row]")?.classList.remove("has-error");
      if (input.dataset.colorPath) { const text = gui.querySelector(`[data-setting-path='${CSS.escape(input.dataset.colorPath)}']`); if (text) text.value = value; }
      else if (/^#[0-9a-f]{6}$/i.test(String(value))) { const picker = gui.querySelector(`[data-color-path='${CSS.escape(input.dataset.settingPath)}']`); if (picker) picker.value = value; }
      syncJson(); setStatus(`แก้ไข ${pathLabel(path)}`);
    } catch (error) { input.closest("[data-setting-row]")?.classList.add("has-error"); setStatus(`ค่า ${pathLabel(path)} ไม่ถูกต้อง: ${error.message}`, "error"); }
  }

  function modifiedValue() { if (!readJson()) return null; return diffObject(draft, baseline) || {}; }
  function showModified() { const modified = modifiedValue(); if (modified === null) return null; result.hidden = false; resultCode.textContent = JSON.stringify(modified, null, 2); setStatus(Object.keys(modified).length ? "แสดงเฉพาะค่าที่ต่างจากไฟล์หลักแล้ว" : "ยังไม่มีค่าที่เปลี่ยน", "success"); return modified; }
  function openPanel() { if (previewMode || debugEnabled !== true) return; draft = clone(setting); renderGui(); syncJson(); syncQuickActions(); result.hidden = true; setStatus("แก้ค่าแล้วกด Apply & Rebuild เพื่อดูผลทันที"); panel.hidden = false; panel.classList.remove("is-closing"); requestAnimationFrame(() => panel.classList.add("is-open")); search.focus(); }
  function closePanel() { panel.classList.remove("is-open"); panel.classList.add("is-closing"); setTimeout(() => { panel.hidden = true; panel.classList.remove("is-closing"); }, 180); }

  gui.addEventListener("input", event => { const input = event.target.closest("[data-setting-path],[data-color-path]"); if (input) updateDraft(input); });
  search.addEventListener("input", filterRows);
  jsonEditor.addEventListener("input", () => { jsonDirty = true; setStatus("JSON มีการแก้ไข กด Apply หรือ Get Modified เพื่อตรวจสอบ"); });
  panel.querySelector(".runtime-setting-close").addEventListener("click", closePanel);
  panel.querySelectorAll("[data-runtime-mode]").forEach(button => button.addEventListener("click", () => { setStatus(`กำลังเปิดบทเรียนเดิมเป็น ${button.dataset.runtimeMode === "student-quiz" ? "Student Quiz" : "Teacher Lab"}…`, "success"); onRetest?.({ mode: button.dataset.runtimeMode }); }));
  panel.querySelector("[data-runtime-retest]").addEventListener("click", () => { setStatus("กำลัง Refresh ทั้งหน้าและเปิดบทเรียนเดิม…", "success"); onRetest?.({}); });
  panel.querySelectorAll("[data-setting-tab]").forEach(button => button.addEventListener("click", () => { const tab = button.dataset.settingTab; if (tab !== "json" && jsonDirty && !readJson()) return; panel.querySelectorAll("[data-setting-tab]").forEach(item => item.classList.toggle("is-active", item === button)); for (const view of panel.querySelectorAll("[data-setting-view]")) { const active = view.dataset.settingView === tab; view.hidden = !active; view.classList.toggle("is-active", active); } treeActions.hidden = tab !== "gui"; search.closest("label").hidden = tab === "service"; if (tab === "gui") { renderGui(); syncJson(); } }));
  async function runGuiLab(action) { const payload = { service: panel.querySelector("[data-gui-lab-service]").value, tone: panel.querySelector("[data-gui-lab-tone]").value, text: panel.querySelector("[data-gui-lab-text]").value }; try { const response = await onGuiLabAction?.(action, payload); serviceLog.textContent = typeof response === "string" ? response : JSON.stringify(response || { action, ...payload }, null, 2); setStatus(`GUI Service Lab: ${action}`, "success"); } catch (error) { serviceLog.textContent = error.stack || error.message; setStatus(error.message, "error"); } }
  panel.querySelector("[data-gui-lab-preview]").addEventListener("click", () => runGuiLab("preview"));
  panel.querySelector("[data-gui-lab-update]").addEventListener("click", () => runGuiLab("update"));
  panel.querySelector("[data-gui-lab-clear]").addEventListener("click", () => runGuiLab("clear"));
  panel.querySelector("[data-expand-all]").addEventListener("click", () => { for (const group of gui.querySelectorAll("details")) group.open = true; setStatus("ขยาย Setting ทุกหมวดแล้ว", "success"); });
  panel.querySelector("[data-collapse-all]").addEventListener("click", () => { for (const group of gui.querySelectorAll("details")) group.open = false; setStatus("พับ Setting ทุกหมวดแล้ว", "success"); });
  panel.querySelector("[data-get-modified]").addEventListener("click", showModified);
  panel.querySelector("[data-copy-modified]").addEventListener("click", async () => { const modified = showModified(); if (modified === null) return; try { await navigator.clipboard.writeText(JSON.stringify(modified, null, 2)); setStatus("คัดลอก Modified JSON แล้ว", "success"); } catch { setStatus("คัดลอกอัตโนมัติไม่ได้ กรุณาเลือกข้อความในกล่องด้านบน", "error"); } });
  panel.querySelector("[data-apply-setting]").addEventListener("click", async () => { const modified = modifiedValue(); if (modified === null) return; setStatus("กำลังสร้าง Runtime ใหม่จากค่าที่แก้ไข…", "success"); sessionStorage.setItem(SETTING_OVERRIDE_KEY, JSON.stringify(modified)); await onApply?.(modified); });
  panel.querySelector("[data-restore-default]").addEventListener("click", async () => { setStatus("กำลังคืนค่าจาก main-world-setting.js…", "success"); sessionStorage.removeItem(SETTING_OVERRIDE_KEY); await onRestore?.(); });
  panel.querySelector("[data-refresh-lesson]").addEventListener("click", async () => { setStatus("กำลังโหลดบทเรียนและ asset ใหม่…", "success"); try { await onRefresh?.(); closePanel(); } catch (error) { setStatus(error.message, "error"); } });
  window.addEventListener("keydown", event => { if (event.key === "F6" && !previewMode && debugEnabled === true) { event.preventDefault(); if (panel.hidden) openPanel(); else closePanel(); } else if (event.key === "Escape" && !panel.hidden) closePanel(); });
  // Keep developer shortcuts outside runtime UI skins and the lesson tool drawer.
  const debugTools = document.createElement("nav");
  debugTools.className = "runtime-debug-tools";
  debugTools.hidden = debugEnabled !== true;
  debugTools.setAttribute("aria-label", "เครื่องมือ Debug");
  const gearIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.08-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.3 7.3 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.49.49 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.64l2.11 1.65c-.05.32-.08.66-.08.98s.03.66.08.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.12.22.38.31.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.24.42.49.42h4c.25 0 .45-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.12-1.65ZM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>`;
  debugTools.innerHTML = `<button type="button" data-debug-action="refresh" aria-label="Refresh และเปิดบทเรียนเดิม" title="Refresh · F4">↻</button><button type="button" data-debug-action="settings" aria-label="เปิด Runtime Setting" title="Runtime Setting · F6">${gearIcon}</button><button type="button" data-debug-action="debug-area" aria-label="เปิด Debug Area แสดงพิกัดและ Transform" aria-pressed="false" title="เปิด Debug Area · พิกัด X/Z และ Transform โมเดล">XYZ</button><button type="button" data-debug-action="teacher-lab" aria-label="เปิดเป็น Teacher Lab" title="Teacher Lab">Lab</button><button type="button" data-debug-action="student-quiz" aria-label="เปิดเป็น Student Quiz" title="Student Quiz">Quiz</button>`;
  document.body.append(debugTools);
  debugTools.addEventListener("click", async event => {
    const action = event.target.closest("[data-debug-action]")?.dataset.debugAction;
    if (!action) return;
    try {
      if (action === "settings") { if (panel.hidden) openPanel(); else closePanel(); }
      else if (action === "debug-area") {
        const button = event.target.closest("[data-debug-action]");
        const enabled = Boolean(onToggleDebugArea?.());
        button.classList.toggle("is-active", enabled);
        button.setAttribute("aria-pressed", String(enabled));
        button.setAttribute("aria-label", `${enabled ? "ปิด" : "เปิด"} Debug Area แสดงพิกัดและ Transform`);
        button.title = `${enabled ? "ปิด" : "เปิด"} Debug Area · พื้นเกาะ X/Z · ความสูง Y`;
      }
      else if (action === "refresh") await onRefresh?.();
      else await onRetest?.({ mode: action });
    } catch (error) { console.warn("[Runtime Debug]", error); }
  });
  return Object.freeze({
    open: openPanel, close: closePanel,
    toggle() { if (previewMode || debugEnabled !== true) return; if (panel.hidden) openPanel(); else closePanel(); },
    setPreviewMode(value) {
      previewMode = value === true;
      debugTools.hidden = previewMode || debugEnabled !== true;
      if (previewMode) {
        onToggleDebugArea?.(false);
        panel.classList.remove("is-open", "is-closing");
        panel.hidden = true;
      }
    }
  });
}
