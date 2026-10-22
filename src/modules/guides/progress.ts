export type GuideProgress = { step: number; completed: boolean };
export type GuideStorage = {
  welcomeSeen?: boolean;
  tours: Record<string, GuideProgress>;
};
export const GUIDE_VERSION = 1;
export const EMPTY_GUIDE_STORAGE: GuideStorage = { tours: {} };
export function guideStorageKey(userId: string, organizationId: string) {
  return `crm:guides:v${GUIDE_VERSION}:${organizationId}:${userId}`;
}
export function parseGuideStorage(raw: string): GuideStorage {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("tours" in value) ||
      !value.tours ||
      typeof value.tours !== "object"
    )
      return EMPTY_GUIDE_STORAGE;
    const tours: Record<string, GuideProgress> = {};
    for (const [id, item] of Object.entries(value.tours)) {
      if (
        item &&
        typeof item === "object" &&
        "step" in item &&
        typeof item.step === "number" &&
        Number.isInteger(item.step) &&
        item.step >= 0 &&
        "completed" in item &&
        typeof item.completed === "boolean"
      ) {
        tours[id] = { step: item.step, completed: item.completed };
      }
    }
    return {
      welcomeSeen: "welcomeSeen" in value && value.welcomeSeen === true,
      tours,
    };
  } catch {
    return EMPTY_GUIDE_STORAGE;
  }
}
