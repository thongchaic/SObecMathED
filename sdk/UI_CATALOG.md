# UI Catalog — ชื่อกลางของหน้าจอ Main World

เอกสารนี้เป็นพจนานุกรมชื่อ UI ของระบบ ใช้ชื่อในคอลัมน์ **ชื่อมาตรฐาน** เมื่อต้องสั่ง AI หรือคุยกับทีม เพื่อไม่ให้เรียก panel เดียวกันคนละชื่อ

ค่ารูปลักษณ์จริงอยู่ใน `Project/interactive/main-world-setting.js` ภายใต้ `mainWorldSetting.ui` และทดลองปรับสดได้จาก Runtime Setting (`F6`) ใน DEV_WORKSPACE ส่วนบทเรียนภายนอกเรียกได้เฉพาะรายการที่ระบุว่า **Lesson Service**

> **กฎสำหรับการสร้างบทเรียน Main World:** ต้องค้นหาและใช้รายการใน Catalog นี้ก่อนเสมอ ห้ามสร้าง HTML/CSS, panel, popup, toolbar, label หรือ effect ที่ทำหน้าที่ซ้ำกับ Service กลาง หากไม่มีความสามารถที่ต้องการจริง ให้ Github รายงาน capability ที่ขาด ส่วนทีม Dev ต้องเพิ่มเป็น Service กลาง ไม่ทำ UI one-off ภายใน lesson

## Lesson Services

| ชื่อมาตรฐาน | API ของบทเรียน | Setting | ใช้สำหรับ |
|---|---|---|---|
| Question Panel | `context.ui.question` | `ui.questionPanel` | โจทย์หลักด้านบน ใช้กรอบคงที่ไม่ทับ Header/Panel และย่ออักษรให้พอดีไม่เกิน 2 บรรทัด |
| GUI Answer | `context.ui.guiAnswer` | `ui.guiAnswer` | คำตอบหรือผลรวมที่ต่อจาก Question Panel พร้อมสถานะถูก/ผิด |
| Main Console | `context.ui.console` | `ui.console` | Objective, ขั้นตอน และสถานะหลักด้านล่าง |
| Top Message | `context.ui.topMessage` | `ui.topMessage` | ประกาศสั้นใต้ Topbar ไม่ใช่โจทย์ |
| Choice Panel | `context.ui.choice` | `ui.choice` | ตัวเลือกคำตอบหรือ action เหนือ Console |
| Gizmo | `context.ui.gizmo` | `ui.gizmo` | GUI 2D ที่ติดตาม object หรือพิกัด World |
| World Option | `context.ui.worldOption` | `ui.worldOption` | Popup ตัวเลือกแนวตั้งที่ติดตาม object 3D และส่ง Event กลับบทเรียน |
| World GUI System | `context.ui.worldGuiSystem` | `ui.worldGuiSystem` | ป้ายข้อมูลขนาดเล็กที่ยึดกับโมเดลหรือพิกัดในฉาก |
| Clickme | `context.ui.clickme` | `ui.clickme` | มือแบ/มือกำชี้วัตถุ draggable/clickable แบบ opt-in เฉพาะที่ Admin/Dev ระบุ |
| Feedback | `context.ui.feedback` | `ui.feedback` | สถานะสั้นแบบไม่บล็อกและปิดได้ |
| Dialog | `context.ui.dialog` | `ui.dialog` | Popup ที่ต้องอ่าน ตัดสินใจ หรือยืนยัน |
| Insight Dialog | `context.ui.insight` / เปิดผ่าน `world.addCallout({ insight })` | `ui.dialog` | เนื้อหาคำอธิบายเชิงลึก โดยพื้นที่ในฉากควรเปิดผ่าน Actionable World Callout |
| Intro Service | `context.ui.intro` / `howto[].intro` | System-owned | iframe เกือบเต็มหน้าจอสำหรับเนื้อหาเสริมจาก URL; บล็อก interaction ของบทเรียนหลักจนกว่าจะปิด |
| Control Menu | `context.ui.control` | `ui.control` | เมนูเครื่องมือมุมขวาบน/กลาง/ล่าง |
| Mascot Hint | `context.ui.hint` | `ui.hint` | คำแนะนำผ่านกล่องคำพูด Mascot |
| Step Gate | `context.ui.steps.setNextEnabled()` | System-owned | ปลดล็อกปุ่มถัดไปของ Step ที่กำหนด `requiresCompletion` |
| Busy Overlay | `context.ui.busy` | `ui.busy` | บล็อกฉากชั่วคราวระหว่างรอ async task |

รายละเอียด signature และตัวอย่างอยู่ใน `GUI_SERVICE_REFERENCE.md`

## System-owned UI

รายการต่อไปนี้มีชื่อและ Setting กลาง แต่บทเรียนไม่ควรสร้าง เปิด หรือปิดเอง

| ชื่อมาตรฐาน | Setting | ผู้ควบคุม / ความหมาย |
|---|---|---|
| Topbar | `ui.topbar` | Header หลัก ชื่อบทเรียน ปุ่ม Back/History/Information/Next |
| Mode Badge | `ui.modeBadge` | ป้าย LAB / TEACHER LAB ใน Topbar |
| Quiz Badge | `ui.quizBadge` | ป้าย PRE-TEST ใต้ Topbar |
| System Popup | `ui.popup` | ฐาน modal ของ Information, Quiz Welcome, Result และ Edit Lab |
| Camera Controls | `ui.cameraControls` | ปุ่มควบคุมกล้องมุมขวาล่าง; ระบบซ่อนบน Mobile |
| World Hint | `ui.worldHint` | ข้อความ `meta.tooltip` มุมซ้ายล่าง; ระบบซ่อนบน Mobile |
| World Callout | `ui.worldCallout` | ป้ายพร้อมเส้นชี้พื้นที่; ใส่ `insight` เพื่อเพิ่ม icon/hover และเปิด Insight Dialog |
| World Counter | `ui.worldCounter` | ตัวเลขดิจิตอล 3D บนพื้น เรียกด้วย `context.world.addWorldCounter()` |
| World GUI | `ui.worldGui` | กรอบข้อความ 3D บนพื้น เรียกด้วย `context.world.addWorldGui()` |
| Loading / Entry Screen | `entry` | หน้าโหลดและหน้าเริ่มบทเรียน |
| Mascot Character | `mascot` | รูป ตำแหน่ง ขนาด คำพูด บับเบิ้ล และ particle ของตัวละคร |
| Celebration VFX | `vfx.celebrationEffect` | Ribbon, confetti และพลุเมื่อจบบทเรียน |
| Debug Area / Transform Editor | `ui.worldGuiSystem` | เครื่องมือ Dev แสดงพิกัด X/Z และ Position/Rotation/Scale; กดป้ายโมเดลเพื่อปรับและคัดลอกค่า |
| Runtime Setting | `ui.theme` และ Setting ราย Service | เครื่องมือ Dev ที่เปิดด้วย `F6` เพื่อแก้ค่าระหว่างรันและทดสอบ GUI Service |

`World Callout` ไม่ใช่ `Gizmo`: Callout ชี้ “พื้นที่” ด้วยเส้นในฉาก ส่วน Gizmo เป็น GUI 2D ที่วิ่งตาม object/ตำแหน่งและหันเข้าหาจอเสมอ

`World Counter` เป็น display-only และรับเฉพาะจำนวน ส่วน `World GUI` รับข้อความหลายบรรทัดและค่าเริ่มต้นเป็น display-only แต่เปลี่ยนเป็นจุดกดได้ด้วย `insight` หรือ `onClick` ทั้งคู่คงตำแหน่ง/มิติอยู่ในโลกจริง

`World GUI System` ต่างจาก `World GUI`: ตัวแรกเป็นป้าย DOM ขนาดเล็กที่ฉายจากตำแหน่ง 3D จึงอ่านตรงและติดตามโมเดลได้ ส่วนตัวหลังเป็นวัตถุ 3D บนพื้นของฉาก Debug Area ใช้ engine เดียวกับ World GUI System แต่เป็น System-owned และ lesson ไม่ควรเปิดเอง

Control Menu อยู่ภายใต้ phase policy กลางของ runtime ทุกบท: ระหว่างขั้นสอนแสดงเฉพาะปุ่มข้ามการสอนของระบบ เมื่อเข้า Lab ขั้นสุดท้าย/การทดลองหรือ Quiz จึงแสดง Control ของบทเรียน และการย้อนกลับไปขั้นสอนจะซ่อน Control อัตโนมัติ

## ชื่อเดิมและชื่อที่ยกเลิก

| ชื่อ | สถานะปัจจุบัน |
|---|---|
| HUD | ยกเลิกและรวมหน้าที่ไว้ที่ **Feedback** เพื่อไม่ให้ซ้อนตำแหน่งกัน ใช้ `context.ui.feedback` / `ui.feedback` |
| Toast | API compatibility `context.ui.toast()` ยังรับได้ แต่ข้อความถูกส่งไปแสดงใน **Main Console** ไม่ใช่กล่องลอยใหม่ |
| Objective | เป็นส่วนหนึ่งของ **Main Console** ใช้ `context.ui.console.setObjective()` หรือ compatibility `context.ui.setObjective()` |

## หลักการตั้งชื่อเวลาสั่ง AI

- ระบุชื่อมาตรฐานและ path พร้อมกัน เช่น “ปรับ `Question Panel (ui.questionPanel)` ให้กว้างขึ้น”
- ถ้าต้องการเมนูมุมขวาบน ให้เรียก “`Control Menu` ตำแหน่ง `top-right`”
- ถ้าต้องการเปลี่ยนระบบกลาง ให้ระบุว่าแก้ Setting; ถ้าต้องการให้บทเรียนแสดงข้อมูล ให้ระบุ API ของ Lesson Service
- ห้ามขอสร้าง HUD หรือ Toast panel ใหม่ ให้ใช้ Feedback หรือ Main Console ตามหน้าที่

## เครื่องมือทดสอบสำหรับทีม Dev

| เครื่องมือ | วิธีใช้ | หน้าที่ |
|---|---|---|
| Quick Retest | กด `F4` | Refresh ทั้งหน้าแล้วกลับเข้าบทเรียนและโหมดเดิมทันที พร้อม cache-busting สำหรับการทดสอบโค้ด/asset ล่าสุด |
| Runtime Setting | กด `F6` | เปิด GUI/JSON editor ของ `mainWorldSetting`, Apply ค่าได้ทันที, ดูเฉพาะค่าที่แก้, Restore ค่าเริ่มต้น และ Refresh lesson/assets |
| Lab / Quiz Switch | ปุ่มด้านขวาของ Header ในหน้า `F6` | สลับทดสอบ `teacher-lab` หรือ `student-quiz` โดยใช้บทเรียนเดิม |
| Refresh | ปุ่มด้านขวาของ Header ในหน้า `F6` | ทำงานแบบ Quick Retest (`F4`) และกลับเข้าบทเรียน/โหมดเดิม |
| GUI Service Lab | หมวดทดสอบในหน้า `F6` | Preview, Update และ Clear Service กลาง เพื่อเช็กหน้าตา, animation และ responsive layout โดยไม่ต้องเขียน UI ทดสอบใน lesson |
| Debug Area | ปุ่ม Debug Area ในหน้า `F6` | เปิดพิกัด X/Z และป้าย transform ของโมเดล; กดป้ายเพื่อแก้ Position/Rotation/Scale แบบสดและคัดลอกค่ากลับไปใช้ |

ฉาก Main World ปัจจุบันใช้ `background: "green"` เพียงแบบเดียว สี Grid ต้องมาจาก Setting กลาง `ground.gridColor`, `ground.gridOpacity` และ `ground.ringColor`; lesson และ background preset ห้ามกำหนดสี Grid ทับเอง สำหรับบทเรียน 3D runtime ใช้ Storybook UI สีน้ำตาล/ครีมบน felt environment โดย theme เป็น System-owned และ lesson ห้ามกำหนดเอง



