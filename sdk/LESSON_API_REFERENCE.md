# Lesson Public API Reference

เอกสารนี้คือ allow-list: บทเรียนเรียกได้เฉพาะ API ที่ระบุไว้ หากต้องการ feature อื่นต้องเพิ่มใน runtime และอัปเดต contract ก่อน ห้าม AI สมมติชื่อ method เอง

> **TEACHER_EXTERNAL restriction:** ใช้เฉพาะ primitive/group/text และ Standard Asset Library ชุดนี้ไม่เปิด custom-model API หรือ direct asset path ให้บทเรียนภายนอก

ดู type signatures เพิ่มเติมที่ [`lesson-sdk.d.ts`](lesson-sdk.d.ts)

## Universal Scene API (Runtime 3.4.0)

บทเรียนใหม่ไม่ควรคัดลอกฉากซ้าย/ขวา กล่อง หรือเครื่องหมายจาก Lesson 0 โดยอัตโนมัติ ให้เลือกวัตถุและการจัดฉากตามเนื้อหาของครูผ่าน API กลางต่อไปนี้ ส่วน API เดิมยังรองรับเพื่อให้บทเรียนเก่าทำงานต่อได้

### Standard Asset Library

รายการที่ runtime ใช้จริงอยู่ที่ `Project/interactive/assets/library/catalog.json` และมี portable snapshot สำหรับ AI ที่ `sdk/asset-library.catalog.json`

```js
const apple = world.addLibraryObject({
  asset: "food/apple",
  name: "answer-apple",
  position: [-3, 0.2, 0],
  scale: 1.1,
  draggable: true,
  onDrop(position, handle) {
    return { accepted: true, commit: true };
  }
});
```

Model asset รองรับ `color`, `opacity`, `textureEnabled` และ `depthWrite` สำหรับสร้าง state ทางภาพ เช่นวัตถุ disabled แบบขาวโปร่งโดยไม่ใช้ texture:

```js
const disabledFruit = await world.addLibraryObject({
  asset: "fruit/red-apple",
  color: "#ffffff",
  opacity: 0.4,
  textureEnabled: false,
  depthWrite: false
});
```

Asset เริ่มต้น:

- `food/apple`
- `food/pizza`
- `sports/ball`
- `science/water-tank`
- `math/balance-scale`
- `space/rocket`
- `classroom/counter`

ตรวจรายการแบบ runtime ได้ด้วย `context.assets.list()` และ `context.assets.get(id)` ห้ามสมมติ Asset ID ที่ไม่มีใน catalog

### `world.addPrimitive(options)`

สร้างรูปร่าง procedural มาตรฐานโดยไม่ต้องเพิ่ม FBX/GLB หรือ Asset ID เหมาะสำหรับทำ prototype ให้จบบทเรียนก่อนส่งทีมหลัก polish ภายหลัง รูปทรงทั้งหมดมีขนาดตั้งต้นประมาณ 1 unit แล้วคูณด้วย `size: [กว้าง, สูง, ลึก]`

```js
world.addPrimitive({
  shape: "cylinder",
  size: [2, 0.5, 2],
  position: [0, 0.25, 0],
  color: "#ffcf62",
  draggable: true
});
```

รูปทรงที่รองรับ:

- พื้นฐาน: `box`, `rounded-box`, `sharp-box`, `sphere`, `hemisphere`, `cylinder`, `cone`, `capsule`, `circle`, `plane`, `arrow-flat`, `ring`
- คณิตศาสตร์และโครงสร้าง: `half-cylinder`, `quarter-cylinder`, `sector`, `sector-flat`, `ring-sector`, `ring-sector-flat`, `tube`, `wedge`
- รูปทรงหลายหน้า: `pyramid`, `prism`, `frustum`, `tetrahedron`, `octahedron`, `dodecahedron`, `icosahedron`, `diamond`
- ตกแต่ง: `torus`, `torus-knot`, `star`, `heart`, `cross`
- กำหนดรูปทรงเอง: `polygon`, `polygon-flat`, `polyhedron`, `lathe`, `spline-tube`

ชื่อที่คุ้นเคยใช้เป็น alias ได้ด้วย เช่น `cube`, `cuboid`, `rectangle`, `rectangle-flat`, `triangle`, `semicircle`, `semi-cylinder`, `quarter-circle`, `pie`, `pie-slice`, `annular-sector`, `arc`, `disc`, `donut`, `extrude-polygon`, `custom-polyhedron` และ `path-tube`

ตัวเลือก `geometry`:

| ค่า | ใช้กับ | ความหมาย |
|---|---|---|
| `segments` | ทรงโค้งทั้งหมด | ความละเอียด 6–96 |
| `sides` | `prism`, `pyramid`, `frustum` | จำนวนด้าน 3–32 |
| `startAngle`, `angle` | `sector`, `ring-sector` และแบบ `-flat` | มุมเริ่มและขนาดมุม หน่วย degree |
| `innerRadius` | `ring`, `ring-sector`, `tube`, `star` | สัดส่วนรัศมีด้านใน |
| `points` | `star` | จำนวนแฉก 3–16 |
| `topRadius`, `bottomRadius` | `frustum` | สัดส่วนรัศมีบนและล่าง |
| `tube` | `torus`, `torus-knot` | สัดส่วนความหนาของวง |
| `p`, `q` | `torus-knot` | จำนวนรอบของปม |
| `openEnded` | ทรงกรวย/ทรงกระบอก/ปริซึม | เปิดฝาปลาย |
| `radius` | `box`, `rounded-box` | ระดับความมนของมุม |
| `vertices`, `holes` | `polygon`, `polygon-flat` | จุดขอบ `[x,z]` และวงช่องว่างภายใน |
| `vertices`, `faces`/`indices` | `polyhedron` | จุด 3D และหน้าของ mesh |
| `profile` | `lathe` | หน้าตัด `[radius,y]` ที่หมุนรอบแกน Y |
| `path`, `tube`, `radialSegments`, `closed` | `spline-tube` | แนวเส้น 3D และความหนาของท่อ |
| `normalize` | รูปทรงกำหนดเอง | ค่าเริ่มต้น `true`; จัดกึ่งกลางและ normalize ก่อนคูณ `size` |
| `orientation` | รูปทรง `-flat`, `plane`, `circle`, `ring`, `arrow-flat` | `front`, `ground`/`xz` หรือ `side`/`yz` |

ตัวอย่างรูปทรงอิสระที่มีช่องตรงกลาง:

```js
world.addPrimitive({
  shape: "polygon",
  geometry: {
    vertices: [[-2,-1], [2,-1], [2,1], [0,2], [-2,1]],
    holes: [[[-.45,-.25], [.45,-.25], [.45,.25], [-.45,.25]]]
  },
  size: [4, .6, 3],
  position: [0, .3, 0],
  color: "#70d8c3"
});
```

ตัวอย่าง mesh 3D จาก vertices และ faces:

```js
world.addPrimitive({
  shape: "polyhedron",
  geometry: {
    vertices: [[-1,0,-1], [1,0,-1], [1,0,1], [-1,0,1], [0,2,0]],
    faces: [[0,1,4], [1,2,4], [2,3,4], [3,0,4], [0,3,2,1]]
  },
  size: [3, 3, 3],
  color: "#ffb66e"
});
```

รูปทรงแบนสร้างบนระนาบ `front` เพื่อรักษาบทเรียนเดิม หากต้องการวางราบกับพื้นไม่ต้องคำนวณ rotation เอง ให้กำหนด `geometry: { orientation: "ground" }` แล้วใช้ `size: [กว้าง, 1, ลึก]`

ตัวอย่างเค้ก `1/8` ที่ทุกชิ้นเท่ากันทางคณิตศาสตร์ โดยไม่ต้องมีโมเดลใน catalog:

```js
const denominator = 8;
for (let index = 0; index < denominator; index += 1) {
  const middleAngle = (index + .5) * 360 / denominator;
  const distance = .12;
  world.addPrimitive({
    name: `cake-slice-${index}`,
    shape: "sector",
    geometry: {
      startAngle: index * 360 / denominator,
      angle: 360 / denominator,
      segments: 48
    },
    size: [5, .9, 5],
    position: [
      Math.cos(middleAngle * Math.PI / 180) * distance,
      .5,
      -Math.sin(middleAngle * Math.PI / 180) * distance
    ],
    color: index < 3 ? "#ff8fb5" : "#ffd9a1",
    draggable: true
  });
}
```

ใช้ `sector` สำหรับชิ้นเค้ก/พิซซ่า/วงกลมเศษส่วนแบบมีความหนา และใช้ `sector-flat` สำหรับแผ่นวงกลมหรือกราฟวงกลม หากต้องการขอบครีมให้ประกอบ `sector` หลายชั้นใน `world.addGroup()` โดยส่ง `geometry` ชุดเดียวกันให้แต่ละ part เพื่อรักษามุมเท่ากัน

### `world.addGroup(options)`

ประกอบหลาย primitive เป็นวัตถุเดียว ทุก `parts` ใช้ position/rotation แบบ local ภายใน group:

```js
world.addGroup({
  name: "simple-rocket",
  position: [0, 0, 0],
  parts: [
    { shape: "cylinder", size: [1, 2.5, 1], position: [0, 1.4, 0], color: "#ffffff" },
    { shape: "cone", size: [1.1, 1.2, 1.1], position: [0, 3.2, 0], color: "#ff7897" }
  ]
});
```

ทุก part ใน `addGroup()` รองรับ `geometry` ชุดเดียวกับ `addPrimitive()` จึงประกอบจรวด เค้กหลายชั้น ตัวละคร ของเล่น ภาชนะ และอุปกรณ์การเรียนจาก procedural geometry ได้โดยไม่ต้องขอ Asset ID ใหม่

วัตถุ 3D ที่ตั้ง `clickable` หรือ `draggable` จะใช้กฎ Hover กลางเสมอ: ผิววัตถุเปลี่ยนเป็นสีขาวและมีวง Hover เพื่อบอกว่ากดหรือหยิบได้ หากบทเรียนมีสถานะ Active ของตัวเอง ให้กำหนด `selectionFeedback: false` เพื่อซ่อนเฉพาะลูกศร Select หลังคลิก โดย Hover สีขาวยังคงทำงาน

### `world.addConnector(options)`

สร้างเส้นเชื่อมจากตำแหน่งหนึ่งไปยังอีกตำแหน่งหนึ่ง ระบบคำนวณองศา 3 มิติให้โดยตรง เหมาะกับกราฟ กิ่งไม้ และความสัมพันธ์ระหว่างวัตถุ

```js
world.addConnector({
  from: [0, 1, 0],
  to: [4, .5, 2],
  color: "#ffad38",
  thickness: .08,
  opacity: .75
});
```

วัตถุ interactive แบบ primitive, group และ library ใช้ Highlight กลางของระบบโดยอัตโนมัติ: Material Tint ทั้งวัตถุ วงแหวนที่คำนวณจาก Bounding Box รวม และ Marker รูปเพชรลอยเมื่อเลือก จึงรองรับวัตถุประกอบหลายชิ้นโดยไม่มีเส้น Outline ซ้อน บทเรียนไม่ต้องสร้าง Highlight เอง

### `world.addText3D(options)`

สร้างข้อความสั้นใน world space สำหรับ label บนวัตถุเท่านั้น ข้อความจะหันเข้าหากล้องและไม่ใช่ polygon จึงห้ามใช้เป็นป้ายโจทย์หลักหรือเครื่องหมายคำนวณบนฐาน

```js
world.addText3D({
  text: "คำตอบ",
  position: [0, 1.2, 0],
  size: [2.2, 1.7],
  color: "#6049c7",
  background: "rgba(255,255,255,.8)"
});
```

เครื่องหมายเปรียบเทียบและคำนวณ `= ≠ < > ≤ ≥ + - × ÷` ให้ใช้ `world.addOperatorSign()` เพื่อให้ได้ polygon 3D และฐานมาตรฐานเดียวกันทุกบท

### Custom model

ไม่มีใน TEACHER_EXTERNAL allow-list ห้ามใช้ `world.addModel()`, `type: "model"`, `context.resolveAsset()` หรือ path ไปยัง GLB/GLTF/FBX ถ้าต้องการโมเดลใหม่ ให้ส่ง requirement ให้ทีม Dev เพิ่มเป็น Standard Asset ID แล้วอัปเดต catalog ก่อน

### `world.addObject(options)`

Dispatcher กลางรองรับ `type: "primitive" | "group" | "text3d" | "library"`; runtime มี `type: "model"` สำหรับ DEV_WORKSPACE แต่ TEACHER_EXTERNAL ห้ามใช้

### Interaction กลาง

วัตถุจาก API ใหม่กำหนดได้ทั้ง:

- `draggable`, `dragAxis`, `guideTarget`, `onDrag`, `onDrop`
- `clickable`, `onClick({ handle, object, hitPoint })`

การ drag และ click จะเรียก objective action, Highlight/Selection และ system SFX ผ่าน main-world อัตโนมัติ บทเรียนควรกำหนดเฉพาะ state/condition ของตนเอง

หาก `onDrop(position, handle)` เรียก `handle.setPosition(...)` หรือ `handle.animateTo(...)` เพื่อ snap วัตถุเข้า grid Runtime จะรักษาตำแหน่ง/แอนิเมชันนั้นไว้และไม่ใส่ drop bounce ทับอีกครั้ง หาก callback ไม่จัดตำแหน่งเอง Runtime จึงใช้ drop bounce มาตรฐาน

## Scene lifecycle และการคงฉาก

ค่าเริ่มต้นคือ `meta.scenePersistence: "reset"` ซึ่ง Runtime จะล้าง World ก่อนเรียก `reset()` ทุกครั้ง หากทุกข้อใช้ฉากหลักเดียวกันและเปลี่ยนเพียงข้อมูลบางส่วน สามารถเลือก:

```js
meta: {
  worldType: "3d-world-space",
  scenePersistence: "lesson"
}
```

เมื่อใช้ `"lesson"` Runtime จะสร้าง World ใหม่เฉพาะ reset แรก หลังจากนั้นบทเรียนต้องสร้างฉากคงที่ครั้งเดียว รีใช้หรือ pool object และล้างเฉพาะส่วน dynamic ใน `reset()` พร้อมล้าง handle, timer และ object ทั้งหมดใน `dispose()`

## Context

`mount(context)` ได้ object แบบ read-only:

- `context.world` — สร้างและควบคุม object ใน world space
- `context.ui` — GUI Service กลาง ได้แก่ Question, Console, Top Message, Choice, Gizmo, World Option, World GUI System, Clickme, Feedback, Dialog, Insight Dialog, Intro, Control, Hint และ Busy รวม compatibility objective/toast/progress
- `context.audio.play(name)` — เล่น SFX ที่ระบบเตรียมไว้
- `context.mode` — `teacher-lab`, `student-lab` หรือ `student-quiz`
- `context.language` — ภาษาจากเว็บหลัก
- `context.lessonData` — ข้อมูลบทเรียนที่ Runtime resolve แล้ว: โดยปกติใช้ `title`/`name`, `category`, `subcategory` ที่เว็บหลักส่งมาเมื่อไม่ว่าง แล้ว fallback จาก lesson meta; หาก `mainWorldSetting.overrideTitleName` เป็น `true` จะใช้ `meta.title`, `meta.category`, `meta.subcategory` ก่อนเสมอ
- `context.objectiveAction()` — แจ้ง attempt ที่ตั้งใจให้ผู้เรียนไปต่อได้ แต่ยังไม่เปลี่ยน state คำตอบ เช่น invalid drop หรือการกดข้าม; ไม่ต้องเรียกซ้ำหลัง `quiz.answer`
- `context.quiz.answer(correct, details)` — อัปเดตคำตอบ Quiz ล่าสุดและเปิดปุ่มไปต่ออัตโนมัติหลังข้อพร้อมใช้งาน; ห้ามเรียกจาก `reset()` และคำสั่งระหว่างเตรียมข้อจะถูก Runtime ปฏิเสธ
- `context.complete(result)` — จบบทเรียนและส่ง result กลับ host
- `context.root` — root ที่ runtime จัดให้; World lesson ไม่ควรสร้าง UI กลางลงไป

## World

### `world.addBox(options)`

สร้างกล่อง 3D และคืน `LessonHandle`

```js
const box = world.addBox({
  name: "answer-0",
  size: [1.4, 1.4, 1.4],
  position: [-4, 0.85, 2.4],
  color: "#75b9ee",
  draggable: true,
  dragAxis: "xz",
  hoverMessage: "ลากกล่องไปยังพื้นที่คำตอบ",
  guideTarget: [4, 0.4, -1],
  onDrag(position) {},
  onDrop(position, handle) {
    return { accepted: true, commit: true };
  }
});
```

`dragAxis` ใช้ `"xz"` สำหรับพื้น world หรือ `"xy"` สำหรับระนาบหันกล้อง

### `world.addZone(options)`

สร้างพื้นที่ source/target และคืน handle:

```js
world.addZone({
  name: "answer-zone",
  size: [7.4, 0.28, 6.6],
  position: [4.2, 0.15, -1],
  color: "#d8f5df",
  opacity: 0.82
});
```

### `world.addCallout(options)` / `world.addLabel(options)`

สร้างป้าย GUI ที่อ่านตรงและล็อกเข้าหาจอ โดยฉาย `position` จาก World มายังหน้าจอและเชื่อมกับ `anchor` ด้วย leader line/ring ในฉาก ระบบกลางดูแลขนาด Desktop/Mobile และป้องกันป้ายหลุดขอบจอ ใส่ `insight` เมื่อต้องการให้ป้ายเป็นจุดกดเปิดคำอธิบาย ห้ามสร้าง DOM/Sprite ทดแทนภายใน lesson:

```js
world.addCallout({
  text: "ดูวิธีสร้างคำตอบ",
  position: [4.2, 4.35, 0.35],
  compactPosition: [2.5, 3.9, 0.35],
  anchor: [4.2, 0.28, -1],
  color: "#23324d",
  lineColor: "#7857ff",
  scale: [2.85, 0.82],
  compactScale: [2.45, 0.92],
  insight: () => ({
    title: "พื้นที่คำตอบ",
    message: "ลากวัตถุเข้าไปในกรอบนี้",
    primaryLabel: "เข้าใจแล้ว"
  })
});
```

Handle ที่คืนมารองรับ `setText(text)` เพื่ออัปเดตข้อความโดยไม่สร้าง Callout ใหม่ เหมาะกับบทเรียนที่คงฉากไว้ระหว่างข้อ

หากไม่มี `insight` หรือ `onClick` ป้ายยังเป็น Callout แสดงผลอย่างเดียวเหมือนเวอร์ชันเดิม Actionable Callout มี icon ข้อมูลและ hover animation อัตโนมัติ โดยค่าเริ่มต้นการเปิดคำอธิบายไม่นับเป็น Quiz objective action

### Interaction hit area สำหรับโมเดลขนาดเล็ก

```js
const carrot = await world.addLibraryObject({
  asset: "food/carrot",
  draggable: true,
  hitArea: [3, 1.1, 2.15],
  hitAreaOffset: [0, 0.78, 0],
  dragFromCenter: true
});

// หลังหยิบออกจากฐาน ให้กลับไปจับตามขนาดโมเดลจริง
carrot.setHitArea(null);
carrot.setDragFromCenter(false);
```

Hit area โปร่งใสและไม่ถูกนำไปคำนวณขนาดวง Highlight จึงช่วยเพิ่มความสะดวกบนมือถือโดยไม่ทำให้โมเดลหรือ selection ใหญ่ผิดปกติ

### `world.addOperatorSign(options)`

รองรับ `=`, `≠`, `<`, `>`, `≤`, `≥`, `+`, `-`, `×` และ `÷` คืน `OperatorHandle` ซึ่งเพิ่ม `setState(valid)` และ `pulse()` ตัวเครื่องหมายเป็น polygon 3D และใช้ฐานมาตรฐานเดียวกันทุกบท (`!=`, `<=`, `>=` ใช้เป็น alias ได้)

กำหนด `clickable`, `onClick`, `hoverMessage`, `objectiveAction` และ `selectionFeedback` ได้เหมือน object แบบ clickable โดยไม่ต้องเข้าถึง internals ของฐานเครื่องหมาย

ความกว้างบนพื้นกำหนดด้วย `scale` ตามปกติ ส่วนความหนาแนวตั้งของ prefab ทุกเครื่องหมายใช้ค่ากลาง `mainWorldSetting.lessonGraphics.operatorBase.heightScale` บทเรียนห้ามเข้าถึง `object3D.userData.visualRoot` เพื่อย่อแกน Y เอง เพราะจะทำให้แต่ละบทมีรูปทรงไม่ตรงกัน

### `world.addWorldCounter(options)`

ตัวนับเลขดิจิตอลแบบ 3D ที่วางบนพื้น ใช้เฉพาะแสดงจำนวนและไม่รับ interaction:

```js
const counter = world.addWorldCounter({
  name: "answer-counter",
  position: [4.2, 0.2, 2.8],
  compactPosition: [3.2, 0.2, 3.4],
  value: 0,
  digits: 2
});

counter.setValue(12);
counter.getValue();
```

รองรับเลขจำนวนเต็มตั้งแต่ `0` ถึงจำนวนหลักที่กำหนด (`digits` 1–6) และ `leadingZero: true` เมื่อต้องการแสดงศูนย์นำหน้า ห้ามใช้แสดงข้อความหรือทำเป็นปุ่ม

### `world.addWorldGui(options)`

กรอบข้อความแบบ 3D ที่วางราบบนพื้น ใช้อธิบายบริเวณโดยไม่บังหน้าจอ ค่าเริ่มต้นเป็น display-only:

```js
const instruction = world.addWorldGui({
  name: "drag-instruction",
  text: "ลากแครอทไปวางในช่องคำตอบ",
  position: [0, 0.24, 5.8],
  compactPosition: [0, 0.24, 5.2],
  size: [5.2, 1.65],
  maxLines: 3
});

instruction.setText("ลากวัตถุชิ้นต่อไปมาวางที่นี่");
instruction.getText();
```

ใช้ `compactPosition`/`compactScale` เมื่อต้องจัดตำแหน่งเฉพาะมือถือ ปรับเฉพาะงานจำเป็นด้วย `textColor`, `backgroundColor`, `borderColor`, `accentColor`, `fontSize` และ `size`; รูปลักษณ์หลักควรใช้ค่ากลางจาก Runtime Setting

เมื่อต้องการให้ผู้เรียนกดอ่านข้อความเพิ่ม ให้ส่ง `insight` หรือ `onClick`; Runtime จะสร้างพื้นผิวแบบปุ่ม, hover และ hit area ให้เอง ห้ามสร้างปุ่ม HTML ซ้ำ:

```js
world.addWorldGui({
  text: "ทำไมจึงยกกำลังสอง?",
  position: [0, 0.24, 5.8],
  insight: {
    title: "พื้นที่รูปสี่เหลี่ยมจัตุรัส",
    message: "จำนวนช่องทั้งหมดเท่ากับด้าน × ด้าน"
  },
  hoverMessage: "กดเพื่อดูรายละเอียด"
});
```

ใช้ `objectiveAction: true` เฉพาะเมื่อการกดเป็นการลงมือหลักของกิจกรรม `onClick` และ callback ของ `insight` ได้ event `{ handle, object, sourceEvent }`

### `world.addTargetFocus(options)`

สร้างวง focus animation สำหรับ sequence step:

```js
world.addTargetFocus({
  position: [4.2, 0.34, -0.8],
  radius: 2.05,
  color: "#7857ff"
});
```

ค่า `opacity` ใช้ลดความเด่นของวง และกำหนด `animate: false` เมื่อต้องการวงเส้นประนิ่งที่ใช้เป็นสเกลหรือขอบเขตอ้างอิงแทนวง Focus โดยตำแหน่งจะไม่หมุนหรือ pulse จนคลาดจากวัตถุ นอกจากนี้ปรับ motion รายวงได้ด้วย `rotateSpeed`, `pulseScale` และ `opacityPulse`

### `world.addGuideline(options)`

สร้างเส้นประพร้อมหัวลูกศร:

```js
world.addGuideline({
  fromObject: box.object3D,
  to: [4.2, 0.35, -0.8],
  color: "#6049c7"
});
```

ใช้ `object3D` เพื่อส่งเป็น `fromObject` เท่านั้น ห้ามแก้ material/geometry/internal userData โดยตรง

### `world.addLineRender(options)`

สร้างเส้นสำหรับแกนวัด ระยะ เส้นพรีวิว หรือกรอบ polygon พร้อมหัวลูกศรที่ปลายเส้น รูปแบบเดิมใช้ `from`/`to`:

```js
world.addLineRender({
  name: "axis-x",
  from: [-2, 0.24, 1],
  to: [2, 0.24, 1],
  color: "#ef6a58",
  dashed: false,
  arrow: true
});
```

ใช้ `dashed: true` สำหรับเส้นช่วยที่ต้องการลดความเด่น และ `arrow: false` สำหรับเส้นแบ่งระยะที่ไม่มีทิศทาง

เมื่อต้องการเส้นหลายช่วงให้ส่ง `points` อย่างน้อยสองตำแหน่ง และใช้ `closed: true` เพื่อเชื่อมจุดสุดท้ายกลับจุดแรก:

```js
world.addLineRender({
  name: "answer-outline",
  points: [
    [-2, 0.32, -1], [2, 0.32, -1],
    [2, 0.32, 1], [-2, 0.32, 1]
  ],
  closed: true,
  dashed: false,
  arrow: false,
  color: "#ff8a00"
});
```

วางค่า Y เหนือพื้นหรือ Zone เล็กน้อยเพื่อป้องกัน z-fighting ถ้าใช้ `points` ระบบจะไม่อ่าน `from`/`to`

### Cue และ entrance

- `world.showDragCue(handle, to)` — แสดงมือสาธิตลาก
- `world.hideDragCue()` — ซ่อน cue และต้องเรียกตอนเปลี่ยน step/dispose
- `world.playEntrance()` — เล่น spawn animation ของ scene

Runtime เรียก entrance ให้อัตโนมัติหลังเปิดขั้นแรกของ Lab และหลัง reset แต่ละข้อใน Quiz จึงห้ามเรียกซ้ำจาก `reset()` หรือฟังก์ชัน render ของบทเรียน เพราะวัตถุจะ scale เข้า 2 รอบ ใช้ API นี้เมื่อมีปุ่มหรือ interaction ที่ต้องการเล่น entrance ซ้ำโดยตั้งใจเท่านั้น
- `world.camera.reset()` — reset camera
- `world.camera.configure(options)` — เปลี่ยน camera config (ปกติใช้ `meta.camera`)
- `world.camera.focus({ position, normal })` — หันกล้องอย่างนุ่มไปยังจุดและแนว normal ที่กำหนด โดยคงระยะซูม, FOV และข้อจำกัดกล้องเดิม; การหมุน/ซูมของผู้เรียนจะยกเลิก transition ที่กำลังเล่น
- `world.getObject(name)` — ค้น object ด้วยชื่อ; ใช้ handle ที่เก็บไว้จะปลอดภัยกว่า
- `world.clear()` — ล้าง lesson world; runtime จัดการให้ก่อน reset อยู่แล้ว

## Handle

Handle ที่ `add...` คืนมามี:

- `setPosition(x, y, z)` — snap และกำหนด ground Y ใหม่
- `setRotation(x, y, z)` — กำหนดมุมเป็นองศา
- `setScale(x, y?, z?)`
- `animateTo(x, y, z, { duration, delay, arcHeight })`
- `stopAnimation()`
- `playCommit()`
- `setColor(color)`
- `setVisible(value)`
- `setDraggable(value)`
- `setClickable(value)`
- `remove()`
- `object3D` — opaque reference สำหรับ guideline; หลีกเลี่ยงการแก้ internals

## UI

### Step progression และ Mascot dialogue

กำหนด `requiresCompletion: true` ใน Step ที่ห้ามข้าม แล้วปลดล็อกเมื่อกิจกรรมสำเร็จ:

```js
howto: [{
  index: 0,
  title: "วางชิ้นแรก",
  type: "sequence",
  desc: "ลากชิ้นลงกรอบก่อนจึงไปต่อ",
  requiresCompletion: true,
  option: {
    type: "instruction",
    header: "เริ่มจากชิ้นที่รู้ค่า",
    message: "ตรวจด้านและมุมของชิ้นแรกก่อนลากลงกรอบ"
  }
}]

// เรียกเมื่อผ่านเงื่อนไขของ Step
context.ui.steps.setNextEnabled(true);
```

`option.type` รองรับ `instruction`, `hint` และ `feedback`: instruction แสดง bubble ทันที, hint อาจแสดงเป็น notice ก่อนบนจอใหญ่และเปิดอัตโนมัติตามเวลาของ Runtime, feedback ส่งเป็นสถานะสำเร็จ ควรเขียนบทพูดเฉพาะแต่ละขั้นและไม่ใช้ประโยคแนะนำทั่วไปซ้ำทั้งบท

อ่านรายละเอียดและตัวอย่างครบที่ [`GUI_SERVICE_REFERENCE.md`](GUI_SERVICE_REFERENCE.md)

บทเรียนใหม่ใช้ GUI กลางผ่าน:

- `context.ui.question` — โจทย์หลักด้านบน
- `context.ui.console` — Objective, คำอธิบาย และ feedback ใน Console
- `context.ui.topMessage` — ประกาศสั้นด้านบนที่ไม่ใช่โจทย์
- `context.ui.choice` — ตัวเลือกที่กดได้เหนือ Console
- `context.ui.gizmo` — GUI 2D ที่ติดตาม object หรือพิกัด World
- `context.ui.worldOption` — popup คำสั่งแนวตั้งที่ติดตาม object 3D และส่ง Event กลับบทเรียน
- `context.ui.worldGuiSystem` — ป้ายข้อมูลขนาดเล็กที่ยึดกับ object หรือพิกัด World
- `context.ui.clickme` — มือแบ/มือกำบอกวัตถุที่ลาก/กดได้แบบ opt-in ตามที่ Admin/Dev ระบุ
- `context.ui.feedback` — ผลลัพธ์สั้นแบบไม่บล็อก
- `context.ui.dialog` — Popup แบบบล็อกสำหรับข้อความสำคัญ/การยืนยัน
- `context.ui.insight` — Popup อธิบายพื้นที่หรือวัตถุที่ผู้เรียนกด รองรับ safe structured HTML
- `context.ui.intro` — iframe เกือบเต็มหน้าจอสำหรับอ่านหรือทำ Interactive จาก URL ภายใน/ภายนอก และบล็อก interaction ของบทเรียนหลักจนกว่าจะปิด
- `context.ui.control` — เมนูปุ่ม utility มุมขวาบน/กลาง/ล่าง ไม่ใช่คำตอบ
- `context.ui.hint` — คำแนะนำผ่าน Mascot กลาง
- `context.ui.busy` — Overlay ระหว่างรอ async task

`context.ui.gizmo` ไม่ใช่ `world.addCallout()`: Gizmo ใช้กับ object/value/status แบบ Screen-space ส่วน Callout ใช้ป้ายและเส้นชี้พื้นที่ในฉาก

`context.ui.worldOption.attach(target, { title, message, items, onSelect })` ใช้เมื่อการกด object ต้องเปิดรายการคำสั่งใกล้วัตถุ Handle รองรับ `show()`, `hide()`, `toggle()`, `setItems()`, `setDisabled()`, `setTarget()` และ `remove()`; ค่าเริ่มต้นจะปิด panel หลังเลือกหนึ่งคำสั่ง และปิดเมื่อกดพื้นที่ว่างของฉาก หากต้องบังคับให้ผู้เรียนเลือกคำสั่งให้ตั้ง `dismissible: false`

`context.ui.worldGuiSystem` ใช้เมื่อข้อมูลสั้นต้องเกาะกับตำแหน่งหรือโมเดลโดยไม่สร้างวัตถุ 3D เพิ่ม รองรับ `attach(target, options)`, `at(position, options)`, `get(id)` และ `clear(scope)` ส่วน `debug` เป็นเครื่องมือ System-owned สำหรับทีม Dev บทเรียนห้ามเปิดเอง

`context.ui.clickme.attach(handle, { size, scale, anchor: "bottom", offset: [0, 0, 0] })` ใช้เฉพาะ handle ของวัตถุ draggable/clickable ที่ Admin/Dev ขอให้ชี้ ไม่ใส่ทุกวัตถุเอง ระบบซ่อนระหว่างสอน/มือไกด์ไลน์/ลาก และกลับมาเมื่อวางพลาด; ใช้ `restoreFor(handle)` เมื่อย้ายวัตถุกลับเอง, `completeFor(handle)` เมื่อสำเร็จ, `clearAll()` เมื่อล้างฉาก ค่าหน้าตาตั้งที่ `mainWorldSetting.ui.clickme` ใน Runtime Setting (F6)

`context.ui.intro.open({ url, title, label, source: "control" })` เปิดเนื้อหาเสริมโดยไม่ส่ง function ไปกลับกับหน้า iframe การปิดจาก Control ไม่เปลี่ยน Step หากกำหนด `howto[].intro = { url, title, label }` Runtime จะเปิดอัตโนมัติและเลื่อนไป Step ถัดไปเมื่อปิด เว็บไซต์ภายนอกต้องอนุญาตการ embed ผ่าน iframe

```js
context.ui.question.show({ text: "4 + 2 = ?" });
context.ui.console.setObjective("เป้าหมาย: หาผลรวมให้ถูกต้อง");

context.ui.choice.show({
  scope: "question",
  title: "เลือกคำตอบ",
  items: [4, 6, 8],
  onSelect(event) {
    context.quiz.answer(Number(event.value) === 6, { answer: Number(event.value) });
  }
});

context.ui.gizmo.attach(box, {
  scope: "scene",
  type: "label",
  text: "ลากกล่องนี้",
  worldOffset: [0, 1.2, 0]
});

const objectMenu = context.ui.worldOption.attach(cat, {
  visible: false,
  title: "เลือกคำสั่ง",
  items: [
    { id: "rotate", label: "หมุน" },
    { id: "left", label: "ขยับซ้าย" }
  ],
  onSelect(event) { runCommand(event.id); }
});
// เรียก objectMenu.toggle() จาก onClick ของ cat

context.ui.worldGuiSystem.attach(box, {
  id: "box-value",
  scope: "step",
  text: "กล่องตัวอย่าง",
  tone: "info",
  anchor: "top"
});
```

Gizmo รองรับ `size: "large"` และ `segments: [{ text, color, role }]` สำหรับป้ายหลายสี โดยใช้ `role: "exponent"` เมื่อต้องแสดงเลขชี้กำลัง

Choice เรียก objective action ให้อัตโนมัติ ระบบล้าง UI ตาม `scope` (`lesson`, `scene`, `step`, `question`, `manual`) และจัด mobile layout ให้ จึงห้ามสร้าง GUI ที่ระบบกลางรองรับด้วย HTML/CSS เอง Control ของบทเรียนถูก phase policy กลางซ่อนระหว่างขั้นสอนแม้เรียก `show()` และจะแสดงได้ใน Lab ขั้นสุดท้าย/การทดลองหรือ Quiz ดู signature และตัวอย่างทั้งหมดใน `GUI_SERVICE_REFERENCE.md`

### Compatibility API

```js
context.ui.setObjective("เป้าหมาย: ลากกล่องไปยังพื้นที่คำตอบ");
context.ui.setQuestion("4 + 2 = ?");
context.ui.toast("ทำได้ถูกต้อง!", "success");
context.ui.setProgress(2, 4);
```

- `setQuestion(text)` แสดงโจทย์ด้วย UI มาตรฐานด้านบนของฉาก เป็น screen-space จึงไม่หมุนตามกล้อง บทเรียนส่งเฉพาะข้อความ
- `clearQuestion()` ซ่อน UI โจทย์ ปกติ runtime จะล้างให้อัตโนมัติก่อน reset/close
- `setObjective(text)` แสดงเป้าหมายใน Main Console ด้านล่าง
- `toast(text, type)` อัปเดตข้อความสถานะภายใน Main Console และค้างไว้จนกว่าจะมีสถานะใหม่หรือเปลี่ยน Step รองรับ `success`, `warning`, `error`, `info`; ห้ามสร้าง panel ชั่วคราวเอง

ห้ามใช้ `addText3D`, callout หรือ group มาสร้างป้ายโจทย์หลักซ้ำบน world-space หากเนื้อหาต้องอ่านคงที่ ให้ใช้ `setQuestion()`

ใน Quiz ห้าม toast บอกถูก/ผิดระหว่างทำ

## Audio

```js
context.audio.play("success");
```

ชื่อมาตรฐานที่ runtime ปัจจุบันรองรับ: `onClick`, `onDrag`, `onDrop`, `onUiBtnClick`, `success`, `fail`, `nextQuest`, `startLesson`, `completeLesson`

การลากและวางมี system SFX อยู่แล้ว อย่าเรียกเสียงซ้ำทุก pointer move

## Quiz และ Complete

```js
context.quiz.answer(correct, {
  leftCount,
  rightCount,
  operator
});

context.complete({ score: 1, total: 1 });
```

`details` ต้องเป็นข้อมูล plain object ที่ serialize ได้ และควรเพียงพอให้ host แสดงเฉลยภายหลัง

ทุกการเรียก `context.quiz.answer(...)` ที่ Runtime รับได้ถือว่าเป็นการตอบแล้ว ปุ่มของระบบต้องเปลี่ยนเป็น “ต่อไป” และในข้อสุดท้ายเป็น “ส่งคำตอบ” โดยไม่ขึ้นกับค่า `correct` บทเรียนห้ามสร้างปุ่มเหล่านี้เองหรือบังคับให้ตอบถูกก่อน



