function asText(value) {
  return String(value ?? "").trim();
}

export function createIntroService({ mount = document.body, lockTarget = null, resolveUrl = value => value, playUiSound = null } = {}) {
  const root = document.createElement("section");
  root.className = "intro-service";
  root.hidden = true;
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "intro-service-title");
  root.innerHTML = `
    <div class="intro-service-card">
      <header class="intro-service-header">
        <div class="intro-service-heading">
          <span class="intro-service-kicker">LEARN MORE</span>
          <h2 id="intro-service-title">เนื้อหาเพิ่มเติม</h2>
          <p data-intro-source></p>
        </div>
        <button type="button" class="intro-service-close" data-intro-close aria-label="ปิดเนื้อหาเพิ่มเติม">
          <span aria-hidden="true">×</span><b>ปิด</b>
        </button>
      </header>
      <div class="intro-service-browser">
        <div class="intro-service-loading" data-intro-loading><i></i><span>กำลังเปิดเนื้อหา…</span></div>
        <iframe data-intro-frame title="เนื้อหาเพิ่มเติม" allow="fullscreen; autoplay; clipboard-read; clipboard-write" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>
    </div>`;
  mount.append(root);

  const frame = root.querySelector("[data-intro-frame]");
  const closeButton = root.querySelector("[data-intro-close]");
  const title = root.querySelector("#intro-service-title");
  const source = root.querySelector("[data-intro-source]");
  const loading = root.querySelector("[data-intro-loading]");
  let active = null;
  let previousFocus = null;
  let previousOverflow = "";

  function setLocked(value) {
    if (lockTarget) lockTarget.inert = Boolean(value);
    document.documentElement.classList.toggle("has-intro-service", Boolean(value));
    if (value) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow;
    }
  }

  function close({ notify = true, reason = "close" } = {}) {
    if (!active) return false;
    const current = active;
    active = null;
    root.hidden = true;
    frame.src = "about:blank";
    setLocked(false);
    const restore = previousFocus;
    previousFocus = null;
    if (restore?.isConnected && typeof restore.focus === "function") restore.focus({ preventScroll: true });
    if (notify) current.onClose?.({ reason, source: current.source });
    return true;
  }

  function open(value = {}) {
    const options = typeof value === "string" ? { url: value } : { ...value };
    const requestedUrl = asText(options.url ?? options.src);
    if (!requestedUrl) throw new Error("INTRO_URL_REQUIRED: intro.open ต้องระบุ url");
    close({ notify: false, reason: "replace" });
    const url = resolveUrl(requestedUrl);
    let host = "เนื้อหาภายในบทเรียน";
    try { host = new URL(url, location.href).host || host; } catch { }
    active = { source: asText(options.source) || "supplemental", onClose: typeof options.onClose === "function" ? options.onClose : null };
    previousFocus = document.activeElement;
    title.textContent = asText(options.title) || "เนื้อหาเพิ่มเติม";
    source.textContent = asText(options.label) || host;
    frame.title = title.textContent;
    loading.hidden = false;
    root.hidden = false;
    setLocked(true);
    frame.src = url;
    requestAnimationFrame(() => closeButton.focus({ preventScroll: true }));
    playUiSound?.();
    return Object.freeze({ close: () => close(), get isOpen() { return Boolean(active); }, url });
  }

  frame.addEventListener("load", () => { if (active) loading.hidden = true; });
  closeButton.addEventListener("click", () => close());
  root.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close({ reason: "escape" });
  });

  return Object.freeze({
    open,
    close,
    get isOpen() { return Boolean(active); },
    get element() { return root; }
  });
}
