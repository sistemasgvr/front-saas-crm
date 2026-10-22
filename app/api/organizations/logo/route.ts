import { apiFetch, ApiError } from "@/src/lib/api";
import { getAccessToken } from "@/src/lib/session";
import { getApiUrl } from "@/src/lib/api-url";
import type { OrganizacionActual } from "@/src/modules/settings/types";

const MAX_MULTIPART = 2 * 1024 * 1024 + 64 * 1024;
const errorResponse = (error: unknown) =>
  Response.json(
    {
      message:
        error instanceof ApiError
          ? error.message
          : "No se pudo actualizar el logo. Intenta de nuevo.",
    },
    { status: error instanceof ApiError ? error.status || 502 : 500 },
  );
function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    const incoming = new URL(origin);
    const internal = new URL(request.url);
    // En el proxy de producción la URL interna puede ser HTTP, aunque el
    // navegador use HTTPS. Host identifica el destino real de la petición.
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

/** Proxy privado: el navegador no recibe credenciales ni URLs del bucket. */
export async function GET(request: Request): Promise<Response> {
  const token = await getAccessToken();
  if (!token) return new Response(null, { status: 401 });
  const version = new URL(request.url).searchParams.get("v");
  try {
    const response = await fetch(
      `${getApiUrl()}/organizations/current/logo${version ? `?v=${encodeURIComponent(version)}` : ""}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      },
    );
    if (!response.ok || !response.body)
      return new Response(null, { status: response.status });
    return new Response(response.body, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return Response.json(
      { message: "Solicitud no permitida" },
      { status: 403 },
    );
  if (!(await getAccessToken()))
    return Response.json({ message: "Sin sesión activa" }, { status: 401 });
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new ApiError(400, "Selecciona una imagen para el logo");
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_MULTIPART) {
          await reader.cancel();
          throw new ApiError(413, "El logo debe pesar como máximo 2 MB");
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    let input: FormData;
    try {
      input = await new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": request.headers.get("content-type") ?? "" },
        body: bytes,
      }).formData();
    } catch {
      throw new ApiError(
        400,
        "El archivo no se pudo leer. Selecciónalo de nuevo.",
      );
    }
    const file = input.get("archivo");
    if (!(file instanceof File) || !file.size)
      throw new ApiError(400, "Selecciona una imagen para el logo");
    if (file.size > 2 * 1024 * 1024)
      throw new ApiError(413, "El logo debe pesar como máximo 2 MB");
    const body = new FormData();
    body.set("archivo", file);
    const org = await apiFetch<OrganizacionActual>(
      "/organizations/current/logo",
      { method: "POST", body },
    );
    return Response.json(org);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  if (!sameOrigin(request))
    return Response.json(
      { message: "Solicitud no permitida" },
      { status: 403 },
    );
  try {
    return Response.json(
      await apiFetch<OrganizacionActual>("/organizations/current/logo", {
        method: "DELETE",
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
