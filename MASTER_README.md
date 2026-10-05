# MASTER README — กฎกลางสำหรับสร้างบทเรียน

เอกสารนี้เป็นแหล่งข้อมูลกลางของกระบวนการสร้างบทเรียนด้วย AI สำหรับ Puzzle Widget Platform ภายในโปรเจ็ค `srru-interactive-3d` สำหรับทีม Dev และ AI ที่ใช้ repository อ้างอิงนี้ อ่านภาพรวมสิทธิ์ที่ `README.md` ก่อนเริ่มงาน

เมื่อกฎการสร้างบทเรียน, runtime, UX หรือขั้นตอนตรวจสอบเปลี่ยน ให้ปรับเอกสารนี้และ portable contract ใน `contracts/` ให้ตรงกัน ส่วน ข้อความ START_PROMPT ที่ผู้มอบหมายส่งมาแยกจาก repository เป็นแบบฟอร์มคำขอของทีม Dev/AI ใช้ส่งให้ทีม Dev และ AI ภายนอกที่ได้รับมอบหมายได้

## Access Profile

- **DEV_WORKSPACE:** ทีม Dev/AI อ่าน source ทั้งโปรเจ็คและมีสิทธิ์เพิ่ม asset หรือขยาย runtime ได้เมื่อผู้ใช้ระบุงานระบบนั้นอย่างชัดเจน
- **Default scope:** แม้อยู่ใน DEV_WORKSPACE งานจาก ข้อความ START_PROMPT ที่ผู้มอบหมายส่งมาแยกจาก repository เริ่มต้นเป็น lesson-only ห้ามแตะ runtime หรือ asset กลางถ้าไม่ได้รับคำสั่ง
- **Portable lesson-only:** ค่าเริ่มต้นของชุดนี้ ส่งบทเรียน HTML หนึ่งไฟล์ ใช้ primitive และ Standard Asset ID; ข้อจำกัด teacher-external ใน portable contract ใช้กับงานแบบนี้ หากผู้ใช้อนุญาตงานระบบโดยชัดเจนให้ยึด DEV_WORKSPACE และรายงานไฟล์เพิ่มเติมทั้งหมด
- **GITHUB_CHAT_READ_ONLY:** เมื่อเริ่มผ่าน `git/DEVGEN` Repository มีไว้ให้อ่านเท่านั้น ห้ามเขียน commit, branch, PR หรือ push ผลลัพธ์ต้องเป็นชื่อ path และ HTML ฉบับเต็มใน Chat เพื่อให้ผู้ใช้ Copy ไปบันทึกเอง กฎนี้มีอำนาจเหนือข้อความเรื่องการเขียนไฟล์ใน workflow ทั่วไปของ Master
- **EXTERNAL_FULL_HTML:** เป็นคนละรูปแบบกับ Lesson Package; ดูข้อแยกใน EXAMPLES.md และ source ของ EduSDK ใช้เมื่อผู้ใช้ขอ HTML อิสระโดยชัดเจนเท่านั้น

## คำสั่งบังคับสำหรับ AI

ก่อนวิเคราะห์ วางแผน สร้าง หรือแก้บทเรียน ต้องอ่านเอกสารนี้ทั้งไฟล์และตรวจ source code ปัจจุบันตามรายการอ้างอิงด้านล่าง ห้ามสร้างจากความจำหรือ pattern ของโปรเจ็คอื่น

AI ต้องผลิต Lesson Package HTML ฉบับเต็มและตรวจ static ส่วน `git/DEVGEN` ส่งผลใน Chat โดยไม่เขียนกลับ Repository และ runtime test ทำเมื่อมีระบบปลายทางพร้อมเท่านั้น ไม่ต้องขอ plugin/asset หรือหยุดสร้างบทเรียนเพราะชุดอ้างอิงนี้รันไม่ได้

เมื่อผู้ใช้เรียก `--DEFINE` ให้ทำตาม `git/DEFINE`: วิเคราะห์ Lesson HTML ล่าสุดและ
สร้างชื่ออ้างอิงของพื้นที่ วัตถุ GUI และ logic โดยไม่แก้ HTML ในคำตอบนั้น ชื่อใน
Define Map ใช้เป็นศัพท์ร่วมของ session แต่ผู้ใช้ยังอธิบายแบบปกติได้เสมอ

คำสั่งวิเคราะห์เพิ่มเติมต้องอ่านไฟล์กำกับก่อนทำงานและห้ามแก้ HTML ในคำตอบเดียวกัน:

- `--CHECK` → `git/CHECK` ตรวจความพร้อมและแยก Passed/Warning/Error/Fix/Verdict
- `--FEEDBACK` → `git/FEEDBACK` วิเคราะห์คุณภาพและจัดลำดับข้อเสนอพัฒนา
- `--IDEA <หัวข้อ>` → `git/IDEA` เสนอแนวคิด Interactive ที่ต่างกัน 5 แบบ

## Source of Truth

ตรวจไฟล์จริงใน workspace ตามลำดับนี้ทุกครั้ง:

1. `Project/interactive/chapters/lesson0.html`
   - canonical example ของบทเรียน 3D, lifecycle, Lab, Quiz, Teacher Tools, drag/drop และ cleanup
2. `Project/interactive/main-world.js`
   - public API ปัจจุบันจาก `world`, `makeHandle`, `lessonUi`, `createContext`, `normalizeMeta`, `resetLessonScene` และระบบ Quiz
3. `Project/interactive/gui-service.js`
   - public GUI API, Choice/Gizmo handles, scope lifecycle และ responsive projection
4. `sdk/UI_CATALOG.md`
   - ชื่อมาตรฐานของ UI, ownership, API และ Setting path ที่ใช้คุยกับผู้ใช้/AI ให้ตรงกัน
5. `Project/interactive/main-world-setting.js`
   - ฉาก Green กลาง, camera, interaction, VFX, mascot และระบบเสียงที่รองรับ
6. `Project/interactive/eduSdk.js`
   - การเปิดบทเรียน, relative path, progress, complete และ close callback
7. `TESTING.md` — static checks ในชุดนี้ และเกณฑ์ runtime test ในระบบปลายทาง
   - รูปแบบ `lessonData` และขั้นตอนเปิดบทเรียนรุ่นล่าสุด
8. ไฟล์คำขอของทีม Dev เช่น ข้อความ START_PROMPT ที่ผู้มอบหมายส่งมาแยกจาก repository
   - เนื้อหา กิจกรรม และการปรับแต่งเฉพาะบท

source code ใน workspace เวอร์ชันปัจจุบันมีอำนาจเหนือ API หรือรายละเอียดที่ AI เคยจำจากงานก่อนหน้า ห้ามเดาชื่อ method, event, asset หรือ schema ขึ้นเอง

ถ้า `lesson0.html` ใช้ pattern เก่ากว่า runtime ปัจจุบัน ให้ยึด public API ใน runtime และรักษาพฤติกรรมที่ถูกต้องของ Lesson 0 แทนการคัดลอกโค้ดเก่าแบบตรงตัว

## ขอบเขตงานเริ่มต้น

- สร้างหรือแก้เฉพาะไฟล์บทเรียนที่ผู้ใช้ระบุใน `Project/interactive/chapters/`
- ห้ามแก้ `main-world.js`, `main-world-setting.js`, `world.css`, `eduSdk.js`, plugin หรือ asset กลาง เว้นแต่ผู้ใช้สั่งให้แก้ระบบโดยตรง
- ห้ามแก้ `lesson0.html` เมื่อใช้เป็น reference เว้นแต่ชื่อไฟล์ที่ผู้ใช้สั่งคือ `lesson0.html` หรือผู้ใช้ระบุให้แก้ Lesson 0
- รักษาการเปลี่ยนแปลงเดิมของผู้ใช้และไม่แตะไฟล์ที่ไม่เกี่ยวข้อง
- หากการทำบทเรียนต้องเพิ่มความสามารถใหม่ใน runtime และผู้ใช้ยังไม่ได้อนุญาตงานระบบ ให้หยุดและอธิบายข้อจำกัดก่อน ห้ามแอบขยาย scope ไปแก้ระบบกลาง
- เมื่อผู้ใช้สั่งเพิ่ม asset/runtime โดยตรง ทีม Dev สามารถดำเนินการได้ แต่ต้องอัปเดต Public API, catalog, types, validator, Github และ regression test ที่เกี่ยวข้อง

## สัญญาไฟล์บทเรียน

- บทเรียนหนึ่งบทเป็น **Lesson Package HTML** ไม่ใช่ standalone webpage หรือ web application
- ไฟล์ยังมี `<!doctype html>`, `<html>`, `<head>` และ `<body>` เพื่อให้ upload เป็น HTML ได้ แต่ `<head>` มีเพียง charset และ title สำหรับตรวจไฟล์
- `<body>` ต้องมีเพียง `<script data-lesson-app>` หนึ่งตัว ห้ามมี div, header, main, section, button, canvas, form หรือ UI markup อื่น
- ห้ามมี `<style>`, `<link rel="stylesheet">`, `<script src>`, Tailwind หรือ CSS framework
- เก็บใต้ `Project/interactive/chapters/`
- มี `<script data-lesson-app>` เพียงหนึ่งตัว
- เรียก `PuzzleLesson.define({...})` เพียงหนึ่งครั้ง
- มี `id`, `version`, `meta`, `mount(context)`, `reset(payload)` และ `dispose()`
- ใช้ `worldType: "3d-world-space"` สำหรับบทเรียนบน World 3D
- ใช้ id แบบ slug ภาษาอังกฤษ ตัวเลข และขีดกลาง โดยไม่ซ้ำกับบทอื่น
- ใช้ semantic version เช่น `1.0.0`
- ห้ามใช้ iframe, CDN, npm, import, ES module, network request หรือ `THREE` โดยตรง
- ห้ามสร้าง `window.context`, `window.eduSdk` หรือ lifecycle สมมติ เช่น `onPhaseChange` และ `onInteraction`
- ห้ามเรียก API สมมติ เช่น `spawnObject`, `removeObject`, `updateObject`; ต้องสร้างฉากผ่าน `context.world` ที่ได้รับใน `mount(context)` เท่านั้น
- ห้ามสร้าง header, loading, mascot, console, camera control, result screen หรือ UI กลางซ้ำ
- ต้องกรอก `meta.title`, `meta.category` และ `meta.subcategory` เป็นค่าเริ่มต้นของบทเรียนเสมอ Runtime จะใช้ `lessonData` ที่ไม่ว่างก่อนตามปกติ และ fallback มาใช้ meta; เมื่อ `mainWorldSetting.overrideTitleName === true` จะใช้ meta ทับทั้งสามค่า บทเรียนห้ามสร้างหรือเขียนทับ header หลักเอง
- ใช้เฉพาะ public API ที่พบจาก runtime ปัจจุบันผ่าน `context.world`, `context.ui`, `context.audio`, `context.quiz`, `context.objectiveAction` และ `context.complete`
- ใน DEV_WORKSPACE บทเรียนเลือกใช้ primitive, Standard Asset Library และ custom GLB/GLTF/FBX ผสมกันได้เมื่อ scope อนุญาต; custom asset ต้องถูกเพิ่มและ deploy โดยทีม Dev ห้ามยึดรูปแบบกราฟิกของ Lesson 0 เป็นค่าเริ่มต้นทุกบท
- ถ้าสิ่งที่สร้างจะส่งให้อาจารย์ภายนอกใช้ต่อ ต้องลงทะเบียนเป็น Standard Asset ID ใน catalog ก่อน อาจารย์ภายนอกห้ามเรียก path ของ custom model โดยตรง
- ตรวจ Asset ID จริงจาก `Project/interactive/assets/library/catalog.json`; เครื่องหมาย `= ≠ < > ≤ ≥ + - × ÷` ใช้ `world.addOperatorSign` เพื่อให้ได้ polygon 3D และฐานมาตรฐาน ห้ามใช้ `addText3D` ทำเครื่องหมายบนฐาน ความหนาแนวตั้งของ prefab ถูกควบคุมส่วนกลางด้วย `mainWorldSetting.lessonGraphics.operatorBase.heightScale` ห้ามแก้ `object3D`/`visualRoot` รายบท
- ห้ามแก้ material, geometry, renderer, scene, camera ภายใน หรือ `userData` ของ object โดยตรง
- ถ้าต้องใช้ asset ให้ใช้เฉพาะไฟล์ที่มีอยู่จริงและ resolve ผ่าน API ของ runtime ห้ามสมมติ path
- **Procedural First:** ก่อนสรุปว่าต้องติดต่อทีม Dev หรือขอ Asset ใหม่ ต้องตรวจรูปทรงทั้งหมดใน `sdk/LESSON_API_REFERENCE.md` และลองประกอบด้วย `world.addPrimitive()` / `world.addGroup()` ก่อน รูปทรง procedural ไม่ต้องลงทะเบียนใน Asset Catalog
- ใช้ `sector`/`ring-sector` สำหรับเค้ก พิซซ่า เศษส่วน และกราฟวงกลม ใช้ `prism`/`pyramid`/`frustum` สำหรับเรขาคณิต และใช้ `polygon`/`polyhedron`/`lathe`/`spline-tube` เมื่อต้องกำหนดจุด หน้าตัด หรือแนวเส้นเอง ทีมหลักสามารถแทนด้วย FBX/Standard Asset ภายหลังโดยไม่เปลี่ยน learning logic
- ติดต่อทีม Dev เฉพาะเมื่อรูปทรงและ interaction ที่ประกาศไว้ยังทำแกนการเรียนรู้ไม่ได้จริง เช่น physics หรือของเหลว ห้ามหยุดเพียงเพราะไม่มีโมเดลสวยใน Catalog

## UI กลางของบทเรียน

- **Existing GUI Service First เป็นกฎบังคับ:** ทุกครั้งที่ต้องแสดง UI ให้จำแนกหน้าที่และค้นใน `sdk/UI_CATALOG.md` / `GUI_SERVICE_REFERENCE.md` ก่อน แล้วใช้ Service ที่มีอยู่ ห้ามเริ่มจากการสร้าง UI เฉพาะบทเรียน
- ถ้าไม่มี capability ที่ต้องการจริง ให้ตรวจ runtime ก่อน จากนั้นเพิ่มหรือขยาย `gui-service.js` และ Setting/API กลาง พร้อม mobile behavior, lifecycle cleanup, เอกสาร และ regression test ห้ามแก้ด้วย HTML/CSS หรือ panel one-off ที่ใช้ได้เพียง lesson เดียว
- ก่อนออกแบบ UI ต้องอ่าน `sdk/UI_CATALOG.md` และ `sdk/GUI_SERVICE_REFERENCE.md` เพื่อใช้ชื่อมาตรฐาน, API และ ownership ให้ถูกต้อง
- โจทย์หลักที่ต้องอ่านคงที่ใช้ `context.ui.setQuestion(text)` ระบบจะแสดงเป็น screen-space UI ด้านบนและไม่หมุนตามกล้อง กรอบรักษาความกว้าง/ความสูง ไม่ทับ Header/Panel และลดขนาดอักษรให้พอดีไม่เกิน 2 บรรทัด บทเรียนส่งเฉพาะข้อความ
- เป้าหมายย่อใน Main Console ด้านล่างใช้ `context.ui.setObjective(text)`
- ข้อความ feedback ใช้ `context.ui.toast(text, type)` เพื่ออัปเดตสถานะใน Main Console ข้อความจะค้างจนกว่าจะมีสถานะใหม่หรือเปลี่ยน Step
- GUI ใหม่ให้ใช้ Service กลาง `context.ui.question`, `guiAnswer`, `console`, `topMessage`, `choice`, `gizmo`, `worldOption`, `worldGuiSystem`, `clickme`, `feedback`, `dialog`, `insight`, `intro`, `control`, `hint`, `busy` ห้ามสร้าง UI ซ้ำด้วย HTML/CSS หาก Public API รองรับแล้ว โดย `control.position` รองรับ `top-right`, `middle-right`, `bottom-right`
- `context.ui.guiAnswer` เป็นแถบคำตอบ/ผลรวมต่อจาก Question Panel ใช้ `show()`/`update()` กับสถานะปกติ, `correct()`/`wrong()` กับผลตรวจ และ `hide()` เมื่อไม่ควรแสดง สำหรับกิจกรรมลากที่ค่าระหว่างลากสั่น ให้แสดงหลัง `onDrop` แทนการอัปเดตทุก `onDrag`
- `context.ui.choice.show()` ใช้สร้างตัวเลือกเหนือ Console และแจ้ง objective action ให้อัตโนมัติ ส่วน `context.ui.gizmo.attach()`/`at()` ใช้ข้อความ ตัวเลข icon หรือภาพ Screen-space ที่ติดตาม object/พิกัด World
- `context.ui.worldGuiSystem.attach()`/`at()` ใช้ป้ายข้อมูลขนาดเล็กที่ยึดกับโมเดลหรือพิกัด เหมาะกับคำอธิบายสั้นบนฉาก; Debug Area และ Transform Editor เป็นเครื่องมือ System-owned สำหรับทีม Dev ไม่ใช่สิ่งที่ lesson ต้องเปิดเอง
- `context.ui.worldOption.attach()` ใช้ popup ตัวเลือกแนวตั้งที่เปิดจาก object 3D และส่ง event ของคำสั่งกลับบทเรียน ห้ามสร้างเมนูเฉพาะบทเรียนทับความสามารถนี้
- วัตถุ 3D ที่ `clickable` หรือ `draggable` ใช้ Hover กลางของ runtime อัตโนมัติ (ผิวขาวพร้อมวง Hover) ห้ามสร้าง Hover ซ้ำรายบทเรียน; `selectionFeedback: false` ซ่อนเฉพาะลูกศร Select หลังคลิกและไม่ปิด Hover
- `context.ui.clickme.attach(handle, { size, scale, anchor, offset })` ใช้มือแบ/มือกำกับวัตถุ draggable/clickable **เฉพาะจุดที่ Admin/Dev ระบุ** ไม่เปิดอัตโนมัติ; ระบบซ่อนระหว่างสอน/เล่นมือไกด์ไลน์/กำลังลาก และกลับมาเมื่อวางไม่สำเร็จ ปรับค่าเริ่มต้นที่ `mainWorldSetting.ui.clickme` (size, scale, unhoverOpacity, hoverOpacity, mobileOpacity, animationTime, opacityTransitionTime)
- `context.ui.intro.open({ url, title, source: "control" })` ใช้เปิดเนื้อหาเสริมจาก URL ภายใน/ภายนอกแบบเกือบเต็มจอและบล็อก interaction ของฉาก ห้ามสร้าง iframe/modal เอง; ขั้นสอนใช้ `howto[].intro` และเมื่อปิดจะไป Step ถัดไป ส่วนการเปิดจาก Control แล้วปิดจะไม่เปลี่ยน Step
- ขั้นที่ต้องทำให้สำเร็จก่อนจึงไปต่อให้กำหนด `howto[].requiresCompletion: true` แล้วเรียก `context.ui.steps.setNextEnabled(true)` เมื่อผ่าน Runtime จะปิดปุ่มถัดไปและปิดการข้ามช่วงที่มีขั้นบังคับให้อัตโนมัติ
- ทุก `howto` ที่มีสาระสอนควรมี `option: { type, header, message }` เฉพาะขั้น ไม่ใช่มีบทพูดเพียงคำทักทายในขั้นแรก; `instruction` แสดงทันที ส่วน `hint` ใช้คำใบ้ที่อาจพักหลังปุ่มแจ้งเตือนบนจอใหญ่
- `world.addCallout()` ใช้สำหรับป้ายพร้อมเส้นชี้ "พื้นที่" ในฉาก และใส่ `insight` ได้เพื่อให้ป้ายเป็นจุดกดเปิดคำอธิบายมาตรฐาน ห้ามซ่อน click action ไว้บนพื้นผิวที่มองไม่ออกว่ากดได้; Callout กับ Gizmo ยังมีหน้าที่ต่างกัน
- ใช้ `world.addWorldCounter()` เมื่อต้องแสดงตัวเลขนับบนพื้นแบบ display-only และใช้ `world.addWorldGui()` เมื่อต้องวางข้อความอธิบายลงบนพื้น World GUI กดเปิด Insight ได้เมื่อกำหนด `insight` หรือ `onClick`; ใช้ interaction กลางนี้แทนการสร้างปุ่มซ้ำเอง
- ใช้ `world.addLineRender({ points, closed: true, dashed, arrow: false })` สำหรับกรอบ polygon หรือแนววางหลายช่วง และยกค่า Y เหนือพื้นเล็กน้อยเพื่อเลี่ยง z-fighting; ใช้ `world.camera.focus({ position, normal })` เพื่อหันกล้องแบบ eased transition โดยคง zoom เดิม
- ใช้ GUI scope ให้เหมาะสม (`scene`, `step`, `question`, `lesson`, `manual`) เพื่อให้ runtime ล้าง UI ตาม lifecycle ได้เอง ดู signature และตัวอย่างล่าสุดใน `sdk/GUI_SERVICE_REFERENCE.md`
- ห้ามสร้างป้ายโจทย์หลักด้วย `addText3D`, callout, group หรือ DOM ของบทเรียน เพราะจะซ้ำกับ UI กลางและอาจกลับด้านเมื่อหมุนกล้อง
- runtime ล้าง Question UI ก่อน reset/close อัตโนมัติ บทเรียนเรียก `context.ui.clearQuestion()` เฉพาะเมื่อต้องการซ่อนระหว่างกิจกรรม
- หากทุกข้อใช้ฉากหลักเดียวกันและการสร้างซ้ำกระทบ performance ให้กำหนด `meta.scenePersistence: "lesson"` แล้วสร้างฉากคงที่ครั้งเดียว รีใช้/pool object และอัปเดตเฉพาะส่วน dynamic ใน `reset()` โดยยังต้องล้างทุกอย่างใน `dispose()` ค่าเริ่มต้นยังเป็นการล้าง World ทุก reset

เลือก Service ตามหน้าที่ดังนี้:

- `question` — โจทย์หลักที่ต้องอ่านค้าง ห้ามใช้ Top Message, Callout หรือ Text3D แทน
- `console` — Objective, ขั้นตอน และสถานะหลักที่ควรอ่านได้ตลอด
- `topMessage` — ประกาศสั้นที่ไม่ใช่โจทย์ เช่น เริ่มรอบหรือปลดล็อกเครื่องมือ
- `choice` — คำตอบหรือ action ที่ผู้เรียนต้องเลือก; ไม่ใช้ Control Menu เป็นคำตอบ
- `gizmo` — ข้อความ/ค่า/icon แบบ 2D ที่ติดตาม object หรือพิกัด World
- `feedback` — สถานะสั้นแบบไม่บล็อก; Quiz ห้ามใช้เฉลยถูก/ผิดระหว่างทำ
- `dialog` — ข้อความสำคัญหรือการยืนยันที่ต้องบล็อก interaction ชั่วคราว
- `control` — ปุ่ม utility ของกิจกรรม รองรับ `top-right`, `middle-right`, `bottom-right`
- Control ของบทเรียนถูก runtime ซ่อนระหว่างขั้นสอนทุกบทโดยอัตโนมัติ ช่วงนี้แสดงได้เฉพาะปุ่มข้ามการสอนของระบบ; Control จะกลับมาเมื่อเข้า Lab ขั้นสุดท้าย/การทดลองหรือ `student-quiz` และจะถูกซ่อนอีกครั้งเมื่อย้อนกลับไปขั้นสอน บทเรียนห้ามพยายามหลบกฎนี้ด้วย `handle.show()`
- `hint` — คำแนะนำผ่าน Mascot กลาง ห้ามสร้าง speech bubble หรือตัวละครซ้ำ
- `busy` — ปิด interaction ระหว่างรอ async task และต้องปิดใน `finally`
- `intro` — หน้าอ่าน/Interactive จาก URL ภายในหรือภายนอก; เว็บไซต์ปลายทางต้องอนุญาตให้ embed ด้วย iframe

วัตถุขนาดเล็กที่แตะยากสามารถกำหนด `hitArea`/`hitAreaOffset` และ `dragFromCenter` โดย hit area จะไม่ขยายโมเดลจริง เมื่อนำวัตถุออกจากฐานแล้วให้เรียก `handle.setHitArea(null)` และ `handle.setDragFromCenter(false)` หากต้องกลับไปใช้พื้นที่จับตามโมเดล

Topbar, Mode Badge, Quiz Badge, System Popup, Camera Controls, World Hint, Loading Screen, Mascot Character, Debug Area/Transform Editor และ Celebration VFX เป็น System-owned UI บทเรียนห้ามสร้างหรือควบคุมซ้ำ หากทีม Dev ต้องเปลี่ยนรูปลักษณ์ให้แก้ Setting ตาม path ใน UI Catalog รูปลักษณ์ 3D runtime ปัจจุบันเป็น Storybook UI สีน้ำตาล/ครีม โดยฉากฐานยังใช้ felt environment

## โครงสร้าง Meta

ตรวจ schema ที่ runtime และ Lesson 0 ก่อนสร้างทุกครั้ง โดยทั่วไปบทเรียน 3D ต้องมีข้อมูลต่อไปนี้:

- `worldType`
- `lessonId`
- `title`
- `category`
- `subcategory`
- `description`
- `keyResult`
- `background`
- `camera`
- `welcomeMessage`
- `tooltip`
- `defaultValue`
- `editSchema`
- `howto`
- `quiz`

Step ใน `howto` เพิ่ม `intro: { url, title?, label? }` ได้ หากต้องบังคับเปิดเนื้อหาเสริมอัตโนมัติ เมื่อผู้เรียนปิด Intro Runtime จะเลื่อนไป Step ถัดไป

อย่าคัดลอกค่า Lesson 0 โดยไม่สัมพันธ์กับบทเรียนใหม่ ทุกค่าใน meta ต้องมีผลจริงต่อเนื้อหาหรือ UX ของบทนั้น

## กฎ Teacher Tools

- ทุก key ใน `editSchema` ต้องมีค่าเริ่มต้นใน `defaultValue`
- key ใน `editSchema`, `defaultValue`, `reset` และ quiz data ต้องตรงกัน
- `reset` ต้องใช้ค่าปัจจุบันจาก `values` จริง
- ห้ามสร้างช่องแก้ไขที่เปลี่ยนค่าแล้วไม่เกิดผลบนฉาก
- ชนิด input, option, min, max และ step ต้องตรงกับรูปแบบที่ runtime ปัจจุบันรองรับ
- ทดสอบค่าต่ำสุด ค่าสูงสุด และค่ากลางอย่างน้อยอย่างละหนึ่งครั้ง

## กฎ Lab

- `howto.index` เริ่มจาก 0 และเรียงต่อกัน
- ขั้นอธิบายหรือสาธิตใช้ `type: "sequence"` และยังไม่เปิดให้นักเรียนลาก
- แต่ละ step ต้องมีการเปลี่ยนแปลงที่มองเห็นและสัมพันธ์กับข้อความ เช่น focus, guideline, pulse หรือ animation สาธิต
- ห้ามใช้ animation ที่ขัดกับสาระหรือเคลื่อนวัตถุโดยไม่มีความหมาย
- ขั้นสุดท้ายใช้ `type: "freestyle"` จึงเปิด interactive ให้นักเรียนทดลองเอง
- ก่อนเปิด freestyle ให้นำวัตถุกลับตำแหน่งพร้อมใช้และล้าง placement จากการสาธิต
- สามารถใช้ drag cue ในครั้งแรกและต้องซ่อนเมื่อผู้เรียนเริ่ม interactive
- Lab สามารถแสดงสถานะถูก สีเขียว เสียง success, toast และ feedback ได้

## กฎ Quiz

- ใช้คลังคำถามตามที่ครูกำหนด ถ้าไม่ได้กำหนดให้สร้างอย่างน้อย 10 ข้อเพื่อให้ระบบสุ่ม
- Lesson source เก็บ `meta.quiz` แบบอ่านและแก้ได้ตามปกติ; ขั้น production เป็นหน้าที่ของเจ้าของระบบที่ compile ไป `productionChapters` ไม่ใช่สิ่งที่ AI ภายนอกเข้ารหัสเอง
- data ของทุกคำถามต้องใช้ key ที่ตรงกับ `defaultValue`
- ทุกข้อเริ่มจาก state ใหม่ ห้ามใช้ placement หรือคำตอบของข้อก่อนหน้า
- วัตถุต้อง interactive ได้ทันทีใน `student-quiz` ไม่ต้องรอ howto
- การลากนับ objective action ผ่าน runtime แต่ action นี้อย่างเดียวไม่ใช่คำตอบและไม่ปลดปุ่มไปต่อ
- ทุกครั้งที่ state คำตอบเปลี่ยน ต้องเรียก `context.quiz.answer(correct, details)` เพื่อเก็บคำตอบล่าสุดแบบ pending; Runtime บันทึกจริงเมื่อผู้เรียนกดยืนยันหรือไปข้อถัดไป
- หากผู้เรียนล้างคำตอบ ให้ส่ง `context.quiz.answer(false, { hasAnswer: false })` เพื่อปิดปุ่มไปต่อจนมีคำตอบใหม่
- ปุ่มไปข้อถัดไปเปิดหลังมีคำตอบจากการลงมือจริง ไม่ว่าคำตอบจะถูกหรือผิด
- ห้ามบังคับให้นักเรียนตอบถูกก่อนจึงไปต่อ
- ห้ามเฉลยหรือแสดง feedback ว่าถูก/ผิดระหว่างทำ Quiz
- ตรวจเงื่อนไขของโจทย์ ไม่ใช่เทียบกับคำตอบตัวอย่างค่าเดียว เช่น น้อยกว่า 4 ต้องยอมรับทุกค่าที่น้อยกว่า 4 ภายในขอบเขตกิจกรรม
- `details` ต้องอธิบายคำตอบได้เพียงพอสำหรับหน้าสรุปและ callback
- ตรวจว่าทุกโจทย์มีคำตอบที่เป็นไปได้ภายในจำนวนวัตถุที่ให้

## กฎ Interactive และ Drag/Drop

- เฉพาะวัตถุ interactive เท่านั้นที่ควรแสดง hover หรือข้อความว่าลากได้
- วัตถุต้องมีขนาดแตะง่ายบนมือถือและไม่ถูก UI บัง
- onDrop ต้องรองรับการวางเข้าเป้าหมาย การวางผิดพื้นที่ และการลากออกจากเป้าหมาย
- การวางผิดและไม่ได้รับการยอมรับต้องกลับตำแหน่งก่อนลาก
- การวางที่ยอมรับควร snap เข้าตำแหน่งชัดเจนและใช้ commit effect ของระบบ
- ถ้ามีหลายวัตถุ ให้เก็บ object-to-slot ด้วย Map และหา slot ว่าง ห้ามนำทุกชิ้นไปทับ slot ล่าสุด
- เมื่อนำวัตถุออก ต้องลบ placement คืน slot และส่งกลับตำแหน่งเริ่มต้นหรือจุดพักที่ถูกต้อง
- อย่าสร้าง VFX, Highlight, Selection Ring, Floating Marker หรือเสียงลากซ้ำกับที่ runtime มีอยู่แล้ว

## แนวทางจัดฉากและ Mobile

- ใช้แกน Y เป็นความสูง พื้นอยู่ใกล้ Y = 0
- วางเนื้อหาหลักให้อยู่ในขอบเขต world และ camera ของ runtime ปัจจุบัน
- เว้นด้านบนสำหรับ header/callout และด้านล่างสำหรับ console
- วัตถุสำคัญ พื้นที่เป้าหมาย และวัตถุเริ่มต้นต้องมองเห็นครบตั้งแต่เปิดบท
- ใช้สีแยกโจทย์ วัตถุ interactive และพื้นที่เป้าหมายให้ชัด
- ใช้ callout, targetFocus และ guideline เท่าที่จำเป็น ห้ามบังวัตถุด้านหลัง
- กล้องหมุนและ zoom แล้วความหมายของสัญลักษณ์ต้องไม่กลับด้านหรือสับสน
- ทดสอบอย่างน้อย desktop แนวนอนและ mobile แนวตั้ง

## Lifecycle และ Cleanup

- `this.someHelper()` เรียกได้เมื่อมี `someHelper() { ... }` อยู่ใน object เดียวกับที่ส่งให้ `PuzzleLesson.define(...)` เท่านั้น `this.*` ไม่ใช่ Runtime/Public API ห้ามคิดชื่อ helper แล้วเรียกโดยไม่เขียน implementation
- ก่อนส่งให้ค้นหา `this.` ทั้งไฟล์และเทียบชื่อที่ถูกเรียกกับ method ที่ประกาศ Validator ต้องไม่รายงาน `LESSON_HELPER_MISSING`
- `mount` ใช้เก็บ context และสร้าง state container เท่านั้น
- runtime จะล้าง world ก่อนเรียก `reset`; reset ต้องสร้างฉากจาก payload ปัจจุบันใหม่ทั้งหมด
- clear timer เดิมก่อนสร้าง timer ใหม่ทุกครั้งใน reset
- เก็บ timeout/interval ทุกตัวและ clear ทั้งใน reset และ dispose
- reset ต้องล้าง Map, array, placement, answer และ state จากรอบก่อน
- `onStep` ต้องหยุด animation และ cue จาก step ก่อนหน้า ก่อนเริ่ม step ใหม่
- `dispose` ต้องหยุด timer, drag cue และล้าง reference ของบทเรียน

## Workflow ที่ AI ต้องทำ

ขั้นตอน browser/runtime/mobile ด้านล่างเป็นเกณฑ์ตรวจในระบบปลายทาง ไม่ใช่เงื่อนไขที่ต้องทำให้ได้ใน repository อ้างอิงนี้ หากไม่มีเว็บทดสอบ ให้ส่งไฟล์พร้อมผล static และระบุรายการ runtime ที่ยังไม่ได้ทดสอบ ห้ามอ้างว่าผ่านแล้ว

1. อ่าน `README.md`, Master และ source of truth ให้ครบ พร้อมยืนยันว่าเป็น lesson-only หรือมีงานระบบ/asset ที่ผู้ใช้อนุญาต
2. ตรวจ git status และรักษาไฟล์ที่ผู้ใช้แก้ไว้
3. แปลงข้อความครูเป็น values, editable fields, steps, interactions และ quiz conditions
4. ตรวจความสมเหตุสมผลของโจทย์ทุกแบบ โดยเฉพาะช่วงคำตอบและกรณีศูนย์
5. สร้าง HTML ฉบับเต็มสำหรับ path ใต้ `Project/interactive/chapters/`; ใน `git/DEVGEN` ให้ส่งทั้งไฟล์ใน Chat ห้ามเขียนกลับ Repository
6. ตรวจ HTML/JavaScript syntax ค้นหาการใช้ API ที่ไม่มีใน runtime และยืนยันว่าทุก `this.someHelper()` มี `someHelper()` ประกาศจริงใน lesson definition
7. เปิดผ่านหน้า demo และ EduSDK ด้วย relative path จริง
8. ทดสอบ `teacher-lab`, `student-lab` และ `student-quiz`
9. ทดสอบ Teacher Tools ว่าทุกช่องเปลี่ยนฉากจริง
10. ทดสอบ Quiz ทั้งคำตอบถูก ผิด ข้าม และไปข้อถัดไปโดยไม่ต้องตอบถูก
11. ทดสอบวาง object หลายชิ้น ลากออก และวางกลับ
12. ทดสอบ desktop และ mobile/แนวตั้ง
13. ตรวจ browser console ว่าไม่มี error
14. ปิด เปิดใหม่ และ reset เพื่อดูว่าไม่มี timer หรือ state ค้าง

หากรายละเอียดจากครูไม่ครบ ให้เลือกค่าเริ่มต้นที่เหมาะสมจาก pattern ของ Lesson 0 และลงมือให้เสร็จ หลีกเลี่ยงการถามศัพท์เทคนิค ถ้ากติกาการตรวจคำตอบกำกวมจนสร้างความหมายต่างกันจริง จึงถามด้วยภาษาธรรมดาไม่เกิน 3 ข้อ

## การนำไฟล์เข้าสู่ระบบสำหรับ Admin

1. ตรวจว่าไฟล์อยู่ใต้ `Project/interactive/chapters/`
2. เพิ่มหรือเลือกบทเรียนใน CMS ของเว็บหลัก
3. ให้ `lessonData.Id` ตรงกับ `id` และ `meta.lessonId` ในไฟล์
4. ส่ง path แบบ relative และ origin เดียวกัน เช่น `./interactive/chapters/lesson1.html`
5. CMS สามารถส่งชื่อ วิชา และหัวข้อย่อยมาแทนค่า meta ได้; หากไม่ส่งหรือเป็นค่าว่าง Runtime จะใช้ `meta.title`, `meta.category`, `meta.subcategory` และสามารถบังคับใช้ meta ด้วย `overrideTitleName`
6. เพิ่ม version ของบทเรียนเมื่อเปลี่ยน logic หรือโครงสร้างคำตอบ

รูปแบบ `lessonData` และ callback ต้องอ่านจาก `Project/interactive/eduSdk.js` ปัจจุบันโดยตรง ไม่คัดลอก object schema มาตรึงไว้ที่นี่ เพื่อไม่ให้ Master ล้าสมัยโดยไม่จำเป็น

## Checklist ก่อนส่งมอบ

- [ ] ไฟล์เป็น HTML UTF-8 และอยู่ใน chapters
- [ ] มี `script[data-lesson-app]` และ `PuzzleLesson.define` อย่างละหนึ่งครั้ง
- [ ] id, lessonId, ชื่อไฟล์ และ CMS ID สอดคล้องกัน
- [ ] meta.title, meta.category และ meta.subcategory มีข้อความครบและตรงกับเนื้อหา
- [ ] ใช้เฉพาะ public API ปัจจุบัน
- [ ] Teacher Tools ทุกช่องเปลี่ยนฉากได้จริง
- [ ] sequence ยัง interactive ไม่ได้ และ freestyle interactive ได้
- [ ] Quiz เปิดปุ่มไปต่อหลัง objective action ครั้งแรก
- [ ] Quiz ไปต่อได้ทั้งเมื่อถูก ผิด หรือไม่ได้ตอบครบ
- [ ] Quiz ไม่เฉลยระหว่างทำและสรุปผลถูกต้อง
- [ ] วัตถุหลายชิ้นไม่ทับ slot และลากกลับได้
- [ ] reset/open/close ไม่มี state หรือ timer ค้าง
- [ ] desktop และ mobile มองเห็น objective ครบ
- [ ] ปุ่ม Back ของ UI มุมซ้ายบนกดได้ทั้งระหว่าง Loading และหลังเข้าบทเรียน โดยปิด lesson overlay และกลับหน้า Host
- [ ] browser console ไม่มี error

## ข้อผิดพลาดที่พบบ่อย

| อาการ | จุดที่ควรตรวจ |
|---|---|
| ไม่พบ `script[data-lesson-app]` | attribute ของ script, จำนวน script และโครง HTML |
| ไม่พบ `mount(context)` | lifecycle ภายใน `PuzzleLesson.define` |
| ฉากว่าง | `reset`, public world API และ browser console |
| Teacher Tools เปลี่ยนแล้วฉากไม่เปลี่ยน | key ระหว่าง defaultValue, editSchema และ reset |
| Quiz ตรวจคำตอบที่ถูกเป็นผิด | condition ถูกเขียนเป็นค่าตายตัวแทน state จริง |
| ต้องตอบถูกจึงไปต่อได้ | objective action หรือปุ่มต่อถูกผูกกับ correct |
| กล่องไปรวมตำแหน่งเดียว | Map ของ object-to-slot และการหา slot ว่าง |
| ลากออกจากคำตอบไม่ได้ | การลบ placement, คืน slot และ start position |
| ปุ่ม Quiz ไม่แสดง | action ที่ไม่ใช่ drag ไม่เรียก objectiveAction |
| ข้อใหม่มี state เดิม | reset ไม่ล้าง Map, array, answer หรือ timer |
| มือถือมองไม่เห็นเป้าหมาย | camera framing, ขอบเขต world และพื้นที่ที่ console บัง |
| เครื่องทำงานแต่ deploy ไม่ได้ | relative path, ตัวพิมพ์เล็ก/ใหญ่, origin และ asset ที่ไม่มีจริง |

## รูปแบบรายงานเมื่อ AI ทำเสร็จ

- path ของไฟล์บทเรียนที่สร้างหรือแก้
- สรุปกิจกรรมและค่าที่ครูปรับได้
- สรุปเงื่อนไขตรวจคำตอบ
- โหมดและ viewport ที่ทดสอบ
- ผล syntax check และ browser console
- ข้อจำกัดที่ยังเหลืออยู่ตามจริง; ถ้าไม่มีให้ระบุว่าพร้อมเชื่อมผ่าน CMS





