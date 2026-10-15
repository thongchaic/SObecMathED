export const LESSON_ENVIRONMENT_PRESETS = Object.freeze(["standard", "day", "night"]);

const isPlainObject = value => value !== null && typeof value === "object" && !Array.isArray(value);

export function normalizeLessonPresentation(value) {
  if (value == null) {
    return {
      mascot: { enabled: true },
      environment: { preset: null }
    };
  }
  if (!isPlainObject(value)) throw new Error("lesson_meta.presentation ต้องเป็น object");

  const mascot = value.mascot == null ? {} : value.mascot;
  const environment = value.environment == null ? {} : value.environment;
  if (!isPlainObject(mascot)) throw new Error("lesson_meta.presentation.mascot ต้องเป็น object");
  if (!isPlainObject(environment)) throw new Error("lesson_meta.presentation.environment ต้องเป็น object");
  if (mascot.enabled != null && typeof mascot.enabled !== "boolean") {
    throw new Error("lesson_meta.presentation.mascot.enabled ต้องเป็น boolean");
  }
  if (environment.preset != null && !LESSON_ENVIRONMENT_PRESETS.includes(environment.preset)) {
    throw new Error(`lesson_meta.presentation.environment.preset ไม่รองรับค่า ${environment.preset}`);
  }

  return {
    mascot: { enabled: mascot.enabled !== false },
    environment: { preset: environment.preset ?? null }
  };
}
