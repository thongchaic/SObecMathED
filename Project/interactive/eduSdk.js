(function createEduSDK(global) {
  "use strict";

  const scriptUrl = new URL(document.currentScript.src);
  // Production uses the SDK script version as a stable cache key. Deployments
  // can invalidate the shell deliberately by changing ?v= on eduSdk.js.
  const cacheVersion = scriptUrl.searchParams.get("v") || "1.0.0";
  const runtimeUrl = new URL("./main-world.html", scriptUrl);
  runtimeUrl.searchParams.set("v", cacheVersion);
  const runtimeChannel = "edu-widget";

  const state = {
    status: "idle",
    options: null,
    container: null,
    setupFrame: null,
    lessonFrame: null,
    overlay: null,
    setupTimer: null,
    openTimer: null,
    removeTimer: null,
    layoutFrame: null,
    containerObserver: null,
    resolveToken: 0,
    activeLesson: null,
    previousBodyOverflow: "",
    previousContainerPosition: "",
    containerPositionChanged: false,
    fullScreen: true
  };

  const styleId = "edu-sdk-overlay-style";
  const setupTimeoutMs = 8000;
  const lessonEventTypes = new Set([
    "runtime.ready",
    "runtime.setupError",
    "lesson.progress",
    "lesson.complete",
    "lesson.error",
    "lesson.closeRequested",
    "lesson.retestRequested"
  ]);
  const hostEventTypes = new Set([
    "host.openLesson",
    "host.closeLesson",
    "host.toggleRuntimeSetting",
    "host.showRuntimeFailure"
  ]);

  function createError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .edu-sdk-overlay {
        position: fixed;
        z-index: 2147483000;
        inset: 0;
        background: #ffffffff;
        opacity: 0;
        visibility: hidden;
        transition: opacity 260ms ease, visibility 260ms ease;
      }

      .edu-sdk-overlay iframe {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        opacity: 0;
        transform: translateY(28px) scale(.99);
        transition: opacity 300ms ease, transform 360ms cubic-bezier(.2, .8, .2, 1);
      }

      .edu-sdk-overlay.is-visible {
        opacity: 1;
        visibility: visible;
      }

      .edu-sdk-overlay.is-visible iframe {
        opacity: 1;
        transform: translateY(0) scale(1);
      }

      .edu-sdk-overlay.is-contained {
        position: absolute;
        overflow: hidden;
      }

      .edu-sdk-overlay.is-contained iframe {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        transform: translateY(28px) scale(var(--edu-sdk-frame-enter-scale, .99));
      }

      .edu-sdk-overlay.is-contained.is-visible iframe {
        transform: translateY(0) scale(var(--edu-sdk-frame-scale, 1));
      }

      @media (prefers-reduced-motion: reduce) {
        .edu-sdk-overlay,
        .edu-sdk-overlay iframe { transition-duration: 1ms; }
      }
    `;
    document.head.append(style);
  }

  function notifyError(error) {
    state.options?.onError?.(error);
  }

  function resetFrameTimers() {
    global.clearTimeout(state.setupTimer);
    global.clearTimeout(state.openTimer);
    state.setupTimer = null;
    state.openTimer = null;
  }

  function restoreContainerPosition() {
    if (!state.containerPositionChanged || !state.container) return;
    state.container.style.position = state.previousContainerPosition;
    state.containerPositionChanged = false;
  }

  function stopContainerObserver() {
    state.containerObserver?.disconnect();
    state.containerObserver = null;
    global.cancelAnimationFrame?.(state.layoutFrame);
    state.layoutFrame = null;
  }

  function containedMetrics() {
    const bounds = state.container?.getBoundingClientRect?.() || {};
    const width = Math.max(1, Number(bounds.width) || state.container?.clientWidth || global.innerWidth || 1);
    const height = Math.max(1, Number(bounds.height) || state.container?.clientHeight || global.innerHeight || 1);
    const referenceWidth = Math.max(1, Number(state.options?.embeddedReferenceWidth) || 1280);
    const referenceHeight = Math.max(1, Number(state.options?.embeddedReferenceHeight) || 720);
    const minimumScale = Math.min(1, Math.max(.1, Number(state.options?.embeddedMinimumScale) || .2));
    const scale = Math.min(1, Math.max(minimumScale, Math.min(width / referenceWidth, height / referenceHeight)));
    return { width, height, scale, logicalWidth: Math.ceil(width / scale), logicalHeight: Math.ceil(height / scale) };
  }

  function applyFrameLayout() {
    if (!state.overlay || !state.lessonFrame) return;
    const contained = state.fullScreen === false;
    state.overlay.classList.toggle("is-contained", contained);
    state.overlay.dataset.fullScreen = String(!contained);
    if (!contained) {
      state.lessonFrame.style.width = "100%";
      state.lessonFrame.style.height = "100%";
      state.lessonFrame.style.removeProperty?.("--edu-sdk-frame-scale");
      state.lessonFrame.style.removeProperty?.("--edu-sdk-frame-enter-scale");
      restoreContainerPosition();
      document.body.style.overflow = "hidden";
      return;
    }

    const computedPosition = global.getComputedStyle?.(state.container)?.position;
    if (!state.containerPositionChanged && (!computedPosition || computedPosition === "static")) {
      state.previousContainerPosition = state.container.style.position || "";
      state.container.style.position = "relative";
      state.containerPositionChanged = true;
    }
    const metrics = containedMetrics();
    state.lessonFrame.style.width = `${metrics.logicalWidth}px`;
    state.lessonFrame.style.height = `${metrics.logicalHeight}px`;
    state.lessonFrame.style.setProperty?.("--edu-sdk-frame-scale", String(metrics.scale));
    state.lessonFrame.style.setProperty?.("--edu-sdk-frame-enter-scale", String(metrics.scale * .99));
    document.body.style.overflow = state.previousBodyOverflow;
  }

  function scheduleFrameLayout() {
    if (state.layoutFrame != null) return;
    const schedule = global.requestAnimationFrame || (callback => global.setTimeout(callback, 0));
    state.layoutFrame = schedule(() => { state.layoutFrame = null; applyFrameLayout(); });
  }

  function startContainerObserver() {
    stopContainerObserver();
    if (state.fullScreen !== false || typeof global.ResizeObserver !== "function" || !state.container) return;
    state.containerObserver = new global.ResizeObserver(scheduleFrameLayout);
    state.containerObserver.observe(state.container);
  }

  // true (ค่าเริ่มต้น) เปิดเต็ม viewport แบบเดิม
  // false ใช้ขนาด panel ของ host และสร้าง virtual viewport เพื่อรักษาสัดส่วน UI/3D/Gizmos
  function onfullScreen(value = true) {
    state.fullScreen = value !== false;
    applyFrameLayout();
    startContainerObserver();
    return state.fullScreen;
  }

  function failSetup(error) {
    resetFrameTimers();
    state.setupFrame?.remove();
    state.setupFrame = null;
    state.status = "error";
    notifyError(error);
  }

  function removeLessonOverlay() {
    global.clearTimeout(state.openTimer);
    state.openTimer = null;
    global.clearTimeout(state.removeTimer);
    state.removeTimer = null;
    stopContainerObserver();
    state.overlay?.remove();
    state.overlay = null;
    state.lessonFrame = null;
    state.activeLesson = null;
    document.body.style.overflow = state.previousBodyOverflow;
    restoreContainerPosition();
    if (state.status !== "error") state.status = "ready";
  }

  function sendToLesson(type, payload = {}) {
    const activeLesson = state.activeLesson;
    if (!activeLesson) return;
    state.lessonFrame?.contentWindow?.postMessage(
      {
        channel: runtimeChannel,
        type,
        payload
      },
      activeLesson.targetOrigin
    );
  }

  function closeLesson() {
    if (!state.overlay || state.status === "closing") return false;

    if (state.status === "open") sendToLesson("host.closeLesson");
    global.clearTimeout(state.openTimer);
    state.openTimer = null;
    const onClose = state.activeLesson?.onClose;
    const lessonData = state.activeLesson?.data;
    state.status = "closing";
    state.overlay.classList.remove("is-visible");
    state.removeTimer = global.setTimeout(removeLessonOverlay, 380);

    // จุดส่ง callback กลับไปยังเว็บหลัก เมื่อบทเรียนกำลังถูกปิด
    //console.log("[EduSDK] เรียก onClose()", { lessonData });
    onClose?.();
    return true;
  }

  function failOpen(error) {
    global.clearTimeout(state.openTimer);
    state.openTimer = null;
    state.status = "error";
    state.overlay?.classList.remove("is-visible");
    state.removeTimer = global.setTimeout(removeLessonOverlay, 380);
    notifyError(error);
  }

  function handleLessonEvent(type, payload) {
    const activeLesson = state.activeLesson;
    if (!state.lessonFrame || !activeLesson || !lessonEventTypes.has(type)) return false;

    if (type === "runtime.ready" && ["opening", "opening-error"].includes(state.status)) {
      global.clearTimeout(state.openTimer);
      state.openTimer = null;
      state.status = "open";
      sendToLesson("host.openLesson", state.activeLesson.runtimePayload);
    }

    if (type === "runtime.setupError") {
      global.clearTimeout(state.openTimer);
      state.openTimer = null;
      state.status = "opening-error";
      notifyError(createError("RUNTIME_ASSET_ERROR", payload?.message || "main-world เริ่มทำงานไม่สำเร็จ"));
    }

    if (type === "lesson.progress") {
      state.options.onProgress?.(state.activeLesson.data, payload);
    }

    if (type === "lesson.complete" && state.status === "open") {
      const lessonData = state.activeLesson?.data;
      if (activeLesson.completionReceived) return;
      activeLesson.completionReceived = true;
      const result = {
        status: "completed",
        ...(payload && typeof payload === "object" && !Array.isArray(payload) ? payload : {}),
        lessonId: lessonData.Id
      };

      // จุดส่งผลลัพธ์กลับไปยังเว็บหลัก: argument แรกคือ lessonData เดิม
      // และ argument ที่สองคือ result ที่ส่งมาจากบทเรียน
      /*
      console.log("[EduSDK] เรียก onComplete(lessonData, result)", {
        lessonData,
        result
      });
      */
      state.activeLesson?.onComplete?.(lessonData, result);
    }

    if (type === "lesson.error") {
      notifyError(createError("LESSON_LOAD_ERROR", payload?.message || "บทเรียนรายงานข้อผิดพลาด"));
    }

    if (type === "lesson.retestRequested") {
      const nextMode = payload?.mode;
      if (activeLesson.data.preview === true && ["teacher-lab", "student-quiz"].includes(nextMode)) {
        const nextData = { ...activeLesson.data, mode: nextMode };
        const { onComplete, onClose, runtimePayload } = activeLesson;
        sendToLesson("host.closeLesson");
        removeLessonOverlay();
        openLesson(nextData, onComplete, onClose, runtimePayload.lessonHtml ? { html: runtimePayload.lessonHtml } : {});
      } else if (activeLesson.data.preview !== true) state.options?.onRetestRequested?.(activeLesson.data, payload || {});
    }
    if (type === "lesson.closeRequested") closeLesson();
    return true;
  }

  // Public service สำหรับ Full HTML lesson ที่อยู่ same-origin
  // sourceWindow บังคับให้ตรงกับ iframe ที่ EduSDK กำลังเปิดอยู่เสมอ
  function sendLessonEvent(sourceWindow, type, payload = {}) {
    if (
      !state.lessonFrame ||
      !state.activeLesson ||
      sourceWindow !== state.lessonFrame.contentWindow ||
      !lessonEventTypes.has(type)
    ) return false;

    return handleLessonEvent(type, payload);
  }

  // ใช้ตรวจ postMessage ขาเข้าจาก EduSDK ก่อน lesson อ่าน payload
  function isValidLessonMessage(event, lessonWindow) {
    return Boolean(
      event &&
      state.lessonFrame &&
      state.activeLesson &&
      lessonWindow === state.lessonFrame.contentWindow &&
      event.source === global &&
      event.origin === global.location.origin &&
      event.data?.channel === runtimeChannel &&
      hostEventTypes.has(event.data?.type)
    );
  }

  function handleMessage(event) {
    if (!event.data || typeof event.data !== "object") return;
    const { type, payload } = event.data;

    if (state.setupFrame && event.source === state.setupFrame.contentWindow) {
      if (event.origin !== runtimeUrl.origin || event.data?.channel !== runtimeChannel) return;
      if (type === "runtime.ready") {
        global.clearTimeout(state.setupTimer);
        state.setupTimer = null;
        state.setupFrame.remove();
        state.setupFrame = null;
        state.status = "ready";
        state.options.onSetupComplete?.({
          ready: true,
          cacheVersion,
          runtime: "main-world",
          externalLessons: true
        });
      }

      if (type === "runtime.setupError") {
        failSetup(createError("SETUP_ASSET_ERROR", payload.message));
      }
      return;
    }

    const activeLesson = state.activeLesson;
    if (!state.lessonFrame || !activeLesson || event.source !== state.lessonFrame.contentWindow) return;
    if (event.origin !== activeLesson.targetOrigin || event.data?.channel !== runtimeChannel) return;
    handleLessonEvent(type, payload);
  }

  async function checkRuntimeFiles() {
    const requiredFiles = [
      runtimeUrl,
      new URL("./main-world.js", runtimeUrl),
      new URL("./main-world-setting.js", runtimeUrl),
      new URL("./debug-scene-time.mjs", runtimeUrl),
      new URL("./runtime-setting-menu.js", runtimeUrl),
      new URL("./world.css", runtimeUrl),
      new URL("../plugins/vendor/three/0.180.0/three.module.min.js", runtimeUrl),
      new URL("../plugins/vendor/three/0.180.0/three.core.min.js", runtimeUrl),
      new URL("../plugins/vendor/three/0.180.0/RoundedBoxGeometry.js", runtimeUrl),
      new URL("../plugins/vendor/three/0.180.0/loaders/FBXLoader.js", runtimeUrl),
      new URL("./vendor/three/GLTFLoader.js", runtimeUrl)
    ];
    await Promise.all(requiredFiles.map(async (source) => {
      const url = new URL(source.href);
      url.searchParams.set("v", cacheVersion);
      const response = await fetch(url.href, { credentials: "same-origin", cache: "no-store" });
      if (!response.ok) throw createError("SETUP_ASSET_ERROR", `ติดตั้ง EduSDK ไม่สำเร็จ: โหลด ${url.pathname.split("/").pop()} ไม่ได้ (${response.status})`);
    }));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", { powerPreference: "low-power" }) || canvas.getContext("webgl");
    if (!context) throw createError("SETUP_WEBGL_ERROR", "ติดตั้ง EduSDK ไม่สำเร็จ: อุปกรณ์นี้ไม่รองรับ WebGL");
    context.getExtension("WEBGL_lose_context")?.loseContext();
  }

  function init(options = {}) {
    if (state.status !== "idle") {
      throw createError("ALREADY_INITIALIZED", "EduSDK ถูกติดตั้งไปแล้ว");
    }

    const container = typeof options.container === "string"
      ? document.querySelector(options.container)
      : options.container;

    if (!container) {
      const error = createError("CONTAINER_NOT_FOUND", "EduSDK ไม่พบ container ที่กำหนด");
      options.onError?.(error);
      state.status = "error";
      return false;
    }

    state.options = options;
    state.container = container;
    state.status = "setting-up";
    installStyles();

    state.setupTimer = global.setTimeout(() => {
      failSetup(createError(
        "SETUP_TIMEOUT",
        "ติดตั้ง EduSDK ไม่สำเร็จ: ไม่สามารถโหลด main-world หรือไฟล์ประกอบได้ครบ"
      ));
    }, setupTimeoutMs);

    checkRuntimeFiles()
      .then(() => {
        if (state.status !== "setting-up") return;
        global.clearTimeout(state.setupTimer);
        state.setupTimer = null;
        state.status = "ready";
        state.options.onSetupComplete?.({
          ready: true,
          cacheVersion,
          runtime: "main-world",
          externalLessons: true,
          setupMode: "lightweight"
        });
      })
      .catch((error) => {
        if (state.status !== "setting-up") return;
        failSetup(error.code
          ? error
          : createError("SETUP_MAIN_ERROR", `ติดตั้ง EduSDK ไม่สำเร็จ: ${error.message}`));
      });

    return true;
  }

  function validateLessonData(lessonData) {
    if (!lessonData || typeof lessonData !== "object") {
      throw createError("INVALID_LESSON_DATA", "lessonData ต้องเป็น object");
    }

    for (const field of ["mode", "Id", "title", "path"]) {
      if (typeof lessonData[field] !== "string" || !lessonData[field].trim()) {
        throw createError("INVALID_LESSON_DATA", `lessonData.${field} จำเป็นต้องมีค่า`);
      }
    }

    if (!["teacher-lab", "student-lab", "student-quiz"].includes(lessonData.mode)) {
      throw createError("INVALID_LESSON_DATA", "lessonData.mode ไม่ใช่โหมดที่ระบบรองรับ");
    }

  }

  async function detectLessonType(lessonUrl) {
    const detectUrl = new URL(lessonUrl.href);
    detectUrl.searchParams.set("eduDetectV", cacheVersion);

    let response;
    try {
      response = await fetch(detectUrl.href, {
        credentials: "same-origin"
      });
    } catch (error) {
      throw createError(
        "LESSON_FILE_ERROR",
        "ไม่สามารถโหลดไฟล์บทเรียนเพื่อตรวจรูปแบบได้: " + error.message
      );
    }

    if (!response.ok) {
      throw createError(
        "LESSON_FILE_ERROR",
        "ไม่สามารถโหลดไฟล์บทเรียนได้ (" + response.status + ")"
      );
    }

    const html = await response.text();
    const lessonDocument = new DOMParser().parseFromString(html, "text/html");

    // Lesson Package ของ main-world ต้องมี marker นี้ตาม contract
    return {
      type: lessonDocument.querySelector("script[data-lesson-app]") ? "main-world" : "external",
      html
    };
  }

  function mountLessonFrame(lessonData, lessonUrl, detection, onComplete, onClose) {
    const lessonType = detection.type;
    const isExternal = lessonType === "external";
    const frameUrl = isExternal ? new URL(lessonUrl.href) : new URL(runtimeUrl.href);
    if (isExternal) frameUrl.searchParams.set("eduV", cacheVersion);

    state.activeLesson = {
      data: lessonData,
      onComplete,
      onClose,
      external: isExternal,
      targetOrigin: isExternal ? lessonUrl.origin : runtimeUrl.origin,
      completionReceived: false,
      runtimePayload: {
        lessonData: {
          ...lessonData,
          path: lessonUrl.href
        },
        language: state.options.language ?? "th",
        fullScreen: state.fullScreen,
        lessonHtml: isExternal ? undefined : detection.html
      }
    };

    state.overlay = document.createElement("div");
    state.overlay.className = "edu-sdk-overlay";
    state.overlay.setAttribute("role", "dialog");
    state.overlay.setAttribute("aria-modal", "true");
    state.overlay.setAttribute("aria-label", lessonData.title);

    state.lessonFrame = document.createElement("iframe");
    state.lessonFrame.title = lessonData.title;
    state.lessonFrame.allow = "fullscreen; autoplay";
    state.lessonFrame.dataset.lessonType = isExternal ? "external" : "internal";
    // Keyboard events do not bubble out of an iframe. Forward F4 through the
    // same SDK callback so both main-world and same-origin external lessons
    // can request a complete page reload without lesson-specific code.
    state.lessonFrame.addEventListener("load", () => {
      try {
        state.lessonFrame?.contentWindow?.addEventListener("keydown", handleRetestShortcut, { capture: true });
      } catch (error) {
        console.warn("[EduSDK] ไม่สามารถติดตั้ง F4 retest ใน lesson iframe", error);
      }
    }, { once: true });
    state.lessonFrame.src = frameUrl.href;
    state.overlay.append(state.lessonFrame);
    state.container.append(state.overlay);

    state.previousBodyOverflow = document.body.style.overflow;
    applyFrameLayout();
    startContainerObserver();
    state.status = "opening";
    global.requestAnimationFrame(() => state.overlay?.classList.add("is-visible"));

    state.openTimer = global.setTimeout(() => {
      const code = isExternal ? "EXTERNAL_LESSON_TIMEOUT" : "RUNTIME_TIMEOUT";
      const message = isExternal
        ? "ไม่สามารถเปิดบทเรียนภายนอกได้: หน้า HTML ไม่ได้แจ้ง runtime.ready ภายในเวลาที่กำหนด"
        : "main-world ใช้เวลาเตรียมนานเกินกำหนดและยังไม่พร้อมเปิดบทเรียน";
      if (isExternal) { failOpen(createError(code, message)); return; }
      state.status = "opening-error";
      sendToLesson("host.showRuntimeFailure", {
        title: "เปิดบทเรียนไม่สำเร็จ",
        message: "ระบบรอการเริ่มทำงานนานเกินไป จึงหยุดรอเพื่อให้ตรวจปัญหาได้ทันที",
        location: "การเริ่ม main-world, dependency หรือ WebGL",
        log: `${code}: ${message}\nLesson: ${lessonData.path}\nMode: ${lessonData.mode}`
      });
      notifyError(createError(code, message));
    }, setupTimeoutMs);
  }

  function openLesson(lessonData, onComplete, onClose, options = {}) {
    if (state.status !== "ready") {
      const error = createError(
        "SDK_NOT_READY",
        state.status === "error"
          ? "ไม่สามารถเปิดบทเรียนได้ เนื่องจากติดตั้ง EduSDK ไม่สำเร็จ"
          : "EduSDK ยังติดตั้งไม่เรียบร้อย"
      );
      notifyError(error);
      return false;
    }

    try {
      validateLessonData(lessonData);
      const hasLessonFullScreen = Object.prototype.hasOwnProperty.call(lessonData, "fullScreen");
      if (hasLessonFullScreen && typeof lessonData.fullScreen !== "boolean") {
        throw createError("INVALID_FULLSCREEN_VALUE", "lessonData.fullScreen ต้องเป็น true หรือ false");
      }
      if (Object.prototype.hasOwnProperty.call(lessonData, "preview") && typeof lessonData.preview !== "boolean") {
        throw createError("INVALID_PREVIEW_VALUE", "lessonData.preview ต้องเป็น true หรือ false");
      }
      const lessonUrl = new URL(lessonData.path, document.baseURI);

      if (lessonUrl.origin !== global.location.origin) {
        throw createError("INVALID_LESSON_PATH", "บทเรียนต้องอยู่ใน origin เดียวกับเว็บหลัก");
      }

      // Local preview keeps a normal same-origin base for shared assets, but
      // sends the selected file's text to main-world without fetching its path.
      let localDetection = null;
      if (options.html !== undefined) {
        if (typeof options.html !== "string" || !options.html.trim()) {
          throw createError("LESSON_HTML_INVALID", "ไฟล์บทเรียนว่างหรือ HTML ไม่ถูกต้อง");
        }
        const parsed = new DOMParser().parseFromString(options.html, "text/html");
        if (parsed.querySelectorAll("script[data-lesson-app]").length !== 1) {
          throw createError("LESSON_HTML_INVALID", "ไฟล์ทดลองต้องมี script[data-lesson-app] หนึ่งตัวตามรูปแบบบทเรียน");
        }
        localDetection = { type: "main-world", html: options.html };
      }

      if (hasLessonFullScreen) onfullScreen(lessonData.fullScreen);
      state.status = "resolving";
      const resolveToken = ++state.resolveToken;

      (localDetection ? Promise.resolve(localDetection) : detectLessonType(lessonUrl))
        .then((detection) => {
          if (state.status !== "resolving" || resolveToken !== state.resolveToken) return;
          mountLessonFrame(lessonData, lessonUrl, detection, onComplete, onClose);
        })
        .catch((error) => {
          if (state.status !== "resolving" || resolveToken !== state.resolveToken) return;
          state.status = "ready";
          notifyError(error.code
            ? error
            : createError(
              "LESSON_FILE_ERROR",
              "ตรวจรูปแบบบทเรียนไม่สำเร็จ: " + error.message
            ));
        });

      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  }

  function destroy() {
    state.resolveToken += 1;
    resetFrameTimers();
    global.clearTimeout(state.removeTimer);
    stopContainerObserver();
    state.setupFrame?.remove();
    state.overlay?.remove();
    document.body.style.overflow = state.previousBodyOverflow;
    restoreContainerPosition();
    state.status = "idle";
  }

  function handleRetestShortcut(event) {
    if (event.key !== "F4" || state.activeLesson?.data.preview === true) return;
    event.preventDefault();
    state.options?.onRetestRequested?.(state.activeLesson?.data ?? null);
  }

  function handleRuntimeShortcut(event) {
    if (event.key === "F4") return handleRetestShortcut(event);
    if (event.key !== "F6" || state.activeLesson?.data.preview === true || state.activeLesson?.external || !state.lessonFrame || !["opening", "open"].includes(state.status)) return;
    event.preventDefault();
    sendToLesson("host.toggleRuntimeSetting");
  }

  global.addEventListener("message", handleMessage);
  global.addEventListener("keydown", handleRuntimeShortcut, { capture: true });

  global.EduSDK = Object.freeze({
    init,
    onfullScreen,
    onFullScreen: onfullScreen,
    openLesson,
    closeLesson,
    destroy,
    lesson: Object.freeze({
      send: sendLessonEvent,
      isValidMessage: isValidLessonMessage
    })
  });
})(window);
