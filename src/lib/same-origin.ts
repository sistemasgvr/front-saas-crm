export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const incoming = new URL(origin);
    const internal = new URL(request.url);
    // El proxy puede conectar por HTTP aunque el navegador use HTTPS.
    const host = request.headers.get("host") ?? internal.host;
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
      internal.protocol.slice(0, -1);
    return (
      ["http", "https"].includes(protocol) &&
      incoming.host === host &&
      incoming.protocol === `${protocol}:`
    );
  } catch {
    return false;
  }
}
