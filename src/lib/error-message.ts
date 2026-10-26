/** Mensaje apto para pantallas y notificaciones, incluso ante un fallo de RSC. */
export function errorMessage(
  error: unknown,
  fallback = "No se pudo completar la acción. Intenta de nuevo.",
): string {
  const message = error instanceof Error ? error.message.trim() : "";
  if (!message || /minified react error|server components render|\bdigest\b|#4\d{2}\b|internal\s*server\s*error/i.test(message)) {
    return fallback;
  }
  return message;
}
