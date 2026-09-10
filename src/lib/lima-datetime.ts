/**
 * America/Lima es UTC-5 fijo (sin DST). Usar para inputs datetime-local del CRM.
 */

const OFFSET_LIMA = "-05:00";

const FORMATTER_LIMA_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Lima",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Convierte valor de input datetime-local (sin zona) a ISO UTC, como hora de Lima. */
export function datetimeLocalAISO(valor: string): string {
  if (!valor) return valor;
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(valor)) {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toISOString();
  }
  const m = valor.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = new Date(valor);
    return Number.isNaN(d.getTime()) ? valor : d.toISOString();
  }
  const sec = m[3] ?? "00";
  const d = new Date(`${m[1]}T${m[2]}:${sec}.000${OFFSET_LIMA}`);
  return Number.isNaN(d.getTime()) ? valor : d.toISOString();
}

/** ISO → valor para input datetime-local en calendario Lima. */
export function isoADatetimeLocalLima(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = FORMATTER_LIMA_PARTS.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  let hour = get("hour");
  if (hour === "24") hour = "00";
  return `${get("year")}-${get("month")}-${get("day")}T${hour}:${get("minute")}`;
}
