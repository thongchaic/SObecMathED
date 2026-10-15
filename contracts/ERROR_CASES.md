# Error Cases และแนวทางส่งกลับให้ AI ซ่อม

เมื่อ runtime หรือ validator แจ้ง error ให้นำ error code, stage, message และชื่อไฟล์ส่งกลับให้ AI พร้อมคำสั่งว่าให้ซ่อมเฉพาะ lesson file

| Code | Stage | ความหมาย | แนวทางตรวจ |
|---|---|---|---|
| `LESSON_FETCH_FAILED` | fetch | โหลดไฟล์ไม่ได้, path/HTTP status ผิด | ตรวจ URL, relative path, same origin |
| `LESSON_HTML_INVALID` | parse | HTML shell ไม่สมบูรณ์ | เทียบกับ output template |
| `LESSON_APP_SCRIPT_MISSING` | parse | ไม่พบ `script[data-lesson-app]` | เพิ่ม script ตาม template |
| `LESSON_APP_SCRIPT_DUPLICATE` | parse | มี registration script มากกว่าหนึ่ง | เหลือเพียงหนึ่ง script |
| `LESSON_SCRIPT_SYNTAX_ERROR` | compile | JavaScript syntax ผิด | ตรวจวงเล็บ, comma, string และ template literal |
| `LESSON_DEFINE_MISSING` | register | ไม่เรียก `PuzzleLesson.define` | เพิ่ม definition หนึ่งครั้ง |
| `LESSON_DEFINE_DUPLICATE` | register | register มากกว่าหนึ่ง lesson | เหลือ define ครั้งเดียว |
| `LESSON_META_INVALID` | validate | meta หรือค่าบังคับไม่ครบ | ตรวจ id, lessonId, worldType, title, category, subcategory และ arrays |
| `LESSON_LIFECYCLE_MISSING` | validate | ขาด mount/reset/onStep/dispose | เพิ่ม lifecycle ให้ครบ |
| `LESSON_HELPER_MISSING` | validate | เรียก `this.someHelper()` แต่ไม่มี method นี้ใน lesson object | เพิ่ม method ใน object ที่ส่งให้ `PuzzleLesson.define(...)` หรือแก้ชื่อที่เรียกให้ตรง; อย่าถือว่า `this.*` เป็น Public API |
| `LESSON_QUIZ_ANSWER_DURING_RESET` | validate | บันทึกคำตอบ Quiz ระหว่าง reset ก่อนผู้เรียนลงมือ | ย้าย `context.quiz.answer(...)` ไปไว้หลัง click/drag/drop/control action เท่านั้น |
| `LESSON_API_NOT_SUPPORTED` | runtime | เรียก API ที่ไม่มี | ใช้เฉพาะ Public API reference |
| `LESSON_MOUNT_FAILED` | mount | error ระหว่าง mount | ตรวจ context access และ state เริ่มต้น |
| `LESSON_RESET_FAILED` | reset | error ระหว่างสร้างฉาก/คำถาม | ตรวจ values, handles, array และ quiz data |
| `LESSON_STEP_FAILED` | step | error เมื่อเปลี่ยน Lab step | ตรวจ index, step และ handle ที่อาจไม่มี |
| `LESSON_ASSET_NOT_FOUND` | asset | path asset ไม่ถูกต้อง | ใช้ `context.resolveAsset` และ asset ที่มีจริง |
| `LESSON_EXTERNAL_ASSET_FORBIDDEN` | validate | TEACHER_EXTERNAL เรียก custom model หรือ path asset | ใช้ Procedural Shape/`addGroup` ให้ core interaction จบก่อน แล้วใช้ Standard Asset ID เมื่อมี; ติดต่อทีม Dev เฉพาะเมื่อ Public API ทำแกนบทเรียนไม่ได้จริง |
| `LESSON_ASSET_PATH_REQUIRED` | asset | DEV_WORKSPACE เรียก custom model โดยไม่มี path | ทีม Dev กำหนดและ deploy relative path ที่ตรวจสอบแล้ว |
| `LESSON_ASSET_LOAD_FAILED` | asset | asset ของ DEV_WORKSPACE โหลดหรือ parse ไม่สำเร็จ | ทีม Dev ตรวจ path, format, texture และ deployment case sensitivity |
| `LESSON_ASSET_ORIGIN_ERROR` | asset | asset ของ DEV_WORKSPACE อยู่นอก origin | ทีม Dev นำ asset เข้า Platform origin และอัปเดต catalog/contract หากจะเปิดให้อาจารย์ใช้ |
| `LESSON_OPERATOR_UNSUPPORTED` | runtime | ส่งอักขระที่ prefab ไม่รองรับ | ใช้ addOperatorSign เฉพาะ `= ≠ < > ≤ ≥ + - × ÷`; ข้อความทั่วไปใช้ addText3D |
| `LESSON_PRIMITIVE_UNSUPPORTED` | runtime | ส่งชื่อรูปทรง procedural ที่ระบบไม่รองรับ | เลือก shape จาก `context.world.capabilities.primitiveShapes` หรือ `sdk/LESSON_API_REFERENCE.md`; ห้ามสมมติชื่อใหม่ |
| `LESSON_PRESENTATION_INVALID` | validator | `meta.presentation` ไม่ใช่ object | ใช้ object ที่มี `mascot` และ/หรือ `environment` หรือเอา `presentation` ออกเพื่อใช้ค่าเดิม |
| `LESSON_PRESENTATION_MASCOT_ENABLED_INVALID` | validator | `mascot.enabled` ไม่ใช่ boolean | ใช้ `true` หรือ `false` โดยไม่ใส่เครื่องหมายคำพูด |
| `LESSON_PRESENTATION_PRESET_INVALID` | validator | ชื่อฉากเริ่มต้นไม่รองรับ | ใช้ `standard`, `day` หรือ `night` เท่านั้น |
| `LESSON_LOAD_TIMEOUT` | load | lifecycle หรือ asset รอนานเกินกำหนด | เอา network/dependency ออกและตรวจ Promise |
| `SDK_VERSION_MISMATCH` | validate | lesson ต้องการ API คนละเวอร์ชัน | ปรับ lesson ให้ตรง Github contract ปัจจุบัน |
| `LESSON_RUNTIME_ERROR` | runtime | exception อื่นใน lesson | ใช้ stack/message หา lifecycle และบรรทัดที่ผิด |

## Repair Prompt มาตรฐาน

```text
ซ่อมเฉพาะไฟล์ lesson ที่แนบมา ห้ามแก้ runtime, SDK, settings หรือ CSS
อ่าน README.md, contracts/LESSON_CONTRACT.md, sdk/LESSON_API_REFERENCE.md,
LESSON_OUTPUT_TEMPLATE.html และ Project/interactive/chapters/lesson0.html ก่อนซ่อม

Error code: [CODE]
Stage: [STAGE]
File: [FILENAME]
Message: [MESSAGE]
Details: [DETAILS]

คืนชื่อ path และ HTML ฉบับเต็มที่แก้สมบูรณ์แล้วใน code block ภาษา `html` หนึ่งก้อนใน Chat พร้อมรายงานสั้นแยกจากโค้ดตาม README ห้ามพยายามเขียนหรือ push กลับ GitHub
```

ข้อความสำหรับผู้ใช้งาน runtime:

> นำข้อความนี้ส่งต่อให้ผู้พัฒนาบทเรียน หรือส่งเข้า AI Agent เพื่อแก้ไขข้อผิดพลาด

## กล่อง FAILED ในระบบทดสอบ

เมื่อบทเรียนพังระหว่างโหลด ระบบปลายทางจะแสดงกล่อง `FAILED` แทนการค้างอยู่ที่หน้า Loading โดยระบุหัวข้อที่พัง lifecycle หรือบรรทัดที่ควรตรวจ และรวบรวม stack trace กับ `console.error` ล่าสุดไว้ใน log

1. กด `Copy log` แล้วส่งข้อความทั้งหมดให้ AI พร้อมไฟล์ HTML ต้นฉบับ
2. หลังแก้ไฟล์แล้วเปิดทดสอบใหม่ หรือกด `Retry` เพื่อรัน payload เดิมซ้ำ
3. กด `กลับ` เพื่อปิดบทเรียนที่เสียหายและกลับไปเลือกไฟล์อื่น

บรรทัด `Stage` ใน log ตรงกับช่วงสำคัญของ loader ได้แก่ `receive`, `fetch`, `structure`, `execute`, `register`, `metadata`, `assets`, `mount`, `reset` และ `finish` ให้เริ่มตรวจจาก stage และ stack frame แรกที่ชี้เข้า lesson HTML




