let wasmPromise = null;

async function loadDecryptor() {
  if (!wasmPromise) wasmPromise = (async () => {
    const response = await fetch(new URL("./quiz-key.wasm", import.meta.url));
    if (!response.ok) throw new Error(`โหลด Lesson WASM ไม่สำเร็จ (${response.status})`);
    const bytes = await response.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {
      env: { abort() { throw new Error("Lesson WASM หยุดทำงานระหว่างถอดรหัส"); } }
    });
    const { memory, a: allocate, f: release, d: decrypt } = instance.exports;
    if (!(memory instanceof WebAssembly.Memory)
      || typeof allocate !== "function"
      || typeof release !== "function"
      || typeof decrypt !== "function") {
      throw new Error("Lesson WASM exports ไม่ครบ");
    }
    return { memory, allocate, release, decrypt };
  })();
  return wasmPromise;
}

export async function decodeLessonScript(raw) {
  const encrypted = new TextEncoder().encode(String(raw || "").trim());
  if (!encrypted.length) throw new Error("ไม่พบข้อมูลบทเรียนเข้ารหัส");
  const wasm = await loadDecryptor();
  const workspaceSize = encrypted.length * 2 + 384;
  const inputPointer = wasm.allocate(workspaceSize);
  const outputPointer = (inputPointer + encrypted.length + 15) & ~15;
  try {
    new Uint8Array(wasm.memory.buffer, inputPointer, encrypted.length).set(encrypted);
    const outputLength = wasm.decrypt(inputPointer, encrypted.length, outputPointer, encrypted.length);
    if (outputLength < 0) {
      const reason = outputLength === -3 ? "authentication ไม่ผ่าน" : "รูปแบบข้อมูลไม่ถูกต้อง";
      throw new Error(`ถอดรหัสบทเรียนไม่สำเร็จ: ${reason}`);
    }
    const plainBytes = new Uint8Array(wasm.memory.buffer, outputPointer, outputLength).slice();
    return new TextDecoder().decode(plainBytes);
  } finally {
    new Uint8Array(wasm.memory.buffer, inputPointer, workspaceSize).fill(0);
    wasm.release(inputPointer);
    encrypted.fill(0);
  }
}
