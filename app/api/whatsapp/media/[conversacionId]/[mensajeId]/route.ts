import { getAccessToken } from "@/src/lib/session";
import { getApiUrl } from "@/src/lib/api-url";

/**
 * Proxy server-side para bytes de WhatsApp — un <img>/<video>/<audio>/<a>
 * no puede mandar un header Authorization, así que este Route Handler lee
 * el access token de la cookie httpOnly (invisible para el JS del cliente)
 * y reenvía la descarga al backend, streameando la respuesta tal cual.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ conversacionId: string; mensajeId: string }> },
): Promise<Response> {
  const { conversacionId, mensajeId } = await params;
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return new Response("No autorizado", { status: 401 });
  }

  let res: Response;
  try {
    res = await fetch(
      `${getApiUrl()}/whatsapp/chats/${conversacionId}/messages/${mensajeId}/media`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      },
    );
  } catch {
    return new Response("No se pudo conectar con el servidor", { status: 502 });
  }

  if (!res.ok || !res.body) {
    return new Response(null, { status: res.status });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") ?? "application/octet-stream",
      "Content-Disposition": res.headers.get("Content-Disposition") ?? "inline",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
