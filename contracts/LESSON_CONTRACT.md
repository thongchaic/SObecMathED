# Lesson Contract 1.5.0

เอกสารนี้กำหนดรูปแบบบังคับของ `lesson_N.html` สำหรับ World Runtime

สัญญานี้ใช้กับ **TEACHER_EXTERNAL**: ผลลัพธ์เป็น lesson HTML หนึ่งไฟล์ ใช้ได้เฉพาะ primitive/group/text และ Standard Asset ID ที่ประกาศไว้ ห้ามเพิ่ม asset หรือโหลด custom model โดยตรง

## 1. ขอบเขตไฟล์

Lesson Package เป็น HTML UTF-8 ไฟล์เดียวเพื่อความสะดวกในการอัปโหลด แต่ไม่ใช่ standalone webpage ตัว runtime จะอ่านเฉพาะ registration script แล้วส่ง public `context` เข้า `mount(context)`

โครงไฟล์ต้องเป็นดังนี้:

```html
<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <title>ชื่อสำหรับตรวจไฟล์</title>
</head>
<body>
  <script data-lesson-app>
    (() => {
      PuzzleLesson.define({ /* lesson definition */ });
    })();
  </script>
</body>
</html>
```

ข้อบังคับ:

- มี `<script data-lesson-app>` หนึ่งตัว
- เรียก `PuzzleLesson.define(...)` หนึ่งครั้ง
- `body` ไม่มี visual DOM อื่น
- ไม่มี `<style>`, `<link>`, `<script src>`, iframe, canvas หรือ form
- ไม่มี network request, dynamic import, CDN, npm หรือ `THREE` โดยตรง
- ใช้เฉพาะ API ที่ประกาศใน `sdk/LESSON_API_REFERENCE.md`
- ออกแบบฉากจากเนื้อหาของบทเรียน ไม่บังคับใช้โครงซ้าย/ขวาหรือกล่องจาก Lesson 0
- ใช้เฉพาะ Standard Asset ID จาก `sdk/asset-library.catalog.json` ห้าม custom model relative path, `world.addModel()` และ `type: "model"` โดยตรง แต่ Standard Asset ID อาจชี้ไปยังโมเดลที่ระบบกลางดูแลได้
- รูปทรง procedural ที่ประกาศใน Public API ใช้ได้ทั้งหมดและไม่ถือเป็น custom asset ก่อนแจ้งว่าขาด Asset ต้องลองสร้างด้วย `addPrimitive`/`addGroup` ก่อน โดยเฉพาะ `sector` สำหรับชิ้นเค้กหรือวงกลมเศษส่วน
- GUI ใช้ Service กลาง `steps`, `question`, `guiAnswer`, `console`, `topMessage`, `choice`, `gizmo`, `worldOption`, `worldGuiSystem`, `clickme`, `feedback`, `dialog`, `insight`, `intro`, `control`, `hint`, `busy` ตามหน้าที่ ห้ามสร้าง UI เหล่านี้ซ้ำด้วย DOM/CSS, Canvas, Sprite, primitive หรือ group ของบทเรียน
- เนื้อหาเสริมจาก URL ต้องเปิดผ่าน `context.ui.intro` หรือ `howto[].intro` เท่านั้น ห้ามฝัง iframe เองใน Lesson Package; เว็บภายนอกต้องอนุญาตการ embed ผ่าน `X-Frame-Options`/CSP
- Control ของบทเรียนต้องยอมรับ phase policy ของ runtime: ซ่อนทั้งหมดระหว่างขั้นสอน ยกเว้นปุ่มข้ามการสอนของระบบ และแสดงได้เมื่อเข้า Lab ขั้นสุดท้าย/การทดลองหรือ Quiz เท่านั้น `handle.show()` ไม่สามารถข้ามกฎนี้
- Debug Area และ Transform Editor เป็น System-owned tooling บทเรียนห้ามเปิดหรือจำลองขึ้นเอง; หากต้องแสดงข้อมูลเล็กที่ยึดกับโมเดลหรือพิกัดในบทเรียน ให้ใช้ `context.ui.worldGuiSystem`
- ก่อนสร้าง UI ทุกชิ้นต้องเลือกชื่อ, ownership และ API ตาม `sdk/UI_CATALOG.md` และตัวอย่างใน `sdk/GUI_SERVICE_REFERENCE.md` ก่อนเสมอ ถ้าไม่มี capability จริงให้รายงานสิ่งที่ขาด ห้ามสมมติ API หรือทำ UI one-off ทดแทน
- `world.addCallout()` สงวนไว้สำหรับ GUI ล็อกเข้าหาจอที่ชี้พื้นที่ด้วย leader line/ring ในฉาก ไม่ใช่ Gizmo และบทเรียนห้ามสร้าง DOM/Screen-space overlay/Sprite ทดแทนเอง
- เครื่องหมายเปรียบเทียบและคำนวณ `= ≠ < > ≤ ≥ + - × ÷` ใช้ `world.addOperatorSign()` เพื่อรักษา polygon และฐานมาตรฐาน

## 2. Lesson Definition

```js
PuzzleLesson.define({
  id: "lesson-unique-id",
  version: "1.0.0",
  meta: { /* metadata */ },
  mount(context) {},
  reset({ values, mode, question, questionIndex }) {},
  onStep(index, step) {},
  dispose() {}
});
```

### Lifecycle

- `mount(context)` เรียกหนึ่งครั้งเมื่อโหลด lesson ใช้เก็บ context และตั้ง state ที่ไม่ผูกกับคำถาม
- `reset(payload)` เรียกทุกครั้งที่เริ่ม Lab ใหม่ เปลี่ยนคำถาม Quiz หรือ reset ต้องสร้าง scene/state ใหม่จาก `values`
- `onStep(index, step)` ใช้ใน Lab เพื่อเปลี่ยน sequence/freestyle behavior
- `dispose()` ต้องหยุด timer, cue, animation และล้าง reference เมื่อปิด lesson
- lifecycle อาจเป็น `async` ได้ แต่ error ต้องถูก throw ออกไปให้ runtime รายงาน

Runtime เป็นเจ้าของการ clear world ก่อน reset ดังนั้น lesson ไม่ต้องลบ object ทีละชิ้น แต่ต้องล้าง Map, array, timer และ handle ของรอบก่อน

ค่าเริ่มต้น `scenePersistence` คือ `"reset"` และ Runtime จะล้าง World ก่อน `reset()` ตามปกติ หากฉากหลักเหมือนเดิมทุกข้อ บทเรียนเลือก `meta.scenePersistence: "lesson"` ได้ แล้ว Runtime จะคง World หลัง reset ครั้งแรก บทเรียนต้องสร้างฉากคงที่ครั้งเดียว รีใช้หรือ pool object ที่เหมาะสม ล้างเฉพาะ object แบบ dynamic ทุก `reset()` และล้างทั้งหมดใน `dispose()` ห้ามใช้โหมดนี้เพียงเพื่อหลบ cleanup

`reset` สามารถเป็น `async` ได้เมื่อตรรกะบทเรียนจำเป็น แต่ TEACHER_EXTERNAL ห้ามโหลด custom model; Standard Library prefab และ primitive สร้างได้ทันที

## 3. Metadata

ค่าหลักที่ต้องมี:

```js
meta: {
  worldType: "3d-world-space",
  lessonId: "lesson-unique-id",
  title: "ชื่อบทเรียน",
  category: "ชื่อวิชา",
  subcategory: "ชื่อหัวข้อย่อย",
  description: "คำอธิบายสั้น",
  keyResult: "ผลลัพธ์การเรียนรู้",
  background: "green",
  camera: { /* camera preset */ },
  welcomeMessage: ["ข้อความสั้น"],
  tooltip: "คำแนะนำการควบคุม",
  defaultValue: {},
  editSchema: [],
  howto: [],
  quiz: []
}
```

- `id` และ `meta.lessonId` ต้องตรงกัน
- `meta.title`, `meta.category` และ `meta.subcategory` ต้องเป็นข้อความที่ไม่ว่าง เพื่อเป็นค่าแสดงผลสำรองของบทเรียน
- `worldType` สำหรับบทเรียนนี้ต้องเป็น `3d-world-space`
- `background` ใช้ค่า `"green"` เท่านั้น ฉากเป็นระบบกลางและบทเรียนไม่กำหนดสี Grid เอง
- key ใน `defaultValue`, `editSchema`, quiz `data` และ logic ใน reset ต้องตรงกัน
- Teacher Tools ทุก field ต้องถูกใช้จริง ห้ามมี control ที่แก้แล้วไม่เกิดผล
- `camera.target` ใช้จัด pivot/framing ของบทเรียน และต้องทดสอบบนจอแนวตั้ง

### editSchema

ชนิดที่ใช้ใน canonical lesson:

```js
{ key: "count", name: "จำนวน", type: "slider", option: [1, 10], step: 1 }
{ key: "side", name: "ฝั่ง", type: "dropdown", option: ["left", "right"] }
{ key: "operator", name: "เครื่องหมาย", type: "dropdown", option: ["=", "≠", "<", ">", "≤", "≥"] }
```

### howto

- `index` เริ่ม 0 และเรียงต่อกัน
- `type: "sequence"` เป็นขั้นสังเกต/สาธิต ต้องปิด interactive
- `type: "freestyle"` เป็นขั้นให้ลงมือ ต้องเปิด interactive และคืน scene สู่ state พร้อมเล่น
- แต่ละ step ควรสื่อการเปลี่ยนแปลงด้วย target focus, cue, guideline, pulse หรือ animation ที่สัมพันธ์กับข้อความ
- ขั้นสำคัญควรมี `option: { type: "instruction" | "hint" | "feedback", header, message }` เพื่อให้ Mascot อธิบายแนวคิดเฉพาะขั้น ไม่ใช้คำทักทายเดียวแทนบทสอนทั้งบท
- ใช้ `requiresCompletion: true` เมื่อผู้เรียนต้องผ่านกิจกรรมก่อนกดถัดไป และเรียก `context.ui.steps.setNextEnabled(true)` หลังตรวจเงื่อนไขสำเร็จ ห้ามจำลองการล็อกปุ่มด้วย DOM
- ถ้าต้องการให้ Teacher Tools กลับเข้า Step ทดลองหลังปรับค่า ให้กำหนด `meta.editRestartStep` เป็น index ที่มีอยู่จริง; ค่าเริ่มต้นคือ Step 0
- Step เพิ่ม `intro: { url, title?, label? }` ได้ เมื่อต้องบังคับอ่านหน้าเสริม การปิด Intro จะพาไป Step ถัดไปอัตโนมัติ; หากเปิด Intro จาก `ui.control` การปิดจะไม่เปลี่ยน Step

### quiz

```js
quiz: [
  {
    question: "ข้อความโจทย์",
    data: [
      { key: "count", value: 4 },
      { key: "operator", value: "<" }
    ]
  }
]
```

## 4. กฎ Lab และ Quiz

### Lab

- sequence step ปิด draggable/click action
- freestyle step เปิด action หลังสาธิตจบ
- Lab แจ้ง success ได้เมื่อ condition ถูกต้อง
- วาง object ผิดพื้นที่ต้องคืน `{ accepted: false }` หรือ `false` เพื่อให้ runtime เด้งกลับ
- วัตถุที่อยู่ใน target ต้องลากออกเพื่อแก้คำตอบได้

### Quiz

- เริ่มแต่ละข้อด้วย state ใหม่และ interactive ได้ทันที
- การลาก object จะนับ objective action โดย runtime อัตโนมัติ
- ทุกครั้งที่ state คำตอบเปลี่ยนจากการลงมือของผู้เรียน ให้เรียก `context.quiz.answer(correct, details)`; Runtime จะบันทึกคำตอบและเปิดปุ่มไปต่อให้อัตโนมัติ ไม่ว่าคำตอบจะถูกหรือผิด
- ห้ามเรียก `context.quiz.answer(...)` ภายใน `reset()` หรือ helper ที่ `reset()` เรียก เพราะยังไม่มีการลงมือจากผู้เรียน และ Runtime จะไม่รับคำตอบระหว่างเตรียมข้อ
- ใช้ `context.objectiveAction()` เฉพาะ action ที่ตั้งใจให้ไปต่อได้แต่ยังไม่เปลี่ยน state คำตอบ เช่น invalid drop หรือการกดข้ามตามรูปแบบกิจกรรม
- เส้นทาง `ตอบ → ต่อไป → ส่งคำตอบ → ดูผล → ปิดบทเรียน` เป็น System-owned flow ที่ทุกบทเรียนต้องใช้งานได้ครบ ห้ามซ่อน แทนที่ หรือผูกปุ่มไปต่อไว้กับคำตอบที่ถูกเท่านั้น
- ห้ามเฉลยหรือแสดง success/fail ระหว่างกำลังทำ Quiz
- ตรวจ predicate จริง เช่น `< 4` ต้องยอมรับทุกค่าที่น้อยกว่า 4 ไม่ใช่บังคับ sample answer ค่าเดียว
- ถ้ามีหลาย object ให้ใช้ Map/slot allocation เพื่อป้องกันวัตถุซ้อน slot เดียวกัน และคืน slot เมื่อลากออก

## 5. Drag/Drop Result

`onDrop(position, handle)` คืนค่า:

```js
{ accepted: true, commit: true }   // ยอมรับตำแหน่งและเล่น commit feedback
{ accepted: true, commit: false }  // ยอมรับโดยไม่เล่น commit feedback
{ accepted: false }                // runtime นำกลับตำแหน่งก่อนลาก
false                              // เหมือน accepted: false
```

หลังวางที่ยอมรับ ควรเรียก `handle.setPosition(...)` เพื่อ snap ไปยังตำแหน่งที่แน่นอน

## 6. Cleanup

### Helper ภายใน lesson object

`this.someHelper()` ไม่ใช่คำสั่งของ Runtime หรือ Public API แต่เป็นการเรียก method ของ lesson object เอง ทุกชื่อที่เรียกต้องประกาศอยู่ใน object ที่ส่งให้ `PuzzleLesson.define(...)` และสะกดตรงกัน เช่น:

```js
PuzzleLesson.define({
  reset() {
    this.updateCounter();
  },
  updateCounter() {
    // อัปเดต state/UI ของบทเรียน
  }
});
```

ห้ามเรียก `this.updateCounter()` โดยไม่มี `updateCounter()` ใน object เดียวกัน หากต้องใช้ฟังก์ชันภายนอก object ให้เรียกชื่อฟังก์ชันนั้นตรง ๆ และต้องประกาศไว้จริง Validator จะคืน `LESSON_HELPER_MISSING` เมื่อพบรูปแบบนี้

ก่อน reset และใน dispose:

- `clearTimeout` / `clearInterval` ทั้งหมด
- `stopAnimation()` ของ handle ที่กำลัง animate หากจำเป็น
- `context.world.hideDragCue()`
- ล้าง Map, Set, array และ references
- ห้ามเก็บ listener บน `window` หรือ `document`; บทเรียนไม่ควรสร้าง global listener

## 7. Output ของ AI

AI ต้องส่ง HTML ฉบับเต็มหนึ่งไฟล์ สำหรับ `git/DEVGEN` ให้ส่งชื่อ path และ HTML ทั้งไฟล์ใน code block ภาษา `html` หนึ่งก้อนใน Chat เสมอ ห้ามเขียน commit, branch, PR หรือ push กลับ GitHub ใช้รูปแบบนี้ทั้ง CREATE และ REPAIR ห้ามส่ง runtime patch, custom asset หรือไฟล์เสริมสำหรับงาน lesson-only หาก API/Standard Library ไม่รองรับสิ่งที่ขอ ให้รายงาน capability หรือ Asset ID ที่ต้องให้ทีม Dev เพิ่ม แทนการประดิษฐ์ API/path

ก่อนส่งต้องเปรียบเทียบกับ `LESSON_OUTPUT_TEMPLATE.html` และ `Project/interactive/chapters/lesson0.html` หากรันเครื่องมือได้ให้ใช้ `validator/validate-lesson.mjs`; หากเป็น Chat ที่รันไม่ได้ให้ทำ static self-review และระบุข้อจำกัดตามจริง




