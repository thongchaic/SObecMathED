# การตรวจบทเรียนในชุดอ้างอิง

ชุดนี้ไม่มี plugin และ asset binary โดยตั้งใจ ใช้เพื่ออ่าน source, ผลิต HTML และตรวจ static เท่านั้น การเปิด main-world.html หรือบทเรียนตรงจากชุดนี้ไม่ใช่การทดสอบ runtime ที่สมบูรณ์

## ตรวจ static จาก repository root

ต้องมี Node.js สำหรับ validator ใช้ built-in modules ไม่ต้อง npm install:

```sh
node validator/validate-lesson.mjs LESSON_OUTPUT_TEMPLATE.html
node validator/validate-lesson.mjs Project/interactive/chapters/lesson0.html
node validator/validate-lesson.mjs path/to/your-lesson.html
```

แทน path สุดท้ายด้วยไฟล์จริง ค่าเริ่มต้น teacher-external ตรงกับ portable lesson-only; ใช้ --profile=dev-workspace เฉพาะงาน custom asset ที่ได้รับมอบหมายชัดเจน ดู [validator README](validator/README.md)

Exit 0 หมายถึงผ่าน static checks; exit 1 มี JSON error และ repairPrompt ห้ามใช้ผลนี้ยืนยัน interaction, rendering หรือความถูกต้องการสอนทั้งหมด

ตรวจเพิ่มจากโค้ด: id ไม่ซ้ำ, values/editSchema/quiz data ใช้ key ตรงกัน, ทุก `this.someHelper()` มี `someHelper()` ประกาศจริงใน lesson object, ทุก `world.*()` ตรง Public API, reset ล้าง state/timer, ไม่เรียก quiz.answer ใน reset, ไม่เฉลย Quiz, ยอมรับทุกคำตอบที่ตรง predicate และทุกโจทย์มีคำตอบที่เป็นไปได้

## ทดสอบในระบบปลายทางเมื่อมีให้ใช้

ส่ง HTML ไปเปิดผ่าน EduSDK ของระบบจริงที่เจ้าของเตรียม runtime/dependency/asset ไว้แล้ว ใช้ URL และวิธีนำเข้าที่เจ้าของระบุ ไม่ต้องดาวน์โหลด plugin/asset มาเติม repository นี้ และไม่ต้องแก้ import/path ของ source อ้างอิงเพื่อให้เปิดได้

| ตรวจ | เกณฑ์ |
|---|---|
| Teacher Lab | ทุกช่องปรับค่าเปลี่ยนฉากจริง |
| Student Lab | sequence/freestyle เปิด interaction ตามกติกา |
| Control phase policy | ระหว่างขั้นสอนเห็นเฉพาะปุ่มข้ามการสอน; Lab ขั้นสุดท้าย/การทดลองและ Quiz จึงเห็น Control ของบทเรียน; กดย้อนกลับแล้ว Control ต้องซ่อนอีกครั้ง |
| Student Quiz | ตอบถูก/ผิดแล้วไปต่อได้ ไม่เฉลยระหว่างทำ ส่ง→ดูผล→ปิดได้ |
| Quiz pending answer | เปลี่ยนคำตอบก่อนกดยืนยันแล้วบันทึกเฉพาะค่าล่าสุด; ล้างคำตอบด้วย `hasAnswer: false` แล้วปุ่มไปต่อซ่อน; กดยืนยันจึงให้คะแนน |
| Teacher preview | `lessonData.preview: true` แสดงสลับ Lab/Quiz แต่ไม่เปิด F4/F6/Debug tools; `false` คงพฤติกรรมปกติ |
| Production compile (เจ้าของระบบ) | ใช้ output `productionChapters` ที่คอมไพล์จาก RAW source; ไม่เผยแพร่ `chapters` เป็น production และชุดอ้างอิงนี้ไม่ใช้แทนไฟล์ deploy |
| Drag/drop ถ้ามี | วางผิดกลับตำแหน่ง ไม่ทับ slot ลากออกเพื่อแก้ได้ |
| Reset / เปิดใหม่ | ไม่เหลือ state, timer หรือ UI จากรอบก่อน |
| Persistent scene (ถ้าใช้) | `meta.scenePersistence: "lesson"` ไม่สร้างฉากคงที่ซ้ำ, object แบบ dynamic เปลี่ยนครบทุกข้อ และ `dispose()` ล้างทั้งหมด |
| Desktop / mobile แนวตั้ง | เห็นข้อความ/เป้าหมายครบ แตะลากได้ และปุ่ม Back ของ UI มุมซ้ายบนปิด lesson overlay ได้ทั้งระหว่าง Loading และหลังเข้าบทเรียน |
| Console / Network | ไม่มี exception หรือไฟล์จำเป็นโหลดล้มเหลวในระบบจริง |
| Debug Area (ทีม Dev) | พิกัด X/Z อ่านได้โดยไม่บังฉาก ป้ายโมเดลแสดง Position/Rotation/Scale และกดปรับค่า/คัดลอกค่าได้ |

## รายงานส่งมอบ

สำหรับ `git/DEVGEN` ให้ส่งชื่อ path และ HTML ฉบับเต็มใน code block ภาษา `html` หนึ่งก้อนใน Chat สรุปกิจกรรม ค่าที่ครูปรับได้ เงื่อนไขคำตอบ ผล validator หรือ static self-review และ commit/tag ของ repository อ้างอิง ห้ามเขียนหรือ push กลับ GitHub หากมีเว็บทดสอบ ให้ระบุโหมด viewport และผลจริง หากไม่มีให้ระบุ “ผ่าน static checks; ยังไม่ได้ทดสอบ runtime ในระบบปลายทาง” แล้วส่งงานได้ ไม่ต้องหยุดรอ asset

