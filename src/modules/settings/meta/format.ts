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
