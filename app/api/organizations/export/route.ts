import { getAccessToken } from "@/src/lib/session";
import { getApiUrl } from "@/src/lib/api-url";

/**
 * Proxy de descarga del ZIP de exportación. La descarga es una navegación
 * normal del navegador (sin Authorization), así que el token sale de la cookie
 * httpOnly y el ZIP se streamea tal cual: nunca se arma en memoria.
 * Si el usuario cancela la descarga, `request.signal` corta también el backend.
 */
export async function GET(request: Request): Promise<Response> {
  const token = await getAccessToken();
  if (!token) return new Response("Sin sesión activa", { status: 401 });

  const entrada = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  params.set("secciones", entrada.get("secciones") ?? "");
  if (entrada.get("medios") === "1") params.set("medios", "1");

  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/organizations/current/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: request.signal,
    });
  } catch {
    return new Response("No se pudo conectar con el servidor", { status: 502 });
  }

  if (!res.ok || !res.body) {
    const mensaje =
      res.status === 403
        ? "Tu rol no tiene permiso para exportar los datos de la empresa."
        : "No se pudo generar la exportación. Intenta de nuevo.";
    return new Response(mensaje, {
      status: res.status || 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition":
        res.headers.get("Content-Disposition") ??
        'attachment; filename="exportacion-crm.zip"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
