# Changelog

## 2026-10-05 — 0.5.0 Current Runtime Snapshot and Quiz Production Rules

- sync runtime/settings/UI snapshot และตัวอย่างบทเรียนที่เปลี่ยนตั้งแต่ 0.4.0; เพิ่มตัวอย่าง `ep12/lesson1` และ `ep14/lesson3` พร้อมดัชนี
- เพิ่ม source อ้างอิงของ operator prefab, Quiz result/protection และ Mascot modules ที่ `main-world.js` รุ่นปัจจุบัน import; ชุดนี้ยังคงไม่รวม WASM, key, vendor หรือ asset binary และไม่ใช่เว็บพร้อม deploy
- อธิบาย `lessonData.preview` สำหรับครู, pending answer ของ Quiz, `hasAnswer: false` และจังหวะกดยืนยัน/ให้คะแนนตาม runtime จริง
- ระบุ workflow production: เจ้าของคอมไพล์ RAW Lesson Package ไป `productionChapters` โดยไม่เปลี่ยนข้อกำหนด read-only ของ AI ภายนอก
- เพิ่ม Handle API `setHighlighted`, `setWash`, `setOpacity` ใน Public API และ types; ปรับ UI Catalog และ `git/CHECK` ตาม flow ใหม่; ตรวจ manifest hash หลัง sync

## 2026-09-30 — 0.4.0 Runtime 3.4.0 Guided Steps and Shared Operator Prefab

- เพิ่ม Step gate ด้วย `howto[].requiresCompletion` และ `context.ui.steps.setNextEnabled()` พร้อมปิดการข้ามช่วงที่มีขั้นบังคับ
- ระบุ `howto[].option` เป็น contract ของบทพูด Mascot รายขั้น รองรับ `instruction`, `hint` และ `feedback`
- เพิ่ม `world.addLineRender({ points, closed })` สำหรับเส้นหลายช่วงและกรอบ polygon พร้อมคำแนะนำให้ยกเส้นเหนือพื้นเพื่อเลี่ยง z-fighting
- เพิ่ม `world.camera.focus({ position, normal })` สำหรับ eased transition ที่คง zoom และยกเลิกได้เมื่อผู้เรียนควบคุมกล้อง
- เพิ่ม `meta.editRestartStep` เพื่อให้ Teacher Tools กลับเข้า Step ที่กำหนดหลังปรับโจทย์
- ลงทะเบียน `context.ui.guiAnswer` และแนวทางแสดงหลัง `onDrop` เมื่อ realtime ระหว่างลากทำให้ panel กระพริบ
- บันทึก lifecycle ของ ClickMe ให้จบ cue เมื่อกิจกรรมครบ เพื่อไม่ให้มือชี้ต่อหลังคำตอบสำเร็จ
- ปรับ prefab `world.addOperatorSign()` ให้ลดเฉพาะความหนาแกน Y ผ่าน `mainWorldSetting.lessonGraphics.operatorBase.heightScale` โดยคง footprint ของเครื่องหมาย
- sync README, Master, Public API, GUI Reference, UI Catalog, types, capabilities, contract/schema, template, runtime/settings snapshots และ source manifest จาก owner project

## 2026-09-25 — Runtime 3.3.0 Free-form Procedural Geometry

- เพิ่ม `polygon`, `polygon-flat`, `polyhedron`, `lathe` และ `spline-tube` สำหรับสร้างโมเดลจาก vertices, holes, faces, profile และ path ขณะ runtime
- เพิ่ม alias ชื่อรูปทรงที่ใช้บ่อย เช่น `cube`, `triangle`, `pie-slice`, `donut`, `extrude-polygon` และ `path-tube`
- เพิ่ม `geometry.orientation` เพื่อวางรูปทรงแบนบนระนาบ `front`, `ground`/`xz` หรือ `side`/`yz` โดยไม่ต้องคำนวณ rotation เอง
- ลงทะเบียน `arrow-flat` ที่ runtime รองรับอยู่แล้วให้ครบใน capabilities, types, validator และเอกสาร
- ปรับ validator ให้ไม่ตีความข้อความข้อมูลทั่วไปที่ใช้ property `shape` เป็น Procedural Geometry

## 2026-09-24 — 0.3.0 World Option Service

- เพิ่ม `context.ui.worldOption` สำหรับ popup ตัวเลือกแนวตั้งที่ติดตาม object 3D พร้อม title, message, disabled state และ event `onSelect`
- เพิ่ม `mainWorldSetting.ui.worldOption` เพื่อควบคุมรูปลักษณ์ส่วนกลางและ lifecycle scope แบบเดียวกับ GUI Service อื่น
- เพิ่มแมว FBX จาก Standard Asset Library ใน `ep0/lesson1` เพื่อทดสอบคำสั่งหมุน ขยับซ้าย และขยับขวา
- ปรับ animation เปิด World Option ให้คำนวณตำแหน่งเกาะวัตถุเสร็จก่อนแสดงผล พร้อม motion ของ panel และรายการคำสั่งที่นุ่มขึ้น
- เพิ่มการปิด World Option เมื่อกดพื้นที่ว่างของฉาก โดยยังรองรับ `dismissible: false` สำหรับกิจกรรมที่บังคับให้เลือกคำสั่ง
- กำหนดกฎกลางให้วัตถุ 3D ที่ `clickable` หรือ `draggable` แสดง Hover สีขาวและวง Hover แม้ตั้ง `selectionFeedback: false`; ค่านี้ใช้ซ่อนเฉพาะสถานะ Select หลังคลิก
- sync runtime, CSS, SDK, types, capabilities, GUI Catalog และ regression test

## 2026-09-24 — 0.2.0 Intro Service and Embedded Lesson Options

- เพิ่ม `context.ui.intro` สำหรับเปิดเนื้อหาเสริมจาก URL ภายใน/ภายนอกใน iframe เกือบเต็มหน้าจอ พร้อมบล็อก input ของบทเรียนหลัก
- เพิ่ม `howto[].intro` สำหรับ Step ที่เปิด Intro อัตโนมัติและไป Step ถัดไปเมื่อปิด โดยการเปิดจาก `ui.control` จะไม่เปลี่ยน Step
- เพิ่ม `lessonData.fullScreen` เป็นตำแหน่งเดียวสำหรับกำหนด Fullscreen/Preview โดยไม่เพิ่ม argument ให้ `openLesson`; ค่าเริ่มต้นยังเป็น `true`
- เพิ่ม click options ให้ `world.addOperatorSign()` และเพิ่ม `ep0/lesson1` เป็นตัวอย่าง Intro/Operator interaction
- sync runtime, CSS, SDK, types, capabilities, contract, UI Catalog, examples และ source manifest จาก owner project

## 2026-09-18 — 0.1.10 NPC Jump-only Success

- ตัด scale animation ออกจากท่าดีใจเมื่อตอบถูกใน `ep3/lesson3`
- คืน NPC เป็นสเกลปกติก่อนกระโดด ใช้เฉพาะการขยับแกน Y และ white commit flash
- เริ่ม idle scale แกน Y อีกครั้งหลัง NPC ลงพื้นเรียบร้อย
- sync lesson snapshot และ source manifest จาก owner project

## 2026-09-18 — 0.1.9 Preview Placement and Rotation Stability

- แยกผลไม้ที่กำลังเติมออกจากผลไม้เดิมในตะกร้า และวางเป็นแถวภายนอกห่าง 2.45 หน่วย
- เลือกทิศวาง preview ออกจากศูนย์กลางของกลุ่ม เพื่อไม่ให้ชนตะกร้าแถวอื่น
- ปิด spawn scale สำหรับผลไม้ preview และแก้ runtime ไม่ให้รีเซ็ต `rotation.z` เมื่อ shared animation จบ
- sync lesson/runtime snapshots และ source manifest จาก owner project

## 2026-09-18 — 0.1.8 Incoming Fruit Preview

- ใช้ visual state สีขาวโปร่ง 40% แบบไม่มี texture กับผลไม้ที่กำลังเพิ่มเข้ามาใน `ep3/lesson3`
- ทำให้ผลไม้ที่นำออกและผลไม้ที่กำลังเพิ่มใช้ภาษาภาพเดียวกัน โดยแยกความหมายด้วยตำแหน่งและข้อความกำกับ
- sync lesson snapshot และ source manifest จาก owner project

## 2026-09-18 — 0.1.7 Translucent Disabled Models

- เพิ่ม `opacity`, `textureEnabled` และ `depthWrite` ให้ material options ของ Standard Library model ใน runtime
- เปลี่ยนผลไม้ที่นำออกใน `ep3/lesson3` เป็นสีขาวโปร่ง 40% และปิด texture เพื่อสื่อสถานะ disabled ชัดเจน
- อัปเดต Public API, types, capabilities, lesson/runtime snapshots และ source manifest

## 2026-09-18 — 0.1.6 Removed Fruit Contrast

- ทำผลไม้ที่นำออกใน `ep3/lesson3` ให้เกือบดำสนิทและปิด texture light เพื่อแยกจากผลไม้ปกติอย่างชัดเจน
- ย้ายแถวผลไม้ที่คัดออกให้ห่างจากตะกร้ามากขึ้น ป้องกันการตีความว่ายังอยู่ในกลุ่มเดิม
- sync lesson snapshot และ source manifest จาก owner project

## 2026-09-18 — 0.1.5 NPC Y-axis Idle Bounce

- ปรับ idle ของ NPC ใน `ep3/lesson3` ให้ล็อก scale แกน X/Z ที่ 1 และยืด–หดช้า ๆ เฉพาะแกน Y
- แยก idle squash/stretch ออกจากท่ากระโดดดีใจเมื่อผู้เรียนตอบถูก
- sync lesson snapshot และ source manifest จาก owner project

## 2026-09-18 — 0.1.4 EP3 Lesson 3 Motion and Scenario Update

- แก้ Feedback และ scene entrance ที่เล่นซ้ำสองรอบ โดยให้ service motion และ runtime เป็นเจ้าของแอนิเมชันอย่างละจุด
- เพิ่ม Lab success reaction: NPC กระโดดพร้อม white commit flash และพื้นที่โจทย์เปลี่ยนเป็นสีเขียว โดย Quiz ยังไม่เปิดเผยว่าคำตอบถูกหรือผิด
- เพิ่ม NPC idle scale แบบช้า และคืน pose ได้ถูกต้องเมื่อเปลี่ยนขั้นหรือเปลี่ยนคำตอบ
- เพิ่มโจทย์บวก ลบ และหารแบบตรงไปตรงมา พร้อม layout แบบสองกอง, นำออก และแบ่งเท่า ๆ กัน รวมคลัง Quiz เป็น 18 ข้อ
- sync `ep3/lesson3`, runtime CSS และ source manifest จาก owner project

## 2026-09-18 — 0.1.3 Owner UpdateLesson Workflow

- บันทึก workflow ฝั่งเจ้าของสำหรับนำ Lesson HTML ภายนอกเข้าบทเรียนเดิมผ่าน `AI/UpdateLesson`
- กำหนดให้รู้ชื่อบทเรียน, `epXX/lessonXX` ปลายทาง และไฟล์ HTML ต้นทางก่อนเริ่ม ห้ามเดาข้อมูลที่ขาด
- รักษา `git/DEVGEN` เป็น GitHub Chat workflow แบบ read-only เช่นเดิม

## 2026-09-18 — 0.1.2 Persistent Lesson Scene

- เพิ่ม `meta.scenePersistence: "lesson"` แบบ opt-in เพื่อคงฉากหลักและรีใช้ object ระหว่างโจทย์ ลดการกระตุกจากการสร้าง World ใหม่ทั้งฉาก
- เพิ่ม `CalloutHandle.setText()` สำหรับอัปเดตข้อความบน Callout เดิมโดยไม่สร้าง object ใหม่
- ปรับ `ep3/lesson3` ให้สร้าง environment, รถ, รั้ว, zone และตะกร้า pool เพียงครั้งเดียว เปลี่ยนเฉพาะผลไม้กับ NPC ตามโจทย์
- ทำผลไม้ที่คัดออกให้ต่างชัดด้วยสีเกือบดำ ลดแสง texture ลดขนาด และวางเอียง
- sync runtime source, lesson snapshot, Public API, types, capabilities, contract, schema และ source manifest

## 2026-09-18 — 0.1.1 Runtime UI และ World GUI System

- sync source snapshot หลังรวม Storybook UI สีน้ำตาล/ครีม โดยคง felt environment เป็นฉากพื้นฐาน และล็อก Question Panel ไม่ให้ทับ Header/Panel
- เพิ่ม `context.ui.worldGuiSystem` สำหรับป้ายขนาดเล็กที่ยึดกับพิกัดหรือโมเดล พร้อม Debug Area และ Transform Editor สำหรับทีม Dev
- ย้ายกฎ Control เป็น phase policy กลาง: ขั้นสอนแสดงเฉพาะปุ่มข้ามการสอน ส่วน Control ของบทเรียนแสดงใน Lab ขั้นสุดท้าย/การทดลองหรือ Quiz และซ่อนเมื่อย้อนกลับ
- อัปเดต Public API, UI Catalog, types, capabilities, contract, testing และ source manifest ให้ตรงกับ runtime
- ซ่อม snapshot ตัวอย่าง `ep1/lesson1–3` ที่ drift จาก source หลักและยืนยัน SHA-256 ใหม่ทั้ง manifest

## 2026-09-17 — Asset Catalog 1.2.4

- เพิ่ม Standard Asset โมเดล 136 รายการจากทีม Art ครอบคลุมสัตว์ ตัวละคร ห้องเรียน ฉาก อาหาร ผลไม้ คณิตศาสตร์ ธรรมชาติ รางวัล วิทยาศาสตร์ และของเล่น
- เก็บ FBX ต้นฉบับพร้อม texture dependency ครบชุด และตั้ง Asset ID แบบ lowercase kebab-case โดยไม่ทับ ID เดิม
- sync runtime catalog, portable catalogs, capabilities, source manifest และ regression test

## 2026-09-14 — Asset Catalog 1.2.3

- เพิ่ม Standard Asset `food/pizza-slice`, `environment/wooden-plate` และ `environment/picnic-blanket`
- sync runtime catalog, portable SDK catalog, capabilities และ source manifest
- ปรับ dependency path ภายใน FBX ให้ texture โหลดผ่าน browser ได้ครบถ้วน

## 2026-09-11 — 0.1.0 Procedural Geometry First

- เพิ่ม Public Procedural Geometry เป็น 32 รูปทรง พร้อมตัวเลือกมุม จำนวนด้าน รัศมีด้านใน และความละเอียด
- เพิ่ม `sector`/`ring-sector` สำหรับแบ่งเค้ก พิซซ่า เศษส่วน และกราฟวงกลมอย่างเท่ากันโดยไม่ใช้โมเดลใหม่
- เพิ่ม prism, pyramid, frustum, capsule, polyhedra และรูปทรงตกแต่งสำหรับทำ lesson prototype ให้จบจาก HTML ไฟล์เดียว
- เพิ่มกฎ Procedural First: AI ภายนอกต้องลองประกอบจาก `addPrimitive`/`addGroup` ก่อนขอ Asset หรือติดต่อทีม Dev
- อัปเดต SDK 3.0.0, Lesson Contract 1.3.0, types, capabilities, validator และ regression tests

## 2026-09-08 — 0.0.9 เพิ่ม CHECK, FEEDBACK และ IDEA

- `--CHECK` ตรวจ Lesson HTML และรายงาน Passed/Warning/Error/Fix/Verdict
- `--FEEDBACK` วิเคราะห์งานล่าสุดและจัดลำดับแนวทางพัฒนา interactive
- `--IDEA <หัวข้อ>` เสนอแนวคิดเริ่มต้น 5 แบบก่อนสร้างจริง
- เพิ่มคู่มือทั้งใน `AI/*.md` และ public entrypoint ภายใต้ `git/`

## 2026-09-08 — 0.0.8 เพิ่ม DEFINE MAP

- เพิ่มเมนู `--DEFINE` สำหรับตั้งชื่อพื้นที่ วัตถุ GUI และ logic ของบทเรียน
- เพิ่ม `git/DEFINE` ซึ่งวิเคราะห์ HTML ล่าสุดใน Chat โดยไม่แก้ไฟล์
- ชื่อ `[Defined Name]` ใช้อ้างอิงจุดแก้ในข้อความถัดไปและ refresh ได้เมื่อโครงสร้างเปลี่ยน

## 2026-09-08 — 0.0.7 ส่งบทเรียนผ่าน Chat

- กำหนด `git/DEVGEN` เป็น GitHub read-only workflow
- `--CREATE` ส่งชื่อ path และ Lesson Package HTML ฉบับเต็มใน code block สำหรับ Copy
- ห้ามพยายามเขียนไฟล์, commit, branch, pull request หรือ push กลับ Repository
- หากไม่มี validator ให้ทำ static self-review และรายงานตามจริงแทนการหยุดที่ `403`

## 2026-09-07 — 0.0.6 แยก Connection ออกจาก Lesson

- คำสั่ง Introduction ใช้เพียง Repository และ `git/DEVGEN`
- ย้าย `[ Lesson ]` ไปถามเมื่อเริ่ม `--CREATE` หรือแสดงผ่าน `--TEMPLATE`
- คำตอบแรกยืนยันโครงสร้างและพร้อมรับคำสั่ง โดยยังไม่กำหนดไฟล์ปลายทาง

## 2026-09-07 — 0.0.5 เพิ่ม DEVGEN MENU

- คำตอบแรกของ session แสดง `--CREATE`, `--TEMPLATE`, `--TOOLS` และ `--HELP`
- `--TEMPLATE` ส่ง Brief แบบ copy ได้ ส่วน `--TOOLS` และ `--HELP` อ้างจากไฟล์จริง
- ข้อความทั่วไปที่ไม่มีชื่อเมนูถูกตีความเป็น `--CREATE` โดยอัตโนมัติ

## 2026-09-07 — 0.0.4 เพิ่ม DEVGEN สำหรับทีมภายนอก

- เพิ่ม `git/DEVGEN` สำหรับตรวจ Repository, อ่าน Master และถาม Brief ก่อนสร้าง
- เพิ่ม `DEVGEN` ที่ root เป็น entrypoint สำรองเพื่อช่วยให้ค้นพบคำสั่งได้ง่าย
- ลด START_PROMPT ภายนอกเหลือ Repository, Introduction และ Lesson path

## 2026-09-07 — 0.0.3 แก้ปุ่ม Back ของ UI บนมือถือ

- ปุ่ม Back มุมซ้ายบนรับการแตะตั้งแต่ `pointerdown` จึงไม่ค้างเมื่อ browser ยกเลิก `click` ระหว่าง gesture
- กัน event `click` ที่ตามหลัง touch ไม่ให้ส่งคำสั่งปิดซ้ำ
- ขยายพื้นที่แตะของปุ่มโดยไม่เปลี่ยนขนาดที่มองเห็น และใช้ได้ทั้งหน้า Loading กับหน้าบทเรียน

## 2026-09-07 — 0.0.2 ตรวจ helper ที่ไม่มีจริง

- เพิ่ม `LESSON_HELPER_MISSING` ใน validator เพื่อจับ `this.someHelper()` ที่ไม่มี method ใน lesson definition ก่อนเปิด runtime
- ระบุใน START_PROMPT, README, Master, contract, testing และ template ว่า `this.*` เป็น helper ของบทเรียน ไม่ใช่ Public API
- ปรับ runtime failure popup ให้ระบุชื่อ helper ที่ขาดและแนวทางซ่อมโดยตรง
- sync source snapshot และ hash กับ working tree ล่าสุด

## 2026-09-07 — รวมชุดสร้างบทเรียนภายนอกเป็น Github

- รวมคู่มือ, Master, SDK, GUI examples, contract/schema, types, template, validator และ source snapshot ไว้ที่ root ของ repo
- ย้าย START_PROMPT ไปเป็นไฟล์ข้อความนอก repo ที่ผู้มอบหมายส่งแยก ไม่เผยแพร่พร้อม source
- รวม workflow CREATE/REPAIR, self-review, error-report และการคืน HTML ฉบับเต็มจากชุด authoring เดิม
- ใช้ README เป็นจุดเริ่มเดียว รวมวิธีมอบหมายและ sync จึงลบคู่มือคน/คู่มืออัปโหลดที่ซ้ำกัน
- ลบชุด authoring เดิมจากโปรเจกต์เจ้าของและปรับเอกสารภายในให้ชี้มาชุด Github
- เก็บ source สำหรับอ่านและ static checks ไม่รวม plugin หรือ asset binary; runtime test ใช้ระบบปลายทาง

Source snapshot ระบุที่มาและ hash ใน SOURCE_MANIFEST.json
