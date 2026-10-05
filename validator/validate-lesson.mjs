#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

const args = process.argv.slice(2);
const input = args.find((arg) => !arg.startsWith("--"));
const profileArg = args.find((arg) => arg.startsWith("--profile="));
const profile = profileArg?.slice("--profile=".length) || "teacher-external";
const supportedProfiles = new Set(["teacher-external", "dev-workspace"]);

if (!input) {
  console.error("Usage: node validator/validate-lesson.mjs <lesson.html> [--profile=teacher-external|dev-workspace]");
  process.exit(1);
}

if (!supportedProfiles.has(profile)) {
  console.error(`Unknown profile: ${profile}`);
  process.exit(1);
}

const file = resolve(input);
const errors = [];
const add = (code, stage, message, details = "") => errors.push({ code, stage, message, details });
let html = "";
let standardAssetIds = new Set();
let primitiveShapes = new Set();

function methodBody(source, methodName) {
  const match = new RegExp(`\\b(?:async\\s+)?${methodName}\\s*\\([^)]*\\)\\s*\\{`).exec(source);
  if (!match) return "";
  const opening = match.index + match[0].lastIndexOf("{");
  let depth = 1, quote = "", lineComment = false, blockComment = false, escaped = false;
  for (let index = opening + 1; index < source.length; index += 1) {
    const char = source[index], next = source[index + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (char === "\\") { escaped = true; continue; }
      if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; index += 1; continue; }
    if (char === "\"" || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(opening + 1, index);
    }
  }
  return "";
}

function callBodies(source, methodNames) {
  const accepted = new Set(methodNames);
  const bodies = [];
  const calls = /\.\s*([A-Za-z_$][\w$]*)\s*\(/g;
  let match;

  while ((match = calls.exec(source))) {
    if (!accepted.has(match[1])) continue;
    const opening = match.index + match[0].lastIndexOf("(");
    let depth = 1, quote = "", lineComment = false, blockComment = false, escaped = false;
    let closedAt = -1;

    for (let index = opening + 1; index < source.length; index += 1) {
      const char = source[index], next = source[index + 1];
      if (lineComment) { if (char === "\n") lineComment = false; continue; }
      if (blockComment) { if (char === "*" && next === "/") { blockComment = false; index += 1; } continue; }
      if (quote) {
        if (escaped) { escaped = false; continue; }
        if (char === "\\") { escaped = true; continue; }
        if (char === quote) quote = "";
        continue;
      }
      if (char === "/" && next === "/") { lineComment = true; index += 1; continue; }
      if (char === "/" && next === "*") { blockComment = true; index += 1; continue; }
      if (char === "\"" || char === "'" || char === "`") { quote = char; continue; }
      if (char === "(") depth += 1;
      if (char === ")") {
        depth -= 1;
        if (depth === 0) { closedAt = index; break; }
      }
    }

    if (closedAt >= 0) {
      bodies.push(source.slice(opening + 1, closedAt));
      calls.lastIndex = closedAt + 1;
    }
  }
  return bodies;
}

function stripArrowCallbacks(source) {
  let result = "";
  for (let index = 0; index < source.length;) {
    if (source[index] !== "=" || source[index + 1] !== ">") {
      result += source[index];
      index += 1;
      continue;
    }

    result += "=>";
    index += 2;
    while (/\s/.test(source[index] || "")) {
      result += source[index];
      index += 1;
    }

    if (source[index] === "{") {
      let depth = 1, quote = "", escaped = false;
      index += 1;
      while (index < source.length && depth > 0) {
        const char = source[index];
        if (quote) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === quote) quote = "";
        } else if (char === "\"" || char === "'" || char === "`") quote = char;
        else if (char === "{") depth += 1;
        else if (char === "}") depth -= 1;
        index += 1;
      }
      result += "{}";
      continue;
    }

    let parens = 0, brackets = 0, braces = 0, quote = "", escaped = false;
    while (index < source.length) {
      const char = source[index];
      if (quote) {
        if (escaped) escaped = false;
        else if (char === "\\") escaped = true;
        else if (char === quote) quote = "";
        index += 1;
        continue;
      }
      if (char === "\"" || char === "'" || char === "`") { quote = char; index += 1; continue; }
      if (char === "(") parens += 1;
      else if (char === ")") { if (parens === 0 && brackets === 0 && braces === 0) break; parens -= 1; }
      else if (char === "[") brackets += 1;
      else if (char === "]") brackets -= 1;
      else if (char === "{") braces += 1;
      else if (char === "}") { if (parens === 0 && brackets === 0 && braces === 0) break; braces -= 1; }
      else if ((char === "," || char === "\n") && parens === 0 && brackets === 0 && braces === 0) break;
      index += 1;
    }
    result += "undefined";
  }
  return result;
}

function maskCommentsAndStrings(source) {
  let result = "", quote = "", lineComment = false, blockComment = false, escaped = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index], next = source[index + 1];
    if (lineComment) {
      if (char === "\n") { lineComment = false; result += "\n"; }
      else result += " ";
      continue;
    }
    if (blockComment) {
      if (char === "*" && next === "/") { result += "  "; blockComment = false; index += 1; }
      else result += char === "\n" ? "\n" : " ";
      continue;
    }
    if (quote) {
      result += char === "\n" ? "\n" : " ";
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { result += "  "; lineComment = true; index += 1; continue; }
    if (char === "/" && next === "*") { result += "  "; blockComment = true; index += 1; continue; }
    if (char === "\"" || char === "'" || char === "`") { result += " "; quote = char; continue; }
    result += char;
  }
  return result;
}

function findMissingLessonHelpers(source) {
  const code = maskCommentsAndStrings(source);
  const called = new Set([...code.matchAll(/\bthis\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
  const declared = new Set();
  const declarationPatterns = [
    /^\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/gm,
    /(?:^|[,{}]\s*)([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?function(?:\s+[A-Za-z_$][\w$]*)?\s*\(/gm,
    /(?:^|[,{}]\s*)([A-Za-z_$][\w$]*)\s*:\s*(?:async\s+)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/gm,
    /\bthis\s*\.\s*([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/gm
  ];
  for (const pattern of declarationPatterns) {
    for (const match of code.matchAll(pattern)) declared.add(match[1]);
  }
  return [...called].filter(name => !declared.has(name)).sort();
}

try {
  const catalogText = await readFile(new URL("../sdk/asset-library.catalog.json", import.meta.url), "utf8");
  const catalog = JSON.parse(catalogText);
  standardAssetIds = new Set(Object.keys(catalog.assets || {}));
} catch (error) {
  add("SDK_CATALOG_INVALID", "validator", `อ่าน Standard Asset catalog ไม่ได้: ${error.message}`);
}

try {
  const capabilitiesText = await readFile(new URL("../sdk/capabilities.json", import.meta.url), "utf8");
  const capabilities = JSON.parse(capabilitiesText);
  primitiveShapes = new Set(capabilities.primitiveShapes || []);
} catch (error) {
  add("SDK_CAPABILITIES_INVALID", "validator", `อ่าน Procedural Geometry capabilities ไม่ได้: ${error.message}`);
}

try {
  html = await readFile(file, "utf8");
} catch (error) {
  add("LESSON_FETCH_FAILED", "read", `อ่านไฟล์ไม่ได้: ${error.message}`);
}

if (html) {
  if (!/^\s*<!doctype html>/i.test(html)) add("LESSON_HTML_INVALID", "parse", "ต้องเริ่มด้วย <!doctype html>");
  if (!/<html\b[^>]*\blang=["']th["'][^>]*>/i.test(html)) add("LESSON_HTML_INVALID", "parse", "ต้องมี <html lang=\"th\">");
  if (!/<meta\s+charset=["']?UTF-8["']?\s*\/?\s*>/i.test(html)) add("LESSON_HTML_INVALID", "parse", "ต้องมี meta charset UTF-8");

  const scripts = [...html.matchAll(/<script\b[^>]*\bdata-lesson-app\b[^>]*>([\s\S]*?)<\/script>/gi)];
  if (!scripts.length) add("LESSON_APP_SCRIPT_MISSING", "parse", "ไม่พบ script[data-lesson-app]");
  if (scripts.length > 1) add("LESSON_APP_SCRIPT_DUPLICATE", "parse", `พบ script[data-lesson-app] ${scripts.length} ตัว`);

  const defineCount = (html.match(/\bPuzzleLesson\s*\.\s*define\s*\(/g) || []).length;
  if (!defineCount) add("LESSON_DEFINE_MISSING", "register", "ไม่พบ PuzzleLesson.define(...)");
  if (defineCount > 1) add("LESSON_DEFINE_DUPLICATE", "register", `พบ PuzzleLesson.define ${defineCount} ครั้ง`);

  const forbidden = [
    [/<script\b[^>]*\bsrc\s*=/i, "external script"],
    [/<(?:iframe|canvas|form|button|main|header|section)\b/i, "standalone UI markup"],
    [/<(?:style|link)\b/i, "lesson CSS/stylesheet"],
    [/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/, "network request"],
    [/\bimport\s*(?:\(|[\w*{])/, "import"],
    [/\bTHREE\s*\./, "THREE internal API"],
    [/\bwindow\s*\.\s*(?:context|eduSdk)\b/, "runtime global"],
    [/\b(?:spawnObject|removeObject|updateObject)\s*\(/, "unsupported invented API"]
  ];
  for (const [pattern, label] of forbidden) {
    if (pattern.test(html)) add("LESSON_API_NOT_SUPPORTED", "validate", `ห้ามใช้ ${label}`);
  }

  const publicWorldMethods = new Set([
    "clear", "addObject", "addPrimitive", "addGroup", "addConnector", "addText3D", "addWorldCounter", "addWorldGui",
    "addLibraryObject", "addModel", "addBox", "addZone", "addCallout", "addLabel", "addOperatorSign", "addGuideline",
    "addLineRender", "addTargetFocus", "showDragCue", "hideDragCue", "playEntrance", "getObject"
  ]);
  const lessonCode = scripts.map(script => maskCommentsAndStrings(script[1])).join("\n");
  const worldCalls = new Set([...lessonCode.matchAll(/\bworld\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)].map(match => match[1]));
  for (const name of worldCalls) {
    if (!publicWorldMethods.has(name)) {
      add(
        "LESSON_API_NOT_SUPPORTED",
        "validate",
        `ไม่พบ world.${name}() ใน Public API`,
        "เลือก method จาก sdk/LESSON_API_REFERENCE.md และยืนยัน signature ใน sdk/lesson-sdk.d.ts; ห้ามสร้างชื่อ API จากการคาดเดา"
      );
    }
  }

  if (profile === "teacher-external") {
    const externalAssetPatterns = [
      [/\.\s*addModel\s*\(/, "world.addModel()"],
      [/\btype\s*:\s*["']model["']/, "addObject type: model"],
      [/\b(?:path|texture)\s*:\s*["'](?:\.\.?\/|assets\/)/i, "direct asset path"]
    ];
    for (const [pattern, label] of externalAssetPatterns) {
      if (pattern.test(html)) {
        add(
          "LESSON_EXTERNAL_ASSET_FORBIDDEN",
          "validate",
          `TEACHER_EXTERNAL ห้ามใช้ ${label}; ใช้ primitive หรือ Standard Asset ID ใน catalog เท่านั้น`
        );
      }
    }

    for (const match of html.matchAll(/\basset\s*:\s*["']([^"']+)["']/g)) {
      if (!standardAssetIds.has(match[1])) {
        add(
          "LESSON_ASSET_NOT_FOUND",
          "validate",
          `ไม่พบ Standard Asset ID: ${match[1]}`,
          "เลือก ID จาก sdk/asset-library.catalog.json เท่านั้น"
        );
      }
    }
  }

  const unsupportedOperator = html.match(/\.addOperatorSign\s*\(\s*{[\s\S]{0,240}?\btext\s*:\s*["']([^"']+)["']/);
  if (unsupportedOperator && !["<", ">", "=", "≠", "<=", ">=", "≤", "≥", "+", "-", "−", "×", "x", "X", "÷"].includes(unsupportedOperator[1])) {
    add("LESSON_OPERATOR_UNSUPPORTED", "validate", `addOperatorSign ไม่รองรับ ${unsupportedOperator[1]}; รองรับ = ≠ < > ≤ ≥ + - × ÷`);
  }

  // `shape` is also a common lesson-data field. Validate it only inside the
  // public constructors that actually consume procedural shape definitions.
  for (const callBody of callBodies(html, ["addPrimitive", "addGroup"])) {
    for (const match of callBody.matchAll(/\bshape\s*:\s*["']([^"']+)["']/g)) {
      const shape = match[1].trim().toLowerCase().replace(/[_\s]+/g, "-");
      if (!primitiveShapes.has(shape)) {
        add(
          "LESSON_PRIMITIVE_UNSUPPORTED",
          "validate",
          `ไม่พบ Procedural Shape: ${match[1]}`,
          "เลือก shape จาก sdk/capabilities.json หรือ sdk/LESSON_API_REFERENCE.md; ห้ามสมมติชื่อรูปทรงใหม่"
        );
      }
    }
  }

  const requiredPatterns = [
    [/\bid\s*:\s*["'][^"']+["']/, "id"],
    [/\bversion\s*:\s*["'][^"']+["']/, "version"],
    [/\bmeta\s*:\s*{/, "meta"],
    [/\bworldType\s*:\s*["']3d-world-space["']/, "meta.worldType"],
    [/\blessonId\s*:\s*["'][^"']+["']/, "meta.lessonId"],
    [/\btitle\s*:\s*["'][^"']+["']/, "meta.title"],
    [/\bcategory\s*:\s*["'][^"']+["']/, "meta.category"],
    [/\bsubcategory\s*:\s*["'][^"']+["']/, "meta.subcategory"],
    [/\bmount\s*\([^)]*\)\s*{/, "mount(context)"],
    [/\breset\s*\([^)]*\)\s*{/, "reset(payload)"],
    [/\bonStep\s*\([^)]*\)\s*{/, "onStep(index, step)"],
    [/\bdispose\s*\([^)]*\)\s*{/, "dispose()"]
  ];
  for (const [pattern, label] of requiredPatterns) {
    if (!pattern.test(html)) add("LESSON_LIFECYCLE_MISSING", "validate", `ไม่พบ ${label}`);
  }

  if (scripts.length === 1) {
    const lessonSource = scripts[0][1], resetBody = methodBody(lessonSource, "reset");
    for (const name of findMissingLessonHelpers(lessonSource)) {
      add(
        "LESSON_HELPER_MISSING",
        "validate",
        `เรียก this.${name}() แต่ไม่พบ method ${name} ใน lesson definition`,
        `this.${name}() ไม่ใช่ Runtime/Public API; ต้องประกาศ ${name}() ใน object ที่ส่งให้ PuzzleLesson.define(...) หรือแก้ให้เรียก helper ที่มีจริง`
      );
    }
    const immediateResetBody = stripArrowCallbacks(resetBody);
    const resetHelpers = [...immediateResetBody.matchAll(/\bthis\s*\.\s*([A-Za-z_$][\w$]*)\s*\(/g)]
      .map(match => match[1]);
    const resetCallsQuizAnswer = /\b(?:this\.)?context\s*\.\s*quiz\s*\.\s*answer\s*\(/.test(immediateResetBody)
      || resetHelpers.some(name => /\b(?:this\.)?context\s*\.\s*quiz\s*\.\s*answer\s*\(/.test(methodBody(lessonSource, name)));
    if (resetCallsQuizAnswer) {
      add(
        "LESSON_QUIZ_ANSWER_DURING_RESET",
        "validate",
        "ห้ามบันทึกคำตอบ Quiz ภายใน reset() หรือเรียก helper ที่บันทึกคำตอบ เพราะยังไม่มีการลงมือจากผู้เรียน",
        "เรียก context.quiz.answer(...) หลัง click/drag/drop/control action เท่านั้น; Runtime จะเปิดปุ่มต่อไปให้อัตโนมัติ"
      );
    }
    try {
      new Function(lessonSource);
    } catch (error) {
      add("LESSON_SCRIPT_SYNTAX_ERROR", "compile", error.message);
    }
  }
}

const report = {
  ok: errors.length === 0,
  file: basename(file),
  contractVersion: "1.6.0",
  profile,
  errors
};

if (errors.length) {
  report.userMessage = "นำข้อความนี้ส่งต่อให้ผู้พัฒนาบทเรียน หรือส่งเข้า AI Agent เพื่อแก้ไขข้อผิดพลาด";
  report.repairPrompt = [
    "ซ่อมเฉพาะไฟล์ lesson ที่แนบมา ห้ามแก้ runtime, SDK, settings หรือ CSS",
    "อ่าน Github README, contract, Public API, output template และ lesson0 ก่อนซ่อม",
    ...errors.map(error => `${error.code} [${error.stage}]: ${error.message}${error.details ? ` — ${error.details}` : ""}`),
    "คืนเฉพาะชื่อไฟล์และ HTML code block ที่แก้สมบูรณ์แล้วหนึ่ง block"
  ].join("\n");
}

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);

