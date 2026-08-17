export function toFormData(values: Record<string, unknown>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    if (typeof value === "boolean") {
      if (value) formData.append(key, "on");
      continue;
    }
    formData.append(key, String(value));
  }
  return formData;
}
