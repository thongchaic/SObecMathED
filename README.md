# Puzzle Widget — Repository อ้างอิงสำหรับ AI สร้างบทเรียน

Repository นี้รวมคู่มือ, Public API, ตัวอย่าง GUI และ source snapshot ที่จำเป็นไว้ในที่เดียว เพื่อให้ทีม Dev / AI อ่านแล้วผลิตบทเรียน HTML ที่ใช้ระบบกลางของเจ้าของโครงการได้

**นี่คือชุดอ่านและตรวจ static ไม่ใช่เว็บพร้อมรัน** ตั้งใจไม่รวม plugin, vendor dependency, รูป, โมเดล, เสียง หรือ asset binary จึงไม่ต้องติดตั้งหรือขอสิ่งเหล่านี้เพื่อเริ่มสร้างบทเรียน ใช้ Asset ID จาก catalog ได้ เพราะระบบปลายทางเป็นผู้จัดเตรียมไฟล์จริง

## จุดเริ่มต้นสำหรับ AI

หากได้รับคำสั่งสั้นที่มี `[ Introduction ] : git/DEVGEN` ให้เปิด
[git/DEVGEN](git/DEVGEN) และทำเฉพาะรอบ Introduction ก่อน ไฟล์นี้จะบังคับให้ตรวจ
`VERSION.txt`, อ่านโครงสร้างจริง ตอบหลักฐานการเชื่อมต่อ และถาม Brief กลับมา
เพื่อให้ผู้ใช้กรอกในข้อความถัดไป

คำตอบแรกจะแสดง `DEVGEN MENU`: `--CREATE`, `--TEMPLATE`, `--TOOLS`, `--HELP`
`--DEFINE`, `--CHECK`, `--FEEDBACK` และ `--IDEA`
ถ้าข้อความถัดไปไม่ขึ้นต้นด้วยคำสั่งเหล่านี้ DEVGEN จะใช้ข้อความนั้นเป็นคำอธิบาย
สำหรับ `--CREATE` โดยอัตโนมัติ

1. อ่าน [MASTER_README.md](MASTER_README.md) ทั้งไฟล์ — กฎหลัก, lifecycle, Lab, Quiz และขอบเขตงาน
2. อ่าน [contract](contracts/LESSON_CONTRACT.md) และ [template](LESSON_OUTPUT_TEMPLATE.html) — รูปแบบ HTML หนึ่งไฟล์
3. อ่าน [Public API](sdk/LESSON_API_REFERENCE.md), [UI Catalog](sdk/UI_CATALOG.md), [ตัวอย่าง GUI Service ครบทุกกลุ่ม](sdk/GUI_SERVICE_REFERENCE.md) และตรวจ signature ใน [types](sdk/lesson-sdk.d.ts)
4. ตรวจ [capabilities](sdk/capabilities.json) และ [Asset catalog](Project/interactive/assets/library/catalog.json) — ห้ามเดา API หรือ Asset ID
5. อ่าน [Lesson 0](Project/interactive/chapters/lesson0.html) ทั้งไฟล์ แล้วเลือกตัวอย่างใกล้กิจกรรมใหม่ 1–2 บทจาก [EXAMPLES.md](EXAMPLES.md) หรือ [examples.json](examples.json)
6. ตรวจ source เฉพาะบริการที่ใช้จาก [main-world.js](Project/interactive/main-world.js), [gui-service.js](Project/interactive/gui-service.js), [settings](Project/interactive/main-world-setting.js) และ [EduSDK](Project/interactive/eduSdk.js)
7. สร้าง HTML ฉบับเต็มใน Chat และทำตาม [TESTING.md](TESTING.md); ใช้ [ERROR_CASES](contracts/ERROR_CASES.md) ช่วยซ่อม

กฎป้องกัน runtime error ที่ต้องตรวจทุกครั้ง: `this.someHelper()` หมายถึง method ภายใน lesson object เท่านั้น ไม่ใช่ Public API ของ Platform จึงต้องมี `someHelper() { ... }` อยู่ใน object ที่ส่งให้ `PuzzleLesson.define(...)` และสะกดตรงกัน Validator จะรายงาน `LESSON_HELPER_MISSING` เมื่อเรียก helper ที่ไม่ได้ประกาศ

หากอ่านผ่านเว็บไม่ครบ ให้ clone repository จาก ข้อความ START_PROMPT ที่ผู้มอบหมายส่งมาแยกต่างหาก หรือใช้ ZIP ที่ได้รับ ไม่ต้องอ่านบทเรียนทุกบททุกครั้ง ห้ามอ้างว่าอ่านหรือทดลองแล้วถ้ายังไม่ได้ทำจริง

## โครงสร้างภายใน repository นี้

```text
<repository-root>/
├── README.md
├── DEVGEN                   ← entrypoint สำรอง; ชี้ไปที่ git/DEVGEN
├── git/DEVGEN               ← Introduction สำหรับคำสั่งสั้นของทีมภายนอก
├── DEFINE                   ← entrypoint สำรอง; ชี้ไปที่ git/DEFINE
├── git/DEFINE               ← สร้าง Define Map สำหรับอ้างชื่อส่วนต่างๆ ของบทเรียน
├── CHECK / git/CHECK        ← ตรวจ HTML ก่อนนำไปใช้โดยไม่แก้ไฟล์
├── FEEDBACK / git/FEEDBACK  ← วิเคราะห์งานล่าสุดและแนะนำการพัฒนา
├── IDEA / git/IDEA          ← เสนอ Interactive เริ่มต้น 5 แบบ
├── MASTER_README.md
├── EXAMPLES.md
├── examples.json             ← path อ้างจาก root นี้
├── TESTING.md
├── SOURCE_MANIFEST.json      ← ที่มาและ SHA-256 ของ source snapshot
├── LESSON_OUTPUT_TEMPLATE.html
├── sdk/                      ← API, GUI, types, capabilities, catalog
├── contracts/                ← contract, schema, repair guide
├── validator/                ← static validator ใช้ Node built-in
└── Project/interactive/
    ├── eduSdk.js
    ├── main-world.html
    ├── main-world.js
    ├── gui-service.js
    ├── clickme-service.js
    ├── intro-service.js
    ├── world-gui-system.js
    ├── main-world-setting.js
    ├── runtime-setting-menu.js
    ├── world.css
    ├── chapters/             ← ตัวอย่าง HTML ทั้งหมด
    └── assets/library/
        ├── README.md
        └── catalog.json      ← ข้อมูล Asset ID ไม่ใช่ไฟล์โมเดล
```

ในเครื่องเจ้าของ root นี้อยู่ที่ `AI/Github/git` แต่เมื่อ sync ขึ้น GitHub ให้เปิด README ที่ root ได้เลย ลิงก์ในเอกสารไม่พึ่ง path ภายนอก repository และคงตัวพิมพ์ `Project/interactive` ให้ตรงกัน

## รูปแบบและขอบเขตงาน

ค่าเริ่มต้นคือ lesson-only: ส่ง HTML หนึ่งไฟล์ ใช้ procedural primitive/group/text และ Standard Asset ID ตาม catalog ที่มีจริง ไม่แก้ source snapshot, settings, CSS, SDK หรือเพิ่ม asset โดยปริยาย source ที่เห็นมีไว้ตรวจ API และโครงสร้าง รูปทรง procedural ไม่ต้องมี Asset ID และควรถูกใช้ทำบทเรียนให้เล่นจบก่อนขอโมเดลใหม่

สำหรับ workflow `git/DEVGEN` ให้ถือ GitHub Repository เป็น read-only เสมอ AI Chat
ต้องคืนชื่อ path และ HTML ฉบับเต็มใน code block เพื่อให้ผู้ใช้ Copy ไปบันทึกเอง
ห้ามพยายามเขียนกลับ Repository, ขอสิทธิ์ write, สร้าง branch, commit, PR หรือ push

เมื่อเจ้าของโปรเจกต์นำ HTML ที่ได้รับจากภายนอกเข้า workspace ให้ใช้คำสั่งภายใน `AI/UpdateLesson` โดยต้องทราบชื่อบทเรียน, `epXX/lessonXX` ปลายทาง และ path/ไฟล์แนบ HTML ต้นทางครบก่อนเริ่ม หากข้อมูลใดขาดต้องถามก่อนและห้ามเดา คำสั่งนี้อยู่ฝั่ง DEV_WORKSPACE จึงไม่เปลี่ยนข้อกำหนด read-only ของ `git/DEVGEN`

Host เรียก EduSDK → ตรวจ `script[data-lesson-app]` → เปิด main-world → เรียก PuzzleLesson.define และ lifecycle → บทเรียนสร้างฉากผ่าน context ส่วน runtime ดูแล renderer, GUI, กล้อง, Lab, Quiz และการปิด บทเรียนจึงไม่สร้าง renderer, canvas หรือแผง UI กลางซ้ำ

### Runtime รุ่นปัจจุบันที่ควรรู้ก่อนสร้างบท

- `howto[].option` เชื่อม Step กับบทพูด Mascot จริง ใช้ `instruction` สำหรับคำอธิบายที่ต้องเห็นทันทีและ `hint` สำหรับคำใบ้ ทุกขั้นสำคัญควรมีข้อความเฉพาะแนวคิด ไม่ใช่ใส่เฉพาะคำทักทายขั้นแรก
- `howto[].requiresCompletion: true` ใช้ล็อกปุ่มถัดไปจนบทเรียนเรียก `context.ui.steps.setNextEnabled(true)` และ Runtime จะไม่ให้ข้ามช่วงที่มีขั้นบังคับ
- `context.ui.guiAnswer` ใช้ผลรวมหรือคำตอบแบบ Screen-space; กิจกรรมลากควรแสดงหลังปล่อยมือถ้าค่าระหว่างลากทำให้ UI กระพริบ
- `context.ui.clickme` เป็นมือชี้แบบ opt-in และต้องจบ cue ด้วย `completeFor()`/`cue.complete()` เมื่อกิจกรรมครบ เพื่อไม่ให้มือชี้ต่อหลังคำตอบเสร็จ
- `world.addLineRender()` รองรับ `points` และ `closed` สำหรับเส้นหลายช่วง/กรอบ polygon ส่วน `world.camera.focus({ position, normal })` หันกล้องแบบนุ่มโดยรักษาระยะซูม
- `world.addOperatorSign()` ใช้ prefab กลางทุกบท รูปทรงและความหนาแนวตั้งถูกกำหนดจาก `mainWorldSetting.lessonGraphics.operatorBase` ห้ามแก้ internal scale ของเครื่องหมายรายบท

### เปิดบทเรียนเต็มจอหรือภายใน Preview Panel

EduSDK เปิดบทเรียนแบบเต็ม viewport เป็นค่าเริ่มต้น เพื่อรักษาพฤติกรรมเดิมของระบบ:

```js
EduSDK.init({
  container: document.body,
  mainWorldPath: "./Project/interactive/main-world.html"
});

EduSDK.openLesson({ ...lessonData, fullScreen: true }, onComplete, onClose);
```

หาก Frontend นำบทเรียนไปแสดงใน `iframe`, preview card หรือ panel ที่เล็กกว่าหน้าจอ ให้ส่ง element ของ panel เป็น `container` และกำหนด `fullScreen: false` ใน `lessonData`:

```js
const previewPanel = document.querySelector("#lesson-preview");

EduSDK.init({
  container: previewPanel,
  mainWorldPath: "./Project/interactive/main-world.html"
});

EduSDK.openLesson({ ...lessonData, fullScreen: false }, onComplete, onClose);
```

กำหนดรูปแบบการแสดงผลด้วย `lessonData.fullScreen` ตอนเปิดบทเรียน โดยรับค่า boolean เท่านั้น: ใช้ `true` สำหรับบทเรียนเต็ม viewport และ `false` สำหรับ iframe, preview card หรือ panel ขนาดเล็ก หากไม่ส่งค่า ค่าเริ่มต้นของ SDK คือ `true`

ในโหมด `false` SDK จะวัดพื้นที่จริงของ `container` ด้วย `ResizeObserver`, สร้าง virtual viewport อ้างอิง 1280×720 และย่อทั้ง Three.js, System UI และ Gizmos ด้วยสเกลเดียวกัน จึงไม่ควรแก้ขนาด UI หรือ Gizmos แยกในบทเรียนเพื่อชดเชย iframe ขนาดเล็ก เมื่อ panel เปลี่ยนขนาด SDK จะคำนวณ layout ใหม่ให้อัตโนมัติ เมื่อต้องเปิดบทเรียนใหม่ในรูปแบบอื่น ให้กำหนด `lessonData.fullScreen` ของครั้งนั้น

ข้อกำหนดสำหรับ panel mode: `container` ต้องมีความกว้างและความสูงจริง ไม่ใช่ element ที่มีขนาดเป็นศูนย์ และควรให้ EduSDK เป็นผู้จัดการการย่อบทเรียน หลีกเลี่ยงการใช้ CSS `transform: scale(...)` ซ้ำที่ iframe หรือ canvas เพราะจะทำให้ pointer, UI และ Gizmos ถูกย่อสองครั้ง

### Intro Service สำหรับเนื้อหาเสริม

ใช้ `context.ui.intro` เมื่อต้องเปิดหน้าอ่านหรือ Interactive จาก URL ภายใน/ภายนอกใน iframe เกือบเต็มหน้าจอ ระบบจะบล็อกเมาส์ คีย์บอร์ด และการเลื่อนของบทเรียนหลักจนกว่าจะปิด ห้ามสร้าง iframe/modal ซ้ำใน Lesson HTML

ขั้นสอนเปิดอัตโนมัติได้ด้วย `howto[].intro`; เมื่อผู้เรียนปิด ระบบไป Step ถัดไป:

```js
howto: [{
  index: 0,
  title: "อ่านเพิ่มเติม",
  type: "sequence",
  desc: "อ่านเนื้อหาแล้วปิดเพื่อไปต่อ",
  intro: { url: "./intro.html", title: "เนื้อหาเพิ่มเติม" }
}]
```

ปุ่ม Control เปิดเสริมได้ด้วย `context.ui.intro.open({ url, title, source: "control" })`; การปิดกรณีนี้ไม่เปลี่ยน Step หน้าเว็บปลายทางอาจปฏิเสธ iframe ผ่าน `X-Frame-Options` หรือ CSP ซึ่ง Host ไม่สามารถข้ามข้อจำกัดนั้นได้

GUI ที่ใช้ได้มี steps, question, guiAnswer, console, topMessage, choice, gizmo, worldOption, worldGuiSystem, clickme, feedback, dialog, insight, intro, control, hint และ busy พร้อมตัวอย่างใน GUI Service Reference; `worldOption` ใช้เมนูคำสั่งแนวตั้งที่ติดตาม object, `worldGuiSystem` ใช้ป้ายเล็กที่ยึดกับพิกัดหรือโมเดล ส่วน `clickme` เป็นมือแบ/มือกำแบบ opt-in ที่ Admin/Dev ระบุให้ใช้กับวัตถุ draggable/clickable และตั้งค่าที่ `ui.clickme` ส่วน Callout, World Counter, World GUI, Target Focus, Line Render และ Guideline ดูใน Public API

Runtime เป็นผู้บังคับกฎ Control กลาง: ระหว่างขั้นสอนแสดงได้เฉพาะปุ่มข้ามการสอน เมื่อเข้า Lab ขั้นสุดท้าย/การทดลองหรือ Quiz จึงแสดง Control ของบทเรียน และเมื่อย้อนกลับไปขั้นสอนระบบต้องซ่อนให้อัตโนมัติ รูปลักษณ์บทเรียน 3D ปัจจุบันใช้ Storybook UI สีน้ำตาล/ครีม โดยคง felt environment เป็นฉากพื้นฐาน

บทเรียนที่ใช้ฉากหลักเดิมทุกข้อเลือก `meta.scenePersistence: "lesson"` ได้ เพื่อคง World และรีใช้ object ระหว่าง `reset()` โดยบทเรียนต้องล้างเฉพาะส่วน dynamic และ cleanup ทั้งหมดเมื่อ `dispose()`; ดูตัวอย่าง `Project/interactive/chapters/ep3/lesson3.html`

Runtime เป็นเจ้าของ entrance animation หลังเปิดฉากและหลังเปลี่ยนข้อ Quiz บทเรียนจึงไม่ควรเรียก `world.playEntrance()` ซ้ำจาก `reset()` หรือฟังก์ชัน render; ใช้เมธอดนี้เฉพาะการเล่นซ้ำที่เกิดจาก action ของผู้เรียนโดยตั้งใจ

คำขอผู้ใช้กำหนดงาน → Master กำหนดกฎ → source snapshot ยืนยัน implementation → SDK/contract อธิบายการใช้งาน → ตัวอย่างแสดง pattern หากไม่ตรงกันให้ตรวจ public API ใน source และรายงานความต่าง ไม่เข้าถึง internal API เพียงเพราะค้นพบ

TEACHER_EXTERNAL ใน contract/validator หมายถึงข้อจำกัด portable lesson-only หากผู้ใช้มอบหมายงานระบบเพิ่มเติมโดยชัดเจน ให้รายงาน patch แยกสำหรับระบบปลายทาง; source repo นี้ยังไม่ใช่ชุด deploy ใช้รูปแบบส่งมอบด้านล่างให้ตรงกันทั้งงานสร้างและงานซ่อม

## การอัปเดตและผลทดสอบ

Source คัดจาก working tree ของโปรเจกต์หลัก ไม่รับรองว่าเท่ากับ upstream commit ที่สะอาดทุกไฟล์ ดู hash รายไฟล์ใน SOURCE_MANIFEST.json เมื่อต้นทางเปลี่ยน ต้องคัด source และ sync SDK, catalog, types, Master, template, validator และดัชนีตัวอย่างพร้อมกัน

catalog สองตำแหน่งมีเนื้อหาเดียวกัน: ใต้ Project ใช้อ่านคู่ runtime ส่วน sdk ใช้กับ validator และ portable API โดยไม่ต้องแนบ asset binary เส้นทาง asset/import ใน source คงตามระบบจริงและอาจไม่มีไฟล์ปลายทางในชุดอ่านนี้โดยตั้งใจ

ส่ง HTML พร้อมผล static, ขอบเขตคำตอบ, commit ของ repository อ้างอิง และรายการ runtime checks ที่ยังรอระบบปลายทาง การผ่าน validator ไม่เท่ากับผ่าน browser หรือเนื้อหาการสอน ไม่ต้องทำให้ repository นี้เปิดเว็บได้ก่อนส่งงาน


## โครงสร้างสำหรับผู้มอบหมายและการ sync

ในโปรเจกต์เจ้าของมีเพียง:

```text
AI/Github/
├── START_PROMPT.txt ← ไฟล์ข้อความ ใช้ส่งโจทย์ ไม่อยู่ใน public repo
└── git/          ← Git repository ที่ sync; README นี้อยู่ที่ root ของ repo
```

ผู้มอบหมายส่งคำสั่งสั้นจาก START_PROMPT.txt ให้ทีมภายนอก โดยระบุเพียง Repository
และ `git/DEVGEN` รอบแรกใช้เชื่อมต่อ ตรวจ VERSION อ่านกฎ และแสดงเมนูเท่านั้น
Lesson path จะส่งภายหลังพร้อม `--CREATE`, แบบฟอร์ม `--TEMPLATE` หรือคำอธิบาย
บทเรียนในข้อความถัดไป แล้ว AI จึงเริ่มสร้างตาม Master และ SDK
เมื่ออ่านเว็บไม่ได้ให้ใช้ clone หรือ ZIP ของ repository นี้

## CREATE — สร้างบทเรียนใหม่

แปลงโจทย์เป็นผลการเรียนรู้, ค่าที่ครูปรับได้, ขั้น Lab ที่มีความหมาย, state/การเปลี่ยน state ที่ยอมรับและปฏิเสธ, คลัง Quiz พร้อม predicate ที่ยอมรับทุกคำตอบที่ถูก, cleanup และการจัดฉากแนวตั้ง ก่อนลงมือเลือก GUI Service, procedural shape และ Asset ID จริง ให้ใช้ Procedural First และประกอบรูปทรงที่มีเพื่อทำ core interaction ให้จบก่อนแจ้งว่าต้องเพิ่ม Asset ผลลัพธ์เป็น HTML หนึ่งไฟล์ ไม่ใช่แผนหรือ API ที่สมมติขึ้น

## DEFINE — ตั้งชื่อส่วนต่างๆ เพื่อสั่งแก้ได้ตรงจุด

ใช้ `--DEFINE` หลังมี Lesson HTML แล้ว AI จะอ่าน HTML ล่าสุดใน Chat และสร้าง
Define Map เช่น `[Grid Area]`, `[Main Character]` หรือ `[World GUI Center Panel]`
พร้อมหน้าที่และส่วนของ code ที่เกี่ยวข้อง ชื่อเหล่านี้ใช้ชี้จุดในคำสั่งรอบถัดไปได้
โดยยังใช้คำอธิบายหรือภาพแบบเดิมได้ ดูกฎเต็มที่ [git/DEFINE](git/DEFINE)

## CHECK — ตรวจไฟล์ก่อนนำไปใช้

ใช้ `--CHECK` เพื่อตรวจโครงสร้าง, helper/API, lifecycle, Lab, Quiz, cleanup, GUI,
mobile, asset และเนื้อหา แล้วรายงาน `PASSED`, `WARNINGS`, `ERRORS`,
`SUGGESTED FIXES` และ `VERDICT` โดยไม่แก้ HTML ดู [git/CHECK](git/CHECK)

## FEEDBACK — วิเคราะห์คุณภาพและแนวทางพัฒนา

ใช้ `--FEEDBACK` กับ HTML ล่าสุดเพื่อหาวิธีทำให้การเรียนรู้ interaction, usability,
visual, mobile และความเป็นมืออาชีพดีขึ้น ข้อเสนอเรียง P1–P3 พร้อม Quick Wins และ
คำสั่งที่ copy ไปใช้ต่อได้ ดู [git/FEEDBACK](git/FEEDBACK)

## IDEA — เสนอแนวคิด Interactive 5 แบบ

ใช้ `--IDEA <ชื่อหรือข้อความสั้นๆ>` เพื่อรับแนวคิดที่มีกลไกต่างกัน 5 แบบ แต่ละแบบ
มี core interaction, learning value, scene, Lab, Quiz, Platform tools และระดับ
ความซับซ้อน โดยยังไม่สร้าง HTML ดู [git/IDEA](git/IDEA)

## REPAIR — ซ่อมบทเรียนจากรายงาน

รับไฟล์ HTML เดิมพร้อม code, stage, message, ขั้นตอนทำซ้ำ และผลที่คาดหวัง ตรวจ [ERROR_CASES](contracts/ERROR_CASES.md) แล้วซ่อมเฉพาะ logic ของบทเรียนเท่าที่จำเป็น รักษาเนื้อหาและพฤติกรรมที่ไม่เกี่ยวข้อง ไม่แก้ runtime เพื่อกลบปัญหาของบทเรียน ตรวจซ้ำและคืน **HTML ฉบับเต็ม** เพื่อให้แทนไฟล์เดิมได้ ไม่ส่งเพียง diff หรือ fragment

หากเป็นข้อจำกัดของระบบกลางจริง ให้รายงาน capability ที่ขาดและทำส่วนอื่นต่อ ไม่เพิ่ม asset, API สมมติ หรือ UI ที่ซ้ำกับระบบกลาง

## Self-review และรูปแบบส่งมอบ

ก่อนส่ง ตรวจ HTML/JS ครบ, script และ define อย่างละหนึ่ง, lifecycle ครบ, ทุก `this.*()` มี method จริงใน lesson definition, API ทุกตัวตรง reference/source, keys ของ Teacher Tools ตรงกัน, sequence/freestyle ถูกต้อง, Quiz ไม่ตอบระหว่าง reset และไม่เฉลย, ไปต่อได้หลังลงมือทั้งถูกและผิด, ทุกคำตอบที่ถูกตามกติกาถูกยอมรับ, slot ไม่ทับกัน, ลากออกเพื่อแก้ได้ และล้าง timer/state/GUI scope ครบ

รัน validator และแก้ error ที่รายงานทุกข้อ หากรันเครื่องมือไม่ได้ให้รายงานว่าเป็น self-review เท่านั้น ไม่อ้างว่า validator ผ่าน ส่วน browser/mobile checks ทำเมื่อมีระบบปลายทางตาม TESTING.md

- `git/DEVGEN` ใน AI Chat: ส่งชื่อ path และ HTML ฉบับเต็มหนึ่ง code block เสมอ
  จากนั้นรายงานสั้นนอก code block ห้ามพยายามเขียนหรือ push กลับ GitHub
- ใช้รูปแบบเดียวกันทั้ง CREATE และ REPAIR; ไม่ส่ง runtime patch หรือ asset เพิ่มสำหรับงาน lesson-only

เมื่อระบบเปลี่ยน ให้ sync source snapshot, Public API, GUI catalog, types, capabilities, asset catalog, contract, template, validator และ examples ในรุ่นเดียวกัน ตรวจลิงก์, template และตัวอย่างหลักก่อน sync

