export type Vec2 = [number, number];
export type Vec3 = [number, number, number];
export type LessonMode = "teacher-lab" | "student-lab" | "student-quiz";
export type DragAxis = "xz" | "xy";
export type PrimitiveShape =
  | "box" | "rounded-box" | "sharp-box"
  | "sphere" | "hemisphere"
  | "cylinder" | "half-cylinder" | "quarter-cylinder"
  | "cone" | "pyramid" | "prism" | "frustum" | "capsule"
  | "sector" | "sector-flat" | "ring-sector" | "ring-sector-flat" | "tube"
  | "torus" | "torus-knot" | "circle" | "plane" | "arrow-flat" | "ring"
  | "star" | "heart" | "cross" | "wedge"
  | "tetrahedron" | "octahedron" | "dodecahedron" | "icosahedron" | "diamond"
  | "polygon" | "polygon-flat" | "polyhedron" | "lathe" | "spline-tube"
  | "cube" | "cuboid" | "rectangle" | "rectangle-flat" | "triangle"
  | "semicircle" | "semi-cylinder" | "quarter-circle" | "pie" | "pie-slice"
  | "annular-sector" | "arc" | "disc" | "donut" | "extrude-polygon" | "custom-polyhedron" | "path-tube";
export type GuiScope = "lesson" | "scene" | "step" | "question" | "manual";
export type GuiTone = "default" | "primary" | "info" | "success" | "warning" | "error";

export interface DropPosition { x: number; y: number; z: number }
export type DropResult = boolean | { accepted?: boolean; commit?: boolean } | void;

export interface LessonHandle {
  /** Opaque scene reference. Use primarily as addGuideline.fromObject. */
  readonly object3D: unknown;
  setPosition(x: number, y: number, z: number): void;
  setRotation(x?: number, y?: number, z?: number): void;
  setScale(x?: number, y?: number, z?: number): void;
  animateTo(x: number, y: number, z: number, options?: { duration?: number; delay?: number; arcHeight?: number }): void;
  stopAnimation(): void;
  playCommit(): void;
  setColor(color: string | number): void;
  setVisible(value: boolean): void;
  setDraggable(value: boolean): void;
  setClickable(value: boolean): void;
  /** เพิ่ม/ลบ hit area ที่มองไม่เห็น โดยไม่เปลี่ยนขนาดโมเดลจริง */
  setHitArea(size?: Vec3 | null, offset?: Vec3): void;
  /** true ทำให้จุดจับกระโดดมาอยู่กลางวัตถุ เหมาะกับ source hit area ขนาดใหญ่ */
  setDragFromCenter(value: boolean): void;
  remove(): void;
}

export interface CalloutHandle extends LessonHandle {
  setText(text: string | number): CalloutHandle;
}

export interface LessonMaterialOptions {
  color?: string | number;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  clearcoatRoughness?: number;
  emissive?: string | number;
  emissiveIntensity?: number;
  texture?: string;
  depthWrite?: boolean;
}

/** ตัวเลือก geometry ใช้หน่วยเป็นสัดส่วนก่อนคูณด้วย size; มุมใช้ degree */
export interface ProceduralGeometryOptions {
  /** ความละเอียดผิว 6-96 */
  segments?: number;
  /** จำนวนด้านของ prism/pyramid/frustum 3-32 */
  sides?: number;
  /** จำนวนแฉกของ star 3-16 */
  points?: number;
  /** มุมเริ่มต้นของ sector/ring-sector */
  startAngle?: number;
  /** ขนาดมุมของ sector/ring-sector 1-360 */
  angle?: number;
  /** สัดส่วนรัศมีด้านในของ ring/ring-sector/tube หรือรัศมีด้านในของ star */
  innerRadius?: number;
  /** สัดส่วนความหนาของ torus/torus-knot */
  tube?: number;
  /** สัดส่วนรัศมีบนและล่างของ frustum */
  topRadius?: number;
  bottomRadius?: number;
  /** จำนวนรอบของ torus-knot */
  p?: number;
  q?: number;
  /** เปิดฝาบน/ล่างของ cylinder/cone/prism/pyramid/frustum */
  openEnded?: boolean;
  /** ความมนของ box/rounded-box 0.01-0.24 */
  radius?: number;
  /** จุดขอบของ polygon เป็น [x,z] หรือจุดของ polyhedron เป็น [x,y,z] */
  vertices?: Vec2[] | Vec3[];
  /** ช่องว่างภายใน polygon แต่ละวงมีอย่างน้อย 3 จุด */
  holes?: Vec2[][];
  /** หน้า polyhedron; แต่ละหน้ารองรับตั้งแต่สามจุดและระบบ triangulate ให้อัตโนมัติ */
  faces?: number[][];
  /** index สามเหลี่ยมแบบ flat สำหรับ polyhedron */
  indices?: number[];
  /** เส้นหน้าตัด [radius,y] สำหรับ lathe */
  profile?: Vec2[];
  /** แนวเส้น [x,y,z] สำหรับ spline-tube */
  path?: Vec3[];
  /** true เป็นค่าเริ่มต้น: จัดจุดให้อยู่กลางและ normalize ก่อนคูณ size */
  normalize?: boolean;
  /** แนวของรูปทรงแบน: front (XY), ground/xz หรือ side/yz */
  orientation?: "front" | "ground" | "horizontal" | "xz" | "side" | "yz";
  radialSegments?: number;
  closed?: boolean;
  curveType?: "centripetal" | "chordal" | "catmullrom";
  tension?: number;
}

export interface PrimitivePart {
  shape?: PrimitiveShape;
  geometry?: ProceduralGeometryOptions;
  size?: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  color?: string | number;
  material?: LessonMaterialOptions;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface LessonObjectOptions {
  name?: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
  outlineMode?: "all" | "primary" | "none";
  draggable?: boolean;
  clickable?: boolean;
  /** Set false when click runs a custom group effect and must not show the platform hover/select marker. */
  selectionFeedback?: boolean;
  dragAxis?: DragAxis;
  /** Optional extra lift while dragging an object that starts partly below a surface. */
  dragLiftHeight?: number;
  /** Invisible interaction bounds; useful when the visible model is too small to touch. */
  hitArea?: Vec3;
  hitAreaOffset?: Vec3;
  dragFromCenter?: boolean;
  objectiveAction?: boolean;
  hoverMessage?: string;
  guideTarget?: Vec3 | null;
  onDrag?: (position: DropPosition) => void;
  onDrop?: (position: DropPosition, handle: LessonHandle) => DropResult;
  onClick?: (event: { handle: LessonHandle; object: unknown; hitPoint: DropPosition }) => void;
}

export interface OperatorHandle extends LessonHandle {
  pulse(): void;
  setState(valid: boolean): void;
}

export interface WorldCounterHandle extends LessonHandle {
  readonly digits: number;
  setValue(value: number): number;
  getValue(): number;
}

export interface WorldGuiHandle extends LessonHandle {
  setText(text: string): string;
  getText(): string;
}

export interface WorldGuiActionEvent {
  handle: WorldGuiHandle;
  object: unknown;
  sourceEvent: unknown;
}

export interface LessonWorld {
  clear(): void;
  readonly capabilities: {
    readonly version: string;
    readonly objects: readonly string[];
    readonly primitiveShapes: readonly PrimitiveShape[];
    readonly interactions: readonly string[];
    readonly modelFormats: readonly string[];
  };
  readonly assets: LessonAssetLibrary;
  addPrimitive(options?: LessonObjectOptions & PrimitivePart): LessonHandle;
  addGroup(options?: LessonObjectOptions & { parts?: PrimitivePart[]; children?: PrimitivePart[] }): LessonHandle;
  addConnector(options?: { name?: string; from?: Vec3; to?: Vec3; color?: string | number; thickness?: number; opacity?: number }): LessonHandle;
  addText3D(options?: LessonObjectOptions & {
    text?: string | number;
    size?: Vec2;
    color?: string;
    background?: string;
    fontSize?: number;
    fontWeight?: number;
    depthTest?: boolean;
  }): LessonHandle;
  addLibraryObject(options: LessonObjectOptions & { asset: string; color?: string | number; opacity?: number; textureEnabled?: boolean; depthWrite?: boolean; targetSize?: number; normalize?: boolean }): LessonHandle | Promise<LessonHandle>;
  addObject(options: LessonObjectOptions & Record<string, unknown>): LessonHandle | Promise<LessonHandle>;
  addBox(options?: {
    name?: string;
    size?: Vec3;
    position?: Vec3;
    color?: string | number;
    draggable?: boolean;
    dragAxis?: DragAxis;
    hoverMessage?: string;
    guideTarget?: Vec3 | null;
    onDrag?: (position: DropPosition) => void;
    onDrop?: (position: DropPosition, handle: LessonHandle) => DropResult;
  }): LessonHandle;
  addZone(options?: { name?: string; size?: Vec3; position?: Vec3; color?: string | number; opacity?: number }): LessonHandle;
  addCallout(options?: { text?: string; position?: Vec3; compactPosition?: Vec3; anchor?: Vec3; color?: string | number; lineColor?: string | number; scale?: Vec2; compactScale?: Vec2; insight?: InsightOptions | string | ((event: { handle: CalloutHandle; object: unknown; hitPoint: DropPosition }) => InsightOptions | string | void); onClick?: LessonObjectOptions["onClick"]; objectiveAction?: boolean }): CalloutHandle;
  addLabel(options?: { text?: string; position?: Vec3; compactPosition?: Vec3; anchor?: Vec3; color?: string | number; lineColor?: string | number; scale?: Vec2; compactScale?: Vec2; insight?: InsightOptions | string | (() => InsightOptions | string | void); onClick?: LessonObjectOptions["onClick"] }): CalloutHandle;
  addWorldCounter(options?: {
    name?: string; position?: Vec3; compactPosition?: Vec3; rotation?: Vec3; scale?: number | Vec3; compactScale?: number | Vec3;
    value?: number; digits?: number; leadingZero?: boolean; digitSpacing?: number;
    edgeColor?: string | number; baseColor?: string | number; faceColor?: string | number; digitColor?: string | number; digitEmissive?: string | number;
  }): WorldCounterHandle;
  addWorldGui(options?: {
    name?: string; position?: Vec3; compactPosition?: Vec3; rotation?: Vec3; scale?: number | Vec3; compactScale?: number | Vec3;
    text?: string; size?: Vec2; maxLines?: number; fontSize?: number; fontWeight?: number;
    color?: string; textColor?: string; backgroundColor?: string | number; backgroundOpacity?: number; borderColor?: string | number; accentColor?: string;
    insight?: InsightOptions | string | ((event: WorldGuiActionEvent) => InsightOptions | string | void);
    onClick?: (event: WorldGuiActionEvent) => void;
    onHover?: (event: { hovered: boolean; handle: WorldGuiHandle; object: unknown }) => void;
    objectiveAction?: boolean; hoverMessage?: string; hitArea?: Vec3; hitAreaOffset?: Vec3;
  }): WorldGuiHandle;
  addOperatorSign(options?: { text?: "<" | ">" | "=" | "≠" | "<=" | ">=" | "≤" | "≥" | "+" | "-" | "−" | "×" | "x" | "X" | "÷"; position?: Vec3; scale?: Vec2; clickable?: boolean; onClick?: LessonObjectOptions["onClick"]; hoverMessage?: string; objectiveAction?: boolean; selectionFeedback?: boolean }): OperatorHandle;
  addGuideline(options?: { from?: Vec3; fromObject?: unknown; to?: Vec3; color?: string | number }): LessonHandle;
  addLineRender(options?: { name?: string; from?: Vec3; to?: Vec3; points?: Vec3[]; closed?: boolean; color?: string | number; opacity?: number; occludedOpacity?: number; dashed?: boolean; arrow?: boolean }): LessonHandle;
  addTargetFocus(options?: { position?: Vec3; radius?: number; color?: string | number; opacity?: number; animate?: boolean; rotateSpeed?: number; pulseScale?: number; opacityPulse?: number }): LessonHandle;
  showDragCue(handle: LessonHandle, to: Vec3): void;
  hideDragCue(): void;
  playEntrance(): void;
  getObject(name: string): unknown;
  readonly camera: {
    reset(): void;
    configure(options?: CameraOptions): void;
    focus(options: { position: Vec3; normal: Vec3 }): void;
  };
}

export interface LessonAssetInfo {
  id: string;
  name: string;
  type: string;
  tags: string[];
}

export interface LessonAssetLibrary {
  readonly version: string;
  list(): LessonAssetInfo[];
  get(id: string): Readonly<Record<string, unknown>>;
}

export interface CameraOptions {
  fov?: number;
  startYaw?: number;
  startPitch?: number;
  startDistance?: number;
  minDistance?: number;
  maxDistance?: number;
  minPitch?: number;
  maxPitch?: number;
  target?: Vec3;
}

export interface EditSchemaItem {
  key: string;
  name: string;
  type: "slider" | "dropdown";
  option: [number, number] | Array<string | number | { value: string | number; label: string }>;
  step?: number;
  help?: string;
  showWhen?: { key: string; value?: string | number; values?: Array<string | number> };
}

export interface HowToStep {
  index: number;
  title: string;
  type: "sequence" | "freestyle";
  desc: string;
  requiresCompletion?: boolean;
  option?: { type?: "instruction" | "hint" | "feedback"; header?: string; message: string };
  intro?: IntroStepOptions;
}

export type IntroStepOptions = ({ url: string; src?: never } | { url?: never; src: string }) & {
  title?: string;
  label?: string;
};

export type IntroOpenOptions = IntroStepOptions & {
  source?: "step" | "control" | string;
  onClose?: (event: { reason: string; source: string }) => void;
};

export interface IntroHandle {
  close(): boolean;
  readonly isOpen: boolean;
  readonly url: string;
}

export interface QuizQuestion {
  question: string;
  data: Array<{ key: string; value: unknown }>;
}

export interface LessonMeta {
  worldType: "3d-world-space";
  scenePersistence?: "reset" | "lesson";
  lessonId: string;
  title: string;
  category: string;
  subcategory: string;
  description: string;
  keyResult: string;
  background?: string;
  camera?: CameraOptions;
  welcomeMessage?: string[];
  tooltip?: string;
  defaultValue: Record<string, unknown>;
  editSchema: EditSchemaItem[];
  editRestartStep?: number;
  howto: HowToStep[];
  quiz: QuizQuestion[];
}

export interface GuiHandle {
  readonly id: string;
  readonly scope: GuiScope;
  update(options?: Record<string, unknown>): GuiHandle;
  show(): GuiHandle;
  hide(): GuiHandle;
  remove(): void;
}

export interface ChoiceItem {
  id?: string | number;
  value?: unknown;
  label: string;
  icon?: string;
  image?: string;
  disabled?: boolean;
}

export interface ChoiceHandle extends GuiHandle {
  readonly value: string | string[] | null;
  setItems(items: Array<ChoiceItem | string | number>): ChoiceHandle;
  setSelected(value: string | number | Array<string | number> | null): ChoiceHandle;
  setDisabled(value: string | number, disabled?: boolean): ChoiceHandle;
}

export interface GizmoHandle extends GuiHandle {
  setTarget(target: LessonHandle | unknown): GizmoHandle;
}

export interface WorldOptionItem extends ChoiceItem {
  onSelect?: (event: WorldOptionSelectEvent) => void;
}

export interface WorldOptionSelectEvent {
  id: string;
  value: unknown;
  item: WorldOptionItem;
  target: LessonHandle | unknown;
  handle: WorldOptionHandle;
  sourceEvent: Event;
}

export interface WorldOptionOptions {
  id?: string;
  scope?: GuiScope;
  title?: string;
  message?: string;
  tone?: GuiTone;
  placement?: "top" | "bottom" | "left" | "right";
  worldOffset?: Vec3;
  offset?: [number, number];
  gap?: number;
  visible?: boolean;
  autoFocus?: boolean;
  dismissible?: boolean;
  closeOnSelect?: boolean;
  multiple?: boolean;
  objectiveAction?: boolean;
  items: Array<WorldOptionItem | string | number>;
  onSelect?: (event: WorldOptionSelectEvent) => void;
}

export interface WorldOptionHandle extends GuiHandle {
  readonly visible: boolean;
  setItems(items: Array<WorldOptionItem | string | number>): WorldOptionHandle;
  setDisabled(value: string | number, disabled?: boolean): WorldOptionHandle;
  setTarget(target: LessonHandle | unknown): WorldOptionHandle;
  toggle(): WorldOptionHandle;
  close(): WorldOptionHandle;
}

export interface WorldGuiSystemOptions {
  id?: string;
  scope?: GuiScope;
  text?: string | number;
  tone?: GuiTone;
  variant?: "label" | "coordinate" | "transform";
  size?: "small" | "medium" | "large";
  anchor?: "top" | "center" | "origin";
  offset?: Vec3;
  screenOffsetY?: number;
  visible?: boolean;
  className?: string;
  onClick?: (event: { id: string; handle: WorldGuiSystemHandle; target: unknown; element: unknown }) => void;
}

export interface WorldGuiSystemHandle {
  readonly id: string;
  readonly scope: GuiScope;
  readonly element: unknown;
  update(options?: Partial<WorldGuiSystemOptions>): WorldGuiSystemHandle;
  setText(text: string | number): WorldGuiSystemHandle;
  setTarget(target: LessonHandle | Vec3 | unknown): WorldGuiSystemHandle;
  show(): WorldGuiSystemHandle;
  hide(): WorldGuiSystemHandle;
  remove(): void;
}

export interface ControlHandle extends GuiHandle {
  setItems(items: ChoiceItem[]): ControlHandle;
  setDisabled(value: string | number, disabled?: boolean): ControlHandle;
}

export interface DialogHandle {
  readonly id: string;
  readonly scope: GuiScope;
  update(options?: Partial<DialogOptions>): DialogHandle;
  close(reason?: string): void;
  remove(reason?: string): void;
}

export interface BusyHandle {
  readonly id: string;
  readonly scope: GuiScope;
  update(options?: Partial<BusyOptions>): BusyHandle;
  setProgress(value: number, message?: string): BusyHandle;
  hide(): void;
  remove(): void;
}

export interface DialogOptions {
  id?: string;
  scope?: GuiScope;
  title?: string;
  message?: string;
  icon?: string;
  tone?: GuiTone;
  primaryLabel?: string;
  secondaryLabel?: string;
  dismissible?: boolean;
  sections?: Array<{ title?: string; message?: string; text?: string }>;
  onPrimary?: (event: { id: string; action: "primary"; handle: DialogHandle }) => void;
  onSecondary?: (event: { id: string; action: "secondary"; handle: DialogHandle }) => void;
  onClose?: (event: { id: string; reason: string; handle: DialogHandle }) => void;
}

export interface InsightOptions extends Omit<DialogOptions, "sections"> {
  /** Safe rich content. Runtime allows only semantic tags and insight-* classes. */
  html?: string;
  contentHtml?: string;
  sections?: Array<{ title?: string; message?: string; text?: string }>;
}

export interface BusyOptions {
  id?: string;
  scope?: GuiScope;
  title?: string;
  message?: string;
  tone?: GuiTone;
  progress?: number;
}

export interface TopMessageOptions {
  id?: string;
  scope?: GuiScope;
  title?: string;
  message?: string;
  text?: string;
  icon?: string;
  tone?: GuiTone;
  duration?: number;
  dismissible?: boolean;
}

export interface ChoiceOptions {
  id?: string;
  scope?: GuiScope;
  title?: string;
  tone?: GuiTone;
  layout?: "auto" | "row" | "grid";
  selection?: "single" | "multiple";
  selected?: string | number | Array<string | number>;
  items: Array<ChoiceItem | string | number>;
  objectiveAction?: boolean;
  onSelect?: (event: { id: string; value: unknown; item: ChoiceItem; selected: string[]; handle: ChoiceHandle }) => void;
}

export interface LessonUi {
  readonly steps: {
    setNextEnabled(enabled: boolean): void;
  };
  readonly question: {
    show(options: string | { label?: string; text: string; tone?: GuiTone }): unknown;
    update(options: { label?: string; text?: string; tone?: GuiTone }): unknown;
    hide(): unknown;
    remove(): unknown;
  };
  readonly guiAnswer: {
    show(options?: string | { label?: string; text?: string; icon?: string; state?: "neutral" | "correct" | "wrong"; celebrate?: boolean }): unknown;
    update(options?: string | { label?: string; text?: string; icon?: string; state?: "neutral" | "correct" | "wrong"; celebrate?: boolean }): unknown;
    correct(options?: string | { label?: string; text?: string; icon?: string; celebrate?: boolean }): unknown;
    wrong(options?: string | { label?: string; text?: string; icon?: string }): unknown;
    reset(options?: string | { label?: string; text?: string; icon?: string }): unknown;
    hide(): unknown;
    remove(): unknown;
    readonly state: Readonly<{ label: string; text: string; icon: string; state: string }>;
  };
  readonly console: {
    set(options: string | { objective?: string; title?: string; message?: string; icon?: string; tone?: GuiTone; state?: GuiTone }): unknown;
    update(options: { objective?: string; title?: string; message?: string; icon?: string; tone?: GuiTone; state?: GuiTone }): unknown;
    feedback(message: string, options?: { tone?: GuiTone }): unknown;
    setObjective(message: string): unknown;
    reset(): unknown;
  };
  readonly topMessage: {
    show(options: TopMessageOptions | string): GuiHandle;
    success(message: string, options?: TopMessageOptions): GuiHandle;
    info(message: string, options?: TopMessageOptions): GuiHandle;
    warning(message: string, options?: TopMessageOptions): GuiHandle;
    error(message: string, options?: TopMessageOptions): GuiHandle;
    readonly current: GuiHandle | null;
    hide(): void;
  };
  readonly choice: {
    show(options: ChoiceOptions): ChoiceHandle;
    create(options: ChoiceOptions): ChoiceHandle;
    get(id: string): ChoiceHandle | null;
    clear(scope?: GuiScope): void;
  };
  readonly gizmo: {
    attach(target: LessonHandle | unknown, options?: GizmoOptions): GizmoHandle;
    at(position: Vec3, options?: GizmoOptions): GizmoHandle;
    get(id: string): GizmoHandle | null;
    clear(scope?: GuiScope): void;
  };
  readonly worldOption: {
    attach(target: LessonHandle | unknown, options: WorldOptionOptions): WorldOptionHandle;
    show(target: LessonHandle | unknown, options: WorldOptionOptions): WorldOptionHandle;
    get(id: string): WorldOptionHandle | null;
    dismiss(): void;
    hide(): void;
    clear(scope?: GuiScope): void;
  };
  readonly worldGuiSystem: {
    at(position: Vec3, options?: WorldGuiSystemOptions): WorldGuiSystemHandle;
    attach(target: LessonHandle | unknown, options?: WorldGuiSystemOptions): WorldGuiSystemHandle;
    get(id: string): WorldGuiSystemHandle | null;
    clear(...scopes: GuiScope[]): void;
    readonly counts: { readonly labels: number; readonly debugLabels: number };
  };
  readonly clickme: {
    attach(target: LessonHandle | unknown, options?: { size?: number; scale?: number; anchor?: "top" | "bottom"; offset?: Vec3 }): { complete(): void; restore(): void; remove(): void };
    suspendFor(target: LessonHandle | unknown): void;
    restoreFor(target: LessonHandle | unknown): void;
    completeFor(target: LessonHandle | unknown): void;
    finishFor(target: LessonHandle | unknown, options?: { completed?: boolean }): void;
    clearAll(): void;
  };
  readonly feedback: {
    show(options: string | { id?: string; scope?: GuiScope; title?: string; message?: string; text?: string; icon?: string; tone?: GuiTone; duration?: number; dismissible?: boolean }): GuiHandle;
    success(message: string, options?: Record<string, unknown>): GuiHandle;
    info(message: string, options?: Record<string, unknown>): GuiHandle;
    warning(message: string, options?: Record<string, unknown>): GuiHandle;
    error(message: string, options?: Record<string, unknown>): GuiHandle;
    get(id: string): GuiHandle | null;
    clear(scope?: GuiScope): void;
  };
  readonly dialog: {
    show(options: DialogOptions | string): DialogHandle;
    alert(message: string, options?: DialogOptions): DialogHandle;
    confirm(message: string, options?: DialogOptions): Promise<boolean>;
    get(id: string): DialogHandle | null;
    closeAll(): void;
  };
  readonly insight: {
    show(options: InsightOptions | string): DialogHandle;
    explain(options: InsightOptions | string): DialogHandle;
    get(id: string): DialogHandle | null;
    close(): void;
  };
  readonly intro: {
    open(options: IntroOpenOptions | string): IntroHandle;
    close(options?: { notify?: boolean; reason?: string }): boolean;
    readonly isOpen: boolean;
    readonly element: HTMLElement;
  };
  readonly control: {
    show(options: { id?: string; scope?: GuiScope; ariaLabel?: string; tone?: GuiTone; position?: "top-right" | "middle-right" | "bottom-right"; items: ChoiceItem[]; objectiveAction?: boolean; onAction?: (event: { id: string; value: unknown; item: ChoiceItem; handle: ControlHandle }) => void }): ControlHandle;
    create(options: Record<string, unknown>): ControlHandle;
    get(id: string): ControlHandle | null;
    clear(scope?: GuiScope): void;
  };
  readonly hint: {
    show(options: string | { id?: string; scope?: GuiScope; title?: string; header?: string; message?: string; text?: string; type?: "instruction" | "hint" | "optional"; duration?: number }): GuiHandle;
    get(id?: string): GuiHandle | null;
    hide(): void;
    clear(scope?: GuiScope): void;
  };
  readonly busy: {
    show(options?: BusyOptions | string): BusyHandle;
    readonly current: BusyHandle | null;
    hide(): void;
  };
  /** Compatibility API. Prefer question/console services in new lessons. */
  toast(message: string, type?: GuiTone): void;
  setObjective(message: string): void;
  setQuestion(message: string): void;
  clearQuestion(): void;
  setProgress(current: number, total: number): void;
}

export interface GizmoOptions {
  id?: string;
  scope?: GuiScope;
  type?: "label" | "badge" | "value" | "icon" | "image";
  text?: string;
  value?: string | number;
  icon?: string;
  image?: string;
  tone?: GuiTone;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  worldOffset?: Vec3;
  offset?: Vec2;
  gap?: number;
  clamp?: boolean;
  priority?: number;
}

export interface LessonContext {
  readonly world: LessonWorld;
  readonly assets: LessonAssetLibrary;
  readonly capabilities: LessonWorld["capabilities"];
  readonly ui: LessonUi;
  readonly audio: { play(name: string): void };
  readonly root: HTMLElement;
  readonly lessonData: Readonly<Record<string, unknown>>;
  readonly mode: LessonMode;
  readonly language: string;
  objectiveAction(): void;
  readonly quiz: { answer(correct: boolean, details?: Record<string, unknown>): boolean };
  complete(result?: Record<string, unknown>): void;
}

export interface LessonResetPayload {
  values: Record<string, unknown>;
  mode: LessonMode;
  question?: QuizQuestion;
  questionIndex?: number;
}

export interface LessonDefinition {
  id: string;
  version: string;
  meta: LessonMeta;
  mount(context: LessonContext): void | Promise<void>;
  reset(payload: LessonResetPayload): void | Promise<void>;
  onStep(index: number, step: HowToStep): void | Promise<void>;
  dispose(): void | Promise<void>;
}

declare global {
  const PuzzleLesson: {
    define(definition: LessonDefinition): void;
  };
}
