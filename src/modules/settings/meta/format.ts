export function formatearFechaMeta(iso: string | null, fallback = "—") {
  if (!iso) return fallback;
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}
