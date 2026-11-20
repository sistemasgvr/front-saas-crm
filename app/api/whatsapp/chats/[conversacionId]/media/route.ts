import { ApiError, apiFetch, type FetchOptions } from "@/src/lib/api";
import { sameOrigin } from "@/src/lib/same-origin";

// 180 s de compresión, más la carga a Meta y el guardado del historial.
export const maxDuration = 300;

// El archivo de hasta 4 MiB más los campos y el boundary quedan bajo el límite de Vercel.
const MAX_MULTIPART = 4 * 1024 * 1024 + 64 * 1024;
const MAX_METADATOS = 16 * 1024;
const ARCHIVO_DEMASIADO_GRANDE =
  "El archivo supera el tamaño permitido para esta carga. Elige un archivo más liviano.";

function errorCarga(status: number, message: string): Response {
  return Response.json({ message }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversacionId: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return errorCarga(403, "Solicitud de carga no permitida.");

  const { conversacionId } = await params;
  const endpoint = `/whatsapp/chats/${encodeURIComponent(conversacionId)}/media`;
  const fase = new URL(request.url).searchParams.get("fase");
  const contentLength = Number(request.headers.get("content-length"));
  if (fase === "preparar" || fase === "confirmar") {
    try {
      if (contentLength > MAX_METADATOS) return errorCarga(413, "La información del archivo es demasiado extensa.");
      const body = await request.text();
      if (body.length > MAX_METADATOS) return errorCarga(413, "La información del archivo es demasiado extensa.");
      const data = await apiFetch(endpoint + "/" + fase, {
        method: "POST",
        body,
        signal: request.signal,
        timeoutMs: fase === "confirmar" ? 240_000 : 20_000,
      });
      return fase === "preparar" ? Response.json(data) : new Response(null, { status: 204 });
    } catch (error) {
      return respuestaError(error);
    }
  }

  const contentType = request.headers.get("content-type");
  if (!request.body || !contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    return errorCarga(400, "Selecciona un archivo para enviar.");
  }
  if (contentLength > MAX_MULTIPART) {
    return errorCarga(413, ARCHIVO_DEMASIADO_GRANDE);
  }

  let recibidos = 0;
  const body = request.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      recibidos += chunk.byteLength;
      if (recibidos > MAX_MULTIPART) {
        controller.error(new Error(ARCHIVO_DEMASIADO_GRANDE));
        return;
      }
      controller.enqueue(chunk);
    },
  }));
  try {
    const options: FetchOptions & { duplex: "half" } = {
      method: "POST",
      body,
      duplex: "half",
      headers: { "Content-Type": contentType },
      redirect: "error",
      signal: request.signal,
      timeoutMs: 240_000,
    };
    await apiFetch(endpoint, options);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (recibidos > MAX_MULTIPART) {
      return errorCarga(413, ARCHIVO_DEMASIADO_GRANDE);
    }
    return respuestaError(error);
  }
}

function respuestaError(error: unknown): Response {
  if (error instanceof ApiError && error.status === 503) {
    return errorCarga(503, error.message);
  }
  if (error instanceof ApiError && error.status === 413) {
    return errorCarga(413, ARCHIVO_DEMASIADO_GRANDE);
  }
  if (error instanceof ApiError && error.status === 408) {
    return errorCarga(504, "El servidor demoró en responder. Revisa el chat antes de volver a enviar el archivo.");
  }
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return errorCarga(error.status, error.message);
  }
  return errorCarga(502, "No se pudo confirmar el envío del archivo. Revisa el chat antes de volver a enviarlo.");
}
