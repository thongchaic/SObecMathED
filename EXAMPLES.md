# แผนที่บทเรียนและตัวอย่าง GUI

ลิงก์ทั้งหมดชี้ไป source snapshot ที่คัดจากโปรเจกต์หลักมาไว้ใน repository นี้ ดัชนี [examples.json](examples.json) ใช้ path จาก repository root พร้อมชื่อและ API ที่ค้นพบจาก source; เป็น search hint ไม่ใช่ผลรับรองว่าบทเรียนนั้นผ่านการทดสอบหรือทุก pattern ควรคัดลอก

ไฟล์สื่อและ plugin ไม่รวมใน snapshot ตัวอย่างใช้เพื่ออ่านโครงสร้าง/logic ไม่ใช่เปิดเล่นตรงจาก repository นี้

## เลือกตัวอย่างตามกิจกรรม

| ไฟล์ | สิ่งที่ควรศึกษา |
|---|---|
| [lesson0.html](Project/interactive/chapters/lesson0.html) | ตัวอย่างหลัก: lifecycle, เปรียบเทียบจำนวน, drag/drop, Lab, Quiz และ cleanup |
| [LESSON_OUTPUT_TEMPLATE.html](LESSON_OUTPUT_TEMPLATE.html) | โครง HTML หนึ่งไฟล์ พร้อมกิจกรรมลากกล่องพื้นฐาน เริ่มบทใหม่จากโครงนี้แล้วแทนเนื้อหาจริง |
| [ep0/lesson1.html](Project/interactive/chapters/ep0/lesson1.html) | ทดสอบ Intro Service, Operator Sign แบบ clickable และ World Option บนแมว FBX จาก Catalog |
| [lesson1.html](Project/interactive/chapters/lesson1.html) | บวก/ลบในสวนผลไม้ และการคำนวณจาก state; UI ในตัวอย่างเดิมต้องเทียบกับ GUI Service ปัจจุบันก่อนนำมาใช้ |
| [lesson-library-demo.html](Project/interactive/chapters/lesson-library-demo.html) | สำรวจการใช้ Standard Asset Library; ตรวจ Asset ID กับ catalog จริงอีกครั้ง |
| [ep1/lesson1.html](Project/interactive/chapters/ep1/lesson1.html) | สัญลักษณ์ วงเล็บ และลำดับการดำเนินการ |
| [ep1/lesson2.html](Project/interactive/chapters/ep1/lesson2.html) | เปรียบเทียบจำนวนด้วยแอปเปิล, target slot, Callout และ Control |
| [ep1/lesson3.html](Project/interactive/chapters/ep1/lesson3.html) | เซต/สมาชิก/สับเซต, ลากจัดกลุ่ม และ Callout ที่เปิด Insight |
| [ep10/lesson1.html](Project/interactive/chapters/ep10/lesson1.html) | เลขยกกำลังผ่านการแตกตัว, state หลายรอบ, Gizmo และ Control |
| [ep10/lesson2.html](Project/interactive/chapters/ep10/lesson2.html) | สมบัติเลขยกกำลัง, ซ้อนถาด, Gizmo เลขชี้กำลัง และข้อความบนพื้น |
| [ep10/lesson3.html](Project/interactive/chapters/ep10/lesson3.html) | แถว → แผ่น → ก้อน, การแสดงกำลังสอง/กำลังสาม และการแยก/รวมรูป |
| [ep12/lesson1.html](Project/interactive/chapters/ep12/lesson1.html) | แบบรูป: สังเกตกฎ เลือกคำอธิบาย และต่อพจน์ถัดไปด้วยบล็อก procedural; อ่าน Lab/Quiz และ state แยกกัน |
| [ep14/lesson3.html](Project/interactive/chapters/ep14/lesson3.html) | พื้นที่ผิว: คลี่รูปทรง 3D เป็นแผ่น 2D, แยกกลุ่มหน้าคู่ตรงข้าม และใช้ Callout/Insight; ภาพประกอบจริงไม่รวมในชุดอ้างอิง |
| [leesonExternal.html](Project/interactive/chapters/leesonExternal.html) | HTML อิสระอีกเส้นทางของ SDK ชื่อไฟล์สะกดตามต้นฉบับ ไม่ใช้เป็น template ของ Lesson Package |

ตัวอย่างอาจมีข้อยกเว้นการสอนหรือ pattern เก่า ให้ยึด Master และ public API ปัจจุบัน หากบทใหม่จำเป็นต้องโต้ตอบระหว่าง sequence ให้ผู้มอบหมายกำหนดข้อยกเว้นชัดเจน ไม่คัดลอกข้อยกเว้นโดยอัตโนมัติ

## โครงสร้างที่ AI ต้องเข้าใจ

```text
HTML shell
└── script[data-lesson-app]
    └── PuzzleLesson.define
        ├── id / version
        ├── meta
        │   ├── lessonId / title / category / subcategory
        │   ├── description / keyResult / camera / background
        │   ├── defaultValue ↔ editSchema ↔ quiz[].data
        │   ├── howto: sequence → freestyle
        │   └── quiz: question + data
        ├── mount(context): เก็บ context และ state container
        ├── reset(payload): สร้างฉากใหม่จาก values/mode/question
        ├── onStep(index, step): หยุด cue เก่าและกำหนด interaction
        ├── helper: คำนวณคำตอบจาก state หลังผู้เรียนลงมือ
        └── dispose(): หยุด timer/animation และล้าง reference
```

อ่าน template เป็นโค้ดเต็มแทนการแปลงแผนภาพนี้เป็น API เอง Runtime ล้าง world ก่อน reset แต่ lesson ต้องล้าง timer/Map/array ของตนเอง ไม่บันทึกคำตอบ Quiz ระหว่างเตรียมฉาก

## ตัวอย่าง GUI Service ครบตามบริการที่เปิดให้ lesson ใช้

คู่มือ [GUI_SERVICE_REFERENCE.md](sdk/GUI_SERVICE_REFERENCE.md) มีโค้ดตัวอย่างแต่ละบริการ ไม่ใช่แค่รายชื่อ อ่านตัวอย่างพร้อม [UI Catalog](sdk/UI_CATALOG.md) เพื่อแยกสิ่งที่ lesson เรียกได้ออกจาก UI ที่ระบบเป็นเจ้าของ

| บริการ | ตัวอย่าง | ใช้เมื่อ |
|---|---|---|
| question | [Question](sdk/GUI_SERVICE_REFERENCE.md#question) | โจทย์หลักที่อ่านค้าง |
| console | [Console](sdk/GUI_SERVICE_REFERENCE.md#console) | เป้าหมาย ขั้นตอน และสถานะ |
| topMessage | [Top Message](sdk/GUI_SERVICE_REFERENCE.md#top-message) | ประกาศเหตุการณ์สั้น |
| choice | [Choice](sdk/GUI_SERVICE_REFERENCE.md#choice) | เลือกคำตอบ/หลายคำตอบและจัดการ selection |
| gizmo | [Gizmo](sdk/GUI_SERVICE_REFERENCE.md#gizmo) | label/value/icon ติดตามวัตถุ รวม segments เลขชี้กำลัง |
| feedback | [Feedback](sdk/GUI_SERVICE_REFERENCE.md#feedback) | ข้อความสถานะไม่บล็อก; ไม่เฉลย Quiz |
| dialog | [Dialog](sdk/GUI_SERVICE_REFERENCE.md#dialog) | ยืนยันหรือข้อความจำเป็นที่บล็อกชั่วคราว |
| insight | [Insight Dialog](sdk/GUI_SERVICE_REFERENCE.md#insight-dialog) | คำอธิบายเพิ่มเติมจากจุดที่กดได้ |
| intro | [Intro](sdk/GUI_SERVICE_REFERENCE.md#intro) | เนื้อหาเสริมจาก URL แบบบล็อกฉากหลัก |
| control | [Control](sdk/GUI_SERVICE_REFERENCE.md#control) | utility ของกิจกรรม สามตำแหน่งด้านขวา |
| hint | [Hint](sdk/GUI_SERVICE_REFERENCE.md#hint) | คำใบ้ผ่าน Mascot กลาง |
| busy | [Busy](sdk/GUI_SERVICE_REFERENCE.md#busy) | รอ async พร้อมปิดใน finally |

ตัวแปรใน snippet เช่น `apple`, `powerStack`, `prepareExperiment` และ `playAnimation` เป็น handle/function ของบทเรียนที่ต้องสร้างเอง ไม่ใช่ global API จาก runtime ตัวอย่าง Choice ที่บันทึก quiz.answer ต้องใช้ในโหมด Quiz; ใน Lab ให้เลือก feedback ตามกิจกรรมและเปิด interaction ตาม step

Insight รองรับเนื้อหาภายใน Dialog กลางตาม reference การรองรับนี้ไม่ได้อนุญาตให้ lesson สร้าง DOM/CSS หรือ overlay แยกของตนเอง

## GUI และเครื่องชี้นำใน world

อ่านโค้ดตัวอย่าง `world.addCallout` ใน GUI reference และ `world.addWorldCounter`, `world.addWorldGui`, `world.addTargetFocus`, `world.addGuideline`, `world.addOperatorSign` ใน [Public API Reference](sdk/LESSON_API_REFERENCE.md)

- Callout ชี้พื้นที่ด้วยเส้น และใส่ Insight ได้; Gizmo ติดตามวัตถุ/ค่า จึงใช้คนละหน้าที่
- World Counter แสดงจำนวนบนพื้นแบบ display-only; World GUI แสดงข้อความบนพื้นและกดเปิด Insight ได้เมื่อกำหนด `insight` หรือ `onClick`
- Target Focus/Guideline/Drag Cue ชี้ตำแหน่งหรือสาธิต ใช้ของกลางและหยุดเมื่อเปลี่ยนขั้น
- เครื่องหมายคำนวณ/เปรียบเทียบใช้ Operator Sign ไม่สร้างด้วย Text3D ทดแทน
- Topbar, Mode/Quiz Badge, Camera Controls, Loading, Mascot และ Celebration เป็น system-owned ดูการตั้งค่าใน UI Catalog ไม่สร้างซ้ำ

ตัวอย่างแต่ละ snippet มีไว้ประกอบบทเรียน ไม่ใช่หน้า demo รวมที่เปิดทุก UI พร้อมกัน ต้องเลือก scope `scene`, `step`, `question`, `lesson` หรือ `manual` ตามอายุการใช้งานและทดสอบ cleanup



