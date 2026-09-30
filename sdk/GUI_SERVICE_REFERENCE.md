# GUI Service Reference

บทเรียนต้องใช้ `context.ui` สำหรับ GUI มาตรฐาน ห้ามสร้าง panel, choice หรือป้ายติดตาม object ด้วย HTML/CSS ของบทเรียนเอง เพราะระบบกลางจัด theme, mobile layout, animation, sound, safe area และการล้าง UI ให้แล้ว

ชื่อมาตรฐานของ UI ทั้งส่วนที่บทเรียนเรียกได้และส่วนที่ระบบควบคุมอยู่ใน [`UI_CATALOG.md`](UI_CATALOG.md) เมื่อต้องสั่ง AI ให้แก้รูปลักษณ์ควรระบุทั้งชื่อและ Setting path จาก catalog นี้

## กฎบังคับ: Existing GUI Service First

ก่อนเขียน UI ทุกชิ้น AI ต้องทำตามลำดับนี้:

1. ระบุหน้าที่ของข้อมูลหรือปฏิสัมพันธ์ก่อน เช่น โจทย์, objective, ตัวเลือก, feedback, popup, ป้ายชี้พื้นที่ หรือข้อความที่ติดตามวัตถุ
2. เปิด `UI_CATALOG.md` และตาราง **เลือก Service ให้ถูก** ด้านล่าง แล้วเลือก Service ที่มีอยู่ให้ตรงหน้าที่
3. เรียก Public API ของ Service นั้น พร้อมกำหนด `scope` ให้ runtime จัด theme, animation, responsive layout, safe area และ cleanup
4. ถ้าต้องปรับรูปลักษณ์ ให้ใช้ Setting path ของระบบกลาง ห้ามสร้าง CSS หรือ panel เฉพาะบทเรียนเพื่อเลี่ยง Setting
5. ห้ามสร้าง UI ที่ทำหน้าที่ซ้ำด้วย DOM, HTML/CSS, Canvas, Sprite, `addText3D()`, group หรือ primitive แม้จะทำได้ทางเทคนิค

ถ้าไม่พบ Service ที่รองรับจริง:

- **TEACHER_EXTERNAL / Github:** รายงานชื่อ capability ที่ขาดให้ชัดเจนและหยุดเฉพาะส่วนนั้น ห้ามสมมติ API หรือสร้าง UI ทดแทนเอง
- **DEV_WORKSPACE:** ตรวจ source ปัจจุบันก่อน แล้วขยายเป็น Service กลางพร้อม Setting, mobile behavior, cleanup, documentation และ regression test ห้ามแก้ด้วย UI one-off ที่ใช้ได้เพียงบทเดียว

กฎนี้ใช้กับบทเรียนแบบ Main World เท่านั้น บทเรียน Full HTML แบบ ExternalLesson มีขอบเขตและคู่มือของตนเอง

## เลือก Service ให้ถูก

| ต้องการ | ใช้ |
|---|---|
| โจทย์หลักด้านบน | `context.ui.question` |
| คำตอบหรือผลรวมที่ต่อจากโจทย์ | `context.ui.guiAnswer` |
| Objective/คำอธิบาย/feedback ใน Console ด้านล่าง | `context.ui.console` |
| ประกาศสั้นด้านบนที่ไม่ใช่โจทย์ | `context.ui.topMessage` |
| ปุ่มตัวเลือกเหนือ Console | `context.ui.choice` |
| ข้อความ ตัวเลข icon หรือภาพ 2D ที่ติดตาม object | `context.ui.gizmo` |
| ผลลัพธ์สั้น ๆ ที่หายเอง | `context.ui.feedback` |
| Popup ที่ต้องให้ผู้เรียนอ่านหรือตัดสินใจ | `context.ui.dialog` |
| คำอธิบายเชิงลึกของพื้นที่ในฉาก | `context.world.addCallout({ insight })` ซึ่งเปิด `context.ui.insight` ให้อัตโนมัติ |
| หน้าอ่าน/Interactive จาก URL ภายในหรือภายนอก | `context.ui.intro` หรือ `howto[].intro` |
| เมนูปุ่ม utility มุมขวาบน/กลาง/ล่าง | `context.ui.control` |
| คำแนะนำผ่าน Mascot กลาง | `context.ui.hint` |
| ปิด interaction ชั่วคราวระหว่างรอ async task | `context.ui.busy` |
| ป้ายพร้อมเส้นชี้ "พื้นที่" ในฉาก | `context.world.addCallout()` |
| ตัวเลขนับบนพื้นของพื้นที่ | `context.world.addWorldCounter()` |
| ข้อความอธิบายที่วางราบบนพื้น | `context.world.addWorldGui()` |
| วงหรือเส้นชี้นำที่มีมิติจริง | `world.addTargetFocus()` / `world.addGuideline()` |

`gizmo` และ `worldCallout` เป็นคนละระบบ ห้ามใช้แทนกัน:

- Gizmo เป็น Screen-space GUI อ่านตรงและมีขนาดคงที่ ใช้กับ object/value/status
- World Callout เป็น GUI ที่อ่านตรงและล็อกเข้าหาจอ โดยฉายตำแหน่ง `position` จาก World มายังหน้าจอและเชื่อมกับ `anchor` ด้วย leader line/ring ในฉาก ใช้ชี้ “พื้นที่” ไม่ใช่ติดตามค่าของ object เมื่อใส่ `insight` ป้ายจะมี icon และสถานะกดได้เพื่อเปิด Insight Dialog
- World Counter เป็นวัตถุแสดงตัวเลขบนพื้นแบบ display-only ส่วน World GUI แสดงข้อความและเป็น display-only โดยค่าเริ่มต้น; หากกำหนด `insight` หรือ `onClick` Runtime จะทำให้ World GUI กดได้พร้อม hover/hit area กลาง
- `world.addTargetFocus()` ใช้ `animate: false` ได้เมื่อต้องการวงเส้นประนิ่งสำหรับสเกลหรือขอบเขตอ้างอิง เพื่อไม่ให้วงหมุนหรือ pulse จนตำแหน่งคลาดจากวัตถุ

## Question

```js
context.ui.question.show({
  label: "โจทย์",
  text: "3 + 2 มีค่าเท่าไร?",
  tone: "primary"
});

context.ui.question.update({ text: "เลือกคำตอบที่ถูกต้อง" });
context.ui.question.hide();
```

API เดิม `setQuestion(text)` และ `clearQuestion()` ยังรองรับ แต่บทเรียนใหม่ควรใช้ Service แบบ nested เมื่อจำเป็นต้องกำหนด label/tone

## GUI Answer

ใช้แสดงคำตอบหรือผลรวมแบบ Screen-space ต่อจาก Question Panel ไม่ใช้แทน Gizmo หรือป้ายที่ต้องติดตามวัตถุ:

```js
context.ui.guiAnswer.show({ label: "ผลรวม", text: "0" });
context.ui.guiAnswer.update({ text: "7" });
context.ui.guiAnswer.correct({ label: "ผลรวม", text: "10" });
context.ui.guiAnswer.wrong({ label: "ลองใหม่", text: "8" });
context.ui.guiAnswer.hide();
```

หากค่าระหว่างลากเปลี่ยนเร็วและทำให้ panel เด้ง ให้ซ่อนระหว่าง `onDrag` แล้วแสดงหรืออัปเดตใน `onDrop` เท่านั้น ใช้ realtime เฉพาะเมื่อการเห็นค่าระหว่างลากเป็นเป้าหมายการเรียนรู้จริง

## Console

```js
context.ui.console.set({
  objective: "หาผลรวมให้ถูกต้อง",
  title: "ลองนับจำนวนทั้งหมด",
  message: "เลือกคำตอบจากตัวเลือกด้านบน",
  icon: "book",
  tone: "info"
});

context.ui.console.feedback("ทำได้ถูกต้อง!", { tone: "success" });
```

Tone ที่รองรับ: `default`, `primary`, `info`, `success`, `warning`, `error`

API เดิม `setObjective(text)` และ `toast(text, tone)` ยังรองรับ ใน Quiz ห้ามแสดง feedback ที่เฉลยถูก/ผิดระหว่างทำข้อสอบ

## Top Message

ใช้ประกาศเหตุการณ์สั้น ๆ ด้านบน เช่น เริ่มรอบใหม่ ปลดล็อกเครื่องมือ หรือเปลี่ยนกติกา ไม่ใช้แทนโจทย์หลัก และไม่ใช้กับข้อความที่ต้องอ่านค้างนาน

```js
context.ui.topMessage.show({
  title: "เริ่มรอบใหม่",
  message: "ครั้งนี้ลองหาคำตอบโดยไม่ใช้คำใบ้",
  icon: "info.svg",
  tone: "primary",
  duration: 2600,
  dismissible: true
});

context.ui.topMessage.success("ปลดล็อกเครื่องมือใหม่แล้ว");
context.ui.topMessage.hide();
```

ถ้า `question` เปิดอยู่ ระบบจะเลื่อน Top Message ลงมาให้อัตโนมัติเพื่อไม่ให้ซ้อนกัน กำหนด `duration: 0` เมื่อต้องการปิดเอง

## Choice

```js
const answerChoice = context.ui.choice.show({
  id: "answer-choice",
  scope: "question",
  title: "เลือกคำตอบ",
  items: [
    { id: "3", label: "3" },
    { id: "5", label: "5" },
    { id: "7", label: "7" }
  ],
  onSelect(event) {
    const answer = Number(event.value);
    context.quiz.answer(answer === 5, { answer });
  }
});
```

Choice เรียก `objectiveAction()` ให้อัตโนมัติเมื่อกดครั้งแรก จึงไม่ต้องเรียกซ้ำ ยกเว้นกำหนด `objectiveAction: false`

Handle:

```js
answerChoice.setSelected("5");
answerChoice.setDisabled("7", true);
answerChoice.setItems(newItems);
answerChoice.update({ title: "ลองเลือกใหม่" });
answerChoice.show();
answerChoice.hide();
answerChoice.remove();
```

ใช้ `selection: "multiple"` เมื่อต้องเลือกหลายข้อ ค่าเริ่มต้นคือ `single`

## Gizmo

ติดตาม LessonHandle:

```js
const valueGizmo = context.ui.gizmo.attach(apple, {
  id: "apple-count",
  scope: "scene",
  type: "value",
  value: 3,
  placement: "top",
  worldOffset: [0, 1.2, 0]
});
```

ติดตามพิกัด World:

```js
context.ui.gizmo.at([0, 2.5, 0], {
  type: "label",
  text: "จุดเริ่มต้น",
  tone: "info"
});
```

ชนิดที่รองรับ: `label`, `badge`, `value`, `icon`, `image`

ป้ายสมการที่ต้องแยกสี เช่น ฐานและเลขชี้กำลัง ใช้ `segments` และ `size: "large"` แทนการสร้าง DOM เอง:

```js
context.ui.gizmo.attach(powerStack, {
  id: "power-label",
  scope: "step",
  type: "badge",
  size: "large",
  ariaLabel: "ฐาน 3 ยกกำลัง 4",
  segments: [
    { text: "3", color: "#ffffff", role: "base" },
    { text: "4", color: "#ffd45e", role: "exponent" }
  ]
});
```

`role: "exponent"` ทำให้ตัวเลขถูกยกขึ้นและลดขนาดแบบเลขชี้กำลังโดยระบบกลาง

Placement: `top`, `bottom`, `left`, `right`, `center`

Gizmo จะติดตามกล้องและ object, ซ่อนเมื่ออยู่หลังกล้อง และ clamp ไม่ให้หลุด safe area โดยอัตโนมัติ Handle มี `update()`, `setTarget()`, `show()`, `hide()`, `remove()`

## Feedback

ใช้กับข้อความสั้นและไม่สำคัญพอจะบล็อกผู้เรียน ถ้าข้อความต้องอ่านค้างให้ใช้ Console แทน

```js
context.ui.feedback.success("เก็บชิ้นส่วนครบแล้ว");
context.ui.feedback.warning("พื้นที่นี้ยังว่างอยู่", { duration: 3200 });

const status = context.ui.feedback.show({
  id: "score-status",
  title: "คะแนน",
  message: "0 คะแนน",
  duration: 0,
  dismissible: true
});
status.update({ message: "10 คะแนน", tone: "success" });
```

รองรับ `show()`, `success()`, `info()`, `warning()`, `error()` และกำหนด `duration: 0` เพื่อใช้เป็นสถานะย่อที่อัปเดตได้ ระบบไม่แยก HUD อีกชุดเพราะซ้ำตำแหน่งและหน้าที่กัน ห้ามใช้ feedback เฉลยถูก/ผิดระหว่าง Quiz

## Dialog

```js
context.ui.dialog.show({
  title: "พร้อมทดลองหรือยัง?",
  message: "เมื่อเริ่มแล้วให้สังเกตการเปลี่ยนแปลงบนฉาก",
  primaryLabel: "เริ่มทดลอง",
  secondaryLabel: "อ่านอีกครั้ง",
  onPrimary() { startExperiment(); }
});

const accepted = await context.ui.dialog.confirm("เริ่มฉากใหม่หรือไม่?");
```

Dialog เป็น UI แบบบล็อก ใช้เมื่อจำเป็นจริง ๆ เท่านั้น และไม่สร้าง HTML popup เองในบทเรียน

## Insight Dialog

ใช้เมื่อผู้เรียนกดพื้นที่หรือวัตถุเพื่อเปิดคำอธิบายเพิ่มเติม เช่น คลี่เลขยกกำลัง อธิบายวงเล็บ หรือแสดงที่มาของผลลัพธ์ ระบบใช้ Dialog layer กลาง จึงบล็อกฉากชั่วคราว รักษา responsive layout และล้างตาม scope ให้อัตโนมัติ

```js
context.ui.insight.show({
  id: "power-explanation",
  scope: "scene",
  title: "เลขยกกำลังมาจากไหน?",
  message: "เลข 2 ในวงกลมบอกว่าใช้เลขฐานคูณกัน 2 ครั้ง",
  html: `
    <div class="insight-equation">
      <strong>2²</strong>
      <span class="insight-arrow">→</span>
      <strong>2 × 2</strong>
      <span class="insight-arrow">→</span>
      <strong class="insight-result">4</strong>
    </div>
    <ol class="insight-steps">
      <li>เริ่มจากเลขฐาน 2</li>
      <li>ใช้เลข 2 คูณกันตามเลขชี้กำลัง</li>
      <li>จึงได้คำตอบ 4</li>
    </ol>
  `
});
```

เนื้อหา `html`/`contentHtml` ถูกกรองก่อนแสดง รองรับเฉพาะ tag เชิงความหมาย `p`, `strong`, `em`, `b`, `i`, `br`, `ul`, `ol`, `li`, `div`, `section`, `span`, `code`, `small`, `mark` และ class มาตรฐานต่อไปนี้:

- `insight-lead`
- `insight-equation`
- `insight-steps`
- `insight-note`
- `insight-grid`
- `insight-card`
- `insight-arrow`
- `insight-result`
- `insight-muted`

attribute, event handler, style, script, iframe, link และ tag อื่นจะไม่ถูกนำไปแสดง บทเรียนจึงเปลี่ยนโครงสร้างเนื้อหาได้ แต่ไม่สามารถแทรก UI หรือโค้ดที่ข้ามระบบกลาง

## World Option

ใช้เมื่อผู้เรียนกดวัตถุแล้วต้องเลือกคำสั่งที่กระทำต่อวัตถุนั้น เมนูจะแสดงใกล้วัตถุ มีเส้นชี้กลับไปยังเป้าหมาย และจัดปุ่มเป็นแนวตั้ง:

```js
const menu = context.ui.worldOption.attach(cat, {
  id: "cat-actions",
  scope: "scene",
  visible: false,
  title: "เลือกคำสั่ง",
  message: "อยากให้น้องแมวทำอะไร?",
  items: [
    { id: "rotate", label: "หมุน" },
    { id: "left", label: "ขยับซ้าย" },
    { id: "right", label: "ขยับขวา" }
  ],
  onSelect(event) {
    if (event.id === "left") cat.animateTo(-2, .2, 0);
  }
});

// เรียกจาก onClick ของ object
menu.toggle();
```

`attach(target, options)` และ `show(target, options)` คืน `WorldOptionHandle` ซึ่งรองรับ `update()`, `setItems()`, `setDisabled()`, `setTarget()`, `show()`, `hide()`, `toggle()`, `close()` และ `remove()` ค่าเริ่มต้น `closeOnSelect: true` และแสดงได้ครั้งละหนึ่ง panel; ใช้ `multiple: true` เฉพาะกรณีที่จำเป็นจริง Event มี `id`, `value`, `item`, `target`, `handle` และ `sourceEvent` เมื่อกดพื้นที่ว่างของฉาก runtime จะปิด panel ให้อัตโนมัติ ยกเว้น panel ที่ตั้ง `dismissible: false`

World Option ใช้สำหรับคำสั่งของ object ส่วน Choice Panel ใช้ตัวเลือกคำตอบกลางหน้าจอ และ Control Menu ใช้เครื่องมือประจำบทเรียนด้านขวา

## World GUI System

ใช้ป้ายขนาดเล็กที่ยึดกับโมเดลหรือพิกัด World โดยยังอ่านตรงในหน้าจอ เหมาะกับชื่อ ค่าสั้น หรือคำอธิบายที่ต้องติดตามวัตถุ:

```js
const label = context.ui.worldGuiSystem.attach(box, {
  id: "box-label",
  scope: "step",
  text: "กล่องตัวอย่าง",
  tone: "info",
  size: "small",
  anchor: "top",
  offset: [0, 0.2, 0]
});

label.setText("กล่องที่เลือก");
label.hide();
label.show();
```

ใช้ `at([x, y, z], options)` สำหรับพิกัดคงที่, `attach(target, options)` สำหรับ Lesson Handle/model, `get(id)` เพื่ออ่าน handle และ `clear(scope)` เพื่อล้างตามอายุ UI Handle รองรับ `update()`, `setText()`, `setTarget()`, `show()`, `hide()` และ `remove()`

Debug Area ที่แสดงพิกัด X/Z และ Transform Editor ใช้ระบบเดียวกันแต่เป็น System-owned tooling สำหรับทีม Dev บทเรียนห้ามเรียก `worldGuiSystem.debug` หรือจำลองเครื่องมือแก้ transform เอง

## Clickme

มือแบ/มือกำ 2D ติดตามวัตถุในฉากเพื่อบอกว่าลากหรือกดได้ ใช้แบบ **opt-in เฉพาะจุดที่ Admin/Dev ระบุ** ไม่ใส่อัตโนมัติทุก object หรือทุกบทเรียน วัตถุต้องเป็น `draggable` หรือ `clickable`:

```js
const cue = context.ui.clickme.attach(ballHandle, {
  size: 34,                 // px; ไม่ส่งจะใช้ ui.clickme.size
  anchor: "bottom",         // หรือ "top"
  offset: [0, 0.14, 0]      // world units
});

// กรณี lesson ย้ายวัตถุกลับเองหลังวางผิด:
context.ui.clickme.restoreFor(ballHandle);
// เมื่อทำสำเร็จ:
context.ui.clickme.completeFor(ballHandle);
// หรือ cue.complete(); cue.remove();
```

ระบบซ่อนมือระหว่างขั้นสอน, ระหว่างมือไกด์ไลน์กำลังแสดง, ขณะลาก และเมื่อทำสำเร็จ ถ้าปล่อยผิดและวัตถุกลับที่เดิม มือจะแสดงอีกครั้ง จอสัมผัสใช้ `mobileOpacity` ตลอดเพราะไม่มี hover

ตั้งค่ากลางที่ `mainWorldSetting.ui.clickme` ใน `Project/interactive/main-world-setting.js` หรือ F6: `size` (px), `scale` (ตัวคูณขนาดรวมแม้ lesson ส่ง `size`), `unhoverOpacity`, `hoverOpacity`, `mobileOpacity` (0–1), `animationTime` (ms/รอบมือแบ–มือกำ), `opacityTransitionTime` (ms) บทเรียนส่ง `scale` รายวัตถุได้ และจะคูณต่อจาก scale กลาง

## Intro

Intro Service เปิด URL ภายในหรือภายนอกใน iframe เกือบเต็มหน้าจอ ระหว่างเปิด ระบบบล็อก input, scroll, keyboard และ pointer ของบทเรียนหลัก หน้าใน iframe ทำงานภายในตัวเองและไม่มี protocol ส่ง function ไปกลับกับบทเรียน

เปิดจาก Control เพื่ออ่านเสริมได้ดังนี้ การปิดจะกลับมาทำกิจกรรมเดิมโดยไม่เปลี่ยน Step:

```js
context.ui.intro.open({
  url: "./intro_lesson.html",
  title: "เรียนรู้เพิ่มเติม",
  label: "เนื้อหาประกอบ",
  source: "control"
});
```

ขั้นสอนเปิดอัตโนมัติผ่าน metadata และการปิดจะถือว่าเรียน Step นี้จบ จากนั้น Runtime ไป Step ถัดไป:

```js
howto: [{
  index: 0,
  title: "อ่านเนื้อหาเพิ่มเติม",
  type: "sequence",
  desc: "อ่านแล้วกดปิดเพื่อไปต่อ",
  intro: {
    url: "https://example.org/lesson",
    title: "ความรู้ก่อนเริ่ม"
  }
}]
```

เรียก `context.ui.intro.close({ notify: false })` เฉพาะตอน cleanup หากไม่ต้องการ trigger ผลของการปิด หน้า URL ภายนอกต้องอนุญาต iframe ด้วย `X-Frame-Options`/CSP; Intro Service ไม่สามารถข้าม policy ของเว็บไซต์ปลายทางได้

## Control

Control ของบทเรียนถูก runtime จัดการตาม phase กลางทุกบท ระหว่างขั้นสอนระบบซ่อน Control ทั้งหมดและแสดงเฉพาะปุ่มข้ามการสอนของระบบ เมื่อเข้า Lab ขั้นสุดท้าย/การทดลองหรือ `student-quiz` จึงอนุญาตให้ Control ของบทเรียนแสดง หากย้อนกลับไปขั้นสอนระบบจะซ่อนอีกครั้ง และ `handle.show()` ไม่สามารถข้ามกฎนี้ได้

Control ใช้กับคำสั่ง utility ไม่ใช่คำตอบ หากเป็นโจทย์ให้ใช้ Choice

```js
context.ui.control.show({
  id: "experiment-tools",
  scope: "scene",
  position: "top-right",
  items: [
    { id: "play", label: "เล่น", icon: "next.svg" },
    { id: "reset", label: "เริ่มใหม่", icon: "home.svg" }
  ],
  onAction(event) {
    if (event.id === "play") playAnimation();
    if (event.id === "reset") resetAnimation();
  }
});
```

ค่าเริ่มต้น Control ไม่เรียก `objectiveAction()` กำหนด `objectiveAction: true` เฉพาะเมื่อการกดคือการตอบสนองต่อโจทย์จริง

ตำแหน่งที่รองรับ:

- `top-right` — เมนูมุมขวาบน เหมาะกับเครื่องมือหลักของกิจกรรม
- `middle-right` — เมนูกลางขวา เป็นค่าเริ่มต้น
- `bottom-right` — เมนูมุมขวาล่าง ระบบจะยกเหนือ Main Console ให้อัตโนมัติ

บนมือถือระบบย่อเมนูให้เหลือ icon และรักษาระยะจาก Topbar/Main Console ไม่ควรสร้างเมนูมุมจอด้วย HTML ของบทเรียนเอง

## Hint

```js
context.ui.hint.show({
  id: "drag-hint",
  scope: "step",
  title: "ลองสังเกต",
  message: "ลากลูกบอลไปยังวงเป้าหมาย",
  type: "hint"
});
```

Hint ส่งข้อความผ่าน Mascot และ responsive behavior กลาง ห้ามสร้างตัวละครหรือ speech bubble ซ้ำเอง เรียก `context.ui.hint.hide()` เมื่อต้องการปิดทันที

## Step progression และบทพูด Mascot

Metadata ของแต่ละ Step รองรับบทพูดผ่าน `option` โดยไม่ต้องเรียก Hint ซ้ำใน `onStep`:

```js
{
  index: 1,
  title: "รวมคู่ศูนย์",
  type: "sequence",
  desc: "+1 กับ −1 หักล้างกัน",
  option: {
    type: "instruction",
    header: "หนึ่งบวกกับหนึ่งลบเป็นศูนย์",
    message: "จับคู่ต่างเครื่องหมายก่อน แล้วค่อยนับจำนวนที่เหลือ"
  }
}
```

ใช้ `instruction` เมื่อข้อความต้องปรากฏทันที, `hint` เมื่อเป็นคำใบ้เสริม และ `feedback` เมื่อเป็นผลตอบรับสั้น ๆ ทุกขั้นสำคัญควรมีข้อความเฉพาะแนวคิด ไม่ใช้คำทักทายทั่วไปซ้ำทั้งบท

ขั้นที่ต้องทำกิจกรรมให้ผ่านก่อนกดถัดไปใช้ `requiresCompletion: true` และปลดล็อกด้วย:

```js
context.ui.steps.setNextEnabled(true);
```

Runtime จะปิดปุ่มถัดไปและไม่แสดงปุ่มข้ามการสอนเมื่อช่วงที่เหลือมี Step บังคับ

## Busy

```js
const busy = context.ui.busy.show({
  title: "กำลังเตรียมการทดลอง",
  message: "กำลังจัดวัตถุบนฉาก",
  progress: 0.25
});

try {
  await prepareExperiment(progress => busy.setProgress(progress));
} finally {
  busy.hide();
}
```

Busy บล็อกการกดบนฉากแต่ไม่บังปุ่ม Back ใช้เฉพาะงาน async ที่ผู้เรียนต้องรอ และต้องปิดด้วย `hide()`/`finally` เสมอ

## Scope และการล้างอัตโนมัติ

| Scope | ถูกล้างเมื่อ |
|---|---|
| `lesson` | ปิดบทเรียน |
| `scene` | `reset()` หรือสร้างฉากใหม่ — ค่าเริ่มต้น |
| `step` | เปลี่ยนขั้น Lab |
| `question` | เปลี่ยนข้อ Quiz |
| `manual` | เรียก `remove()` เอง |

เลือก scope ให้ตรงกับอายุ UI และอย่าเก็บ DOM element ของระบบไปแก้โดยตรง

## World Callout + Insight สำหรับพื้นที่

```js
context.world.addCallout({
  text: "ดูวิธีวางคำตอบ",
  position: [4, 4.2, 0],
  compactPosition: [2.5, 3.9, 0],
  anchor: [4, 0.2, -1],
  compactScale: [2.5, 0.92],
  insight: {
    title: "พื้นที่คำตอบใช้อย่างไร?",
    message: "ลากวัตถุเข้าไปในกรอบ แล้วตรวจจำนวนอีกครั้ง",
    primaryLabel: "กลับไปทำโจทย์"
  }
});
```

`insight` รับ object, ข้อความ string หรือ function ที่คืนค่า Insight options ได้ หากไม่กำหนด `insight`/`onClick` จะเป็นป้ายปกติเหมือนเดิม หากกำหนด action ระบบจะเติม icon `i`, idle motion, hover animation และ click behavior ให้เอง ใช้ `compactPosition`/`compactScale` เมื่อป้ายที่วางตามฉาก Desktop อาจหลุด viewport บนมือถือ ห้ามเปลี่ยนเป็น Gizmo หรือซ่อน click action ไว้บนพื้นที่โปร่งใส



