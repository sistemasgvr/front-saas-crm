export function formatearFechaMeta(iso: string | null, fallback = "—") {
  if (!iso) return fallback;
  return new Date(iso).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function formatearMonto(valor: number | null, moneda: string | null, fallback = "—") {
  if (valor === null) return fallback;
  try {
    return new Intl.NumberFormat("es-PE", { style: "currency", currency: moneda ?? "USD" }).format(valor);
  } catch {
    return valor.toFixed(2);
  }
}

/** YYYY-MM-DD en zona America/Lima para inputs `type="date"`. */
export function aFechaInput(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export function hoyFechaInput(): string {
  return aFechaInput(new Date());
}
